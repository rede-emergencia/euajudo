"""
Event Bus - Synchronous now, Kafka-ready later.

All domain events go through here. When we add Kafka:
1. Replace SyncEventBus with KafkaEventBus
2. Each handler becomes a consumer group
3. Events are already serializable dicts

Usage:
    bus = get_event_bus()
    bus.emit("donation.committed", {"delivery_id": 1, "shelter_id": 5, ...})
"""
import logging
from datetime import datetime
from typing import Callable, Dict, List, Any

logger = logging.getLogger(__name__)


# ============================================================================
# DOMAIN EVENTS
# ============================================================================

class DomainEvent:
    """Base domain event - serializable for future Kafka publishing."""

    def __init__(self, event_type: str, payload: Dict[str, Any], actor_id: int = None):
        self.event_type = event_type
        self.payload = payload
        self.actor_id = actor_id
        self.occurred_at = datetime.utcnow().isoformat()

    def to_dict(self) -> dict:
        return {
            "event_type": self.event_type,
            "payload": self.payload,
            "actor_id": self.actor_id,
            "occurred_at": self.occurred_at,
        }


# ---- Donation Events ----
class DonationCommitted(DomainEvent):
    def __init__(self, delivery_ids: list, shelter_id: int, volunteer_id: int, code: str):
        super().__init__(
            "donation.committed",
            {"delivery_ids": delivery_ids, "shelter_id": shelter_id,
             "volunteer_id": volunteer_id, "code": code},
            actor_id=volunteer_id,
        )


class DonationCancelled(DomainEvent):
    def __init__(self, delivery_id: int, shelter_id: int, volunteer_id: int):
        super().__init__(
            "donation.cancelled",
            {"delivery_id": delivery_id, "shelter_id": shelter_id, "volunteer_id": volunteer_id},
            actor_id=volunteer_id,
        )


class DonationDelivered(DomainEvent):
    def __init__(self, delivery_id: int, shelter_id: int, volunteer_id: int, quantity: int):
        super().__init__(
            "donation.delivered",
            {"delivery_id": delivery_id, "shelter_id": shelter_id,
             "volunteer_id": volunteer_id, "quantity": quantity},
            actor_id=volunteer_id,
        )


# ---- Need Request Events ----
class NeedRequestCreated(DomainEvent):
    def __init__(self, request_id: int, shelter_id: int, category_id: int, quantity: int):
        super().__init__(
            "need_request.created",
            {"request_id": request_id, "shelter_id": shelter_id,
             "category_id": category_id, "quantity": quantity},
            actor_id=shelter_id,
        )


class NeedRequestFulfilled(DomainEvent):
    def __init__(self, request_id: int, shelter_id: int):
        super().__init__(
            "need_request.fulfilled",
            {"request_id": request_id, "shelter_id": shelter_id},
            actor_id=shelter_id,
        )


# ============================================================================
# SYNC EVENT BUS (swap for Kafka bus later)
# ============================================================================

class SyncEventBus:
    """
    Synchronous in-process event bus.
    
    To migrate to Kafka:
    - Replace `emit()` with a Kafka producer publish
    - Replace `subscribe()` with Kafka consumer group registration
    - Events are already dicts, no serialization changes needed
    """

    def __init__(self):
        self._handlers: Dict[str, List[Callable]] = {}

    def subscribe(self, event_type: str, handler: Callable[[DomainEvent], None]):
        """Register a handler for an event type. Supports wildcards: 'donation.*'"""
        self._handlers.setdefault(event_type, []).append(handler)

    def emit(self, event: DomainEvent):
        """
        Emit an event synchronously to all registered handlers.
        Handlers run in registration order. Failures are logged but don't abort.
        """
        logger.info(f"[EventBus] {event.event_type} | {event.to_dict()}")

        for pattern, handlers in self._handlers.items():
            if self._matches(pattern, event.event_type):
                for handler in handlers:
                    try:
                        handler(event)
                    except Exception as exc:
                        logger.error(
                            f"[EventBus] Handler {handler.__name__} failed for "
                            f"{event.event_type}: {exc}",
                            exc_info=True,
                        )

    @staticmethod
    def _matches(pattern: str, event_type: str) -> bool:
        if pattern == "*":
            return True
        if pattern.endswith(".*"):
            return event_type.startswith(pattern[:-2])
        return pattern == event_type


# ============================================================================
# SINGLETON
# ============================================================================

_bus = SyncEventBus()


def get_event_bus() -> SyncEventBus:
    """Get the application event bus singleton."""
    return _bus


def register_handlers(bus: SyncEventBus):
    """
    Register all domain event handlers.
    Add new handlers here as features grow.
    """
    def _log_all(event: DomainEvent):
        logger.debug(f"[Audit] {event.event_type}: {event.payload}")

    bus.subscribe("*", _log_all)
