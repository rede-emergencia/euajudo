# 💎 Padrões de Código

## Arquitetura em Camadas

```
┌─────────────────────────────────────────┐
│         API Layer (FastAPI)             │
│  - Routers                              │
│  - Request/Response handling            │
│  - Authentication                       │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Application Layer                  │
│  - Commands (write)                     │
│  - Queries (read)                       │
│  - Handlers                             │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│        Domain Layer                     │
│  - Entities                             │
│  - Value Objects                        │
│  - Domain Services                      │
│  - Business Rules                       │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│     Infrastructure Layer                │
│  - Repositories                         │
│  - Database                             │
│  - External APIs                        │
│  - Event Bus                            │
└─────────────────────────────────────────┘
```

## Repository Pattern

### Interface
```python
# app/core/interfaces/repository.py
from abc import ABC, abstractmethod
from typing import List, Optional, Generic, TypeVar

T = TypeVar('T')

class Repository(ABC, Generic[T]):
    """Interface base para repositórios"""
    
    @abstractmethod
    async def save(self, entity: T) -> T:
        """Salva ou atualiza entidade"""
        pass
    
    @abstractmethod
    async def get_by_id(self, id: int) -> Optional[T]:
        """Busca por ID"""
        pass
    
    @abstractmethod
    async def delete(self, entity: T) -> None:
        """Remove entidade"""
        pass
    
    @abstractmethod
    async def list(self, **filters) -> List[T]:
        """Lista entidades com filtros"""
        pass
```

### Implementação
```python
# app/infrastructure/repositories/event_repository.py
from app.core.interfaces.repository import Repository
from app.core.domain.entities import Event
from app.models import EventModel
from sqlalchemy.orm import Session

class SQLAlchemyEventRepository(Repository[Event]):
    """Implementação SQLAlchemy do repositório de eventos"""
    
    def __init__(self, session: Session):
        self.session = session
    
    async def save(self, event: Event) -> Event:
        """Salva evento"""
        # Converter domain entity para model
        if event.id:
            # Update
            model = await self.session.get(EventModel, event.id)
            self._update_model_from_entity(model, event)
        else:
            # Create
            model = self._create_model_from_entity(event)
            self.session.add(model)
        
        await self.session.commit()
        await self.session.refresh(model)
        
        # Converter model de volta para entity
        return self._create_entity_from_model(model)
    
    async def get_by_id(self, id: int) -> Optional[Event]:
        """Busca por ID"""
        model = await self.session.get(EventModel, id)
        if not model:
            return None
        return self._create_entity_from_model(model)
    
    async def delete(self, event: Event) -> None:
        """Remove evento"""
        model = await self.session.get(EventModel, event.id)
        if model:
            await self.session.delete(model)
            await self.session.commit()
    
    async def list(
        self,
        category: Optional[str] = None,
        status: Optional[str] = None,
        city_id: Optional[str] = None
    ) -> List[Event]:
        """Lista eventos"""
        query = self.session.query(EventModel)
        
        if category:
            query = query.filter(EventModel.category == category)
        if status:
            query = query.filter(EventModel.status == status)
        if city_id:
            query = query.filter(EventModel.city_id == city_id)
        
        models = await query.all()
        return [self._create_entity_from_model(m) for m in models]
    
    def _create_entity_from_model(self, model: EventModel) -> Event:
        """Converte model para entity"""
        return Event(
            id=model.id,
            type=EventType(model.type),
            category=Category(model.category, model.subcategory),
            status=EventStatus(model.status),
            creator_id=model.creator_id,
            city_id=model.city_id,
            metadata=Metadata(model.metadata),
            created_at=model.created_at,
            updated_at=model.updated_at
        )
    
    def _create_model_from_entity(self, event: Event) -> EventModel:
        """Converte entity para model"""
        return EventModel(
            type=event.type.value,
            category=event.category.name,
            subcategory=event.category.subcategory,
            status=event.status.value,
            creator_id=event.creator_id,
            city_id=event.city_id,
            metadata=event.metadata.to_dict()
        )
```

