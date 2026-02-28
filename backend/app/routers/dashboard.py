"""
Generic Dashboard Router
Provides dashboard configuration and data based on user role
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime

from app.database import get_db
from app.auth import get_current_user
from app.models import User, ProductBatch, Delivery, ResourceRequest, ResourceReservation
from app.schemas import UserResponse
from app.dashboard_config import get_dashboard_config, get_widget_config, WidgetDataSource
from app.enums import BatchStatus, DeliveryStatus, OrderStatus, UserRole

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

def has_role(user: User, role: str) -> bool:
    """Check if user has a specific role"""
    return role in user.roles.split(',')

def get_user_primary_role(user: User) -> str:
    """Get user's primary role for dashboard"""
    roles = user.roles.split(',')
    role_priority = [UserRole.ADMIN.value, UserRole.PROVIDER.value, UserRole.SHELTER.value, UserRole.VOLUNTEER.value]
    
    for role in role_priority:
        if role in roles:
            return role
    
    return roles[0] if roles else 'volunteer'

@router.get("/stats")
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get dashboard statistics for current user
    """
    stats = {}
    
    # Provider stats
    if has_role(current_user, 'provider') or has_role(current_user, 'produtor'):
        stats['total_ingredient_requests'] = db.query(ResourceRequest).filter(
            ResourceRequest.provider_id == current_user.id
        ).count()
        
        stats['total_batches'] = db.query(ProductBatch).filter(
            ProductBatch.provider_id == current_user.id
        ).count()
        
        stats['batches_ready'] = db.query(ProductBatch).filter(
            ProductBatch.provider_id == current_user.id,
            ProductBatch.status == BatchStatus.READY
        ).count()
    
    # Volunteer buyer stats
    if has_role(current_user, 'volunteer_comprador'):
        stats['total_reservations'] = db.query(ResourceReservation).filter(
            ResourceReservation.volunteer_id == current_user.id
        ).count()
        
        stats['active_reservations'] = db.query(ResourceReservation).filter(
            ResourceReservation.volunteer_id == current_user.id,
            ResourceReservation.status.in_(['RESERVED', 'PARTIALLY_RESERVED'])
        ).count()
        
        stats['available_requests'] = db.query(ResourceRequest).filter(
            ResourceRequest.status == OrderStatus.REQUESTING
        ).count()
    
    # Volunteer delivery stats
    if has_role(current_user, 'volunteer_entregador') or has_role(current_user, 'volunteer'):
        stats['total_deliveries'] = db.query(Delivery).filter(
            Delivery.volunteer_id == current_user.id
        ).count()
        
        stats['completed_deliveries'] = db.query(Delivery).filter(
            Delivery.volunteer_id == current_user.id,
            Delivery.status == DeliveryStatus.DELIVERED
        ).count()
    
    # Admin stats
    if has_role(current_user, 'admin'):
        stats['pending_deliveries'] = db.query(Delivery).filter(
            Delivery.status.in_([DeliveryStatus.PENDING_CONFIRMATION, DeliveryStatus.PICKED_UP])
        ).count()
    
    return stats

@router.get("/config")
def get_dashboard_configuration(
    current_user: User = Depends(get_current_user)
):
    """
    Get dashboard configuration for current user based on their role
    """
    role = get_user_primary_role(current_user)
    config = get_dashboard_config(role)
    
    if not config:
        raise HTTPException(status_code=404, detail="Dashboard configuration not found for role")
    
    return {
        "role": config.role,
        "title": config.title,
        "description": config.description,
        "widgets": [
            {
                "id": w.id,
                "type": w.type,
                "title": w.title,
                "data_source": w.data_source,
                "icon": w.icon,
                "size": w.size,
                "order": w.order,
                "visible": w.visible,
                "display_mode": w.display_mode,
                "max_items": w.max_items,
                "columns": w.columns,
                "primary_action": {
                    "id": w.primary_action.id,
                    "label": w.primary_action.label,
                    "icon": w.primary_action.icon,
                    "endpoint": w.primary_action.endpoint,
                    "method": w.primary_action.method,
                    "style": w.primary_action.style,
                } if w.primary_action else None,
                "item_actions": [
                    {
                        "id": a.id,
                        "label": a.label,
                        "icon": a.icon,
                        "endpoint": a.endpoint,
                        "method": a.method,
                        "style": a.style,
                        "confirmation_message": a.confirmation_message,
                    }
                    for a in w.item_actions
                ]
            }
            for w in sorted(config.widgets, key=lambda x: x.order)
        ],
        "quick_actions": config.quick_actions
    }

@router.get("/widgets/{widget_id}/data")
def get_widget_data(
    widget_id: str,
    limit: int = 10,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get data for a specific widget
    """
    role = get_user_primary_role(current_user)
    widget = get_widget_config(role, widget_id)
    
    if not widget:
        raise HTTPException(status_code=404, detail=f"Widget {widget_id} not found for role {role}")
    
    # Load data based on widget data source
    data = load_widget_data(
        widget.data_source,
        widget.filters,
        current_user,
        db,
        limit=min(limit, widget.max_items),
        offset=offset
    )
    
    return {
        "widget_id": widget_id,
        "data": data,
        "total": len(data),
        "has_more": len(data) >= limit
    }

