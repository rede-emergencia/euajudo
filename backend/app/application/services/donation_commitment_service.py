"""
DonationCommitmentService — Implementação específica para doações.

Herda de BaseCommitmentService e implementa lógica específica de doações:
- commit(): Voluntário se compromete a doar itens
- cancel(): Voluntário cancela compromisso (restaura ShelterRequest)
- confirm(): Abrigo confirma recebimento com código pickup
"""
from typing import List, Dict, Any, Optional
from datetime import datetime

from sqlalchemy.orm import Session

from app.models import Delivery
from app.inventory_models import ShelterRequest, ShelterRequestDelivery
from app.shared.enums import DeliveryStatus
from app.repositories import (
    DeliveryRepository,
    ShelterRequestRepository,
    LocationRepository,
)
from app.services.inventory_service import on_delivery_cancelled, on_delivery_confirmed
from app.core.events import get_event_bus, DonationCommitted, DonationCancelled, DonationDelivered
from app.core.logging_config import get_logger
from app.shared.exceptions import ValidationError, NotFoundError

from .commitment_service import BaseCommitmentService, CommitmentResult, CommitmentError
from .pickup_service import PickupService, PickupCodeType

logger = get_logger(__name__)


class DonationCommitmentService(BaseCommitmentService[Delivery]):
    """
    Serviço de compromissos de doação.
    
    Implementa o padrão commit/cancel/confirm específico para doações:
    - commit(): Voluntário cria compromisso de doar itens
    - cancel(): Voluntário cancela (restora quantidades no ShelterRequest)
    - confirm(): Abrigo confirma com código pickup (atualiza inventário)
    """
    
    def __init__(self, db: Session):
        # Criar PickupService se não fornecido
        pickup_service = PickupService(db)
        super().__init__(db, pickup_service)
        self._delivery_repo = DeliveryRepository(db)
        self._request_repo = ShelterRequestRepository(db)
        self._location_repo = LocationRepository(db)
        self._event_bus = get_event_bus()
    
    # ========================================================================
    # IMPLEMENTAÇÃO DOS MÉTODOS ABSTRATOS
    # ========================================================================
    
    def _validate_commit(
        self,
        user_id: int,
        target_id: int,
        items: List[Dict[str, Any]],
        **kwargs
    ) -> CommitmentResult:
        """
        Validações de negócio antes de criar compromisso.
        
        Args:
            user_id: ID do voluntário
            target_id: ID do abrigo
            items: Lista de itens
            **kwargs: Parâmetros adicionais
        
        Returns:
            CommitmentResult com validação
        """
        # 1. Validar que é voluntário
        # TODO: Verificar role do usuário quando auth estiver implementado
        
        # 1.1. Verificar se voluntário já tem delivery ativa
        from app.shared.enums import DeliveryStatus
        active_delivery = self.db.query(Delivery).filter(
            Delivery.volunteer_id == user_id,
            Delivery.status.in_([
                DeliveryStatus.PENDING_CONFIRMATION,
                DeliveryStatus.RESERVED,
                DeliveryStatus.PICKED_UP,
                DeliveryStatus.IN_TRANSIT
            ])
        ).first()
        
        if active_delivery:
            return CommitmentResult(
                success=False,
                message="Você já tem uma entrega ativa. Finalize-a antes de aceitar outra."
            )
        
        # 2. Validar que abrigo existe e tem localização
        shelter_location = self._location_repo.find_primary_by_user(target_id)
        if not shelter_location:
            return CommitmentResult(
                success=False,
                message="No location"
            )
        
        # 3. Validar itens
        if not items:
            return CommitmentResult(
                success=False,
                message="At least one item is required"
            )
        
        # 4. Validar cada item
        for item in items:
            request_id = item.get('request_id')
            quantity = item.get('quantity')
            
            if not request_id or not quantity:
                return CommitmentResult(
                    success=False,
                    message="Invalid quantity"
                )
            
            if quantity <= 0:
                return CommitmentResult(
                    success=False,
                    message="Invalid quantity"
                )
        
        return CommitmentResult(success=True, message="Validation passed")
    
    def _create_commitment_entities(
        self,
        user_id: int,
        target_id: int,
        items: List[Dict[str, Any]],
        **kwargs
    ) -> List[Delivery]:
        """
        Cria entidades Delivery para cada item.
        
        Args:
            user_id: ID do voluntário
            target_id: ID do abrigo
            items: Lista de itens
        
        Returns:
            Lista de deliveries criadas
        """
        shelter_location = self._location_repo.find_primary_by_user(target_id)
        deliveries = []
        
        for item in items:
            request_id = item['request_id']
            quantity = item['quantity']
            
            # Lock request para validação
            request = self._request_repo.lock_for_commitment(request_id, target_id)
            if not request:
                raise NotFoundError(f"Request {request_id} not found")
            
            # Validar quantidade disponível
            if request.quantity_requested < request.quantity_received + quantity:
                raise ValidationError(f"Invalid quantity for request {request_id}")
            
            # Criar delivery
            delivery = self._delivery_repo.create(
                volunteer_id=user_id,
                delivery_location_id=shelter_location.id,
                category_id=request.category_id,
                quantity=quantity,
                status=DeliveryStatus.PENDING_CONFIRMATION,
                expires_at=self._calculate_expiry(datetime.utcnow()),
                product_type="GENERIC",  # Adicionar product_type obrigatório
                accepted_at=datetime.utcnow()
            )
            
            # Criar link ShelterRequestDelivery
            link = ShelterRequestDelivery(
                request_id=request.id,
                delivery_id=delivery.id,
                quantity=quantity
            )
            self.db.add(link)
            
            # Atualizar quantity_received para diminuir disponível
            request.quantity_received += quantity
            request.quantity_pending += quantity  # Adicionar ao pending também
            
            if request.status == "pending":
                request.status = "active"
            
            deliveries.append(delivery)
        
        return deliveries
    
    def _get_commitment_by_id(self, commitment_id: int) -> Optional[Delivery]:
        """
        Busca delivery por ID.
        
        Args:
            commitment_id: ID da delivery
        
        Returns:
            Delivery ou None
        """
        return self._delivery_repo.get_by_id(commitment_id)
    
    def _find_active_commitments(self, user_id: int) -> List[Delivery]:
        """
        Busca deliveries ativas de um voluntário.
        
        Args:
            user_id: ID do voluntário
        
        Returns:
            Lista de deliveries ativas
        """
        return self._delivery_repo.find_active_by_volunteer(user_id)
    
    def _validate_commit_permissions(self, user_id: int, **kwargs) -> bool:
        """
        Validações de permissão para doação.
        
        Args:
            user_id: ID do voluntário
        
        Returns:
            True se tem permissão
        """
        # TODO: Verificar se usuário é voluntário aprovado
        return True
    
    # ========================================================================
    # OVERRIDE DE MÉTODOS ESPECÍFICOS
    # ========================================================================
    
    def _restore_commitment_state(
        self,
        commitment: Delivery,
        user_id: int,
        reason: Optional[str]
    ) -> CommitmentResult:
        """
        Restora estado do ShelterRequest ao cancelar delivery.
        
        Args:
            commitment: Delivery a ser cancelada
            user_id: ID do voluntário
            reason: Motivo do cancelamento
        
        Returns:
            CommitmentResult com resultado
        """
        try:
            # Buscar links ShelterRequestDelivery
            links = self.db.query(ShelterRequestDelivery).filter(
                ShelterRequestDelivery.delivery_id == commitment.id
            ).all()
            
            quantity_restored = 0
            
            # Coletar dados para o evento antes de deletar
            delivery_data = {
                'id': commitment.id,
                'delivery_location_id': commitment.delivery_location_id,
                'volunteer_id': commitment.volunteer_id
            }
            
            for link in links:
                request = self._request_repo.get_by_id(link.request_id)
                if request:
                    # Restaurar quantidade - apenas decrementar received e pending
                    # NÃO incrementar cancelled pois isso diminui o disponível
                    request.quantity_received -= link.quantity
                    request.quantity_pending -= link.quantity
                    quantity_restored += link.quantity
                    
                    # Garantir não negativo
                    if request.quantity_received < 0:
                        request.quantity_received = 0
                    if request.quantity_pending < 0:
                        request.quantity_pending = 0
                    
                    # Se não há mais entregas, marcar como pending
                    if request.quantity_received == 0 and request.quantity_pending == 0:
                        request.status = "pending"
                
                # Remover link
                self.db.delete(link)
            
            # Executar lógica pós-cancelamento ANTES de deletar
            self._post_cancel(commitment, user_id, reason)
            
            # Deletar delivery
            self.db.delete(commitment)
            
            return CommitmentResult(
                success=True,
                message=f"Restored {quantity_restored} items to requests"
            )
            
        except Exception as e:
            logger.error(f"Error restoring commitment state: {str(e)}")
            return CommitmentResult(
                success=False,
                message=f"Error restoring state: {str(e)}"
            )
    
    def _process_confirmation(
        self,
        commitment: Delivery,
        user_id: int,
        **kwargs
    ) -> CommitmentResult:
        """
        Processa confirmação de entrega.
        
        Args:
            commitment: Delivery confirmada
            user_id: ID do abrigo
            **kwargs: Parâmetros adicionais
        
        Returns:
            CommitmentResult com resultado
        """
        try:
            # Atualizar status
            commitment.status = DeliveryStatus.DELIVERED
            commitment.delivered_at = datetime.utcnow()
            
            # Processar inventário
            on_delivery_confirmed(self.db, commitment, user_id=user_id)
            
            return CommitmentResult(
                success=True,
                message="Delivery confirmed and inventory updated"
            )
            
        except Exception as e:
            logger.error(f"Error processing confirmation: {str(e)}")
            return CommitmentResult(
                success=False,
                message=f"Error processing confirmation: {str(e)}"
            )
    
    def _post_commit(self, entities: List[Delivery], user_id: int, **kwargs) -> None:
        """
        Emite evento de compromisso criado.
        
        Args:
            entities: Deliveries criadas
            user_id: ID do voluntário
            **kwargs: Parâmetros adicionais
        """
        if entities:
            # Obter código da primeira delivery (todas têm o mesmo código)
            code = entities[0].pickup_code if entities else None
            
            self._event_bus.emit(DonationCommitted(
                delivery_ids=[d.id for d in entities],
                volunteer_id=user_id,
                shelter_id=kwargs.get('target_id'),
                code=code  # Adicionar parâmetro code obrigatório
            ))
    
    def _post_cancel(self, commitment: Delivery, user_id: int, reason: Optional[str]) -> None:
        """
        Emite evento de cancelamento e processa lógica de cancelamento.
        
        Args:
            commitment: Delivery cancelada
            user_id: ID do voluntário
            reason: Motivo do cancelamento (não usado no evento)
        """
        # Processar lógica de cancelamento do inventory_service
        on_delivery_cancelled(self.db, commitment, user_id=user_id)
        
        # Obter shelter_id para o evento
        shelter_id = None
        if commitment.delivery_location_id:
            location = self._location_repo.get_by_id(commitment.delivery_location_id)
            shelter_id = location.user_id if location else None
        
        # Emitir evento (sem reason)
        self._event_bus.emit(DonationCancelled(
            delivery_id=commitment.id,
            volunteer_id=user_id,
            shelter_id=shelter_id
        ))
    
    def _post_confirm(self, commitment: Delivery, user_id: int, **kwargs) -> None:
        """
        Emite evento de entrega confirmada.
        
        Args:
            commitment: Delivery confirmada
            user_id: ID do abrigo
            **kwargs: Parâmetros adicionais
        """
        self._event_bus.emit(DonationDelivered(
            delivery_id=commitment.id,
            shelter_id=user_id,
            volunteer_id=commitment.volunteer_id,
            quantity=commitment.quantity
        ))
    
    def _is_cancellable(self, commitment: Delivery) -> bool:
        """
        Verifica se delivery pode ser cancelada.
        
        Args:
            commitment: Delivery
        
        Returns:
            True se pode cancelar
        """
        return commitment.status in [
            DeliveryStatus.PENDING_CONFIRMATION,
            DeliveryStatus.RESERVED
        ]
    
    def _is_confirmable(self, commitment: Delivery) -> bool:
        """
        Verifica se delivery pode ser confirmada.
        
        Args:
            commitment: Delivery
        
        Returns:
            True se pode confirmar
        """
        return commitment.status == DeliveryStatus.PENDING_CONFIRMATION
    
    def _can_user_cancel(self, commitment: Delivery, user_id: int) -> bool:
        """
        Verifica se voluntário pode cancelar delivery.
        
        Args:
            commitment: Delivery
            user_id: ID do usuário
        
        Returns:
            True se pode cancelar
        """
        return commitment.volunteer_id == user_id
    
    def _can_user_confirm(self, commitment: Delivery, user_id: int) -> bool:
        """
        Verifica se abrigo pode confirmar delivery.
        
        Args:
            commitment: Delivery
            user_id: ID do usuário
        
        Returns:
            True se pode confirmar
        """
        # Verificar se usuário é dono da localização de entrega
        location = self._location_repo.get_by_id(commitment.delivery_location_id)
        return location and location.user_id == user_id
    
    def _get_pickup_code_type(self) -> PickupCodeType:
        """
        Retorna o tipo de código para doações.
        
        Returns:
            PickupCodeType.DELIVERY
        """
        return PickupCodeType.DELIVERY
