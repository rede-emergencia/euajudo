"""
Router Genérico de Cancelamento

Endpoint unificado para cancelar qualquer tipo de entidade no sistema.
"""

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from ..database import get_db
from ..models import User
from ..auth import get_current_active_user
from ..services.cancel_service import cancel_entity_generic, CancelableEntityType

router = APIRouter(prefix="/api/cancel", tags=["cancel"])


@router.post("/{entity_type}/{entity_id}")
def cancel_entity(
    entity_type: str,
    entity_id: int,
    reason: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Cancela uma entidade genérica
    
    Tipos suportados:
    - delivery: Cancela uma entrega
    - batch: Cancela um lote de produtos
    - resource_request: Cancela uma solicitação de recursos
    - resource_reservation: Cancela uma reserva de recursos
    
    Args:
        entity_type: Tipo da entidade a ser cancelada
        entity_id: ID da entidade
        reason: Motivo do cancelamento (opcional)
    
    Returns:
        Dados da operação de cancelamento
    
    Raises:
        404: Entidade não encontrada
        403: Usuário não autorizado
        400: Entidade não pode ser cancelada no status atual
    """
    return cancel_entity_generic(
        entity_type=entity_type,
        entity_id=entity_id,
        db=db,
        current_user=current_user,
        reason=reason
    )


@router.get("/types")
def get_cancellable_types():
    """
    Retorna os tipos de entidades que podem ser canceladas
    """
    from .cancel_service import CancelableEntityType
    
    return {
        "types": [
            {
                "type": CancelableEntityType.DELIVERY,
                "description": "Cancela uma entrega de voluntário",
                "cancelable_statuses": ["PENDING_CONFIRMATION", "RESERVED"]
            },
            {
                "type": CancelableEntityType.BATCH,
                "description": "Cancela um lote de produtos",
                "cancelable_statuses": ["PRODUCING", "READY"]
            },
            {
                "type": CancelableEntityType.RESOURCE_REQUEST,
                "description": "Cancela uma solicitação de recursos",
                "cancelable_statuses": ["PENDING", "APPROVED"]
            },
            {
                "type": CancelableEntityType.RESOURCE_RESERVATION,
                "description": "Cancela uma reserva de recursos",
                "cancelable_statuses": ["RESERVED"]
            }
        ]
    }
