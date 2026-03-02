"""
User Response DTOs - Schemas de saída para endpoints de usuário.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime


class UserResponse(BaseModel):
    """Response com dados do usuário."""
    id: int = Field(..., description="ID do usuário")
    email: EmailStr = Field(..., description="Email")
    name: str = Field(..., description="Nome completo")
    phone: Optional[str] = Field(None, description="Telefone")
    roles: List[str] = Field(..., description="Roles do usuário")
    active: bool = Field(..., description="Se usuário está ativo")
    approved: bool = Field(..., description="Se usuário foi aprovado")
    created_at: datetime = Field(..., description="Data de criação")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "email": "volunteer@example.com",
                "name": "João Silva",
                "phone": "+5511999999999",
                "roles": ["volunteer"],
                "active": True,
                "approved": True,
                "created_at": "2026-03-01T10:00:00"
            }
        }


class TokenResponse(BaseModel):
    """Response com token de autenticação."""
    access_token: str = Field(..., description="JWT token")
    token_type: str = Field(default="bearer", description="Tipo do token")
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer"
            }
        }
