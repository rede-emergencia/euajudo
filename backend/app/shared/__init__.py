"""
Shared - Código compartilhado entre camadas.

Inclui:
- Exceptions customizadas
- Utility functions
- Constants
"""
from .exceptions import (
    DomainError,
    DonationError,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
)
from . import constants
from . import utils

__all__ = [
    # Exceptions
    "DomainError",
    "DonationError",
    "ValidationError",
    "NotFoundError",
    "UnauthorizedError",
    # Modules
    "constants",
    "utils",
]
