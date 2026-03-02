"""
Service Interfaces (ABCs) - Contratos para services.

Todos os services devem implementar uma interface ABC para:
- Facilitar testes (mocking)
- Dependency Inversion Principle
- Documentação clara de contratos
"""
from .donation_service import IDonationService, CommitItem
from .inventory_service import IInventoryService
from .commitment_service import ICommitmentService

__all__ = [
    "IDonationService",
    "CommitItem",
    "IInventoryService",
    "ICommitmentService",
]
