# 🎨 Domain Model (Domain-Driven Design)

## Bounded Contexts

Sistema dividido em **contextos delimitados** com responsabilidades claras:

```
┌─────────────────────────────────────────────────────────────┐
│                     JFOOD PLATFORM                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Identity   │  │   Catalog    │  │  Matching    │     │
│  │   Context    │  │   Context    │  │   Context    │     │
│  │              │  │              │  │              │     │
│  │  - Users     │  │  - Events    │  │  - Matches   │     │
│  │  - Roles     │  │  - Items     │  │  - Scoring   │     │
│  │  - Auth      │  │  - Categories│  │  - Ranking   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Assignment  │  │   Delivery   │  │Notification  │     │
│  │   Context    │  │   Context    │  │   Context    │     │
│  │              │  │              │  │              │     │
│  │  - Assign    │  │  - Routes    │  │  - Email     │     │
│  │  - Reserve   │  │  - Tracking  │  │  - SMS       │     │
│  │  - Confirm   │  │  - Status    │  │  - Push      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Core Domain: Catalog Context

### Aggregates

#### Event Aggregate
```python
class Event:
    """
    Agregado raiz para eventos do sistema
    Um evento pode ser uma necessidade, oferta ou entrega
    """
    
    # Entity
    id: EventId
    type: EventType  # necessidade, oferta, entrega
    category: Category  # alimentos, roupas, medicamentos
    status: EventStatus
    
    # Value Objects
    location: Location
    timeframe: Timeframe
    metadata: Metadata
    
    # Entities do Agregado
    items: List[EventItem]
    
    # Relacionamentos
    creator_id: UserId
    city_id: CityId
    parent_event_id: Optional[EventId]  # Para ofertas ligadas a necessidades
    
    # Auditoria
    created_at: datetime
    updated_at: datetime
    expires_at: Optional[datetime]
    
    # Métodos de Negócio
    def publish(self) -> None:
        """Publica evento"""
        if self.status != EventStatus.DRAFT:
            raise InvalidStateTransition("Só pode publicar rascunhos")
        
        self.status = EventStatus.ACTIVE
        self.raise_event(EventPublished(event_id=self.id))
    
    def cancel(self, reason: str) -> None:
        """Cancela evento"""
        if self.status in [EventStatus.COMPLETED, EventStatus.CANCELLED]:
            raise InvalidStateTransition("Evento já finalizado")
        
        self.status = EventStatus.CANCELLED
        self.raise_event(EventCancelled(event_id=self.id, reason=reason))
    
    def complete(self) -> None:
        """Completa evento"""
        if not self.can_complete():
            raise InvalidStateTransition("Evento não pode ser completado")
        
        self.status = EventStatus.COMPLETED
        self.raise_event(EventCompleted(event_id=self.id))
    
    def can_complete(self) -> bool:
        """Verifica se pode completar"""
        # Todos items devem estar entregues
        return all(item.quantity_delivered >= item.quantity for item in self.items)
    
    def add_item(self, item: EventItem) -> None:
        """Adiciona item ao evento"""
        if self.status != EventStatus.DRAFT:
            raise InvalidStateTransition("Só pode adicionar items em rascunho")
        
        self.items.append(item)
        self.raise_event(ItemAdded(event_id=self.id, item=item))
```

#### EventItem Entity
```python
class EventItem:
    """Item de um evento"""
    
    id: ItemId
    event_id: EventId
    name: str
    quantity: Quantity
    unit: Unit
    category: str
    metadata: Dict
    
    # Tracking
    quantity_reserved: Quantity = 0
    quantity_delivered: Quantity = 0
    
    def reserve(self, amount: Quantity) -> None:
        """Reserva quantidade"""
        available = self.quantity - self.quantity_reserved
        if amount > available:
            raise InsufficientQuantity(f"Disponível: {available}, Solicitado: {amount}")
        
        self.quantity_reserved += amount
    
    def deliver(self, amount: Quantity) -> None:
        """Marca como entregue"""
        if amount > self.quantity_reserved:
            raise InvalidOperation("Não pode entregar mais que reservado")
        
        self.quantity_delivered += amount
        self.quantity_reserved -= amount
