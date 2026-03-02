"""
Custom Exceptions - Exceções de domínio e aplicação.

Hierarquia:
- DomainError (base)
  - ValidationError
  - NotFoundError
  - UnauthorizedError
  - DonationError
  - InventoryError
"""


class DomainError(Exception):
    """
    Base exception para erros de domínio.
    
    Todas as exceções de negócio devem herdar desta classe.
    """
    def __init__(self, message: str, code: str = None):
        self.message = message
        self.code = code or self.__class__.__name__
        super().__init__(self.message)


class ValidationError(DomainError):
    """Erro de validação de regras de negócio."""
    pass


class NotFoundError(DomainError):
    """Recurso não encontrado."""
    pass


class UnauthorizedError(DomainError):
    """Operação não autorizada."""
    pass


class DonationError(DomainError):
    """Erro em operações de doação."""
    pass


class InventoryError(DomainError):
    """Erro em operações de inventário."""
    pass
