"""
Donation Request DTOs - Schemas de entrada para endpoints de doação.
"""
from pydantic import BaseModel, Field
from typing import List


class DonationItemRequest(BaseModel):
    """
    Item individual em um compromisso de doação.
    
    Representa a quantidade que o voluntário se compromete a trazer
    para um pedido específico do abrigo.
    """
    request_id: int = Field(
        ...,
        description="ID do ShelterRequest (pedido do abrigo)",
        example=1,
        gt=0,
    )
    quantity: int = Field(
        ...,
        description="Quantidade que o voluntário vai trazer",
        example=10,
        gt=0,
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "request_id": 1,
                "quantity": 10
            }
        }


class DonationCommitRequest(BaseModel):
    """
    Request para criar compromisso de doação.
    
    Voluntário se compromete a trazer itens diretamente ao abrigo.
    Gera código de pickup único para confirmação na entrega.
    """
    shelter_id: int = Field(
        ...,
        description="ID do usuário do abrigo (user_id, não location_id)",
        example=10,
        gt=0,
    )
    items: List[DonationItemRequest] = Field(
        ...,
        description="Lista de itens a doar (mínimo 1)",
        min_length=1,
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "shelter_id": 10,
                "items": [
                    {"request_id": 1, "quantity": 10},
                    {"request_id": 2, "quantity": 5}
                ]
            }
        }


class ConfirmDeliveryRequest(BaseModel):
    """
    Request para confirmar entrega de doação.
    
    Abrigo usa código de pickup para confirmar recebimento.
    """
    pickup_code: str = Field(
        ...,
        description="Código de 6 dígitos fornecido ao voluntário",
        example="847291",
        min_length=6,
        max_length=6,
        pattern=r"^\d{6}$",
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "pickup_code": "847291"
            }
        }
