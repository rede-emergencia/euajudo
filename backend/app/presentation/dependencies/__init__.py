"""
Dependency Injection - Factories para services e repositories.

Todos os services devem ser injetados via dependencies, não criados manualmente.
"""
from .services import get_donation_service

__all__ = [
    "get_donation_service",
]
