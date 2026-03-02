"""
Base Commitment Service — Serviço genérico de compromissos.

Implementa o padrão commit/cancel/confirm de forma genérica.
Serviços específicos devem herdar e implementar métodos abstratos.
"""
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Optional, Dict, Any, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.core.logging_config import get_logger
from .pickup_service import IPickupService, PickupCodeType
from app.shared.constants import COMMITMENT_TTL_HOURS, PICKUP_CODE_LENGTH
from app.shared.utils import generate_random_code, add_hours
from app.shared.exceptions import (
    DomainError,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
)

logger = get_logger(__name__)

T = TypeVar('T')  # Tipo da entidade (Delivery, ResourceReservation, etc)


class CommitmentError(DomainError):
    """Erro em operações de compromisso."""
    pass


class CommitmentResult:
    """Resultado de uma operação de compromisso."""
    def __init__(
        self,
        success: bool,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        code: Optional[str] = None
    ):
        self.success = success
        self.message = message
        self.data = data or {}
        self.code = code


class BaseCommitmentService(ABC, Generic[T]):
    """
    Base genérica para serviços de compromisso.
    
    Implementa lógica comum do padrão commit/cancel/confirm.
    Serviços específicos devem herdar e implementar métodos abstratos.
    """
    
    def __init__(self, db: Session, pickup_service: Optional[IPickupService] = None):
        self.db = db
        self._logger = logger
        self._pickup_service = pickup_service
    
    # ========================================================================
    # OPERAÇÕES PRINCIPAIS (implementação base)
    # ========================================================================
    
    def commit(
        self,
        user_id: int,
        target_id: int,
        items: List[Dict[str, Any]],
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
        """
        try:
            self._logger.info(f"Starting commitment: user={user_id}, target={target_id}, items={len(items)}")
            
            # 1. Validações de negócio
            validation_result = self._validate_commit(user_id, target_id, items, **kwargs)
            if not validation_result.success:
                raise ValidationError(validation_result.message)
            
            # 2. Verificar se usuário pode fazer novo compromisso
            if not self.can_commit(user_id, **kwargs):
                raise ValidationError("User cannot create new commitment")
            
            # 3. Criar entidades do compromisso (implementação específica)
            for item in items:
                if not item.get('request_id') or not item.get('quantity'):
                    return CommitmentResult(
                        success=False,
                        message="Delivery not found or does not belong to you"
                    )
            entities = self._create_commitment_entities(
                user_id=user_id,
                target_id=target_id,
                items=items,
                code="",  # Código será definido depois
                **kwargs
            )
            
            # 4. Gerar código único para todas as entidades
            code_info = self._pickup_service.generate_code(
                entity_type=self._get_pickup_code_type(),
                entity_id=entities[0].id if entities else 0,
                provider_id=user_id,
                receiver_id=target_id
            )
            code = code_info.code
            
            # 4.1. Atualizar código em todas as entidades
            # Para doações diretas (batch_id=null), usar delivery_code
            # Para entregas com pickup (batch_id!=null), usar pickup_code
            for entity in entities:
                is_direct_donation = not hasattr(entity, 'batch_id') or entity.batch_id is None
                if is_direct_donation:
                    if hasattr(entity, 'delivery_code'):
                        entity.delivery_code = code
                else:
                    if hasattr(entity, 'pickup_code'):
                        entity.pickup_code = code
            
            # 4.2. Flush para garantir que o código seja salvo
            self.db.flush()
            
            # 5. Executar lógica pós-commit (ex: notificações)
            self._post_commit(entities, user_id, **kwargs)
            
            # 6. Commit transação
            self.db.commit()
            
            # 7. Retornar dados do compromisso
            result = self._build_commit_result(entities, code)
            
            self._logger.info(f"Commitment created: code={code}, entities={len(entities)}")
            return result
            
        except Exception as e:
            self.db.rollback()
            self._logger.error(f"Commitment failed: {str(e)}")
            raise
    
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
        """
        try:
            self._logger.info(f"Cancelling commitment: id={commitment_id}, user={user_id}")
            
            # 1. Buscar compromisso
            commitment = self._get_commitment_by_id(commitment_id)
            if not commitment:
                raise NotFoundError(f"Commitment {commitment_id} not found")
            
            # 2. Validar autorização
            if not self._can_user_cancel(commitment, user_id):
                raise UnauthorizedError("Delivery not found or does not belong to you")
            
            # 3. Validar status permite cancelamento
            if not self._is_cancellable(commitment):
                raise ValidationError("Cannot cancel a delivery with status")
            
            # 4. Executar lógica de cancelamento (restaurar estado)
            restore_result = self._restore_commitment_state(commitment, user_id, reason)
            if not restore_result.success:
                raise ValidationError(restore_result.message)
            
            # 5. Atualizar status ou deletar (já deletado no restore)
            # self._update_commitment_status(commitment, "CANCELLED")
            
            # 6. Executar lógica pós-cancelamento (já executado no restore)
            # self._post_cancel(commitment, user_id, reason)
            
            # 7. Commit transação
            self.db.commit()
            
            self._logger.info(f"Commitment cancelled: id={commitment_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            self._logger.error(f"Cancel failed: {str(e)}")
            raise
    
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
        """
        try:
            self._logger.info(f"Confirming commitment: id={commitment_id}, code={confirmation_code}")
            
            # 1. Buscar compromisso
            commitment = self._get_commitment_by_id(commitment_id)
            if not commitment:
                raise NotFoundError(f"Commitment {commitment_id} not found")
            
            # 2. Validar código usando PickupService
            if not self._pickup_service.validate_code(
                code=confirmation_code,
                entity_type=self._get_pickup_code_type(),
                entity_id=commitment_id,
                user_id=user_id
            ):
                raise ValidationError("Invalid pickup code")
            
            # 3. Validar status permite confirmação
            if not self._is_confirmable(commitment):
                raise ValidationError("Commitment cannot be confirmed in current status")
            
            # 4. Validar autorização
            if not self._can_user_confirm(commitment, user_id):
                raise UnauthorizedError("User not authorized to confirm this commitment")
            
            # 5. Executar lógica de confirmação
            confirmation_result = self._process_confirmation(commitment, user_id, **kwargs)
            if not confirmation_result.success:
                raise ValidationError(confirmation_result.message)
            
            # 6. Atualizar status
            self._update_commitment_status(commitment, "DELIVERED")
            
            # 7. Executar lógica pós-confirmação
            self._post_confirm(commitment, user_id, **kwargs)
            
            # 8. Commit transação
            self.db.commit()
            
            self._logger.info(f"Commitment confirmed: id={commitment_id}")
            return commitment
            
        except Exception as e:
            self.db.rollback()
            self._logger.error(f"Confirmation failed: {str(e)}")
            raise
    
    def get_active_commitments(self, user_id: int) -> List[T]:
        """
        Lista compromissos ativos de um usuário.
        
        Args:
            user_id: ID do usuário
        
        Returns:
            Lista de compromissos ativos
        """
        try:
            commitments = self._find_active_commitments(user_id)
            self._logger.debug(f"Found {len(commitments)} active commitments for user {user_id}")
            return commitments
        except Exception as e:
            self._logger.error(f"Error getting active commitments: {str(e)}")
            raise
    
    def can_commit(self, user_id: int, **kwargs) -> bool:
        """
        Verifica se usuário pode fazer novo compromisso.
        
        Args:
            user_id: ID do usuário
            **kwargs: Parâmetros para validação
        
        Returns:
            True se pode fazer compromisso
        """
        try:
            # Verificar se já tem compromissos ativos
            active_commitments = self.get_active_commitments(user_id)
            if active_commitments:
                self._logger.debug(f"User {user_id} has {len(active_commitments)} active commitments")
                return False
            
            # Validações adicionais específicas do domínio
            return self._validate_commit_permissions(user_id, **kwargs)
        except Exception as e:
            self._logger.error(f"Error checking commit permissions: {str(e)}")
            return False
    
    # ========================================================================
    # MÉTODOS ABSTRATOS (implementação específica obrigatória)
    # ========================================================================
    
    @abstractmethod
    def _validate_commit(
        self,
        user_id: int,
        target_id: int,
        items: List[Dict[str, Any]],
        **kwargs
    ) -> CommitmentResult:
        """
        Validações específicas do domínio antes de criar compromisso.
        
        Args:
            user_id: ID do usuário
            target_id: ID do alvo
            items: Lista de itens
            **kwargs: Parâmetros adicionais
        
        Returns:
            CommitmentResult com validação
        """
        pass
    
    @abstractmethod
    def _create_commitment_entities(
        self,
        user_id: int,
        target_id: int,
        items: List[Dict[str, Any]],
        code: str,
        **kwargs
    ) -> List[T]:
        """
        Cria entidades específicas do compromisso.
        
        Args:
            user_id: ID do usuário
            target_id: ID do alvo
            items: Lista de itens
            code: Código de confirmação
            **kwargs: Parâmetros adicionais
        
        Returns:
            Lista de entidades criadas
        """
        pass
    
    @abstractmethod
    def _get_commitment_by_id(self, commitment_id: int) -> Optional[T]:
        """
        Busca compromisso por ID.
        
        Args:
            commitment_id: ID do compromisso
        
        Returns:
            Entidade ou None
        """
        pass
    
    @abstractmethod
    def _find_active_commitments(self, user_id: int) -> List[T]:
        """
        Busca compromissos ativos de um usuário.
        
        Args:
            user_id: ID do usuário
        
        Returns:
            Lista de compromissos ativos
        """
        pass
    
    @abstractmethod
    def _validate_commit_permissions(self, user_id: int, **kwargs) -> bool:
        """
        Validações de permissão específicas do domínio.
        
        Args:
            user_id: ID do usuário
            **kwargs: Parâmetros adicionais
        
        Returns:
            True se tem permissão
        """
        pass
    
    # ========================================================================
    # MÉTODOS OPCIONAIS (override quando necessário)
    # ========================================================================
    
    def _generate_commitment_code(self) -> str:
        """
        Gera código de confirmação único.
        
        Returns:
            Código numérico de 6 dígitos
        """
        return generate_random_code(PICKUP_CODE_LENGTH)
    
    def _calculate_expiry(self, created_at: datetime) -> datetime:
        """
        Calcula data de expiração do compromisso.
        
        Args:
            created_at: Data de criação
        
        Returns:
            Data de expiração
        """
        return add_hours(created_at, COMMITMENT_TTL_HOURS)
    
    def _build_commit_result(self, entities: List[T], code: str) -> Dict[str, Any]:
        """
        Constrói resultado do commit.
        
        Args:
            entities: Entidades criadas
            code: Código de confirmação
        
        Returns:
            Dict com resultado
        """
        return {
            "success": True,
            "code": code,
            "delivery_ids": [getattr(e, 'id', None) for e in entities if hasattr(e, 'id')],
            "entities_count": len(entities)
        }
    
    def _can_user_cancel(self, commitment: T, user_id: int) -> bool:
        """
        Verifica se usuário pode cancelar compromisso.
        
        Args:
            commitment: Entidade do compromisso
            user_id: ID do usuário
        
        Returns:
            True se pode cancelar
        """
        # Implementação padrão: verifica se é o dono
        owner_id = getattr(commitment, 'user_id', None) or getattr(commitment, 'volunteer_id', None)
        return owner_id == user_id
    
    def _can_user_confirm(self, commitment: T, user_id: int) -> bool:
        """
        Verifica se usuário pode confirmar compromisso.
        
        Args:
            commitment: Entidade do compromisso
            user_id: ID do usuário
        
        Returns:
            True se pode confirmar
        """
        # Implementação padrão: verifica se é o alvo do compromisso
        target_id = getattr(commitment, 'target_id', None) or getattr(commitment, 'delivery_location_id', None)
        return target_id == user_id
    
    def _is_cancellable(self, commitment: T) -> bool:
        """
        Verifica se compromisso pode ser cancelado.
        
        Args:
            commitment: Entidade do compromisso
        
        Returns:
            True se pode cancelar
        """
        # Implementação padrão: verifica se não está confirmado
        status = getattr(commitment, 'status', None)
        return status not in ['CONFIRMED', 'CANCELLED', 'DELIVERED']
    
    def _is_confirmable(self, commitment: T) -> bool:
        """
        Verifica se compromisso pode ser confirmado.
        
        Args:
            commitment: Entidade do compromisso
        
        Returns:
            True se pode confirmar
        """
        # Implementação padrão: verifica se está pendente
        status = getattr(commitment, 'status', None)
        return status in ['PENDING', 'RESERVED', 'PENDING_CONFIRMATION']
    
    def _validate_confirmation_code(self, commitment: T, code: str) -> bool:
        """
        Valida código de confirmação.
        
        Args:
            commitment: Entidade do compromisso
            code: Código informado
        
        Returns:
            True se código é válido
        """
        stored_code = getattr(commitment, 'pickup_code', None)
        return stored_code == code
    
    def _restore_commitment_state(
        self,
        commitment: T,
        user_id: int,
        reason: Optional[str]
    ) -> CommitmentResult:
        """
        Restaura estado anterior ao cancelamento.
        
        Args:
            commitment: Entidade do compromisso
            user_id: ID do usuário
            reason: Motivo do cancelamento
        
        Returns:
            CommitmentResult com resultado
        """
        # Implementação padrão: sucesso
        return CommitmentResult(success=True, message="State restored")
    
    def _process_confirmation(
        self,
        commitment: T,
        user_id: int,
        **kwargs
    ) -> CommitmentResult:
        """
        Processa confirmação do compromisso.
        
        Args:
            commitment: Entidade do compromisso
            user_id: ID do usuário
            **kwargs: Parâmetros adicionais
        
        Returns:
            CommitmentResult com resultado
        """
        # Implementação padrão: sucesso
        return CommitmentResult(success=True, message="Confirmation processed")
    
    def _update_commitment_status(self, commitment: T, status: str) -> None:
        """
        Atualiza status do compromisso.
        
        Args:
            commitment: Entidade do compromisso
            status: Novo status
        """
        if hasattr(commitment, 'status'):
            commitment.status = status
    
    def _post_commit(self, entities: List[T], user_id: int, **kwargs) -> None:
        """
        Lógica pós-commit (ex: notificações, eventos).
        
        Args:
            entities: Entidades criadas
            user_id: ID do usuário
            **kwargs: Parâmetros adicionais
        """
        # Implementação padrão: não faz nada
        pass
    
    def _post_cancel(self, commitment: T, user_id: int, reason: Optional[str]) -> None:
        """
        Lógica pós-cancelamento.
        
        Args:
            commitment: Entidade do compromisso
            user_id: ID do usuário
            reason: Motivo do cancelamento
        """
        # Implementação padrão: não faz nada
        pass
    
    def _post_confirm(self, commitment: T, user_id: int, **kwargs) -> None:
        """
        Lógica pós-confirmação.
        
        Args:
            commitment: Entidade do compromisso
            user_id: ID do usuário
            **kwargs: Parâmetros adicionais
        """
        # Implementação padrão: não faz nada
        pass
    
    @abstractmethod
    def _get_pickup_code_type(self) -> PickupCodeType:
        """
        Retorna o tipo de código de pickup para este serviço.
        
        Returns:
            PickupCodeType correspondente ao domínio
        """
        pass
