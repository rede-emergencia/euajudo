"""
Inventory Service - Core stock impact logic
Handles all inventory mutations triggered by delivery lifecycle events.

Stock Flow:
- Shelter creates delivery request → no stock change (requesting from outside)
- Volunteer commits to delivery → ShelterRequest.quantity_pending increases
- Delivery confirmed/delivered → stock IN increases, ShelterRequest.quantity_received increases
- Delivery cancelled → ShelterRequest.quantity_pending decreases, restore parent delivery
- Shelter distributes to end user → stock OUT decreases
- Request adjusted (increase/decrease) → no stock change (just the request quantity)
- Request cancelled → no stock change (was requesting from outside)

Now uses Repository Pattern for all data access.
"""
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, Tuple

from app.inventory_models import (
    InventoryItem, InventoryTransaction, ShelterRequest,
    ShelterRequestDelivery, TransactionType
)
from app.models import Delivery
from app.shared.enums import DeliveryStatus
from app.repositories import (
    InventoryItemRepository,
    ShelterRequestRepository,
    LocationRepository,
)
from app.core.logging_config import get_logger

logger = get_logger(__name__)


def get_or_create_inventory_item(
    db: Session, shelter_id: int, category_id: int
) -> InventoryItem:
    """Get existing inventory item or create a new one for this shelter+category."""
    repo = InventoryItemRepository(db)
    return repo.get_or_create(shelter_id, category_id)


def _record_transaction(
    db: Session,
    inventory_item: InventoryItem,
    transaction_type: TransactionType,
    quantity_change: int,
    user_id: Optional[int] = None,
    delivery_id: Optional[int] = None,
    notes: Optional[str] = None,
):
    """Create an immutable transaction record."""
    txn = InventoryTransaction(
        inventory_item_id=inventory_item.id,
        transaction_type=transaction_type,
        quantity_change=quantity_change,
        balance_after=inventory_item.quantity_in_stock,
        reserved_after=inventory_item.quantity_reserved,
        available_after=inventory_item.quantity_available,
        user_id=user_id,
        delivery_id=delivery_id,
        notes=notes,
    )
    db.add(txn)
    inventory_item.last_transaction_at = datetime.utcnow()
    inventory_item.updated_at = datetime.utcnow()


def _get_shelter_id_for_delivery(db: Session, delivery: Delivery) -> Optional[int]:
    """Resolve the shelter user_id from a delivery's location."""
    if not delivery.delivery_location_id:
        return None
    repo = LocationRepository(db)
    location = repo.get_by_id(delivery.delivery_location_id)
    if location and location.user_id:
        return location.user_id
    return None


def _find_shelter_request_for_delivery(
    db: Session, shelter_id: int, category_id: int
) -> Optional[ShelterRequest]:
    """Find the active/pending shelter request that matches this delivery."""
    repo = ShelterRequestRepository(db)
    return repo.find_by_shelter_and_category(shelter_id, category_id, active_only=True)


# ============================================================================
# DELIVERY LIFECYCLE HOOKS
# ============================================================================

def on_delivery_created(db: Session, delivery: Delivery, shelter_id: int):
    """
    Called when shelter creates a direct delivery request (AVAILABLE).
    No stock change — we're requesting items from outside.
    Just ensure the inventory item row exists.
    """
    if delivery.category_id:
        get_or_create_inventory_item(db, shelter_id, delivery.category_id)


def on_volunteer_committed(
    db: Session, committed_delivery: Delivery, quantity: int
):
    """
    Called when a volunteer commits (partially or fully) to a delivery.
    Update the matching ShelterRequest.quantity_pending.
    """
    shelter_id = _get_shelter_id_for_delivery(db, committed_delivery)
    if not shelter_id or not committed_delivery.category_id:
        return

    request = _find_shelter_request_for_delivery(
        db, shelter_id, committed_delivery.category_id
    )
    if not request:
        return

    # Link delivery to request
    link = ShelterRequestDelivery(
        request_id=request.id,
        delivery_id=committed_delivery.id,
        quantity=quantity,
    )
    db.add(link)

    # Update request status
    if request.status == "pending":
        request.status = "active"
    request.updated_at = datetime.utcnow()