def load_widget_data(
    data_source: WidgetDataSource,
    filters: Dict[str, Any],
    user: User,
    db: Session,
    limit: int = 10,
    offset: int = 0
) -> List[Dict[str, Any]]:
    """
    Load data from the appropriate source based on widget configuration
    """
    if data_source == WidgetDataSource.BATCHES:
        return load_batches_data(filters, user, db, limit, offset)
    elif data_source == WidgetDataSource.REQUESTS:
        return load_requests_data(filters, user, db, limit, offset)
    elif data_source == WidgetDataSource.RESERVATIONS:
        return load_reservations_data(filters, user, db, limit, offset)
    elif data_source == WidgetDataSource.DELIVERIES:
        return load_deliveries_data(filters, user, db, limit, offset)
    elif data_source == WidgetDataSource.STATS:
        return load_stats_data(filters, user, db)
    
    return []

def load_batches_data(
    filters: Dict[str, Any],
    user: User,
    db: Session,
    limit: int,
    offset: int
) -> List[Dict[str, Any]]:
    """Load batches data"""
    query = db.query(ProductBatch)
    
    if filters.get("my"):
        query = query.filter(ProductBatch.provider_id == user.id)
    
    if filters.get("active"):
        query = query.filter(
            ProductBatch.status.in_([
                BatchStatus.PRODUCING,
                BatchStatus.READY,
                BatchStatus.IN_DELIVERY
            ])
        )
    
    batches = query.order_by(ProductBatch.created_at.desc()).limit(limit).offset(offset).all()
    
    return [
        {
            "id": b.id,
            "product_type": b.product_type,
            "quantity": b.quantity,
            "quantity_available": b.quantity_available,
            "description": b.description,
            "status": b.status,
            "created_at": b.created_at.isoformat() if b.created_at else None,
            "expires_at": b.expires_at.isoformat() if b.expires_at else None,
            "pickup_deadline": b.pickup_deadline,
            "provider": {
                "id": b.provider.id,
                "name": b.provider.name,
                "address": b.provider.address,
            } if b.provider else None,
        }
        for b in batches
    ]

def load_requests_data(
    filters: Dict[str, Any],
    user: User,
    db: Session,
    limit: int,
    offset: int
) -> List[Dict[str, Any]]:
    """Load resource requests data"""
    query = db.query(ResourceRequest)
    
    if filters.get("my"):
        query = query.filter(ResourceRequest.provider_id == user.id)
    
    requests = query.order_by(ResourceRequest.created_at.desc()).limit(limit).offset(offset).all()
    
    return [
        {
            "id": r.id,
            "quantity_meals": r.quantity_meals,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "receiving_time": r.receiving_time.isoformat() if r.receiving_time else None,
            "confirmation_code": r.confirmation_code,
            "items": [
                {
                    "id": item.id,
                    "name": item.name,
                    "quantity": item.quantity,
                    "unit": item.unit,
                    "quantity_reserved": item.quantity_reserved,
                    "quantity_delivered": item.quantity_delivered,
                }
                for item in r.items
            ],
            "provider": {
                "id": r.provider.id,
                "name": r.provider.name,
                "address": r.provider.address,
                "phone": r.provider.phone,
            } if r.provider else None,
        }
        for r in requests
    ]

def load_reservations_data(
    filters: Dict[str, Any],
    user: User,
    db: Session,
    limit: int,
    offset: int
) -> List[Dict[str, Any]]:
    """Load resource reservations data"""
    query = db.query(ResourceReservation)
    
    if filters.get("my"):
        query = query.filter(ResourceReservation.volunteer_id == user.id)
    
    reservations = query.order_by(ResourceReservation.created_at.desc()).limit(limit).offset(offset).all()
    
    return [
        {
            "id": res.id,
            "request_id": res.request_id,
            "status": res.status,
            "created_at": res.created_at.isoformat() if res.created_at else None,
            "delivered_at": res.delivered_at.isoformat() if res.delivered_at else None,
            "request": {
                "id": res.request.id,
                "quantity_meals": res.request.quantity_meals,
                "confirmation_code": res.request.confirmation_code,
                "provider": {
                    "id": res.request.provider.id,
                    "name": res.request.provider.name,
                    "address": res.request.provider.address,
                    "phone": res.request.provider.phone,
                } if res.request.provider else None,
                "items": [
                    {
                        "id": item.id,
                        "name": item.name,
                        "quantity": item.quantity,
                        "unit": item.unit,
                    }
                    for item in res.request.items
                ],
            } if res.request else None,
        }
        for res in reservations
    ]

