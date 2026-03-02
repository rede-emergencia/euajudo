"""
ICommitmentService - Interface para serviço genérico de compromissos.

Define o contrato para operações de commit/cancel/confirm em qualquer tipo de entidade.
Este é um padrão genérico que pode ser usado para doações, reservas, pedidos, etc.
"""
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Optional, Dict, Any
from enum import Enum


T = TypeVar('T')  # Tipo da entidade (Delivery, ResourceReservation, etc)


class CommitmentStatus(str, Enum):
    """Status possíveis de um compromisso."""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class ICommitmentService(ABC, Generic[T]):
    """
    Interface genérica para serviço de compromissos.
    
    Responsabilidades:
    - Criar compromissos (commit)
    - Cancelar compromissos (cancel)
    - Confirmar compromissos (confirm)
    - Validar regras de negócio
    
    Tipo genérico T representa a entidade do compromisso (ex: Delivery).
    """
    
    @abstractmethod
    def commit(
        self,
        user_id: int,
        target_id: int,
        items: list,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Cria um novo compromisso.
        
        Args:
            user_id: ID do usuário fazendo o compromisso
            target_id: ID do alvo (shelter, provider, etc)
            items: Lista de itens do compromisso
            **kwargs: Parâmetros adicionais específicos do domínio
        
        Returns:
            Dict com dados do compromisso criado (code, ids, etc)
        
        Raises:
            ValidationError: Validação falhou
            DomainError: Erro de negócio
        """
        pass
    
    @abstractmethod
    def cancel(
        self,
        commitment_id: int,
        user_id: int,
        reason: Optional[str] = None,
    ) -> bool:
        """
        Cancela um compromisso existente.
        
        Args:
            commitment_id: ID do compromisso
            user_id: ID do usuário (validação de ownership)
            reason: Motivo do cancelamento (opcional)
        
        Returns:
            True se cancelado com sucesso
        
        Raises:
            NotFoundError: Compromisso não encontrado
            UnauthorizedError: Usuário não autorizado
            ValidationError: Status não permite cancelamento
        """
        pass
    
    @abstractmethod
    def confirm(
        self,
        commitment_id: int,
        confirmation_code: str,
        user_id: int,
        **kwargs
    ) -> T:
        """
        Confirma um compromisso usando código de confirmação.
        
        Args:
            commitment_id: ID do compromisso
            confirmation_code: Código de confirmação
            user_id: ID do usuário confirmando
            **kwargs: Parâmetros adicionais específicos do domínio
        
        Returns:
            Entidade atualizada
        
        Raises:
            NotFoundError: Compromisso não encontrado
            ValidationError: Código inválido ou status incorreto
        """
        pass
    
    @abstractmethod
    def get_active_commitments(self, user_id: int) -> list[T]:
        """
        Lista compromissos ativos de um usuário.
        
        Args:
            user_id: ID do usuário
        
        Returns:
            Lista de compromissos ativos
        """
        pass
    
    @abstractmethod
    def can_commit(self, user_id: int, **kwargs) -> bool:
        """
        Verifica se usuário pode fazer novo compromisso.
        
        Args:
            user_id: ID do usuário
            **kwargs: Parâmetros para validação
        
        Returns:
            True se pode fazer compromisso
        """
        pass
