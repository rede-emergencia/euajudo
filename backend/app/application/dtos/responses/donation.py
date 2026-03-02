"""
Donation Response DTOs - Schemas de saída para endpoints de doação.
"""
from pydantic import BaseModel, Field
from typing import List


class DonationCommitResponse(BaseModel):
    """
    Response após criar compromisso de doação.
    
    Retorna código de pickup único e IDs das deliveries criadas.
    """
    success: bool = Field(
        ...,
        description="Se o compromisso foi criado com sucesso",
        example=True,
    )
    code: str = Field(
        ...,
        description="Código de pickup de 6 dígitos para confirmar entrega",
        example="847291",
        min_length=6,
        max_length=6,
    )
    delivery_ids: List[int] = Field(
        ...,
        description="IDs das deliveries criadas (uma por item)",
        example=[101, 102],
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "code": "847291",
                "delivery_ids": [101, 102]
            }
        }