```

### Value Objects

```python
@dataclass(frozen=True)
class EventType:
    """Tipo de evento"""
    value: str
    
    NECESSIDADE = "necessidade"
    OFERTA = "oferta"
    ENTREGA = "entrega"
    
    def __post_init__(self):
        if self.value not in [self.NECESSIDADE, self.OFERTA, self.ENTREGA]:
            raise ValueError(f"Tipo inválido: {self.value}")

@dataclass(frozen=True)
class Category:
    """Categoria de produto/serviço"""
    name: str
    subcategory: Optional[str] = None
    
    def __str__(self):
        if self.subcategory:
            return f"{self.name}/{self.subcategory}"
        return self.name

@dataclass(frozen=True)
class Quantity:
    """Quantidade com unidade"""
    amount: float
    unit: str
    
    def __add__(self, other: 'Quantity') -> 'Quantity':
        if self.unit != other.unit:
            raise IncompatibleUnits(f"{self.unit} != {other.unit}")
        return Quantity(self.amount + other.amount, self.unit)
    
    def __sub__(self, other: 'Quantity') -> 'Quantity':
        if self.unit != other.unit:
            raise IncompatibleUnits(f"{self.unit} != {other.unit}")
        return Quantity(self.amount - other.amount, self.unit)
    
    def __gt__(self, other: 'Quantity') -> bool:
        if self.unit != other.unit:
            raise IncompatibleUnits(f"{self.unit} != {other.unit}")
        return self.amount > other.amount

@dataclass(frozen=True)
class Location:
    """Localização geográfica"""
    latitude: float
    longitude: float
    address: str
    city_id: str
    
    def distance_to(self, other: 'Location') -> float:
        """Calcula distância em km"""
        from math import radians, cos, sin, asin, sqrt
        
        lon1, lat1, lon2, lat2 = map(radians, [
            self.longitude, self.latitude,
            other.longitude, other.latitude
        ])
        
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        km = 6371 * c
        
        return km

@dataclass(frozen=True)
class Timeframe:
    """Janela de tempo"""
    start: datetime
    end: datetime
    
    def __post_init__(self):
        if self.start >= self.end:
            raise ValueError("Start deve ser antes de end")
    
    def contains(self, dt: datetime) -> bool:
        """Verifica se datetime está dentro da janela"""
        return self.start <= dt <= self.end
    
    def overlaps(self, other: 'Timeframe') -> bool:
        """Verifica se há sobreposição"""
        return self.start <= other.end and other.start <= self.end
```

## Assignment Context

### Assignment Aggregate
```python
class Assignment:
    """
    Agregado para atribuição de voluntário a evento
    Representa compromisso de um voluntário com uma tarefa
    """
    
    id: AssignmentId
    event_id: EventId
    volunteer_id: UserId
    status: AssignmentStatus
    
    # Detalhes
    items: List[AssignmentItem]
    pickup_location: Location
    delivery_location: Location
    estimated_time: Timeframe
    
    # Tracking
    accepted_at: Optional[datetime]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    
    def accept(self) -> None:
        """Voluntário aceita assignment"""
        if self.status != AssignmentStatus.PENDING:
            raise InvalidStateTransition("Assignment não está pendente")
        
        self.status = AssignmentStatus.ACCEPTED
        self.accepted_at = datetime.utcnow()
        self.raise_event(AssignmentAccepted(assignment_id=self.id))
    
    def start(self) -> None:
        """Inicia execução"""
        if self.status != AssignmentStatus.ACCEPTED:
            raise InvalidStateTransition("Assignment não foi aceito")
        
        self.status = AssignmentStatus.IN_PROGRESS
        self.started_at = datetime.utcnow()
        self.raise_event(AssignmentStarted(assignment_id=self.id))
    
    def complete(self, confirmation_code: str) -> None:
        """Completa assignment"""
        if self.status != AssignmentStatus.IN_PROGRESS:
            raise InvalidStateTransition("Assignment não está em progresso")
        
        self.status = AssignmentStatus.COMPLETED
        self.completed_at = datetime.utcnow()
        self.raise_event(AssignmentCompleted(
            assignment_id=self.id,
            confirmation_code=confirmation_code
        ))
