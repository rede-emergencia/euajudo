from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from app.database import get_db
from app.models import User, DeliveryLocation
from app.schemas import UserCreate, UserResponse, Token
from app.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_current_active_user
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Auto-approve admin and volunteer users
    # Vou Ajudar: Apenas providers e shelters precisam de aprovação
    approved = user.roles in ['admin', 'volunteer']

    new_user = User(
        email=user.email,
        hashed_password=get_password_hash(user.password),
        name=user.name,
        phone=user.phone,
        roles=user.roles,
        city_id=user.city_id,
        address=user.address,
        establishment_type=user.establishment_type,
        production_capacity=user.production_capacity,
        delivery_capacity=user.delivery_capacity,
        operating_hours=user.operating_hours,
        latitude=user.latitude,
        longitude=user.longitude,
        approved=approved
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # For shelter role: automatically create a linked DeliveryLocation
    if "shelter" in user.roles and user.location_address:
        location = DeliveryLocation(
            name=user.location_name or user.name,
            address=user.location_address,
            city_id=user.city_id or 'belo-horizonte',
            contact_person=user.contact_person,
            phone=user.location_phone,
            daily_need=user.daily_need,
            operating_hours=user.location_operating_hours,
            user_id=new_user.id,
            approved=False,
            active=True,
        )
        db.add(location)
        db.commit()

    return new_user

@router.post("/quick-login", response_model=Token)
def quick_login(user_type: str = Form(...), db: Session = Depends(get_db)):
    """
    Login rápido para testes - aceita qualquer usuário com senha "123"
    Parâmetros: provider, volunteer, shelter, admin
    """
    
    # Usuários hardcoded para testes
    quick_users = {
        "provider": {
            "email": "cozinha.solidaria@euajudo.com",
            "name": "Cozinha Solidária Central",
            "roles": "provider"
        },
        "volunteer": {
            "email": "joao.voluntario@euajudo.com", 
            "name": "João Voluntário",
            "roles": "volunteer"
        },
        "shelter": {
            "email": "abrigo.sao.francisco@euajudo.com",
            "name": "Abrigo São Francisco de Assis", 
            "roles": "shelter"
        },
        "admin": {
            "email": "admin@euajudo.com",
            "name": "Administrador Sistema",
            "roles": "admin"
        }
    }
    
    if user_type not in quick_users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid user_type. Use: {', '.join(quick_users.keys())}"
        )
    
    user_info = quick_users[user_type]
    user = db.query(User).filter(User.email == user_info["email"]).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_info['email']} not found. Run seed first."
        )
    
    # Verifica se a senha é "123" (padrão do seed)
    if not verify_password("123", user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Quick login only works with password '123'"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_info": {
            "email": user.email,
            "name": user.name,
            "roles": user.roles
        }
    }

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user