## Service Layer

```python
# app/core/application/services/event_service.py
from app.core.domain.entities import Event
from app.core.interfaces.repository import Repository
from app.events.bus import EventBus

class EventService:
    """Serviço de aplicação para eventos"""
    
    def __init__(
        self,
        event_repository: Repository[Event],
        event_bus: EventBus
    ):
        self.event_repository = event_repository
        self.event_bus = event_bus
    
    async def create_event(
        self,
        type: str,
        category: str,
        creator_id: int,
        items: List[Dict],
        metadata: Dict
    ) -> Event:
        """Cria novo evento"""
        
        # 1. Validar com plugin
        plugin = plugin_registry.get(category)
        plugin.validate_metadata(metadata)
        
        # 2. Criar entidade de domínio
        event = Event.create(
            type=type,
            category=category,
            creator_id=creator_id,
            metadata=metadata
        )
        
        # 3. Adicionar items
        for item_data in items:
            event.add_item(EventItem(**item_data))
        
        # 4. Enriquecer
        event = plugin.enrich_event(event)
        
        # 5. Salvar
        event = await self.event_repository.save(event)
        
        # 6. Publicar evento de domínio
        await self.event_bus.publish(EventCreated(event_id=event.id))
        
        return event
    
    async def publish_event(self, event_id: int, user_id: int) -> Event:
        """Publica evento"""
        
        # 1. Buscar
        event = await self.event_repository.get_by_id(event_id)
        if not event:
            raise NotFoundError("Event", event_id)
        
        # 2. Verificar permissão
        if event.creator_id != user_id:
            raise PermissionDeniedError("Apenas o criador pode publicar")
        
        # 3. Publicar (método de domínio)
        event.publish()
        
        # 4. Salvar
        event = await self.event_repository.save(event)
        
        # 5. Eventos de domínio
        for domain_event in event.domain_events:
            await self.event_bus.publish(domain_event)
        
        event.clear_domain_events()
        
        return event
```

## Dependency Injection

```python
# app/dependencies.py
from fastapi import Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.repositories.event_repository import SQLAlchemyEventRepository
from app.services.event_service import EventService

def get_event_repository(db: Session = Depends(get_db)):
    """Factory para repositório de eventos"""
    return SQLAlchemyEventRepository(db)

def get_event_service(
    repo: SQLAlchemyEventRepository = Depends(get_event_repository)
):
    """Factory para serviço de eventos"""
    return EventService(repo, event_bus)

# Uso em routers
@router.post("/events")
async def create_event(
    data: EventCreate,
    service: EventService = Depends(get_event_service),
    current_user: User = Depends(get_current_user)
):
    event = await service.create_event(
        type=data.type,
        category=data.category,
        creator_id=current_user.id,
        items=data.items,
        metadata=data.metadata
    )
    return event
```

## Factory Pattern

```python
# app/factories/event_factory.py
from app.core.domain.entities import Event, EventItem
from typing import Dict, List

class EventFactory:
    """Factory para criar eventos"""
    
    @staticmethod
    def create_from_dict(data: Dict) -> Event:
        """Cria evento a partir de dict"""
        event = Event(
            type=EventType(data['type']),
            category=Category(data['category']),
            creator_id=data['creator_id'],
            city_id=data.get('city_id'),
            metadata=Metadata(data.get('metadata', {}))
        )
        
        # Adicionar items
        for item_data in data.get('items', []):
            item = EventItemFactory.create_from_dict(item_data)
            event.items.append(item)
        
        return event
    
    @staticmethod
    def create_necessidade(
        category: str,
        creator_id: int,
        items: List[Dict],
        **kwargs
    ) -> Event:
        """Atalho para criar necessidade"""
        return EventFactory.create_from_dict({
            'type': 'necessidade',
            'category': category,
            'creator_id': creator_id,
            'items': items,
            **kwargs
        })
    
    @staticmethod
    def create_oferta(
        category: str,
        provider_id: int,
        items: List[Dict],
        **kwargs
    ) -> Event:
        """Atalho para criar oferta"""
        return EventFactory.create_from_dict({
            'type': 'oferta',
            'category': category,
            'creator_id': provider_id,
            'items': items,
            **kwargs
        })
```

