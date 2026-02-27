"""
Admin Router - User management
Uses Repository pattern
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth import require_admin
from app.models import User
from app.schemas import UserResponse
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
