"""
Delivery Response DTOs - Schemas de saída para deliveries.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.shared.enums import DeliveryStatus, ProductType


class DeliveryResponse(BaseModel):
    """
    Response com dados de uma delivery.
    
    Usado em listagens e detalhes de deliveries.
    """
    id: int = Field(..., description="ID da delivery", example=101)
    batch_id: Optional[int] = Field(None, description="ID do batch (se delivery de provider)")
    pickup_location_id: Optional[int] = Field(None, description="ID do local de coleta")
    delivery_location_id: Optional[int] = Field(None, description="ID do local de entrega")
    volunteer_id: Optional[int] = Field(None, description="ID do voluntário")
    category_id: int = Field(..., description="ID da categoria", example=1)
    product_type: ProductType = Field(..., description="Tipo de produto")
    quantity: int = Field(..., description="Quantidade", example=10)
    status: DeliveryStatus = Field(..., description="Status da delivery")
    pickup_code: Optional[str] = Field(None, description="Código de pickup de 6 dígitos")
    
    created_at: datetime = Field(..., description="Data de criação")
    accepted_at: Optional[datetime] = Field(None, description="Data de aceite pelo voluntário")
    picked_up_at: Optional[datetime] = Field(None, description="Data de coleta")
    delivered_at: Optional[datetime] = Field(None, description="Data de entrega")
    expires_at: Optional[datetime] = Field(None, description="Data de expiração do compromisso")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 101,
                "batch_id": None,
                "pickup_location_id": None,
                "delivery_location_id": 5,
                "volunteer_id": 42,
                "category_id": 1,
                "product_type": "GENERIC",
                "quantity": 10,
                "status": "PENDING_CONFIRMATION",
                "pickup_code": "847291",
                "created_at": "2026-03-02T14:30:00",
                "accepted_at": "2026-03-02T14:30:00",
                "picked_up_at": None,
                "delivered_at": None,
                "expires_at": "2026-03-04T14:30:00"
            }
        }