```

## Delivery Context

### Delivery Aggregate
```python
class Delivery:
    """
    Agregado para rastreamento de entrega
    Tracking em tempo real da movimentação
    """
    
    id: DeliveryId
    assignment_id: AssignmentId
    status: DeliveryStatus
    
    # Rota
    origin: Location
    destination: Location
    route: List[Waypoint]
    current_location: Optional[Location]
    
    # Tempo
    estimated_arrival: datetime
    actual_arrival: Optional[datetime]
    
    # Confirmação
    photo_proof: Optional[str]
    signature: Optional[str]
    confirmation_code: Optional[str]
    
    def update_location(self, location: Location) -> None:
        """Atualiza localização atual"""
        if self.status not in [DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT]:
            raise InvalidStateTransition("Delivery não está em trânsito")
        
        self.current_location = location
        self.status = DeliveryStatus.IN_TRANSIT
        self.raise_event(LocationUpdated(
            delivery_id=self.id,
            location=location
        ))
    
    def deliver(self, confirmation_code: str, photo: Optional[str] = None) -> None:
        """Confirma entrega"""
        if self.status != DeliveryStatus.IN_TRANSIT:
            raise InvalidStateTransition("Delivery não está em trânsito")
        
        self.status = DeliveryStatus.DELIVERED
        self.actual_arrival = datetime.utcnow()
        self.confirmation_code = confirmation_code
        self.photo_proof = photo
        
        self.raise_event(DeliveryCompleted(
            delivery_id=self.id,
            confirmation_code=confirmation_code
        ))
```

## Domain Services

### MatchingService
```python
class MatchingService:
    """
    Serviço de domínio para matching entre necessidades e ofertas
    Lógica complexa que não pertence a nenhum agregado específico
    """
    
    def find_matches(
        self,
        necessidade: Event,
        ofertas: List[Event],
        max_distance_km: float = 10.0
    ) -> List[Match]:
        """Encontra ofertas que atendem necessidade"""
        
        matches = []
        
        for oferta in ofertas:
            score = self.calculate_match_score(necessidade, oferta, max_distance_km)
            
            if score > 0:
                matches.append(Match(
                    necessidade_id=necessidade.id,
                    oferta_id=oferta.id,
                    score=score
                ))
        
        # Ordenar por score
        matches.sort(key=lambda m: m.score, reverse=True)
        
        return matches
    
    def calculate_match_score(
        self,
        necessidade: Event,
        oferta: Event,
        max_distance_km: float
    ) -> float:
        """Calcula score de compatibilidade (0-100)"""
        
        score = 0.0
        
        # 1. Categoria (40 pontos)
        if necessidade.category == oferta.category:
            score += 40
        else:
            return 0  # Categorias diferentes = sem match
        
        # 2. Quantidade (30 pontos)
        necessidade_qty = sum(item.quantity for item in necessidade.items)
        oferta_qty = sum(item.quantity for item in oferta.items)
        
        if oferta_qty >= necessidade_qty:
            score += 30
        else:
            score += 30 * (oferta_qty / necessidade_qty)
        
        # 3. Distância (20 pontos)
        distance = necessidade.location.distance_to(oferta.location)
        if distance <= max_distance_km:
            score += 20 * (1 - distance / max_distance_km)
        
        # 4. Tempo (10 pontos)
        if necessidade.timeframe.overlaps(oferta.timeframe):
            score += 10
        
        return score

class Match:
    """Resultado de matching"""
    necessidade_id: EventId
    oferta_id: EventId
    score: float
