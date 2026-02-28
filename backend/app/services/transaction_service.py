"""
Serviço de Transações Robusto - Baseado em Eventos
Garante consistência ACID nas operações de reserva/cancelamento
"""

from sqlalchemy.orm import Session
from app.models import ResourceRequest, ResourceItem, ResourceReservation, ReservationItem
from app.enums import OrderStatus
from datetime import datetime, timedelta
from typing import List, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class TransactionError(Exception):
    """Erro em transação - permite rollback controlado"""
    pass

class ResourceTransactionService:
    """Serviço de transações para recursos com garantia ACID"""
    
    def __init__(self, db: Session):
        self.db = db
        self.events = []  # Eventos da transação
    
    def create_reservation(self, 
                          request_id: int, 
                          volunteer_id: int, 
                          items: List[dict],
                          estimated_delivery: datetime) -> ResourceReservation:
        """
        Cria reserva com transação atômica
        Lança exceção se qualquer parte falhar
        """
        try:
            # Iniciar transação explícita
            # Validar request
            request = self._validate_request_for_reservation(request_id)
            
            # Validar e bloquear itens
            reservation_items = self._validate_and_lock_items(request_id, items)
            
            # Criar reserva
            reservation = self._create_reservation_entity(
                request_id, volunteer_id, reservation_items, estimated_delivery
            )
            
            # Atualizar status do request
            self._update_request_status_after_reservation(request)
            
            # Commit da transação
            self.db.commit()
            
            # Registrar eventos
            self._log_transaction("CREATE_RESERVATION", {
                "reservation_id": reservation.id,
                "request_id": request_id,
                "volunteer_id": volunteer_id,
                "items": items
            })
            
            return reservation
            
        except Exception as e:
            # Rollback em caso de erro
            self.db.rollback()
            logger.error(f"Transaction failed: {e}")
            raise TransactionError(f"Failed to create reservation: {e}")
    
    def cancel_reservation(self, reservation_id: int, volunteer_id: int) -> bool:
        """
        Cancela reserva com transação atômica
        Garante que todos os itens voltem para disponibilidade
        """
        try:
            # Validar e obter reserva
            reservation = self._validate_reservation_for_cancellation(reservation_id, volunteer_id)
            
            # Coletar itens antes de deletar
            items_to_return = self._collect_items_for_return(reservation_id)
            
            # Retornar itens para disponibilidade
            self._return_items_to_availability(items_to_return)
            
            # Deletar itens da reserva
            self._delete_reservation_items(reservation_id)
            
            # Deletar reserva
            self._delete_reservation(reservation_id)
            
            # Atualizar status do request
            self._update_request_status_after_cancellation(reservation.request_id)
            
            # Commit da transação
            self.db.commit()
            
            # Registrar eventos
            self._log_transaction("CANCEL_RESERVATION", {
                "reservation_id": reservation_id,
                "volunteer_id": volunteer_id,
                "items_returned": len(items_to_return)
            })
            
            return True
            
        except Exception as e:
            # Rollback em caso de erro
            self.db.rollback()
            logger.error(f"Cancel transaction failed: {e}")
            raise TransactionError(f"Failed to cancel reservation: {e}")
    
    def _validate_request_for_reservation(self, request_id: int) -> ResourceRequest:
        """Valida se request pode receber reservas"""
        request = self.db.query(ResourceRequest).filter(
            ResourceRequest.id == request_id
        ).with_for_update().first()  # Lock para evitar race conditions
        
        if not request:
            raise TransactionError("Request not found")
        
        if request.status not in [OrderStatus.REQUESTING, OrderStatus.PARTIALLY_RESERVED]:
            raise TransactionError(f"Request status {request.status} not available for reservation")
        
        return request
    
    def _validate_and_lock_items(self, request_id: int, items: List[dict]) -> List[ResourceItem]:
        """Valida disponibilidade e bloqueia itens"""
        reservation_items = []
        
        for item_data in items:
            # Lock do item para evitar concorrência
            resource_item = self.db.query(ResourceItem).filter(
                ResourceItem.id == item_data["resource_item_id"],
                ResourceItem.request_id == request_id
            ).with_for_update().first()
            
            if not resource_item:
                raise TransactionError(f"Item {item_data['resource_item_id']} not found in request")
            
            # Calcular disponibilidade
            available_quantity = resource_item.quantity - resource_item.quantity_reserved
            requested_quantity = item_data["quantity"]
            
            if requested_quantity > available_quantity:
                raise TransactionError(
                    f"Item '{resource_item.name}': only {available_quantity} available, requested {requested_quantity}"
                )
            
            # Adicionar à lista
            reservation_items.append({
                "resource_item": resource_item,
                "quantity": requested_quantity
            })
        
        return reservation_items
    
    def _create_reservation_entity(self, 
                                 request_id: int, 
                                 volunteer_id: int,
                                 reservation_items: List[dict],
                                 estimated_delivery: datetime) -> ResourceReservation:
        """Cria entidade de reserva e itens associados"""
        # Criar reserva
        reservation = ResourceReservation(
            request_id=request_id,
            volunteer_id=volunteer_id,
            status=OrderStatus.RESERVED,
            estimated_delivery=estimated_delivery,
            expires_at=datetime.utcnow() + timedelta(hours=24)
        )
        
        self.db.add(reservation)
        self.db.flush()  # Obter ID
        
        # Criar itens da reserva e atualizar reservados
        for item_data in reservation_items:
            resource_item = item_data["resource_item"]
            quantity = item_data["quantity"]
            
            # Criar ReservationItem
            reservation_item = ReservationItem(
                reservation_id=reservation.id,
                resource_item_id=resource_item.id,
                quantity=quantity
            )
            self.db.add(reservation_item)
            
            # Atualizar quantidade reservada
            resource_item.quantity_reserved += quantity
        
        return reservation
    
    def _update_request_status_after_reservation(self, request: ResourceRequest):
        """Atualiza status do request após reserva"""
        # Recalcular status baseado nos itens
        total_items = len(request.items)
        fully_reserved_items = sum(
            1 for item in request.items 
            if item.quantity_reserved >= item.quantity
        )
        partially_reserved_items = sum(
            1 for item in request.items 
            if 0 < item.quantity_reserved < item.quantity
        )
        
        if fully_reserved_items == total_items:
            request.status = OrderStatus.RESERVED
        elif partially_reserved_items > 0 or fully_reserved_items > 0:
            request.status = OrderStatus.PARTIALLY_RESERVED
        else:
            request.status = OrderStatus.REQUESTING
    
    def _validate_reservation_for_cancellation(self, reservation_id: int, volunteer_id: int) -> ResourceReservation:
        """Valida se reserva pode ser cancelada"""
        reservation = self.db.query(ResourceReservation).filter(
            ResourceReservation.id == reservation_id
        ).with_for_update().first()
        
        if not reservation:
            raise TransactionError("Reservation not found")
        
        if reservation.volunteer_id != volunteer_id:
            raise TransactionError("Not authorized to cancel this reservation")
        
        if reservation.status != OrderStatus.RESERVED:
            raise TransactionError("Cannot cancel reservation after pickup")
        
        return reservation
    
    def _collect_items_for_return(self, reservation_id: int) -> List[Tuple[ResourceItem, int]]:
        """Coleta itens que devem ser devolvidos"""
        items = self.db.query(ReservationItem).filter(
            ReservationItem.reservation_id == reservation_id
        ).all()
        
        items_to_return = []
        for reservation_item in items:
            resource_item = self.db.query(ResourceItem).filter(
                ResourceItem.id == reservation_item.resource_item_id
            ).with_for_update().first()
            
            if resource_item:
                items_to_return.append((resource_item, reservation_item.quantity))
        
        return items_to_return
    
    def _return_items_to_availability(self, items_to_return: List[Tuple[ResourceItem, int]]):
        """Retorna itens para disponibilidade"""
        for resource_item, quantity in items_to_return:
            resource_item.quantity_reserved -= quantity
            # Garantir que não fique negativo
            resource_item.quantity_reserved = max(0, resource_item.quantity_reserved)
    
    def _delete_reservation_items(self, reservation_id: int):
        """Deleta itens da reserva"""
        self.db.query(ReservationItem).filter(
            ReservationItem.reservation_id == reservation_id
        ).delete()
    
    def _delete_reservation(self, reservation_id: int):
        """Deleta reserva"""
        self.db.query(ResourceReservation).filter(
            ResourceReservation.id == reservation_id
        ).delete()
    
    def _update_request_status_after_cancellation(self, request_id: int):
        """Atualiza status do request após cancelamento"""
        request = self.db.query(ResourceRequest).filter(
            ResourceRequest.id == request_id
        ).with_for_update().first()
        
        if not request:
            return
        
        # Verificar se ainda há reservas ativas
        active_reservations = self.db.query(ResourceReservation).filter(
            ResourceReservation.request_id == request_id,
            ResourceReservation.status == OrderStatus.RESERVED
        ).count()
        
        # Recalcular status baseado nos itens
        total_items = len(request.items)
        fully_reserved_items = sum(
            1 for item in request.items 
            if item.quantity_reserved >= item.quantity
        )
        partially_reserved_items = sum(
            1 for item in request.items 
            if 0 < item.quantity_reserved < item.quantity
        )
        
        if active_reservations == 0 and partially_reserved_items == 0 and fully_reserved_items == 0:
            request.status = OrderStatus.REQUESTING
        elif fully_reserved_items == total_items:
            request.status = OrderStatus.RESERVED
        elif partially_reserved_items > 0 or fully_reserved_items > 0:
            request.status = OrderStatus.PARTIALLY_RESERVED
    
    def _log_transaction(self, event_type: str, data: dict):
        """Registra eventos da transação para auditoria"""
        event = {
            "event_type": event_type,
            "timestamp": datetime.utcnow().isoformat(),
            "data": data
        }
        self.events.append(event)
        logger.info(f"Transaction Event: {event_type} - {data}")

# Função de conveniência para uso nos routers
def get_transaction_service(db: Session) -> ResourceTransactionService:
    """Obtém serviço de transações"""
    return ResourceTransactionService(db)
