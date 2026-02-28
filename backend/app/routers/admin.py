"""
Admin Router - User management
Uses Repository pattern
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth import require_admin
from app.models import User, DeliveryLocation
from app.schemas import UserResponse, DeliveryLocationResponse
from app.repositories import BaseRepository

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/users", response_model=List[UserResponse])
def list_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List all users"""
    repo = BaseRepository(User, db)
    return repo.list_all()

@router.get("/users/pending", response_model=List[UserResponse])
def list_pending_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List users pending approval"""
    repo = BaseRepository(User, db)
    return repo.filter_by(approved=False, active=True)

@router.post("/users/{user_id}/approve", response_model=UserResponse)
def approve_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Approve user"""
    repo = BaseRepository(User, db)
    user = repo.get_by_id(user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated = repo.update(user, approved=True)
    repo.commit()
    repo.refresh(updated)
    return updated

@router.post("/users/{user_id}/disapprove", response_model=UserResponse)
def disapprove_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Disapprove user"""
    repo = BaseRepository(User, db)
    user = repo.get_by_id(user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot disapprove yourself")
    
    updated = repo.update(user, approved=False)
    repo.commit()
    repo.refresh(updated)
    return updated

@router.post("/users/{user_id}/deactivate", response_model=UserResponse)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Deactivate user"""
    repo = BaseRepository(User, db)
    user = repo.get_by_id(user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    
    updated = repo.update(user, active=False)
    repo.commit()
    repo.refresh(updated)
    return updated

@router.post("/users/{user_id}/activate", response_model=UserResponse)
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Activate user"""
    repo = BaseRepository(User, db)
    user = repo.get_by_id(user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated = repo.update(user, active=True)
    repo.commit()
    repo.refresh(updated)
    return updated

# ============================================================================
# VOLUNTEER MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/volunteers", response_model=List[UserResponse])
def list_volunteers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List all volunteers"""
    volunteers = db.query(User).filter(User.roles.like("%volunteer%")).all()
    return volunteers

@router.get("/volunteers/pending", response_model=List[UserResponse])
def list_pending_volunteers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List volunteers pending approval"""
    volunteers = db.query(User).filter(User.roles.like("%volunteer%"), User.approved == False, User.active == True).all()
    return volunteers

@router.get("/volunteers/active", response_model=List[UserResponse])
def list_active_volunteers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List active volunteers"""
    volunteers = db.query(User).filter(User.roles.like("%volunteer%"), User.approved == True, User.active == True).all()
    return volunteers

# ============================================================================
# SHELTER MANAGEMENT ENDPOINTS  
# ============================================================================

@router.get("/shelters", response_model=List[UserResponse])
def list_shelters(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List all shelters (users with receiver role)"""
    shelters = db.query(User).filter(User.roles.like("%shelter%")).all()
    return shelters

@router.get("/shelters/pending", response_model=List[UserResponse])
def list_pending_shelters(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List shelters pending approval"""
    shelters = db.query(User).filter(User.roles.like("%shelter%"), User.approved == False, User.active == True).all()
    return shelters

@router.get("/shelters/active", response_model=List[UserResponse])
def list_active_shelters(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List active shelters"""
    shelters = db.query(User).filter(User.roles.like("%shelter%"), User.approved == True, User.active == True).all()
    return shelters

@router.put("/shelters/{shelter_id}/location", response_model=UserResponse)
def update_shelter_location(
    shelter_id: int,
    latitude: float,
    longitude: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update shelter location coordinates"""
    repo = BaseRepository(User, db)
    shelter = repo.get_by_id(shelter_id)
    
    if not shelter:
        raise HTTPException(status_code=404, detail="Shelter not found")
    
    if "shelter" not in shelter.roles:
        raise HTTPException(status_code=400, detail="User is not a shelter")
    
    updated = repo.update(shelter, latitude=latitude, longitude=longitude)
    repo.commit()
    repo.refresh(updated)
    return updated

# ============================================================================
# DELIVERY LOCATIONS ADMIN ENDPOINTS
# ============================================================================

@router.get("/locations", response_model=List[DeliveryLocationResponse])
def list_all_locations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List all delivery locations (admin view)"""
    locations = db.query(DeliveryLocation).all()
    return locations

@router.get("/locations/pending", response_model=List[DeliveryLocationResponse])
def list_pending_locations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List locations pending approval"""
    locations = db.query(DeliveryLocation).filter(DeliveryLocation.approved == False, DeliveryLocation.active == True).all()
    return locations

@router.get("/locations/active", response_model=List[DeliveryLocationResponse])
def list_active_locations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List active locations"""
    locations = db.query(DeliveryLocation).filter(DeliveryLocation.approved == True, DeliveryLocation.active == True).all()
    return locations

@router.post("/locations/{location_id}/approve", response_model=DeliveryLocationResponse)
def approve_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
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

@router.post("/locations/{location_id}/disapprove", response_model=DeliveryLocationResponse)
def disapprove_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Disapprove location"""
    repo = BaseRepository(DeliveryLocation, db)
    location = repo.get_by_id(location_id)
    
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    updated = repo.update(location, approved=False)
    repo.commit()
    repo.refresh(updated)
    return updated

@router.post("/locations/{location_id}/activate", response_model=DeliveryLocationResponse)
def activate_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Activate location"""
    repo = BaseRepository(DeliveryLocation, db)
    location = repo.get_by_id(location_id)
    
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    updated = repo.update(location, active=True)
    repo.commit()
    repo.refresh(updated)
    return updated

@router.post("/locations/{location_id}/deactivate", response_model=DeliveryLocationResponse)
def deactivate_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
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
