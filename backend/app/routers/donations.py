"""
Donation Commitments Router — volunteer brings items directly to shelter.

MVP Flow:
  POST   /api/donations/commitments          — volunteer commits
  DELETE /api/donations/commitments/{id}     — volunteer cancels
  POST   /api/donations/commitments/{id}/confirm — shelter confirms receipt
  GET    /api/donations/commitments/my       — volunteer's history

Uses Clean Architecture:
  - DTOs from application/dtos
  - Service interface from application/services/interfaces
  - Shared exceptions from shared/exceptions
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User, Delivery
from ..auth import get_current_user, require_approved
from ..application.services.donation_commitment_service import DonationCommitmentService
from ..application.services.interfaces.donation_service import CommitItem
from ..application.dtos import (
    DonationCommitRequest,
    DonationCommitResponse,
    DonationItemRequest,
    ConfirmDeliveryRequest,
    DeliveryResponse,
)
from ..shared.exceptions import DonationError

router = APIRouter(prefix="/api/donations", tags=["donations"])


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/commitments", response_model=DonationCommitResponse, status_code=201)
def commit_donation(
    body: DonationCommitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved),
):
    """
    Volunteer commits to bring donation items directly to a shelter.
    
    Returns a unique pickup code and list of delivery IDs created.
    """
    if "volunteer" not in current_user.roles:
        raise HTTPException(status_code=403, detail="Only volunteers can create donation commitments")

    svc = DonationCommitmentService(db)
    try:
        # Converter para formato esperado
        items_dict = [{"request_id": i.request_id, "quantity": i.quantity} for i in body.items]
        
        result = svc.commit(
            user_id=current_user.id,
            target_id=body.shelter_id,
            items=items_dict,
        )
    except DonationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # Result já contém success=True do serviço
    return DonationCommitResponse(**result)


@router.delete("/commitments/{delivery_id}", status_code=200)
def cancel_donation(
    delivery_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved),
):
    """
    Volunteer cancels their own pending commitment.
    """
    if "volunteer" not in current_user.roles:
        raise HTTPException(status_code=403, detail="Only volunteers can cancel donation commitments")

    svc = DonationCommitmentService(db)
    try:
        svc.cancel(delivery_id, current_user.id)
    except DonationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return {"success": True, "message": "Commitment cancelled"}


@router.post("/commitments/{delivery_id}/confirm", response_model=DeliveryResponse)
def confirm_delivery(
    delivery_id: int,
    body: ConfirmDeliveryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved),
):
    """
    Shelter confirms receipt of donation using pickup code.
    """
    if "shelter" not in current_user.roles:
        raise HTTPException(status_code=403, detail="Only shelters can confirm donation deliveries")

    svc = DonationCommitmentService(db)
    try:
        delivery = svc.confirm(delivery_id, body.pickup_code, current_user.id)
    except DonationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return DeliveryResponse.from_model(delivery)


@router.get("/commitments/my", response_model=List[DeliveryResponse])
def my_commitments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List the current volunteer's donation commitments, newest first."""
    return (
        db.query(Delivery)
        .filter(
            Delivery.volunteer_id == current_user.id,
            Delivery.batch_id.is_(None),
            Delivery.pickup_location_id.is_(None),
        )
        .order_by(Delivery.created_at.desc())
        .all()
    )
