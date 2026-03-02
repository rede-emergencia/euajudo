"""
DTOs (Data Transfer Objects) - Schemas Pydantic para API.

Organização:
- requests/  - DTOs de entrada (Request)
- responses/ - DTOs de saída (Response)

Convenções:
- Request DTOs: {Domain}{Action}Request (ex: DonationCommitRequest)
- Response DTOs: {Domain}Response (ex: DeliveryResponse)
- Usar Pydantic Field() para validações e documentação
- Sempre incluir examples para Swagger
"""
from .requests import (
    # Donation
    DonationCommitRequest,
    DonationItemRequest,
    ConfirmDeliveryRequest,
    # User
    UserCreateRequest,
    UserUpdateRequest,
    LoginRequest,
    # Inventory
    InventoryItemUpdateRequest,
    ShelterRequestCreateRequest,
)
from .responses import (
    # Donation
    DonationCommitResponse,
    DeliveryResponse,
    # User
    UserResponse,
    TokenResponse,
    # Inventory
    InventoryItemResponse,
    ShelterRequestResponse,
)

__all__ = [
    # Requests - Donation
    "DonationCommitRequest",
    "DonationItemRequest",
    "ConfirmDeliveryRequest",
    # Requests - User
    "UserCreateRequest",
    "UserUpdateRequest",
    "LoginRequest",
    # Requests - Inventory
    "InventoryItemUpdateRequest",
    "ShelterRequestCreateRequest",
    # Responses - Donation
    "DonationCommitResponse",
    "DeliveryResponse",
    # Responses - User
    "UserResponse",
    "TokenResponse",
    # Responses - Inventory
    "InventoryItemResponse",
    "ShelterRequestResponse",
]
