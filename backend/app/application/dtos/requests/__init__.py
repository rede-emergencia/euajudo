"""
Request DTOs - Schemas de entrada da API.

Todos os endpoints devem usar DTOs tipados para validação automática.
"""
from .donation import (
    DonationCommitRequest,
    DonationItemRequest,
    ConfirmDeliveryRequest,
)
from .user import (
    UserCreateRequest,
    UserUpdateRequest,
    LoginRequest,
)
from .inventory import (
    InventoryItemUpdateRequest,
    ShelterRequestCreateRequest,
)

__all__ = [
    # Donation
    "DonationCommitRequest",
    "DonationItemRequest",
    "ConfirmDeliveryRequest",
    # User
    "UserCreateRequest",
    "UserUpdateRequest",
    "LoginRequest",
    # Inventory
    "InventoryItemUpdateRequest",
    "ShelterRequestCreateRequest",
]