def on_delivery_confirmed(
    db: Session, delivery: Delivery, user_id: Optional[int] = None
):
    """
    Called when delivery is marked DELIVERED (code validated).
    - Add quantity to inventory stock
    - Update ShelterRequest.quantity_received
    - Decrease ShelterRequest.quantity_pending
    """
    shelter_id = _get_shelter_id_for_delivery(db, delivery)
    if not shelter_id or not delivery.category_id:
        return

    quantity = delivery.quantity

    # 1. Update inventory stock
    item = get_or_create_inventory_item(db, shelter_id, delivery.category_id)
    item.quantity_in_stock += quantity
    item.quantity_available = item.quantity_in_stock - item.quantity_reserved

    _record_transaction(
        db, item,
        TransactionType.DONATION_RECEIVED,
        quantity_change=quantity,
        user_id=user_id,
        delivery_id=delivery.id,
        notes=f"Received {quantity} units from delivery #{delivery.id}",
    )

    # 2. Update ShelterRequest
    request = _find_shelter_request_for_delivery(
        db, shelter_id, delivery.category_id
    )
    if request:
        request.quantity_received += quantity
        # Check if request is now complete
        if request.quantity_received >= request.quantity_requested:
            request.status = "completed"
            request.completed_at = datetime.utcnow()
        elif request.quantity_received > 0:
            request.status = "partially_completed"
        request.updated_at = datetime.utcnow()


def on_delivery_cancelled(
    db: Session, delivery: Delivery, user_id: Optional[int] = None
):
    """
    Called when a committed delivery is cancelled (before delivered).
    - Remove the ShelterRequestDelivery link
    - Update ShelterRequest quantities
    - No inventory change (items were never received)
    """
    shelter_id = _get_shelter_id_for_delivery(db, delivery)
    if not shelter_id or not delivery.category_id:
        return

    # Find link before removing it
    link = db.query(ShelterRequestDelivery).filter(
        ShelterRequestDelivery.delivery_id == delivery.id
    ).first()

    if link:
        request = db.query(ShelterRequest).filter(
            ShelterRequest.id == link.request_id
        ).first()
        if request:
            # CRITICAL: Restore quantities when cancelling
            request.quantity_received -= link.quantity
            request.quantity_pending -= link.quantity
            
            # Ensure non-negative
            if request.quantity_received < 0:
                request.quantity_received = 0
            if request.quantity_pending < 0:
                request.quantity_pending = 0
            
            request.updated_at = datetime.utcnow()
            
            # If all deliveries cancelled and nothing received, revert to pending
            remaining_links = db.query(ShelterRequestDelivery).filter(
                ShelterRequestDelivery.request_id == request.id,
                ShelterRequestDelivery.delivery_id != delivery.id,
            ).count()
            if remaining_links == 0 and request.quantity_received == 0:
                request.status = "pending"
        # Use bulk delete to avoid double-delete warning from ORM cascade
        db.query(ShelterRequestDelivery).filter(
            ShelterRequestDelivery.delivery_id == delivery.id
        ).delete(synchronize_session=False)


def on_distribution(
    db: Session, shelter_id: int, category_id: int,
    quantity: int, user_id: Optional[int] = None,
    notes: Optional[str] = None
) -> InventoryItem:
    """
    Called when shelter distributes items to end recipients.
    Decreases stock.
    Returns the updated inventory item.
    Raises ValueError if insufficient stock.
    """
    item = get_or_create_inventory_item(db, shelter_id, category_id)

    if item.quantity_available < quantity:
        raise ValueError(
            f"Insufficient stock. Available: {item.quantity_available}, "
            f"Requested: {quantity}"
        )

    item.quantity_in_stock -= quantity
    item.quantity_available = item.quantity_in_stock - item.quantity_reserved

    _record_transaction(
        db, item,
        TransactionType.DONATION_GIVEN,
        quantity_change=-quantity,
        user_id=user_id,
        notes=notes or f"Distributed {quantity} units to end recipient",
    )

    return item
