"""
IDonationService - Interface para serviço de doações.

Define o contrato que qualquer implementação de DonationService deve seguir.
Facilita testes com mocks e garante consistência de API.
"""
from abc import ABC, abstractmethod
from typing import List
from datetime import datetime


class CommitItem:
    """Value object: um item em um compromisso de doação."""
    def __init__(self, request_id: int, quantity: int):
        self.request_id = request_id
        self.quantity = quantity


class IDonationService(ABC):
    """
    Interface para serviço de doações.
    
    Responsabilidades:
    - Gerenciar compromissos de doação (commit/cancel)
    - Confirmar entregas com código de pickup
    - Garantir transações ACID
    - Emitir eventos de domínio
    """
    
    @abstractmethod
    def commit_donation(
        self,
        volunteer_id: int,
        shelter_user_id: int,
        items: List[CommitItem],
    ) -> dict:
        """
        Voluntário se compromete a doar itens diretamente ao abrigo.
        
        Args:
            volunteer_id: ID do voluntário
            shelter_user_id: ID do usuário do abrigo
            items: Lista de itens com request_id e quantity
        
        Returns:
            {"code": str, "delivery_ids": list[int]}
        
        Raises:
            DonationError: Validação falhou ou erro de negócio
        """
        pass
    
    @abstractmethod
    def cancel_donation(self, delivery_id: int, volunteer_id: int) -> bool:
        """
        Voluntário cancela um compromisso pendente.
        
        Args:
            delivery_id: ID da delivery a cancelar
            volunteer_id: ID do voluntário (validação de ownership)
        
        Returns:
            True se cancelado com sucesso
        
        Raises:
            DonationError: Delivery não encontrada ou já completada
        """
        pass
    
    @abstractmethod
    def confirm_delivery(
        self,
        delivery_id: int,
        pickup_code: str,
        shelter_user_id: int,
    ):
        """
        Abrigo confirma recebimento da doação usando código de pickup.
        
        Args:
            delivery_id: ID da delivery
            pickup_code: Código de 6 dígitos
            shelter_user_id: ID do usuário do abrigo
        
        Returns:
            Delivery atualizada
        
        Raises:
            DonationError: Código inválido ou status incorreto
        """
        pass
