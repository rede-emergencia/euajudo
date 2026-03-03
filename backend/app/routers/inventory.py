"""
Inventory Management Router for Shelters
Handles stock tracking, transactions, requests, and distributions
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.auth import get_current_user
from app.models import User, Category, Delivery, DeliveryLocation
from app.inventory_models import (
    InventoryItem, InventoryTransaction, ShelterRequest,
    RequestAdjustment, ShelterRequestDelivery, DistributionRecord, TransactionType
)
from app.inventory_schemas import (
    InventoryItemCreate, InventoryItemUpdate, InventoryItemResponse,
    InventoryTransactionResponse, ShelterRequestCreate, ShelterRequestUpdate,
    ShelterRequestResponse, RequestAdjustmentCreate, RequestAdjustmentResponse,
    DistributionRecordCreate, DistributionRecordResponse, DistributionRecordUpdate, DistributionRecordCancel,
    InventoryStats, CategoryStock, RecentActivity, ShelterDashboardData
)
from app.shared.enums import DeliveryStatus
from app.services.inventory_service import (
    get_or_create_inventory_item, on_distribution
)

router = APIRouter(prefix="/api/inventory", tags=["inventory"])

def has_role(user: User, role: str) -> bool:
    """Check if user has a specific role"""
    roles_str = str(user.roles).strip("{}")
    return role in [r.strip() for r in roles_str.split(',')]

# ============================================================================
# INVENTORY ITEMS ENDPOINTS
# ============================================================================

@router.get("/items", response_model=List[InventoryItemResponse])
def list_inventory_items(
    category_id: Optional[int] = None,
    low_stock_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all inventory items for current shelter"""
    if not has_role(current_user, 'shelter'):
        raise HTTPException(status_code=403, detail="Only shelters can access inventory")
    
    query = db.query(InventoryItem).filter(InventoryItem.shelter_id == current_user.id)
    
    if category_id:
        query = query.filter(InventoryItem.category_id == category_id)
    
    if low_stock_only:
        query = query.filter(InventoryItem.quantity_available <= InventoryItem.min_threshold)
    
    return query.all()

