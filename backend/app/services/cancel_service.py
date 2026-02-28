"""
Serviço Genérico de Cancelamento

Padroniza o cancelamento de qualquer tipo de entidade no sistema.
"""

from typing import Dict, Any, Optional, Type
from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime

from ..models import (
    Delivery, ProductBatch, ResourceRequest, ResourceReservation
)
from ..enums import (
    DeliveryStatus, BatchStatus, OrderStatus
)
from ..database import get_db


class CancelableEntityType:
    """Define tipos de entidades que podem ser canceladas"""
    DELIVERY = "delivery"
    BATCH = "batch"
    RESOURCE_REQUEST = "resource_request"
    RESOURCE_RESERVATION = "resource_reservation"


class CancelResult:
    """Resultado da operação de cancelamento"""
    def __init__(self, success: bool, message: str, data: Dict[str, Any] = None):
        self.success = success
        self.message = message
        self.data = data or {}


class CancelService:
    """Serviço genérico para cancelamento de entidades"""
    
    # Mapeamento de entidades para suas configurações
    ENTITY_CONFIGS = {
        CancelableEntityType.DELIVERY: {
            "model": Delivery,
            "id_field": "id",
            "owner_field": "volunteer_id",
            "alternative_owner_field": "batch.provider_id",
            "cancelable_statuses": [DeliveryStatus.PENDING_CONFIRMATION, DeliveryStatus.RESERVED],
            "status_field": "status",
            "cancel_status": None,  # Delivery é deletada, não tem status de cancelado
            "on_cancel": "_cancel_delivery_logic"
        },
        CancelableEntityType.BATCH: {
            "model": ProductBatch,
            "id_field": "id",
            "owner_field": "provider_id",
            "alternative_owner_field": None,
            "cancelable_statuses": [BatchStatus.PRODUCING, BatchStatus.READY],
            "status_field": "status",
            "cancel_status": BatchStatus.CANCELLED,
            "on_cancel": None
        },
        CancelableEntityType.RESOURCE_REQUEST: {
            "model": ResourceRequest,
            "id_field": "id",
            "owner_field": "user_id",
            "alternative_owner_field": None,
            "cancelable_statuses": [OrderStatus.REQUESTING, OrderStatus.RESERVED],
            "status_field": "status",
            "cancel_status": OrderStatus.CANCELLED,
            "on_cancel": None
        },
        CancelableEntityType.RESOURCE_RESERVATION: {
            "model": ResourceReservation,
            "id_field": "id",
            "owner_field": "user_id",
            "alternative_owner_field": None,
            "cancelable_statuses": [OrderStatus.RESERVED],
            "status_field": "status",
            "cancel_status": OrderStatus.CANCELLED,
            "on_cancel": None
        }
    }
    
    def __init__(self, db: Session):
        self.db = db
    
    def cancel_entity(
        self,
        entity_type: str,
        entity_id: int,
        user_id: int,
        user_roles: list = None,
        reason: str = None
    ) -> CancelResult:
        """
        Cancela uma entidade genérica
        
        Args:
            entity_type: Tipo da entidade (delivery, batch, etc.)
            entity_id: ID da entidade
            user_id: ID do usuário solicitando
            user_roles: Roles do usuário (para verificação de permissão)
            reason: Motivo do cancelamento (opcional)
            
        Returns:
            CancelResult com resultado da operação
        """
        try:
            # Verificar se o tipo de entidade é suportado
            if entity_type not in self.ENTITY_CONFIGS:
                return CancelResult(
                    success=False,
                    message=f"Entity type '{entity_type}' not supported for cancellation"
                )
            
            config = self.ENTITY_CONFIGS[entity_type]
            model = config["model"]
            
            # Buscar entidade
            entity = self.db.query(model).filter(
                getattr(model, config["id_field"]) == entity_id
            ).first()
            
            if not entity:
                return CancelResult(
                    success=False,
                    message=f"{entity_type.title()} not found"
                )
            
            # Verificar autorização
            auth_result = self._check_authorization(entity, config, user_id, user_roles)
            if not auth_result.success:
                return auth_result
            
            # Verificar se pode ser cancelada
            status_result = self._check_cancellable_status(entity, config)
            if not status_result.success:
                return status_result
            
            # Executar lógica específica de cancelamento
            if config["on_cancel"]:
                cancel_method = getattr(self, config["on_cancel"])
                logic_result = cancel_method(entity, user_id, reason)
                if not logic_result.success:
                    return logic_result
            
            # Atualizar status ou deletar
            if config["cancel_status"]:
                # Mudar status para cancelado
                setattr(entity, config["status_field"], config["cancel_status"])
                if hasattr(entity, 'cancelled_at'):
                    entity.cancelled_at = datetime.utcnow()
                if hasattr(entity, 'cancel_reason') and reason:
                    entity.cancel_reason = reason
                
                self.db.commit()
                
                return CancelResult(
                    success=True,
                    message=f"{entity_type.title()} cancelled successfully",
                    data={"status": config["cancel_status"]}
                )
            else:
                # Deletar entidade (caso de Delivery)
                entity_data = self._prepare_entity_data(entity)
                self.db.delete(entity)
                self.db.commit()
                
                return CancelResult(
                    success=True,
                    message=f"{entity_type.title()} cancelled successfully",
                    data=entity_data
                )
                
        except Exception as e:
            self.db.rollback()
            return CancelResult(
                success=False,
                message=f"Error cancelling {entity_type}: {str(e)}"
            )
    
    def _check_authorization(self, entity, config, user_id, user_roles) -> CancelResult:
        """Verifica se o usuário pode cancelar a entidade"""
        # Verificar se é o dono
        owner_id = getattr(entity, config["owner_field"])
        if owner_id == user_id:
            return CancelResult(success=True, message="Authorized")
        
        # Verificar dono alternativo (ex: provider de delivery)
        if config["alternative_owner_field"]:
            if "." in config["alternative_owner_field"]:
                # Campo relacionado (ex: batch.provider_id)
                related_field, nested_field = config["alternative_owner_field"].split(".")
                related_obj = getattr(entity, related_field)
                if related_obj and getattr(related_obj, nested_field) == user_id:
                    return CancelResult(success=True, message="Authorized")
        
        # TODO: Verificar roles admin (futuro)
        # if user_roles and "admin" in user_roles:
        #     return CancelResult(success=True, message="Authorized (admin)")
        
        return CancelResult(
            success=False,
            message="Not authorized to cancel this entity"
        )
    
    def _check_cancellable_status(self, entity, config) -> CancelResult:
        """Verifica se a entidade pode ser cancelada no status atual"""
        current_status = getattr(entity, config["status_field"])
        
        if current_status not in config["cancelable_statuses"]:
            return CancelResult(
                success=False,
                message=f"Cannot cancel {config['model'].__name__.lower()} with status '{current_status}'"
            )
        
        return CancelResult(success=True, message="Status allows cancellation")
    
    def _cancel_delivery_logic(self, delivery: Delivery, user_id: int, reason: str) -> CancelResult:
        """Lógica específica para cancelamento de delivery"""
        try:
            # Retornar quantidade ao batch
            if delivery.batch_id:
                batch = self.db.query(ProductBatch).filter(
                    ProductBatch.id == delivery.batch_id
                ).first()
                
                if batch:
                    old_quantity = batch.quantity_available
                    batch.quantity_available += delivery.quantity
                    print(f"🔄 Restaurando quantidade: batch {batch.id} de {old_quantity} para {batch.quantity_available}")
                    self.db.commit()  # Commit imediato para garantir persistência
                    
                    # Verificar se atualizou
                    self.db.refresh(batch)
                    print(f"✅ Quantidade atualizada no banco: {batch.quantity_available}")
            
            return CancelResult(success=True, message="Delivery logic executed")
            
        except Exception as e:
            self.db.rollback()
            return CancelResult(
                success=False,
                message=f"Error in delivery cancel logic: {str(e)}"
            )
    
    def _prepare_entity_data(self, entity) -> Dict[str, Any]:
        """Prepara dados da entidade para retorno (antes de deletar)"""
        data = {}
        
        # Campos comuns
        if hasattr(entity, 'id'):
            data['id'] = entity.id
        if hasattr(entity, 'quantity'):
            data['quantity'] = entity.quantity
        
        # Campos específicos de Delivery
        if isinstance(entity, Delivery):
            data['quantity_returned'] = entity.quantity
        
        return data


# Função helper para uso nos routers
def cancel_entity_generic(
    entity_type: str,
    entity_id: int,
    db: Session,
    current_user,
    reason: str = None
):
    """
    Função helper para uso nos routers - padroniza o cancelamento
    """
    cancel_service = CancelService(db)
    
    result = cancel_service.cancel_entity(
        entity_type=entity_type,
        entity_id=entity_id,
        user_id=current_user.id,
        user_roles=getattr(current_user, 'roles', []),
        reason=reason
    )
    
    if not result.success:
        raise HTTPException(
            status_code=400 if "not found" in result.message.lower() else 403,
            detail=result.message
        )
    
    return result.data