## Builder Pattern

```python
# app/builders/event_builder.py
class EventBuilder:
    """Builder para construir eventos complexos"""
    
    def __init__(self):
        self._type = None
        self._category = None
        self._creator_id = None
        self._city_id = None
        self._metadata = {}
        self._items = []
    
    def with_type(self, type: str) -> 'EventBuilder':
        self._type = type
        return self
    
    def with_category(self, category: str) -> 'EventBuilder':
        self._category = category
        return self
    
    def for_creator(self, creator_id: int) -> 'EventBuilder':
        self._creator_id = creator_id
        return self
    
    def in_city(self, city_id: str) -> 'EventBuilder':
        self._city_id = city_id
        return self
    
    def with_metadata(self, **metadata) -> 'EventBuilder':
        self._metadata.update(metadata)
        return self
    
    def add_item(self, name: str, quantity: float, unit: str) -> 'EventBuilder':
        self._items.append({
            'name': name,
            'quantity': quantity,
            'unit': unit
        })
        return self
    
    def build(self) -> Event:
        """Constrói o evento"""
        if not self._type or not self._category or not self._creator_id:
            raise ValueError("Type, category e creator_id são obrigatórios")
        
        return EventFactory.create_from_dict({
            'type': self._type,
            'category': self._category,
            'creator_id': self._creator_id,
            'city_id': self._city_id,
            'metadata': self._metadata,
            'items': self._items
        })

# Uso
event = (EventBuilder()
    .with_type('necessidade')
    .with_category('alimentos')
    .for_creator(user_id)
    .in_city('juiz-de-fora')
    .with_metadata(quantidade=100, vegetariana=True)
    .add_item('Marmita', 100, 'unidades')
    .build())
```

## Specification Pattern

```python
# app/core/domain/specifications.py
from abc import ABC, abstractmethod

class Specification(ABC):
    """Especificação para validação de regras de negócio"""
    
    @abstractmethod
    def is_satisfied_by(self, entity) -> bool:
        """Verifica se entidade satisfaz especificação"""
        pass
    
    def and_(self, other: 'Specification') -> 'Specification':
        return AndSpecification(self, other)
    
    def or_(self, other: 'Specification') -> 'Specification':
        return OrSpecification(self, other)
    
    def not_(self) -> 'Specification':
        return NotSpecification(self)

class AndSpecification(Specification):
    def __init__(self, spec1: Specification, spec2: Specification):
        self.spec1 = spec1
        self.spec2 = spec2
    
    def is_satisfied_by(self, entity) -> bool:
        return self.spec1.is_satisfied_by(entity) and self.spec2.is_satisfied_by(entity)

class EventCanBePublishedSpec(Specification):
    """Evento pode ser publicado?"""
    
    def is_satisfied_by(self, event: Event) -> bool:
        # Deve estar em draft
        if event.status != EventStatus.DRAFT:
            return False
        
        # Deve ter pelo menos 1 item
        if not event.items:
            return False
        
        # Metadata deve ser válido
        try:
            plugin = plugin_registry.get(event.category)
            plugin.validate_metadata(event.metadata)
            return True
        except ValidationError:
            return False

class EventCanBeCancelledSpec(Specification):
    """Evento pode ser cancelado?"""
    
    def is_satisfied_by(self, event: Event) -> bool:
        return event.status not in [EventStatus.COMPLETED, EventStatus.CANCELLED]

# Uso
spec = EventCanBePublishedSpec()
if spec.is_satisfied_by(event):
    event.publish()
else:
    raise BusinessRuleViolation("Evento não pode ser publicado")
```

