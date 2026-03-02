"""
IInventoryService - Interface para serviço de inventário.

Define o contrato para operações de inventário e stock management.
"""
from abc import ABC, abstractmethod
from typing import Optional
from app.models import Delivery
from app.inventory_models import InventoryItem


class IInventoryService(ABC):
    """
    Interface para serviço de inventário.
    
    Responsabilidades:
    - Gerenciar stock de abrigos
    - Processar eventos de delivery lifecycle
    - Manter transações de inventário
    """
    
    @abstractmethod
    def get_or_create_inventory_item(
        self, shelter_id: int, category_id: int
    ) -> InventoryItem:
        """
        Obtém ou cria item de inventário para shelter+categoria.
        
        Args:
            shelter_id: ID do abrigo
            category_id: ID da categoria
        
        Returns:
            InventoryItem existente ou recém-criado
        """
        pass
    
    @abstractmethod
    def on_delivery_confirmed(
        self, delivery: Delivery, user_id: Optional[int] = None
    ) -> None:
        """
        Processa confirmação de delivery (aumenta stock).
        
        Args:
            delivery: Delivery confirmada
            user_id: ID do usuário que confirmou
        """
        pass
    
    @abstractmethod
    def on_delivery_cancelled(
        self, delivery: Delivery, user_id: Optional[int] = None
    ) -> None:
        """
        Processa cancelamento de delivery (restaura quantidades).
        
        Args:
            delivery: Delivery cancelada
            user_id: ID do usuário que cancelou
        """
        pass
