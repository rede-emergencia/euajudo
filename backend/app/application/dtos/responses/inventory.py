"""
Inventory Response DTOs - Schemas de saída para endpoints de inventário.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class InventoryItemResponse(BaseModel):
    """Response com dados de item de inventário."""
    id: int = Field(..., description="ID do item")
    shelter_id: int = Field(..., description="ID do abrigo")
    category_id: int = Field(..., description="ID da categoria")
    quantity_in_stock: int = Field(..., description="Quantidade em estoque")
    quantity_reserved: int = Field(..., description="Quantidade reservada")
    quantity_available: int = Field(..., description="Quantidade disponível")
    min_threshold: int = Field(..., description="Limite mínimo")
    max_threshold: Optional[int] = Field(None, description="Limite máximo")
    last_transaction_at: Optional[datetime] = Field(None, description="Última transação")
    created_at: datetime = Field(..., description="Data de criação")
    updated_at: datetime = Field(..., description="Última atualização")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "shelter_id": 10,
                "category_id": 1,
                "quantity_in_stock": 100,
                "quantity_reserved": 20,
                "quantity_available": 80,
                "min_threshold": 10,
                "max_threshold": 500,
                "last_transaction_at": "2026-03-02T14:30:00",
                "created_at": "2026-03-01T10:00:00",
                "updated_at": "2026-03-02T14:30:00"
            }
        }


class ShelterRequestResponse(BaseModel):
    """Response com dados de pedido de abrigo."""
    id: int = Field(..., description="ID do pedido")
    shelter_id: int = Field(..., description="ID do abrigo")
    category_id: int = Field(..., description="ID da categoria")
    quantity_requested: int = Field(..., description="Quantidade solicitada")
    quantity_received: int = Field(default=0, description="Quantidade recebida")
    quantity_pending: int = Field(default=0, description="Quantidade pendente")
    status: str = Field(..., description="Status do pedido")
    urgency: Optional[str] = Field(None, description="Urgência")
    notes: Optional[str] = Field(None, description="Observações")
    created_at: datetime = Field(..., description="Data de criação")
    updated_at: datetime = Field(..., description="Última atualização")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "shelter_id": 10,
                "category_id": 1,
                "quantity_requested": 50,
                "quantity_received": 30,
                "quantity_pending": 10,
                "status": "active",
                "urgency": "high",
                "notes": "Necessário urgente",
                "created_at": "2026-03-01T10:00:00",
                "updated_at": "2026-03-02T14:30:00"
            }
        }
