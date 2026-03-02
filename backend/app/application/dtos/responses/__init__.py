"""
Response DTOs - Schemas de saída da API.

Todos os endpoints devem retornar DTOs tipados para documentação automática.
"""
from .donation import DonationCommitResponse
from .delivery import DeliveryResponse
from .user import UserResponse, TokenResponse
from .inventory import InventoryItemResponse, ShelterRequestResponse

__all__ = [
    # Donation
    "DonationCommitResponse",
    "DeliveryResponse",
    # User
    "UserResponse",
    "TokenResponse",
    # Inventory
    "InventoryItemResponse",
    "ShelterRequestResponse",
]
