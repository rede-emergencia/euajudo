"""
Inventory Request DTOs - Schemas de entrada para endpoints de inventário.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class InventoryItemUpdateRequest(BaseModel):
    """Request para atualizar item de inventário."""
    quantity_in_stock: Optional[int] = Field(
        None,
        ge=0,
        description="Quantidade em estoque"
    )
    min_threshold: Optional[int] = Field(
        None,
        ge=0,
        description="Limite mínimo de alerta"
    )
    max_threshold: Optional[int] = Field(
        None,
        ge=0,
        description="Limite máximo de estoque"
    )
    metadata_cache: Optional[Dict[str, Any]] = Field(
        None,
        description="Metadados adicionais"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "quantity_in_stock": 100,
                "min_threshold": 10,
                "max_threshold": 500
            }
        }


class ShelterRequestCreateRequest(BaseModel):
    """Request para criar pedido de abrigo."""
    category_id: int = Field(..., gt=0, description="ID da categoria")
    quantity_requested: int = Field(..., gt=0, description="Quantidade solicitada")
    urgency: Optional[str] = Field(
        "normal",
        description="Urgência: low, normal, high, critical"
    )
    notes: Optional[str] = Field(None, description="Observações adicionais")
    metadata_cache: Optional[Dict[str, Any]] = Field(
        None,
        description="Metadados adicionais do pedido"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "category_id": 1,
                "quantity_requested": 50,
                "urgency": "high",
                "notes": "Necessário para distribuição amanhã"
            }
        }
