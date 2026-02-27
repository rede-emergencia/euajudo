from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User
from app.schemas import UserResponse, UserUpdate
from app.auth import get_current_active_user, require_role

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db)
):
    """Get all approved users - for login modal selection"""
    return db.query(User).filter(User.approved == True).all()

@router.get("/pending-approval", response_model=List[UserResponse])
def get_pending_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    return db.query(User).filter(User.approved == False).all()

@router.post("/{user_id}/approve", response_model=UserResponse)
def approve_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.approved = True
    db.commit()
    db.refresh(user)
    return user

@router.put("/me", response_model=UserResponse)
def update_profile(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.phone is not None:
        current_user.phone = user_update.phone
    if user_update.address is not None:
        current_user.address = user_update.address
    if user_update.production_capacity is not None:
        current_user.production_capacity = user_update.production_capacity
    if user_update.delivery_capacity is not None:
        current_user.delivery_capacity = user_update.delivery_capacity
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/me")
def delete_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db.delete(current_user)
    db.commit()
    return {"message": "Account deleted successfully"}
