"""
User Request DTOs - Schemas de entrada para endpoints de usuário.
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import List, Optional


class UserCreateRequest(BaseModel):
    """Request para criar novo usuário."""
    email: EmailStr = Field(
        ...,
        description="Email único do usuário",
        example="volunteer@example.com"
    )
    password: str = Field(
        ...,
        min_length=6,
        description="Senha (mínimo 6 caracteres)",
        example="senha123"
    )
    name: str = Field(
        ...,
        min_length=2,
        description="Nome completo",
        example="João Silva"
    )
    phone: Optional[str] = Field(
        None,
        description="Telefone de contato",
        example="+5511999999999"
    )
    roles: List[str] = Field(
        default=["volunteer"],
        description="Roles do usuário",
        example=["volunteer"]
    )
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "volunteer@example.com",
                "password": "senha123",
                "name": "João Silva",
                "phone": "+5511999999999",
                "roles": ["volunteer"]
            }
        }


class UserUpdateRequest(BaseModel):
    """Request para atualizar dados do usuário."""
    name: Optional[str] = Field(None, min_length=2)
    phone: Optional[str] = None
    active: Optional[bool] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "João Silva Santos",
                "phone": "+5511988888888",
                "active": True
            }
        }


class LoginRequest(BaseModel):
    """Request para login (OAuth2 password flow)."""
    username: str = Field(..., description="Email do usuário")
    password: str = Field(..., description="Senha")
    
    class Config:
        json_schema_extra = {
            "example": {
                "username": "volunteer@example.com",
                "password": "senha123"
            }
        }
