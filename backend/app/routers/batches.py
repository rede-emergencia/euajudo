"""
Generic Product Batches Router
Handles batches of any product type
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.models import User, ProductBatch
from app.enums import BatchStatus, ProductType
from app.schemas import ProductBatchCreate, ProductBatchResponse
from app.auth import get_current_active_user, require_approved
from app.validators import ValidatorFactory

router = APIRouter(prefix="/api/batches", tags=["batches"])

@router.get("/", response_model=List[ProductBatchResponse])
def list_all_batches(
    status: Optional[BatchStatus] = None,
    product_type: Optional[ProductType] = None,
    db: Session = Depends(get_db)
):
    """List all available batches for map view"""
    query = db.query(ProductBatch).filter(ProductBatch.status == BatchStatus.READY)
    
    if product_type:
        query = query.filter(ProductBatch.product_type == product_type)
    
    return query.order_by(ProductBatch.created_at.desc()).all()

@router.post("/", response_model=ProductBatchResponse, status_code=201)
def create_batch(
    batch: ProductBatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved)
):
    """Provider creates a new product batch"""
    
    if "provider" not in current_user.roles:
        raise HTTPException(status_code=403, detail="Only providers can create batches")
    
    # Validate using product-specific validator
    validator = ValidatorFactory.get_validator(batch.product_type)
    
    if not validator.validate_quantity(batch.quantity):
        raise HTTPException(status_code=400, detail="Invalid quantity for this product type")
    
    if batch.description and not validator.validate_description(batch.description):
        raise HTTPException(status_code=400, detail="Invalid description")
    
    # Create batch
    new_batch = ProductBatch(
        provider_id=current_user.id,
        product_type=batch.product_type,
        quantity=batch.quantity,
        quantity_available=batch.quantity,
        description=batch.description,
        status=BatchStatus.PRODUCING,
        donated_ingredients=batch.donated_ingredients,
        pickup_deadline=batch.pickup_deadline
    )
    
    db.add(new_batch)
    db.commit()
    db.refresh(new_batch)
    return new_batch

@router.post("/{batch_id}/mark-ready", response_model=ProductBatchResponse)
def mark_batch_ready(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved)
):
    """Provider marks batch as ready for pickup"""
    
    batch = db.query(ProductBatch).filter(
        ProductBatch.id == batch_id,
        ProductBatch.provider_id == current_user.id
    ).first()
    
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    if batch.status != BatchStatus.PRODUCING:
        raise HTTPException(status_code=400, detail="Batch must be in PRODUCING status")
    
    # Get expiry hours from validator
    validator = ValidatorFactory.get_validator(batch.product_type)
    expiry_hours = validator.get_default_expiry_hours()
    
    batch.status = BatchStatus.READY
    batch.ready_at = datetime.utcnow()
    batch.expires_at = datetime.utcnow() + timedelta(hours=expiry_hours)
    
    db.commit()
    db.refresh(batch)
    return batch

@router.get("/my-batches", response_model=List[ProductBatchResponse])
def list_my_batches(
    status: Optional[BatchStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List batches created by current provider"""
    
    query = db.query(ProductBatch).filter(ProductBatch.provider_id == current_user.id)
    
    if status:
        query = query.filter(ProductBatch.status == status)
    
    return query.order_by(ProductBatch.created_at.desc()).all()

@router.get("/ready", response_model=List[ProductBatchResponse])
def list_ready_batches(
    product_type: Optional[ProductType] = None,
    db: Session = Depends(get_db)
):
    """List ready batches available for delivery"""
    
    query = db.query(ProductBatch).filter(
        ProductBatch.status == BatchStatus.READY,
        ProductBatch.quantity_available > 0
    )
    
    if product_type:
        query = query.filter(ProductBatch.product_type == product_type)
    
    return query.order_by(ProductBatch.created_at.desc()).all()

@router.get("/{batch_id}", response_model=ProductBatchResponse)
def get_batch(
    batch_id: int,
    db: Session = Depends(get_db)
):
    """Get batch details"""
    
    batch = db.query(ProductBatch).filter(ProductBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    return batch

@router.delete("/{batch_id}")
def cancel_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Cancel a batch"""
    
    batch = db.query(ProductBatch).filter(
        ProductBatch.id == batch_id,
        ProductBatch.provider_id == current_user.id
    ).first()
    
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    if batch.status == BatchStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Cannot cancel a completed batch")
    
    if batch.status == BatchStatus.IN_DELIVERY:
        raise HTTPException(
            status_code=400,
            detail="Cannot cancel batch with active deliveries. Cancel deliveries first."
        )
    
    batch.status = BatchStatus.CANCELLED
    
    db.commit()
    return {"message": "Batch cancelled successfully"}
