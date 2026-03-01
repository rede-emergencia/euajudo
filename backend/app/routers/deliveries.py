"""
Generic Deliveries Router
Handles deliveries of any product type
"""
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime, timedelta
from app.database import get_db
from app.models import User, ProductBatch, Delivery, DeliveryLocation, Category
from app.enums import DeliveryStatus, BatchStatus, ProductType
from app.schemas import DeliveryCreate, DirectDeliveryCreate, DeliveryResponse
from app.auth import get_current_active_user, require_approved
from app.validators import ConfirmationCodeValidator, StatusTransitionValidator

router = APIRouter(prefix="/api/deliveries", tags=["deliveries"])

@router.get("/", response_model=List[DeliveryResponse])
def list_all_deliveries(db: Session = Depends(get_db)):
    """List all deliveries for map view"""
    return db.query(Delivery).order_by(Delivery.created_at.desc()).all()

@router.post("/", response_model=DeliveryResponse, status_code=201)
def create_delivery(
    delivery: DeliveryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved)
):
    """Volunteer reserves products from a batch for delivery to a location"""
    
    if "volunteer" not in current_user.roles:
        raise HTTPException(status_code=403, detail="Only volunteers can create deliveries")
    
    # Check if volunteer already has active delivery
    active_delivery = db.query(Delivery).filter(
        Delivery.volunteer_id == current_user.id,
        Delivery.status.in_([DeliveryStatus.PENDING_CONFIRMATION, DeliveryStatus.RESERVED, DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT])
    ).first()
    
    if active_delivery:
        raise HTTPException(
            status_code=400,
            detail="You already have an active delivery. Complete or cancel it first."
        )
    
    # Verify batch exists and is ready
    batch = db.query(ProductBatch).filter(ProductBatch.id == delivery.batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    if batch.status != BatchStatus.READY:
        raise HTTPException(status_code=400, detail="Batch is not ready for delivery")
    
    if batch.expires_at and batch.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Batch has expired")
    
    # Verify location exists
    location = db.query(DeliveryLocation).filter(DeliveryLocation.id == delivery.location_id).first()
    if not location or not location.active:
        raise HTTPException(status_code=404, detail="Delivery location not found or inactive")
    
    # Check available quantity
    if batch.quantity_available <= 0:
        raise HTTPException(status_code=400, detail="No products available in this batch")
    
    quantity_to_reserve = min(delivery.quantity, batch.quantity_available)
    
    # Create delivery with RESERVED status
    new_delivery = Delivery(
        batch_id=delivery.batch_id,
        location_id=delivery.location_id,
        volunteer_id=current_user.id,
        product_type=batch.product_type,
        category_id=batch.category_id,  # Adicionar categoria!
        quantity=quantity_to_reserve,
        status=DeliveryStatus.RESERVED,
        accepted_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(hours=3),
        pickup_code=ConfirmationCodeValidator.generate_code()
    )
    
    db.add(new_delivery)
    db.flush()
    
    # Update batch
    batch.quantity_available -= quantity_to_reserve
    if batch.quantity_available == 0:
        batch.status = BatchStatus.IN_DELIVERY
    
    db.commit()
    db.refresh(new_delivery)
    return new_delivery

@router.post("/direct", response_model=DeliveryResponse, status_code=201)
def create_direct_delivery(
    delivery: DirectDeliveryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Shelter creates direct delivery request (no batch)"""
    
    # Buscar a DeliveryLocation associada ao usuário
    location = db.query(DeliveryLocation).filter(
        DeliveryLocation.user_id == current_user.id
    ).first()
    
    if not location:
        print(f"❌ ERROR: No DeliveryLocation found for user_id={current_user.id}")
        raise HTTPException(status_code=404, detail="No delivery location found for this user")
    
    print(f"🔍 DEBUG: Usando location_id={location.id} para user_id={current_user.id}")
    
    # Verify category exists
    category = db.query(Category).filter(Category.id == delivery.category_id).first()
    if not category:
        print(f"❌ ERROR: Category not found. category_id={delivery.category_id}")
        raise HTTPException(status_code=404, detail="Category not found")
    
    print(f"✅ SUCCESS: Creating delivery for category {category.display_name}")
    
    # Create direct delivery (no batch_id)
    new_delivery = Delivery(
        batch_id=None,  # Direct delivery
        location_id=location.id,  # Usar o ID da location encontrada
        category_id=delivery.category_id,
        product_type=ProductType.MEAL,  # Default for compatibility
        quantity=delivery.quantity,
        status=DeliveryStatus.AVAILABLE,
        metadata_cache=delivery.metadata_cache or {},
        expires_at=datetime.utcnow() + timedelta(hours=24)  # 24h expiry
    )
    
    db.add(new_delivery)
    db.commit()
    db.refresh(new_delivery)
    print(f"✅ SUCCESS: Delivery created with id={new_delivery.id}")
    return new_delivery

@router.post("/{delivery_id}/confirm-pickup", response_model=DeliveryResponse)
def confirm_pickup(
    delivery_id: int,
    request: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Volunteer confirms pickup with provider's code (FLUXO 2 - with batch)"""
    code = request.get("pickup_code")
    
    if not code:
        raise HTTPException(status_code=400, detail="Pickup code is required")
    
    if not ConfirmationCodeValidator.validate_code(code):
        raise HTTPException(status_code=400, detail="Invalid code format")
    
    delivery = db.query(Delivery).filter(
        Delivery.id == delivery_id,
        Delivery.volunteer_id == current_user.id
    ).first()
    
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    
    # Only FLUXO 2 (with batch) uses this endpoint
    if not delivery.batch_id:
        raise HTTPException(status_code=400, detail="This is a direct delivery, no pickup needed")
    
    if delivery.status != DeliveryStatus.PENDING_CONFIRMATION:
        raise HTTPException(status_code=400, detail=f"Delivery must be PENDING_CONFIRMATION. Current: {delivery.status}")
    
    if code != delivery.pickup_code:
        raise HTTPException(status_code=422, detail="Invalid pickup code")
    
    # Update to PICKED_UP and generate delivery code if not exists
    delivery.status = DeliveryStatus.PICKED_UP
    delivery.picked_up_at = datetime.utcnow()
    if not delivery.delivery_code:
        delivery.delivery_code = ConfirmationCodeValidator.generate_code()
    
    db.commit()
    db.refresh(delivery)
    return delivery

@router.post("/{delivery_id}/confirm-delivery", response_model=DeliveryResponse)
def confirm_delivery(
    delivery_id: int,
    request: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Volunteer confirms delivery at location with delivery code"""
    code = request.get("delivery_code")
    
    if not code:
        raise HTTPException(status_code=400, detail="Delivery code is required")
    
    delivery = db.query(Delivery).filter(
        Delivery.id == delivery_id,
        Delivery.volunteer_id == current_user.id
    ).first()
    
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    
    if delivery.status not in [DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT]:
        raise HTTPException(
            status_code=400,
            detail=f"Delivery must be PICKED_UP or IN_TRANSIT. Current: {delivery.status}"
        )
    
    if code and delivery.delivery_code and code != delivery.delivery_code:
        raise HTTPException(status_code=422, detail="Invalid delivery code")
    
    # Mark as delivered
    delivery.status = DeliveryStatus.DELIVERED
    delivery.delivered_at = datetime.utcnow()
    
    # Check if all deliveries from batch are complete
    batch = delivery.batch
    all_delivered = all(
        d.status == DeliveryStatus.DELIVERED
        for d in batch.deliveries
    )
    
    if all_delivered:
        batch.status = BatchStatus.COMPLETED
    
    db.commit()
    db.refresh(delivery)
    return delivery

@router.get("/my-deliveries", response_model=List[DeliveryResponse])
def list_my_deliveries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List deliveries for current volunteer"""
    print(f"🔍 DEBUG /my-deliveries: Buscando deliveries para user_id={current_user.id}")
    
    deliveries = db.query(Delivery).options(
        joinedload(Delivery.category),
        joinedload(Delivery.location),
        joinedload(Delivery.volunteer)
    ).filter(
        Delivery.volunteer_id == current_user.id
    ).order_by(Delivery.created_at.desc()).all()
    
    print(f"📦 DEBUG /my-deliveries: Encontradas {len(deliveries)} deliveries")
    for d in deliveries:
        print(f"  Delivery {d.id}: category_id={d.category_id}, category={d.category}")
        if d.category:
            print(f"    Category: id={d.category.id}, name={d.category.name}, display_name={d.category.display_name}")
        else:
            print(f"    Category: NULL - joinedload não funcionou ou category_id é NULL")
    
    return deliveries

@router.get("/available", response_model=List[DeliveryResponse])
def list_available_deliveries(db: Session = Depends(get_db)):
    """List available deliveries waiting for volunteers"""
    return db.query(Delivery).filter(
        Delivery.status == DeliveryStatus.AVAILABLE,
        Delivery.volunteer_id.is_(None)
    ).order_by(Delivery.created_at.desc()).all()

@router.post("/{delivery_id}/commit", response_model=DeliveryResponse)
def commit_to_delivery(
    delivery_id: int,
    request: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved)
):
    """Volunteer commits to fulfill a delivery directly (without batch/provider)"""
    
    if "volunteer" not in current_user.roles:
        raise HTTPException(status_code=403, detail="Only volunteers can commit to deliveries")
    
    # Check if volunteer already has active delivery (com lógica mais flexível)
    print(f"🔍 DEBUG: Verificando entregas ativas para volunteer_id={current_user.id}")
    
    all_user_deliveries = db.query(Delivery).filter(Delivery.volunteer_id == current_user.id).all()
    print(f"📋 Todas as entregas do usuário: {len(all_user_deliveries)}")
    for d in all_user_deliveries:
        print(f"  - Delivery {d.id}: status={d.status}, created_at={d.created_at}")
    
    active_deliveries = db.query(Delivery).filter(
        Delivery.volunteer_id == current_user.id,
        Delivery.status.in_([DeliveryStatus.PENDING_CONFIRMATION, DeliveryStatus.RESERVED, DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT])
    ).all()
    
    print(f"🎯 Entregas ativas encontradas: {len(active_deliveries)}")
    
    # Lógica flexível: permitir múltiplas entregas se foram criadas recentemente (mesmo compromisso)
    if active_deliveries:
        # Verificar se as entregas ativas foram criadas nos últimos 30 segundos (provavelmente mesmo compromisso)
        thirty_seconds_ago = datetime.utcnow() - timedelta(seconds=30)
        
        recent_deliveries = [d for d in active_deliveries if d.created_at > thirty_seconds_ago]
        old_deliveries = [d for d in active_deliveries if d.created_at <= thirty_seconds_ago]
        
        print(f"📅 Entregas recentes (<30s): {len(recent_deliveries)}")
        print(f"📅 Entregas antigas (>30s): {len(old_deliveries)}")
        
        if old_deliveries:
            print(f"❌ Usuário tem entrega antiga ativa: {old_deliveries[0].id}, status={old_deliveries[0].status}")
            raise HTTPException(
                status_code=400,
                detail="You already have an active delivery. Complete or cancel it first."
            )
        
        if recent_deliveries:
            print(f"✅ Permitindo múltiplas entregas (criadas recentemente): {[d.id for d in recent_deliveries]}")
    
    print(f"✅ Usuário pode criar nova entrega")
    
    # Get the delivery
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    
    if delivery.status != DeliveryStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="Delivery is not available")
    
    if delivery.volunteer_id is not None:
        raise HTTPException(status_code=400, detail="Delivery already has a volunteer")
    
    # Get quantity to commit (partial or full)
    quantity_to_commit = request.get("quantity", delivery.quantity)
    
    print(f"🔍 DEBUG: Delivery ID={delivery.id}, original_quantity={delivery.quantity}, requested_quantity={quantity_to_commit}")
    print(f"🔍 DEBUG: Delivery original - category_id={delivery.category_id}, product_type={delivery.product_type}")
    
    if quantity_to_commit <= 0 or quantity_to_commit > delivery.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid quantity. Must be between 1 and {delivery.quantity}"
        )
    
    # Get batch to reduce available quantity (if exists)
    batch = None
    if delivery.batch_id:
        batch = db.query(ProductBatch).filter(ProductBatch.id == delivery.batch_id).first()
        if not batch:
            raise HTTPException(status_code=404, detail="Batch not found")
    
    # Always create split delivery for proper tracking and cancellation
    # This ensures we can restore quantities correctly when cancelled
    print(f"🔍 DEBUG: Creating split delivery - original: {delivery.quantity}, committed: {quantity_to_commit}")
    
    # Reduce batch available quantity TEMPORARILY (until confirmation) - only if batch exists
    if batch:
        batch.quantity_available -= quantity_to_commit
    
    # Create new delivery for the committed portion
    committed_delivery = Delivery(
        batch_id=delivery.batch_id,
        location_id=delivery.location_id,
        volunteer_id=current_user.id,
        parent_delivery_id=delivery.id,  # Track the original delivery
        product_type=delivery.product_type,
        category_id=delivery.category_id,  # Preservar categoria!
        quantity=quantity_to_commit,
        status=DeliveryStatus.PENDING_CONFIRMATION,
        accepted_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(hours=24),
        pickup_code=ConfirmationCodeValidator.generate_code(),
        delivery_code=ConfirmationCodeValidator.generate_code()
    )
    
    # Reduce original delivery quantity
    delivery.quantity -= quantity_to_commit
    
    # Keep original delivery even with 0 quantity to allow restoration
    # This ensures we can restore the quantity when cancelled
    if delivery.quantity == 0:
        print(f"� Original delivery {delivery.id} has 0 quantity, keeping for restoration")
        # Don't delete - keep it for potential restoration
    
    db.add(committed_delivery)
    db.commit()
    db.refresh(committed_delivery)
    
    print(f"✅ DEBUG: Nova delivery criada - id={committed_delivery.id}, category_id={committed_delivery.category_id}, product_type={committed_delivery.product_type}")
    
    return committed_delivery