```

### RouteOptimizationService
```python
class RouteOptimizationService:
    """
    Serviço de domínio para otimização de rotas
    """
    
    def optimize_route(
        self,
        volunteer_location: Location,
        pickups: List[Location],
        deliveries: List[Location]
    ) -> Route:
        """Otimiza rota de coleta e entrega"""
        
        # Algoritmo simples: nearest neighbor
        # Em produção: usar Google Maps Directions API
        
        route = Route(waypoints=[])
        current = volunteer_location
        remaining_pickups = pickups.copy()
        remaining_deliveries = deliveries.copy()
        
        # Coletas primeiro
        while remaining_pickups:
            nearest = min(
                remaining_pickups,
                key=lambda loc: current.distance_to(loc)
            )
            route.add_waypoint(nearest, WaypointType.PICKUP)
            remaining_pickups.remove(nearest)
            current = nearest
        
        # Depois entregas
        while remaining_deliveries:
            nearest = min(
                remaining_deliveries,
                key=lambda loc: current.distance_to(loc)
            )
            route.add_waypoint(nearest, WaypointType.DELIVERY)
            remaining_deliveries.remove(nearest)
            current = nearest
        
        return route
```

## Repositories

### Interface (Port)
```python
from abc import ABC, abstractmethod

class EventRepository(ABC):
    """Interface do repositório de eventos"""
    
    @abstractmethod
    async def save(self, event: Event) -> None:
        pass
    
    @abstractmethod
    async def get_by_id(self, event_id: EventId) -> Optional[Event]:
        pass
    
    @abstractmethod
    async def find_active_by_category(
        self,
        category: Category,
        city_id: str
    ) -> List[Event]:
        pass
    
    @abstractmethod
    async def find_by_creator(self, creator_id: UserId) -> List[Event]:
        pass
```

### Implementation (Adapter)
```python
class SQLAlchemyEventRepository(EventRepository):
    """Implementação com SQLAlchemy"""
    
    def __init__(self, session: Session):
        self.session = session
    
    async def save(self, event: Event) -> None:
        # Converter agregado para model
        model = EventModel(
            id=event.id,
            type=event.type.value,
            category=event.category.name,
            status=event.status.value,
            creator_id=event.creator_id,
            city_id=event.city_id,
            metadata=event.metadata.to_dict(),
            created_at=event.created_at
        )
        
        # Salvar items
        for item in event.items:
            item_model = EventItemModel(
                id=item.id,
                event_id=event.id,
                name=item.name,
                quantity=item.quantity.amount,
                unit=item.quantity.unit
            )
            model.items.append(item_model)
        
        self.session.add(model)
        await self.session.commit()
    
    async def get_by_id(self, event_id: EventId) -> Optional[Event]:
        model = await self.session.get(EventModel, event_id)
        if not model:
            return None
        
        # Reconstruir agregado a partir do model
        return self._to_domain(model)
    
    def _to_domain(self, model: EventModel) -> Event:
        """Converte model para agregado de domínio"""
        items = [
            EventItem(
                id=item.id,
                event_id=model.id,
                name=item.name,
                quantity=Quantity(item.quantity, item.unit),
                # ...
            )
            for item in model.items
        ]
        
        return Event(
            id=model.id,
            type=EventType(model.type),
            category=Category(model.category),
            status=EventStatus(model.status),
            items=items,
            # ...
        )
```

## Validação de Invariantes

```python
class Event:
    def validate_invariants(self) -> None:
        """Valida regras de negócio"""
        
        # Regra: Evento deve ter pelo menos 1 item
        if not self.items:
            raise DomainValidationError("Evento deve ter pelo menos um item")
        
        # Regra: Quantidade total > 0
        total_qty = sum(item.quantity.amount for item in self.items)
        if total_qty <= 0:
            raise DomainValidationError("Quantidade total deve ser maior que zero")
        
        # Regra: Timeframe deve ser futuro
        if self.timeframe.end < datetime.utcnow():
            raise DomainValidationError("Evento não pode expirar no passado")
        
        # Regra específica por categoria
        validator = CategoryValidatorFactory.get(self.category)
        validator.validate(self)
```

---

**Próximo**: [Estratégia de Migração](./04-MIGRATION-STRATEGY.md)