@router.post("/items", response_model=InventoryItemResponse)
def create_inventory_item(
    item: InventoryItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update inventory item for a specific type/unit combination"""
    if not has_role(current_user, 'shelter'):
        raise HTTPException(status_code=403, detail="Only shelters can manage inventory")
    
    print(f"🔍 DEBUG Backend - Item recebido:")
    print(f"  category_id: {item.category_id}")
    print(f"  quantity_in_stock: {item.quantity_in_stock}")
    print(f"  metadata_cache: {item.metadata_cache}")
    
    # Create a unique key for type+unit combination from metadata
    tipo = item.metadata_cache.get('tipo') if item.metadata_cache else None
    unidade = item.metadata_cache.get('unidade') if item.metadata_cache else None
    
    print(f"🔍 DEBUG Backend - Tipo: {tipo}, Unidade: {unidade}")
    
    # Get all items for this category and shelter
    existing_items = db.query(InventoryItem).filter(
        InventoryItem.shelter_id == current_user.id,
        InventoryItem.category_id == item.category_id
    ).all()
    
    print(f"🔍 DEBUG Backend - Itens existentes na categoria: {len(existing_items)}")
    for i, existing_item in enumerate(existing_items):
        print(f"  Item {i}: id={existing_item.id}, metadata={existing_item.metadata_cache}")
    
    # If we have tipo and unidade, look for exact match in metadata
    existing = None
    if tipo and unidade:
        for existing_item in existing_items:
            if (existing_item.metadata_cache and 
                existing_item.metadata_cache.get('tipo') == tipo and
                existing_item.metadata_cache.get('unidade') == unidade):
                existing = existing_item
                break
        print(f"🔍 DEBUG Backend - Correspondência encontrada: {existing.id if existing else 'None'}")
    # If no tipo/unidade, always create new item (don't overwrite existing)
    
    if existing:
        if item.replace_quantity:
            # Replace quantity entirely (for editing)
            old_quantity = existing.quantity_in_stock
            existing.quantity_in_stock = item.quantity_in_stock
            quantity_change = item.quantity_in_stock - old_quantity
            existing.quantity_available = existing.quantity_in_stock - existing.quantity_reserved
            
            # Update thresholds if provided
            if item.min_threshold is not None:
                existing.min_threshold = item.min_threshold
            if item.max_threshold is not None:
                existing.max_threshold = item.max_threshold
            
            # Create transaction
            transaction = InventoryTransaction(
                inventory_item_id=existing.id,
                transaction_type=TransactionType.MANUAL_ADJUSTMENT,
                quantity_change=quantity_change,
                balance_after=existing.quantity_in_stock,
                reserved_after=existing.quantity_reserved,
                available_after=existing.quantity_available,
                user_id=current_user.id,
                notes=f"Stock updated: {old_quantity} → {item.quantity_in_stock} units"
            )
        else:
            # Add to stock (for adding new items)
            quantity_change = item.quantity_in_stock
            existing.quantity_in_stock += quantity_change
            existing.quantity_available = existing.quantity_in_stock - existing.quantity_reserved
            
            # Update thresholds if provided
            if item.min_threshold is not None:
                existing.min_threshold = item.min_threshold
            if item.max_threshold is not None:
                existing.max_threshold = item.max_threshold
            
            # Create transaction
            transaction = InventoryTransaction(
                inventory_item_id=existing.id,
                transaction_type=TransactionType.MANUAL_ADJUSTMENT,
                quantity_change=quantity_change,
                balance_after=existing.quantity_in_stock,
                reserved_after=existing.quantity_reserved,
                available_after=existing.quantity_available,
                user_id=current_user.id,
                notes=f"Stock added: {quantity_change} units"
            )
        
        db.add(transaction)
        existing.last_transaction_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        
        return existing
    
    # Create new item
    db_item = InventoryItem(
        shelter_id=current_user.id,
        **item.dict()
    )
    db_item.quantity_available = db_item.quantity_in_stock - db_item.quantity_reserved
    
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    # Create initial transaction
    if db_item.quantity_in_stock > 0:
        transaction = InventoryTransaction(
            inventory_item_id=db_item.id,
            transaction_type=TransactionType.INITIAL_STOCK,
            quantity_change=db_item.quantity_in_stock,
            balance_after=db_item.quantity_in_stock,
            reserved_after=0,
            available_after=db_item.quantity_in_stock,
            user_id=current_user.id,
            notes="Initial stock setup"
        )
        db.add(transaction)
        db_item.last_transaction_at = datetime.utcnow()
        db.commit()
    
    return db_item

@router.patch("/items/{item_id}", response_model=InventoryItemResponse)
def update_inventory_item(
    item_id: int,
    update: InventoryItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update inventory item - can adjust stock (+/-), thresholds, and metadata"""
    if not has_role(current_user, 'shelter'):
        raise HTTPException(status_code=403, detail="Only shelters can manage inventory")
    
    item = db.query(InventoryItem).filter(
        InventoryItem.id == item_id,
        InventoryItem.shelter_id == current_user.id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    # Handle stock adjustment (positive or negative)
    if update.quantity_adjustment is not None and update.quantity_adjustment != 0:
        new_stock = item.quantity_in_stock + update.quantity_adjustment
        
        # Validate we don't go below zero
        if new_stock < 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot remove {abs(update.quantity_adjustment)} items. Available: {item.quantity_in_stock}"
            )
        
        quantity_change = update.quantity_adjustment
        
        # Create adjustment transaction
        transaction = InventoryTransaction(
            inventory_item_id=item.id,
            transaction_type=TransactionType.MANUAL_ADJUSTMENT,
            quantity_change=quantity_change,
            balance_after=new_stock,
            reserved_after=item.quantity_reserved,
            available_after=new_stock - item.quantity_reserved,
            user_id=current_user.id,
            notes=f"Stock adjustment: {'+' if quantity_change > 0 else ''}{quantity_change} units"
        )
        db.add(transaction)
        
        item.quantity_in_stock = new_stock
        item.quantity_available = new_stock - item.quantity_reserved
        item.last_transaction_at = datetime.utcnow()
    
    # Update other fields
    if update.min_threshold is not None:
        item.min_threshold = update.min_threshold
    if update.max_threshold is not None:
        item.max_threshold = update.max_threshold
    if update.metadata_cache is not None:
        item.metadata_cache = update.metadata_cache
    
    item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    
    return item

# ============================================================================
# TRANSACTIONS ENDPOINTS
# ============================================================================

@router.get("/transactions", response_model=List[InventoryTransactionResponse])
def list_transactions(
    category_id: Optional[int] = None,
    transaction_type: Optional[TransactionType] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List inventory transactions for current shelter"""
    if not has_role(current_user, 'shelter'):
        raise HTTPException(status_code=403, detail="Only shelters can access transactions")
    
    query = db.query(InventoryTransaction).join(InventoryItem).filter(
        InventoryItem.shelter_id == current_user.id
    )
    
    if category_id:
        query = query.filter(InventoryItem.category_id == category_id)
    
    if transaction_type:
        query = query.filter(InventoryTransaction.transaction_type == transaction_type)
    
    return query.order_by(InventoryTransaction.created_at.desc()).limit(limit).offset(offset).all()

@router.post("/receive-donation/{delivery_id}")
def receive_donation(
    delivery_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark donation as received and add to inventory"""
    if not has_role(current_user, 'shelter'):
        raise HTTPException(status_code=403, detail="Only shelters can receive donations")
    
    # Get delivery
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    
    if delivery.status != DeliveryStatus.DELIVERED:
        raise HTTPException(status_code=400, detail="Delivery must be marked as delivered first")
    
    # Get or create inventory item
    inventory_item = db.query(InventoryItem).filter(
        InventoryItem.shelter_id == current_user.id,
        InventoryItem.category_id == delivery.category_id
    ).first()
    
    if not inventory_item:
        # Create new inventory item
        inventory_item = InventoryItem(
            shelter_id=current_user.id,
            category_id=delivery.category_id,
            quantity_in_stock=0,
            quantity_reserved=0,
            quantity_available=0,
            metadata_cache=delivery.metadata_cache
        )
        db.add(inventory_item)
        db.flush()
    
    # Update stock
    old_stock = inventory_item.quantity_in_stock
    inventory_item.quantity_in_stock += delivery.quantity
    inventory_item.quantity_available = inventory_item.quantity_in_stock - inventory_item.quantity_reserved
    inventory_item.last_transaction_at = datetime.utcnow()
    inventory_item.updated_at = datetime.utcnow()
    
    # Create transaction record
    transaction = InventoryTransaction(
        inventory_item_id=inventory_item.id,
        transaction_type=TransactionType.DONATION_RECEIVED,
        quantity_change=delivery.quantity,
        balance_after=inventory_item.quantity_in_stock,
        reserved_after=inventory_item.quantity_reserved,
        available_after=inventory_item.quantity_available,
        delivery_id=delivery_id,
        user_id=current_user.id,
        notes=f"Received donation from delivery #{delivery_id}"
    )
    db.add(transaction)
    
    db.commit()
    
    return {
        "message": "Donation received successfully",
        "quantity": delivery.quantity,
        "new_stock": inventory_item.quantity_in_stock,
        "previous_stock": old_stock
    }

# ============================================================================
# DISTRIBUTION ENDPOINTS
# ============================================================================

@router.post("/distribute", response_model=DistributionRecordResponse)
def distribute_items(
    distribution: DistributionRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Distribute items to end recipients"""
    if not has_role(current_user, 'shelter'):
        raise HTTPException(status_code=403, detail="Only shelters can distribute items")
    
    # Get inventory item
    inventory_item = db.query(InventoryItem).filter(
        InventoryItem.shelter_id == current_user.id,
        InventoryItem.category_id == distribution.category_id
    ).first()
    
    if not inventory_item:
        raise HTTPException(status_code=404, detail="No inventory for this category")
    
    if inventory_item.quantity_available < distribution.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock. Available: {inventory_item.quantity_available}, Requested: {distribution.quantity}"
        )
    
    # Update stock
    inventory_item.quantity_in_stock -= distribution.quantity
    inventory_item.quantity_available = inventory_item.quantity_in_stock - inventory_item.quantity_reserved
    inventory_item.last_transaction_at = datetime.utcnow()
    inventory_item.updated_at = datetime.utcnow()
    
    # Create transaction
    transaction = InventoryTransaction(
        inventory_item_id=inventory_item.id,
        transaction_type=TransactionType.DONATION_GIVEN,
        quantity_change=-distribution.quantity,
        balance_after=inventory_item.quantity_in_stock,
        reserved_after=inventory_item.quantity_reserved,
        available_after=inventory_item.quantity_available,
        user_id=current_user.id,
        notes=distribution.notes or "Distributed to end recipient",
        transaction_metadata=distribution.distribution_metadata
    )
    db.add(transaction)
    
    # Create distribution record
    db_distribution = DistributionRecord(
        shelter_id=current_user.id,
        **distribution.dict()
    )
    db.add(db_distribution)
    
    db.commit()
    db.refresh(db_distribution)
    
    return db_distribution

@router.get("/distributions", response_model=List[DistributionRecordResponse])
def list_distributions(
    category_id: Optional[int] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List distribution records"""
    if not has_role(current_user, 'shelter'):
        raise HTTPException(status_code=403, detail="Only shelters can access distributions")
    
    query = db.query(DistributionRecord).filter(
        DistributionRecord.shelter_id == current_user.id
    )
    
    if category_id:
        query = query.filter(DistributionRecord.category_id == category_id)
    
    return query.order_by(DistributionRecord.distributed_at.desc()).limit(limit).offset(offset).all()

@router.patch("/distributions/{distribution_id}", response_model=DistributionRecordResponse)
def update_distribution(
    distribution_id: int,
    update: DistributionRecordUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update distribution record (only if active)"""
    if not has_role(current_user, 'shelter'):
        raise HTTPException(status_code=403, detail="Only shelters can update distributions")
    
    distribution = db.query(DistributionRecord).filter(
        DistributionRecord.id == distribution_id,
        DistributionRecord.shelter_id == current_user.id
    ).first()
    
    if not distribution:
        raise HTTPException(status_code=404, detail="Distribution not found")
    
    if distribution.status != "active":
        raise HTTPException(status_code=400, detail="Cannot update cancelled distribution")
    
    # Get inventory item
    inventory_item = db.query(InventoryItem).filter(
        InventoryItem.shelter_id == current_user.id,
        InventoryItem.category_id == distribution.category_id
    ).first()
    
    if not inventory_item:
        raise HTTPException(status_code=404, detail="No inventory for this category")
    
    # Handle quantity change
    quantity_change = 0
    if update.quantity is not None and update.quantity != distribution.quantity:
        quantity_change = update.quantity - distribution.quantity
        
        # Check if we have enough stock for increase
        if quantity_change > 0:
            if inventory_item.quantity_available < quantity_change:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for increase. Available: {inventory_item.quantity_available}, Needed: {quantity_change}"
                )
        
        # Update stock
        inventory_item.quantity_in_stock -= quantity_change
        inventory_item.quantity_available = inventory_item.quantity_in_stock - inventory_item.quantity_reserved
        inventory_item.last_transaction_at = datetime.utcnow()
        inventory_item.updated_at = datetime.utcnow()
        
        # Create adjustment transaction
        transaction = InventoryTransaction(
            inventory_item_id=inventory_item.id,
            transaction_type=TransactionType.MANUAL_ADJUSTMENT,
            quantity_change=-quantity_change,  # Negative because we're adjusting the distribution
            balance_after=inventory_item.quantity_in_stock,
            reserved_after=inventory_item.quantity_reserved,
            available_after=inventory_item.quantity_available,
            user_id=current_user.id,
            notes=f"Distribution quantity adjusted: {distribution.quantity} → {update.quantity}"
        )
        db.add(transaction)
        
        distribution.quantity = update.quantity
    
    # Update other fields
    if update.recipient_name is not None:
        distribution.recipient_name = update.recipient_name
    if update.recipient_document is not None:
        distribution.recipient_document = update.recipient_document
    if update.notes is not None:
        distribution.notes = update.notes
    
    distribution.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(distribution)
    
    return distribution

@router.post("/distributions/{distribution_id}/cancel")
def cancel_distribution(
    distribution_id: int,
    cancel: DistributionRecordCancel,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel distribution and return items to stock"""
    if not has_role(current_user, 'shelter'):
        raise HTTPException(status_code=403, detail="Only shelters can cancel distributions")
    
    distribution = db.query(DistributionRecord).filter(
        DistributionRecord.id == distribution_id,
        DistributionRecord.shelter_id == current_user.id
    ).first()
    
    if not distribution:
        raise HTTPException(status_code=404, detail="Distribution not found")
    
    if distribution.status != "active":
        raise HTTPException(status_code=400, detail="Distribution is already cancelled")
    
    # Get inventory item
    inventory_item = db.query(InventoryItem).filter(
        InventoryItem.shelter_id == current_user.id,
        InventoryItem.category_id == distribution.category_id
    ).first()
    
    if not inventory_item:
        raise HTTPException(status_code=404, detail="No inventory for this category")
    
    # Return items to stock
    inventory_item.quantity_in_stock += distribution.quantity
    inventory_item.quantity_available = inventory_item.quantity_in_stock - inventory_item.quantity_reserved
    inventory_item.last_transaction_at = datetime.utcnow()
    inventory_item.updated_at = datetime.utcnow()
    
    # Create return transaction
    transaction = InventoryTransaction(
        inventory_item_id=inventory_item.id,
        transaction_type=TransactionType.MANUAL_ADJUSTMENT,
        quantity_change=distribution.quantity,  # Positive because we're returning to stock
        balance_after=inventory_item.quantity_in_stock,
        reserved_after=inventory_item.quantity_reserved,
        available_after=inventory_item.quantity_available,
        user_id=current_user.id,
        notes=f"Distribution cancelled: {distribution.quantity} items returned to stock"
    )
    db.add(transaction)
    
    # Update distribution status
    distribution.status = "cancelled"
    distribution.cancelled_at = datetime.utcnow()
    distribution.cancellation_reason = cancel.reason
    distribution.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": "Distribution cancelled successfully",
        "quantity_returned": distribution.quantity,
        "new_stock": inventory_item.quantity_in_stock
    }

# ============================================================================
# SHELTER REQUESTS ENDPOINTS
# ============================================================================

@router.get("/requests/public", response_model=List[ShelterRequestResponse])
def list_public_shelter_requests(
    db: Session = Depends(get_db)
):
    """
    Public endpoint to list all active shelter donation requests.
    Used by map view to show shelter needs without authentication.
    Only returns active requests (pending, partial, active status).
    """
    query = db.query(ShelterRequest).filter(
        ShelterRequest.status.in_(['pending', 'partial', 'active'])
    )
    
    return query.order_by(ShelterRequest.created_at.desc()).all()

@router.get("/requests", response_model=List[ShelterRequestResponse])
def list_shelter_requests(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List shelter donation requests (authenticated - shelter only)"""
    if not has_role(current_user, 'shelter'):
        raise HTTPException(status_code=403, detail="Only shelters can access requests")
    
    query = db.query(ShelterRequest).filter(ShelterRequest.shelter_id == current_user.id)
    
    if status:
        query = query.filter(ShelterRequest.status == status)
    
    return query.order_by(ShelterRequest.created_at.desc()).all()

@router.post("/requests", response_model=ShelterRequestResponse)
def create_shelter_request(
    request: ShelterRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new donation request"""
    if not has_role(current_user, 'shelter'):
        raise HTTPException(status_code=403, detail="Only shelters can create requests")
    
    # Verify category exists
    category = db.query(Category).filter(Category.id == request.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Create request
    db_request = ShelterRequest(
        shelter_id=current_user.id,
        category_id=request.category_id,
        quantity_requested=request.quantity_requested,
        quantity_received=0,
        quantity_pending=0,
        quantity_cancelled=0,
        status='pending',
        notes=request.notes,
        metadata_cache=request.metadata_cache or {},
    )
    
    db.add(db_request)
    db.flush()
    
    # Ensure inventory item row exists for this category
    get_or_create_inventory_item(db, current_user.id, request.category_id)
    
    db.commit()
    db.refresh(db_request)
    
    return db_request

@router.post("/requests/adjust/{request_id}", response_model=RequestAdjustmentResponse)
def adjust_request(
    request_id: int,
    adjustment: RequestAdjustmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Adjust request quantity (increase, decrease, or cancel)"""
    if not has_role(current_user, 'shelter'):
        raise HTTPException(status_code=403, detail="Only shelters can adjust requests")
    
    # Get request
    request = db.query(ShelterRequest).filter(
        ShelterRequest.id == request_id,
        ShelterRequest.shelter_id == current_user.id
    ).first()
    
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request.status in ['completed', 'cancelled']:
        raise HTTPException(status_code=400, detail="Cannot adjust completed or cancelled requests")
    
    # Calculate new quantity
    quantity_before = request.quantity_requested
    
    if adjustment.adjustment_type == 'cancel':
        quantity_after = 0
        can_adjust = True
        warning_message = None
        
        if request.quantity_pending > 0:
            warning_message = f"Warning: {request.quantity_pending} items are currently in transit and cannot be cancelled"
            can_adjust = False
    
    elif adjustment.adjustment_type == 'increase':
        quantity_after = quantity_before + abs(adjustment.quantity_change)
        can_adjust = True
        warning_message = None
    
    elif adjustment.adjustment_type == 'decrease':
        quantity_after = max(0, quantity_before - abs(adjustment.quantity_change))
        
        # Check if decrease affects in-progress deliveries
        if quantity_after < request.quantity_pending:
            warning_message = f"Warning: Cannot decrease below {request.quantity_pending} (items in transit)"
            quantity_after = request.quantity_pending
            can_adjust = False
        else:
            can_adjust = True
            warning_message = None
    
    else:
        raise HTTPException(status_code=400, detail="Invalid adjustment type")
    
    # Create adjustment record
    db_adjustment = RequestAdjustment(
        request_id=request_id,
        adjustment_type=adjustment.adjustment_type,
        quantity_before=quantity_before,
        quantity_after=quantity_after,
        quantity_change=quantity_after - quantity_before,
        reason=adjustment.reason,
        user_id=current_user.id,
        can_adjust=can_adjust,
        warning_message=warning_message
    )
    db.add(db_adjustment)
    
    # Update request if adjustment is allowed
    if can_adjust:
        request.quantity_requested = quantity_after
        
        if adjustment.adjustment_type == 'cancel':
            request.status = 'cancelled'
            request.cancelled_at = datetime.utcnow()
            request.quantity_cancelled = quantity_before - request.quantity_received
        
        request.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_adjustment)
    
    return db_adjustment

# ============================================================================
# DASHBOARD & ANALYTICS ENDPOINTS
# ============================================================================

@router.get("/dashboard", response_model=ShelterDashboardData)
def get_shelter_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive dashboard data for shelter"""
    if not has_role(current_user, 'shelter'):
        raise HTTPException(status_code=403, detail="Only shelters can access dashboard")
    
    # Calculate stats
    inventory_items = db.query(InventoryItem).filter(
        InventoryItem.shelter_id == current_user.id
    ).all()
    
    total_items = sum(item.quantity_in_stock for item in inventory_items)
    low_stock_count = sum(1 for item in inventory_items if item.quantity_available <= item.min_threshold)
    
    # Transactions this month
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    received_this_month = db.query(func.sum(InventoryTransaction.quantity_change)).join(InventoryItem).filter(
        InventoryItem.shelter_id == current_user.id,
        InventoryTransaction.transaction_type == TransactionType.DONATION_RECEIVED,
        InventoryTransaction.created_at >= month_start
    ).scalar() or 0
    
    distributed_this_month = abs(db.query(func.sum(InventoryTransaction.quantity_change)).join(InventoryItem).filter(
        InventoryItem.shelter_id == current_user.id,
        InventoryTransaction.transaction_type == TransactionType.DONATION_GIVEN,
        InventoryTransaction.created_at >= month_start
    ).scalar() or 0)
    
    # Active requests (pending, active, partially_completed)
    active_requests = db.query(ShelterRequest).filter(
        ShelterRequest.shelter_id == current_user.id,
        ShelterRequest.status.in_(['pending', 'active', 'partially_completed'])
    ).all()
    
    stats = InventoryStats(
        total_items_in_stock=total_items,
        total_categories=len(inventory_items),
        low_stock_items=low_stock_count,
        total_received_this_month=int(received_this_month),
        total_distributed_this_month=int(distributed_this_month),
        pending_requests=sum(1 for r in active_requests if r.quantity_pending > 0),
        active_requests=len(active_requests)
    )
    
    # Inventory by category
    inventory_by_category = []
    for item in inventory_items:
        category = db.query(Category).filter(Category.id == item.category_id).first()
        inventory_by_category.append(CategoryStock(
            id=item.id,
            category_id=item.category_id,
            category_name=category.display_name if category else "Unknown",
            quantity_in_stock=item.quantity_in_stock,
            quantity_reserved=item.quantity_reserved,
            quantity_available=item.quantity_available,
            min_threshold=item.min_threshold,
            is_low_stock=item.quantity_available <= item.min_threshold,
            metadata_cache=item.metadata_cache
        ))
    
    # Recent transactions
    recent_txns = db.query(InventoryTransaction).join(InventoryItem).filter(
        InventoryItem.shelter_id == current_user.id
    ).order_by(InventoryTransaction.created_at.desc()).limit(10).all()
    
    recent_transactions = []
    for txn in recent_txns:
        item = db.query(InventoryItem).filter(InventoryItem.id == txn.inventory_item_id).first()
        category = db.query(Category).filter(Category.id == item.category_id).first() if item else None
        
        recent_transactions.append(RecentActivity(
            transaction_type=txn.transaction_type.value,
            category_name=category.display_name if category else "Unknown",
            quantity=txn.quantity_change,
            created_at=txn.created_at,
            notes=txn.notes
        ))
    
    # Low stock alerts
    low_stock_alerts = [
        CategoryStock(
            id=item.id,
            category_id=item.category_id,
            category_name=db.query(Category).filter(Category.id == item.category_id).first().display_name,
            quantity_in_stock=item.quantity_in_stock,
            quantity_reserved=item.quantity_reserved,
            quantity_available=item.quantity_available,
            min_threshold=item.min_threshold,
            is_low_stock=True,
            metadata_cache=item.metadata_cache
        )
        for item in inventory_items
        if item.quantity_available <= item.min_threshold
    ]
    
    return ShelterDashboardData(
        stats=stats,
        inventory_by_category=inventory_by_category,
        recent_transactions=recent_transactions,
        active_requests=[ShelterRequestResponse.from_orm(r) for r in active_requests],
        low_stock_alerts=low_stock_alerts
    )


# ============================================================================
# SHELTER DELIVERIES ENDPOINT
# ============================================================================

@router.get("/shelter-deliveries")
def list_shelter_deliveries(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List deliveries coming to this shelter's location"""
    if not has_role(current_user, 'shelter'):
        raise HTTPException(status_code=403, detail="Only shelters can access this")
    
    # Find shelter's location
    location = db.query(DeliveryLocation).filter(
        DeliveryLocation.user_id == current_user.id
    ).first()
    
    if not location:
        return []
    
    query = db.query(Delivery).filter(
        Delivery.delivery_location_id == location.id
    )
    
    if status:
        query = query.filter(Delivery.status == status)
    
    deliveries = query.order_by(Delivery.created_at.desc()).all()
    
    result = []
    for d in deliveries:
        volunteer = db.query(User).filter(User.id == d.volunteer_id).first() if d.volunteer_id else None
        category = db.query(Category).filter(Category.id == d.category_id).first() if d.category_id else None
        result.append({
            "id": d.id,
            "quantity": d.quantity,
            "status": d.status.value if hasattr(d.status, 'value') else str(d.status),
            "category_id": d.category_id,
            "category_name": category.display_name if category else "N/A",
            "volunteer_name": volunteer.name if volunteer else None,
            "delivery_code": d.delivery_code,
            "pickup_code": d.pickup_code,
            "created_at": d.created_at.isoformat() if d.created_at else None,
            "delivered_at": d.delivered_at.isoformat() if d.delivered_at else None,
            "parent_delivery_id": d.parent_delivery_id,
        })
    
    return result


@router.post("/requests/{request_id}/cancel")
def cancel_shelter_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a shelter request"""
    if not has_role(current_user, 'shelter'):
        raise HTTPException(status_code=403, detail="Only shelters can cancel requests")
    
    request = db.query(ShelterRequest).filter(
        ShelterRequest.id == request_id,
        ShelterRequest.shelter_id == current_user.id
    ).first()
    
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request.status in ['completed', 'cancelled']:
        raise HTTPException(status_code=400, detail=f"Cannot cancel request with status: {request.status}")
    
    request.status = 'cancelled'
    request.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Request cancelled successfully"}
