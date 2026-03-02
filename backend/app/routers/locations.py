"""
Delivery Locations Router
Uses Repository pattern to avoid code duplication
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, DeliveryLocation
from app.schemas import DeliveryLocationCreate, DeliveryLocationResponse
from app.auth import get_current_active_user, require_role
from app.repositories import BaseRepository

router = APIRouter(prefix="/api/locations", tags=["locations"])

@router.get("/", response_model=List[DeliveryLocationResponse])
def list_locations(
    active_only: bool = True,
    city_id: str = None,
    db: Session = Depends(get_db)
):
    """List delivery locations"""
    repo = BaseRepository(DeliveryLocation, db)
    
    filters = {}
    if active_only:
        filters['active'] = True
        filters['approved'] = True  # Apenas locations aprovadas devem aparecer no mapa
    if city_id:
        filters['city_id'] = city_id
    
    return repo.filter_by(**filters)

@router.post("/", response_model=DeliveryLocationResponse, status_code=201)
def create_location(
    location: DeliveryLocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Create new delivery location"""
    repo = BaseRepository(DeliveryLocation, db)
    
    new_location = repo.create(
        name=location.name,
        address=location.address,
        city_id=location.city_id,
        latitude=location.latitude,
        longitude=location.longitude,
        contact_person=location.contact_person,
        phone=location.phone,
        capacity=location.capacity,
        daily_need=location.daily_need,
        operating_hours=location.operating_hours
    )
    
    repo.commit()
    repo.refresh(new_location)
    return new_location

@router.get("/debug-locations", response_model=List[dict])
def debug_locations(
    db: Session = Depends(get_db)
):
    """Debug endpoint para verificar status de todos os abrigos"""
    locations = db.query(DeliveryLocation).all()
    
    debug_info = []
    for loc in locations:
        debug_info.append({
            "id": loc.id,
            "name": loc.name,
            "active": loc.active,
            "approved": loc.approved,
            "latitude": loc.latitude,
            "longitude": loc.longitude,
            "user_id": loc.user_id,
            "should_appear_on_map": loc.active and loc.approved and loc.latitude and loc.longitude
        })
    
    return debug_info

@router.get("/{location_id}", response_model=DeliveryLocationResponse)
def get_location(location_id: int, db: Session = Depends(get_db)):
    """Get location by ID"""
    repo = BaseRepository(DeliveryLocation, db)
    location = repo.get_by_id(location_id)
    
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    return location

@router.put("/{location_id}", response_model=DeliveryLocationResponse)
def update_location(
    location_id: int,
    location_update: DeliveryLocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Update location"""
    repo = BaseRepository(DeliveryLocation, db)
    location = repo.get_by_id(location_id)
    
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    updated = repo.update(
        location,
        name=location_update.name,
        address=location_update.address,
        city_id=location_update.city_id,
        latitude=location_update.latitude,
        longitude=location_update.longitude,
        contact_person=location_update.contact_person,
        phone=location_update.phone,
        capacity=location_update.capacity,
        daily_need=location_update.daily_need,
        operating_hours=location_update.operating_hours
    )
    
    repo.commit()
    repo.refresh(updated)
    return updated

@router.post("/{location_id}/approve", response_model=DeliveryLocationResponse)
def approve_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Approve location"""
    repo = BaseRepository(DeliveryLocation, db)
    location = repo.get_by_id(location_id)
    
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    updated = repo.update(location, approved=True)
    repo.commit()
    repo.refresh(updated)
    return updated

@router.post("/{location_id}/deactivate", response_model=DeliveryLocationResponse)
def deactivate_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Deactivate location"""
    repo = BaseRepository(DeliveryLocation, db)
    location = repo.get_by_id(location_id)
    
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    updated = repo.update(location, active=False)
    repo.commit()
    repo.refresh(updated)
    return updated