## Unit of Work Pattern

```python
# app/core/interfaces/unit_of_work.py
from abc import ABC, abstractmethod
from typing import Optional

class UnitOfWork(ABC):
    """Coordena transações e repositórios"""
    
    events: Repository[Event]
    assignments: Repository[Assignment]
    deliveries: Repository[Delivery]
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            await self.rollback()
        else:
            await self.commit()
    
    @abstractmethod
    async def commit(self) -> None:
        pass
    
    @abstractmethod
    async def rollback(self) -> None:
        pass

# Implementação
class SQLAlchemyUnitOfWork(UnitOfWork):
    def __init__(self, session_factory):
        self.session_factory = session_factory
    
    async def __aenter__(self):
        self.session = self.session_factory()
        self.events = SQLAlchemyEventRepository(self.session)
        self.assignments = SQLAlchemyAssignmentRepository(self.session)
        self.deliveries = SQLAlchemyDeliveryRepository(self.session)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            await self.rollback()
        await self.session.close()
    
    async def commit(self):
        await self.session.commit()
    
    async def rollback(self):
        await self.session.rollback()

# Uso
async def create_delivery_flow(event_id: int, volunteer_id: int):
    async with SQLAlchemyUnitOfWork(session_factory) as uow:
        # Tudo na mesma transação
        event = await uow.events.get_by_id(event_id)
        
        assignment = Assignment.create(event_id, volunteer_id)
        assignment = await uow.assignments.save(assignment)
        
        delivery = Delivery.create(assignment.id)
        delivery = await uow.deliveries.save(delivery)
        
        # Commit automático se não houver exceção
```

## Strategy Pattern (já usado em Plugins)

```python
# Plugins são strategies
class MatchingStrategy(ABC):
    @abstractmethod
    def calculate_score(self, need: Event, offer: Event) -> float:
        pass

class FoodMatchingStrategy(MatchingStrategy):
    def calculate_score(self, need: Event, offer: Event) -> float:
        # Lógica específica para alimentos
        pass

class ClothingMatchingStrategy(MatchingStrategy):
    def calculate_score(self, need: Event, offer: Event) -> float:
        # Lógica específica para roupas
        pass

# Context
class MatchingService:
    def __init__(self):
        self.strategies = {
            'alimentos': FoodMatchingStrategy(),
            'roupas': ClothingMatchingStrategy()
        }
    
    def find_matches(self, need: Event, offers: List[Event]) -> List[Match]:
        strategy = self.strategies[need.category]
        
        matches = []
        for offer in offers:
            score = strategy.calculate_score(need, offer)
            if score > 0:
                matches.append(Match(need, offer, score))
        
        return sorted(matches, key=lambda m: m.score, reverse=True)
```

## Observer Pattern (já usado em Events)

```python
# Event bus é implementação de Observer
class Subject:
    def __init__(self):
        self._observers = []
    
    def attach(self, observer):
        self._observers.append(observer)
    
    def notify(self, event):
        for observer in self._observers:
            observer.update(event)

# Observers
class EmailNotificationObserver:
    def update(self, event):
        if isinstance(event, EventPublished):
            send_email_notification(event)

class AnalyticsObserver:
    def update(self, event):
        track_event(event)
```

## Padrões de Teste

```python
# tests/conftest.py
import pytest
from app.factories.event_factory import EventFactory

@pytest.fixture
def event_factory():
    return EventFactory()

@pytest.fixture
def sample_event(event_factory):
    return event_factory.create_necessidade(
        category='alimentos',
        creator_id=1,
        items=[{'name': 'Marmita', 'quantity': 100, 'unit': 'unidades'}]
    )

# tests/test_event_service.py
@pytest.mark.asyncio
async def test_create_event(event_service, sample_event):
    event = await event_service.create_event(...)
    assert event.id is not None
    assert event.status == EventStatus.DRAFT
```

---

**Próximo**: [Diagramas](./diagrams/event-flow.md)
