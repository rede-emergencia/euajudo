"""
Generic Resources Router (donations, materials, supplies)
Uses Repository pattern to avoid code duplication
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from app.database import get_db
from app.auth import require_approved
from app.models import User, ResourceRequest, ResourceItem, ResourceReservation, ReservationItem
from app.enums import OrderStatus, UserRole
from app.schemas import (
    ResourceRequestCreate,
    ResourceRequestResponse,
    ResourceReservationCreate,
    ResourceReservationResponse
)
from app.auth import get_current_active_user, require_approved
from app.validators import ConfirmationCodeValidator
from app.repositories import BaseRepository
from app.services.transaction_service import get_transaction_service, TransactionError

router = APIRouter(prefix="/api/resources", tags=["resources"])

@router.get("/", response_model=List[ResourceRequestResponse])
def list_all_requests(
    status: OrderStatus = None,
    db: Session = Depends(get_db)
):
    """List all resource requests for map view"""
    repo = BaseRepository(ResourceRequest, db)
    
    if status:
        return repo.filter_by(status=status)
    
    return repo.list_all()

# ============================================================================
# RESOURCE REQUESTS
# ============================================================================

@router.post("/requests", response_model=ResourceRequestResponse, status_code=201)
def create_request(
    request_data: ResourceRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved)
):
    """Provider or Shelter creates resource request"""
    
    if UserRole.PROVIDER.value not in current_user.roles and UserRole.SHELTER.value not in current_user.roles:
        raise HTTPException(status_code=403, detail="Only providers or shelters can create resource requests")
    
    # Use repository
    repo = BaseRepository(ResourceRequest, db)
    
    new_request = repo.create(
        provider_id=current_user.id,
        quantity_meals=request_data.quantity_meals,
        status=OrderStatus.REQUESTING,
        receiving_time=request_data.receiving_time,
        confirmation_code=ConfirmationCodeValidator.generate_code(),
        expires_at=datetime.utcnow() + timedelta(days=2)
    )
    
    # Add items
    item_repo = BaseRepository(ResourceItem, db)
    for item_data in request_data.items:
        item_repo.create(
            request_id=new_request.id,
            name=item_data.name,
            quantity=item_data.quantity,
            unit=item_data.unit
        )
    
    repo.commit()
    repo.refresh(new_request)
    return new_request

@router.get("/requests", response_model=List[ResourceRequestResponse])
def list_requests(
    status: OrderStatus = None,
    db: Session = Depends(get_db)
):
    """List resource requests"""
    repo = BaseRepository(ResourceRequest, db)
    
    if status:
        return repo.filter_by(status=status)
    
    return repo.list_all()

@router.get("/requests/my", response_model=List[ResourceRequestResponse])
def list_my_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List my resource requests"""
    repo = BaseRepository(ResourceRequest, db)
    return repo.filter_by(provider_id=current_user.id)

@router.delete("/requests/{request_id}")
def delete_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a resource request (only if owned by user)"""
    repo = BaseRepository(ResourceRequest, db)
    request = repo.get_by_id(request_id)
    
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request.provider_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only delete your own requests")
    
    if request.status != OrderStatus.REQUESTING:
        raise HTTPException(status_code=400, detail="Can only delete requests in 'requesting' status")
    
    repo.delete(request_id)
    repo.commit()
    return {"message": "Request deleted successfully"}

# ============================================================================
# RESOURCE RESERVATIONS
# ============================================================================

@router.post("/reservations", response_model=ResourceReservationResponse, status_code=201)
def create_reservation(
    reservation_data: ResourceReservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved)
):
    """Volunteer creates reservation to buy/deliver resources - ROBUST TRANSACTION"""
    
    if "volunteer" not in current_user.roles:
        raise HTTPException(status_code=403, detail="Only volunteers can create reservations")
    
    # Usar serviço de transações robusto
    transaction_service = get_transaction_service(db)
    
    try:
        # Converter itens para formato esperado
        items = [{"resource_item_id": item.resource_item_id, "quantity": item.quantity} 
                for item in reservation_data.items]
        
        reservation = transaction_service.create_reservation(
            request_id=reservation_data.request_id,
            volunteer_id=current_user.id,
            items=items,
            estimated_delivery=reservation_data.estimated_delivery
        )
        
        return reservation
        
    except TransactionError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transaction failed: {str(e)}")

@router.get("/reservations/my", response_model=List[ResourceReservationResponse])
def list_my_reservations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List my resource reservations"""
    repo = BaseRepository(ResourceReservation, db)
    return repo.filter_by(volunteer_id=current_user.id)

@router.post("/reservations/{reservation_id}/cancel")
def cancel_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Cancel a resource reservation - ROBUST TRANSACTION"""
    
    # Usar serviço de transações robusto
    transaction_service = get_transaction_service(db)
    
    try:
        success = transaction_service.cancel_reservation(
            reservation_id=reservation_id,
            volunteer_id=current_user.id
        )
        
        if success:
            return {"message": "Reservation cancelled successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to cancel reservation")
            
    except TransactionError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cancel transaction failed: {str(e)}")
