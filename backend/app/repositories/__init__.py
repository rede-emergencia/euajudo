"""
Repository Pattern - Clean Architecture

Cada entidade tem seu próprio repository com interface ABC.
Todos seguem o mesmo padrão: herdam IRepository[T] e BaseRepository[T].

Para criar novo repository:
  1. Copie um dos exemplos (delivery_repository.py)
  2. Renomeie a classe e model
  3. Adicione métodos específicos do domínio
  4. Exporte aqui no __init__.py
"""
from .base import IRepository, BaseRepository
from .delivery_repository import DeliveryRepository
from .shelter_request_repository import ShelterRequestRepository
from .user_repository import UserRepository
from .location_repository import LocationRepository
from .inventory_repository import InventoryItemRepository
from .category_repository import CategoryRepository

__all__ = [
    "IRepository",
    "BaseRepository",
    "DeliveryRepository",
    "ShelterRequestRepository",
    "UserRepository",
    "LocationRepository",
    "InventoryItemRepository",
    "CategoryRepository",
]