@router.post("/{delivery_id}/validate-delivery", response_model=DeliveryResponse)
def validate_delivery_code(
    delivery_id: int,
    request: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Volunteer validates delivery at destination (both FLUXO 1 and FLUXO 2)"""
    print(f"🎯 DEBUG: Validando delivery_id={delivery_id}, user_id={current_user.id}")
    
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    
    print(f"📋 DEBUG: Delivery encontrado - status={delivery.status}, volunteer_id={delivery.volunteer_id}")
    
    # Check if user is the volunteer
    if delivery.volunteer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the volunteer can validate delivery")
    
    # Check status - FLUXO 1 (direct): PENDING_CONFIRMATION, FLUXO 2 (pickup): PICKED_UP
    valid_statuses = [DeliveryStatus.PENDING_CONFIRMATION, DeliveryStatus.PICKED_UP]
    if delivery.status not in valid_statuses:
        print(f"❌ DEBUG: Status inválido! Precisa: {valid_statuses}, Atual: {delivery.status}")
        raise HTTPException(
            status_code=400, 
            detail=f"Delivery must be PENDING_CONFIRMATION or PICKED_UP. Current: {delivery.status}"
        )
    
    # Validate code
    code = request.get("code")
    print(f"🔑 DEBUG: Código recebido={code}, código esperado={delivery.delivery_code}")
    
    if not code or delivery.delivery_code != code:
        print(f"❌ DEBUG: Código inválido!")
        raise HTTPException(status_code=400, detail="Invalid delivery code")
    
    # Update status
    print(f"🔄 DEBUG: Atualizando status para DELIVERED")
    delivery.status = DeliveryStatus.DELIVERED
    delivery.delivered_at = datetime.utcnow()
    
    db.commit()
    db.refresh(delivery)
    
    print(f"✅ DEBUG: Delivery finalizado com sucesso! Novo status={delivery.status}")
    return delivery

@router.delete("/{delivery_id}")
def cancel_delivery(
    delivery_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Cancel a delivery - only allowed before pickup"""
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    
    print(f"🔍 DEBUG CANCEL: Delivery ID={delivery_id}, status={delivery.status}, volunteer_id={delivery.volunteer_id}")
    print(f"🔍 DEBUG CANCEL: User ID={current_user.id}, User roles={current_user.roles}")
    
    # Check authorization - allow multiple user types to cancel
    can_cancel = False
    cancel_reason = ""
    
    # 1. Volunteer can cancel their own deliveries
    if delivery.volunteer_id == current_user.id:
        can_cancel = True
        cancel_reason = "volunteer_own_delivery"
        print(f"✅ DEBUG CANCEL: Volunteer {current_user.id} can cancel own delivery {delivery_id}")
    
    # 2. Provider can cancel their batch deliveries
    elif delivery.batch_id:
        batch = db.query(ProductBatch).filter(ProductBatch.id == delivery.batch_id).first()
        if batch and batch.provider_id == current_user.id:
            can_cancel = True
            cancel_reason = "provider_batch_delivery"
            print(f"✅ DEBUG CANCEL: Provider {current_user.id} can cancel batch delivery {delivery_id}")
    
    # 3. Shelter can cancel deliveries to their location
    else:
        location = db.query(DeliveryLocation).filter(DeliveryLocation.id == delivery.location_id).first()
        if location and location.user_id == current_user.id and "shelter" in current_user.roles:
            can_cancel = True
            cancel_reason = "shelter_location_delivery"
            print(f"✅ DEBUG CANCEL: Shelter {current_user.id} can cancel delivery {delivery_id}")
    
    if not can_cancel:
        print(f"❌ DEBUG CANCEL: User {current_user.id} cannot cancel delivery {delivery_id}")
        raise HTTPException(status_code=403, detail="Not authorized to cancel this delivery")
    
    print(f"✅ DEBUG CANCEL: User {current_user.id} can cancel delivery {delivery_id} as {cancel_reason}")
    
    # Can only cancel if not yet picked up
    if delivery.status not in [DeliveryStatus.AVAILABLE, DeliveryStatus.PENDING_CONFIRMATION, DeliveryStatus.RESERVED]:
        print(f"❌ DEBUG CANCEL: Cannot cancel - status {delivery.status} not allowed")
        raise HTTPException(
            status_code=400, 
            detail="Cannot cancel delivery after pickup. You must complete the delivery."
        )
    
    print(f"✅ DEBUG CANCEL: Status {delivery.status} allows cancellation")
    
    # Return quantity based on delivery type
    quantity_returned = 0
    
    if delivery.batch_id:
        # Has batch - return to batch.quantity_available
        batch = db.query(ProductBatch).filter(ProductBatch.id == delivery.batch_id).first()
        if batch:
            batch.quantity_available += delivery.quantity
            quantity_returned = delivery.quantity
            print(f"🔄 DEBUG CANCEL: Returned {quantity_returned} to batch {batch.id}")
    elif delivery.parent_delivery_id:
        # This is a split delivery - return quantity to parent delivery
        parent_delivery = db.query(Delivery).filter(Delivery.id == delivery.parent_delivery_id).first()
        if parent_delivery:
            parent_delivery.quantity += delivery.quantity
            quantity_returned = delivery.quantity
            print(f"🔄 DEBUG CANCEL: Returned {quantity_returned} to parent delivery {parent_delivery.id}")
        else:
            # Parent not found (shouldn't happen) - just delete
            quantity_returned = delivery.quantity
            print(f"⚠️ DEBUG CANCEL: Parent not found, just deleting")
    else:
        # Direct delivery without parent - just delete
        quantity_returned = delivery.quantity
        print(f"🗑️ DEBUG CANCEL: Direct delivery, just deleting")
    
    db.delete(delivery)
    db.commit()
    print(f"✅ DEBUG CANCEL: Successfully cancelled delivery {delivery_id}, returned {quantity_returned}")
    return {"message": "Delivery cancelled successfully", "quantity_returned": quantity_returned}