def load_deliveries_data(
    filters: Dict[str, Any],
    user: User,
    db: Session,
    limit: int,
    offset: int
) -> List[Dict[str, Any]]:
    """Load deliveries data"""
    query = db.query(Delivery)
    
    if filters.get("my"):
        query = query.filter(Delivery.volunteer_id == user.id)
    
    if filters.get("my_batches"):
        # Get deliveries for batches created by this user
        query = query.join(ProductBatch).filter(ProductBatch.provider_id == user.id)
    
    if filters.get("to_my_location"):
        # For shelters - deliveries coming to their location
        # This requires knowing the user's location_id - we'll use address matching for now
        pass
    
    if filters.get("status"):
        query = query.filter(Delivery.status == filters["status"])
    
    deliveries = query.order_by(Delivery.created_at.desc()).limit(limit).offset(offset).all()
    
    return [
        {
            "id": d.id,
            "batch_id": d.batch_id,
            "location_id": d.location_id,
            "product_type": d.product_type,
            "quantity": d.quantity,
            "status": d.status,
            "pickup_code": d.pickup_code,
            "delivery_code": d.delivery_code,
            "created_at": d.created_at.isoformat() if d.created_at else None,
            "picked_up_at": d.picked_up_at.isoformat() if d.picked_up_at else None,
            "delivered_at": d.delivered_at.isoformat() if d.delivered_at else None,
            "batch": {
                "id": d.batch.id,
                "quantity": d.batch.quantity,
                "description": d.batch.description,
                "provider": {
                    "id": d.batch.provider.id,
                    "name": d.batch.provider.name,
                    "address": d.batch.provider.address,
                } if d.batch.provider else None,
            } if d.batch else None,
            "location": {
                "id": d.location.id,
                "name": d.location.name,
                "address": d.location.address,
            } if d.location else None,
            "volunteer": {
                "id": d.volunteer.id,
                "name": d.volunteer.name,
                "phone": d.volunteer.phone,
            } if d.volunteer else None,
        }
        for d in deliveries
    ]

def load_stats_data(
    filters: Dict[str, Any],
    user: User,
    db: Session
) -> List[Dict[str, Any]]:
    """Load statistics data"""
    stats = {}
    
    if has_role(user, 'provider') or has_role(user, 'produtor'):
        stats['total_batches'] = db.query(ProductBatch).filter(
            ProductBatch.provider_id == user.id
        ).count()
        
        stats['active_batches'] = db.query(ProductBatch).filter(
            ProductBatch.provider_id == user.id,
            ProductBatch.status.in_([BatchStatus.READY, BatchStatus.IN_DELIVERY])
        ).count()
    
    if has_role(user, 'volunteer'):
        stats['total_deliveries'] = db.query(Delivery).filter(
            Delivery.volunteer_id == user.id
        ).count()
        
        stats['completed_deliveries'] = db.query(Delivery).filter(
            Delivery.volunteer_id == user.id,
            Delivery.status == DeliveryStatus.DELIVERED
        ).count()
    
    return [stats]

@router.get("/stats")
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get dashboard statistics for current user (legacy endpoint for compatibility)
    """
    stats = {}
    
    # Provider stats
    if has_role(current_user, 'provider') or has_role(current_user, 'produtor'):
        stats['total_batches'] = db.query(ProductBatch).filter(
            ProductBatch.provider_id == current_user.id
        ).count()
        
        stats['active_batches'] = db.query(ProductBatch).filter(
            ProductBatch.provider_id == current_user.id,
            ProductBatch.status.in_([BatchStatus.READY, BatchStatus.IN_DELIVERY])
        ).count()
    
    # Volunteer stats
    if has_role(current_user, 'volunteer'):
        stats['total_deliveries'] = db.query(Delivery).filter(
            Delivery.volunteer_id == current_user.id
        ).count()
        
        stats['completed_deliveries'] = db.query(Delivery).filter(
            Delivery.volunteer_id == current_user.id,
            Delivery.status == DeliveryStatus.DELIVERED
        ).count()
    
    return stats
