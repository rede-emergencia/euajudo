# 🔄 Event-Driven Architecture

## O que é Event-Driven?

Sistema onde **eventos** são a fonte primária de verdade. Toda ação no sistema gera um evento imutável que é processado de forma assíncrona.

### Benefícios
✅ **Desacoplamento**: Serviços não se conhecem diretamente  
✅ **Escalabilidade**: Processamento assíncrono e paralelo  
✅ **Auditoria**: Histórico completo de tudo que aconteceu  
✅ **Resiliência**: Retry automático em falhas  
✅ **Extensibilidade**: Adicionar consumers sem alterar producers  

## Conceitos Fundamentais

### 1. Eventos vs Comandos

**Comando** (Imperativo):
```python
# "Faça isso"
CriarPedido(quantidade=100)
ReservarMarmitas(lote_id=5, quantidade=30)
```

**Evento** (Passado):
```python
# "Isso aconteceu"
PedidoCriado(pedido_id=1, quantidade=100, timestamp=...)
MarmitasReservadas(reserva_id=3, quantidade=30, timestamp=...)
```

### 2. Event Store

Armazenamento de **todos os eventos** que aconteceram no sistema:

```python
class EventStore(Base):
    __tablename__ = "event_store"
    
    id = Column(Integer, primary_key=True)
    event_type = Column(String, nullable=False, index=True)
    aggregate_id = Column(String, nullable=False, index=True)
    aggregate_type = Column(String, nullable=False)
    event_data = Column(JSON, nullable=False)
    metadata = Column(JSON)
    version = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Índices para queries comuns
    __table_args__ = (
        Index('idx_aggregate', 'aggregate_type', 'aggregate_id'),
        Index('idx_event_type_timestamp', 'event_type', 'timestamp'),
    )
```

### 3. Event Bus

Sistema de mensageria para distribuir eventos:

```python
from abc import ABC, abstractmethod
from typing import List, Callable

class EventBus(ABC):
    @abstractmethod
    async def publish(self, event: Event) -> None:
        """Publica um evento"""
        pass
    
    @abstractmethod
    async def subscribe(self, event_type: str, handler: Callable) -> None:
        """Registra um handler para um tipo de evento"""
        pass

# Implementação simples (in-memory)
class InMemoryEventBus(EventBus):
    def __init__(self):
        self.handlers: Dict[str, List[Callable]] = {}
    
    async def publish(self, event: Event) -> None:
        handlers = self.handlers.get(event.event_type, [])
        for handler in handlers:
            await handler(event)
    
    async def subscribe(self, event_type: str, handler: Callable) -> None:
        if event_type not in self.handlers:
            self.handlers[event_type] = []
        self.handlers[event_type].append(handler)

# Implementação produção (Redis/RabbitMQ)
class RedisEventBus(EventBus):
    def __init__(self, redis_url: str):
        self.redis = Redis.from_url(redis_url)
        self.pubsub = self.redis.pubsub()
    
    async def publish(self, event: Event) -> None:
        channel = f"events:{event.event_type}"
        await self.redis.publish(channel, event.json())
    
    async def subscribe(self, event_type: str, handler: Callable) -> None:
        channel = f"events:{event_type}"
        await self.pubsub.subscribe(**{channel: handler})
```

## Tipos de Eventos no Sistema

### Domain Events (Eventos de Domínio)

#### Necessidades
```python
@dataclass
class NecessidadeCriada:
    event_id: str
    necessidade_id: int
    category: str
    items: List[Dict]
    location_id: int
    creator_id: int
    urgency: str
    metadata: Dict
    timestamp: datetime

@dataclass
class NecessidadeAtualizada:
    event_id: str
    necessidade_id: int
    changes: Dict
    timestamp: datetime

@dataclass
class NecessidadeCancelada:
    event_id: str
    necessidade_id: int
    reason: str
    timestamp: datetime
```

#### Ofertas
```python
@dataclass
class OfertaPublicada:
    event_id: str
    oferta_id: int
    category: str
    items: List[Dict]
    provider_id: int
    available_until: datetime
    metadata: Dict
    timestamp: datetime

@dataclass
class OfertaReservada:
    event_id: str
    oferta_id: int
    volunteer_id: int
    quantity: int
    timestamp: datetime

@dataclass
class OfertaExpirada:
    event_id: str
    oferta_id: int
    reason: str
    timestamp: datetime
```

#### Entregas
```python
@dataclass
class EntregaIniciada:
    event_id: str
    entrega_id: int
    volunteer_id: int
    origin_id: int
    destination_id: int
    items: List[Dict]
    timestamp: datetime

@dataclass
class EntregaEmRota:
    event_id: str
    entrega_id: int
    latitude: float
    longitude: float
    timestamp: datetime

@dataclass
class EntregaConcluida:
    event_id: str
    entrega_id: int
    receiver_id: int
    confirmation_code: str
    timestamp: datetime
```

### Integration Events (Eventos de Integração)

Para comunicação entre serviços/módulos:

```python
@dataclass
class NotificacaoEnviar:
    event_id: str
    user_id: int
    type: str  # "email", "sms", "push"
    template: str
    data: Dict
    timestamp: datetime

@dataclass
class EmailEnviado:
    event_id: str
    user_id: int
    email: str
    subject: str
    timestamp: datetime

@dataclass
class AnalyticsEventoRegistrado:
    event_id: str
    category: str
    action: str
    label: str
    value: float
    timestamp: datetime
```

## Padrões de Implementação

### Pattern 1: Event Sourcing Completo

**Todo estado é derivado de eventos**:

```python
class Necessidade:
    def __init__(self, necessidade_id: int):
        self.id = necessidade_id
        self.version = 0
        self.uncommitted_events = []
        
        # Estado atual
        self.status = None
        self.items = []
        self.created_at = None
    
    @classmethod
    def criar(cls, data: Dict) -> 'Necessidade':
        """Cria nova necessidade"""
        necessidade = cls(necessidade_id=None)
        event = NecessidadeCriada(**data)
        necessidade.apply(event)
        necessidade.uncommitted_events.append(event)
        return necessidade
    
    @classmethod
    def from_events(cls, necessidade_id: int, events: List[Event]) -> 'Necessidade':
        """Reconstrói estado a partir de eventos"""
        necessidade = cls(necessidade_id)
        for event in events:
            necessidade.apply(event)
        return necessidade
    
    def apply(self, event: Event) -> None:
        """Aplica evento ao estado"""
        if isinstance(event, NecessidadeCriada):
            self.id = event.necessidade_id
            self.status = "aberta"
            self.items = event.items
            self.created_at = event.timestamp
            
        elif isinstance(event, NecessidadeAtualizada):
            for key, value in event.changes.items():
                setattr(self, key, value)
                
        elif isinstance(event, NecessidadeCancelada):
            self.status = "cancelada"
        
        self.version += 1
    
    def atualizar(self, changes: Dict) -> None:
        """Atualiza necessidade"""
        event = NecessidadeAtualizada(
            event_id=uuid4().hex,
            necessidade_id=self.id,
            changes=changes,
            timestamp=datetime.utcnow()
        )
        self.apply(event)
        self.uncommitted_events.append(event)
    
    def cancelar(self, reason: str) -> None:
        """Cancela necessidade"""
        event = NecessidadeCancelada(
            event_id=uuid4().hex,
            necessidade_id=self.id,
            reason=reason,
            timestamp=datetime.utcnow()
        )
        self.apply(event)
        self.uncommitted_events.append(event)
```

### Pattern 2: CQRS (Command Query Responsibility Segregation)

**Separa leitura de escrita**:

```python
# WRITE SIDE - Commands
class NecessidadeCommandHandler:
    def __init__(self, event_store: EventStore, event_bus: EventBus):
        self.event_store = event_store
        self.event_bus = event_bus
    
    async def handle_criar_necessidade(self, command: CriarNecessidade):
        # Criar agregado
        necessidade = Necessidade.criar({
            'necessidade_id': command.id,
            'category': command.category,
            'items': command.items,
            'creator_id': command.creator_id,
            # ...
        })
        
        # Salvar eventos
        for event in necessidade.uncommitted_events:
            await self.event_store.append(event)
            await self.event_bus.publish(event)
        
        return necessidade.id

# READ SIDE - Queries (Projeções)
class NecessidadeQueryModel(Base):
    """Modelo otimizado para leitura"""
    __tablename__ = "necessidades_view"
    
    id = Column(Integer, primary_key=True)
    category = Column(String, index=True)
    status = Column(String, index=True)
    items_count = Column(Integer)
    creator_name = Column(String)
    location_name = Column(String)
    urgency = Column(String, index=True)
    created_at = Column(DateTime, index=True)
    
    # Desnormalizado para queries rápidas

class NecessidadeProjection:
    """Atualiza projeção de leitura a partir de eventos"""
    
    async def on_necessidade_criada(self, event: NecessidadeCriada):
        necessidade_view = NecessidadeQueryModel(
            id=event.necessidade_id,
            category=event.category,
            status="aberta",
            items_count=len(event.items),
            creator_name=await self.get_creator_name(event.creator_id),
            urgency=event.urgency,
            created_at=event.timestamp
        )
        db.add(necessidade_view)
        await db.commit()
    
    async def on_necessidade_cancelada(self, event: NecessidadeCancelada):
        necessidade_view = await db.get(NecessidadeQueryModel, event.necessidade_id)
        necessidade_view.status = "cancelada"
        await db.commit()
```

### Pattern 3: Saga Pattern

**Transações distribuídas**:

```python
class EntregaSaga:
    """
    Coordena entrega completa:
    1. Reserva oferta
    2. Cria assignment
    3. Notifica voluntário
    4. Rastreia entrega
    5. Confirma recebimento
    """
    
    def __init__(self, event_bus: EventBus):
        self.event_bus = event_bus
        self.state = {}
    
    async def start(self, oferta_id: int, volunteer_id: int):
        saga_id = uuid4().hex
        
        # Passo 1: Reservar oferta
        await self.event_bus.publish(ReservarOferta(
            saga_id=saga_id,
            oferta_id=oferta_id,
            volunteer_id=volunteer_id
        ))
    
    async def on_oferta_reservada(self, event: OfertaReservada):
        # Passo 2: Criar assignment
        await self.event_bus.publish(CriarAssignment(
            saga_id=event.saga_id,
            oferta_id=event.oferta_id,
            volunteer_id=event.volunteer_id
        ))
    
    async def on_assignment_criado(self, event: AssignmentCriado):
        # Passo 3: Notificar voluntário
        await self.event_bus.publish(NotificarVoluntario(
            saga_id=event.saga_id,
            volunteer_id=event.volunteer_id,
            type="nova_entrega",
            data={...}
        ))
    
    async def on_error(self, event: SagaError):
        # Compensação - desfaz ações
        if event.step == "reservar_oferta":
            await self.event_bus.publish(CancelarReserva(
                oferta_id=event.oferta_id
            ))
```

## Implementação Prática

### Setup Inicial

```python
# app/events/bus.py
from typing import Dict, List, Callable
import asyncio

class EventBus:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.handlers = {}
        return cls._instance
    
    def subscribe(self, event_type: str, handler: Callable):
        """Registra handler"""
        if event_type not in self.handlers:
            self.handlers[event_type] = []
        self.handlers[event_type].append(handler)
    
    async def publish(self, event: Event):
        """Publica evento"""
        # Salvar no event store
        await self.save_to_store(event)
        
        # Notificar handlers
        handlers = self.handlers.get(event.event_type, [])
        await asyncio.gather(*[handler(event) for handler in handlers])
    
    async def save_to_store(self, event: Event):
        """Persiste evento"""
        from app.database import SessionLocal
        db = SessionLocal()
        
        event_record = EventStoreModel(
            event_type=event.event_type,
            aggregate_id=event.aggregate_id,
            aggregate_type=event.aggregate_type,
            event_data=event.to_dict(),
            timestamp=event.timestamp
        )
        db.add(event_record)
        db.commit()

# Singleton global
event_bus = EventBus()
```

### Registrar Handlers

```python
# app/events/handlers/__init__.py
from app.events.bus import event_bus
from .notifications import send_email_on_necessidade_criada
from .analytics import track_event
from .projections import update_necessidades_view

def setup_event_handlers():
    """Registra todos os handlers"""
    
    # Notificações
    event_bus.subscribe("NecessidadeCriada", send_email_on_necessidade_criada)
    event_bus.subscribe("OfertaPublicada", send_notification)
    
    # Analytics
    event_bus.subscribe("*", track_event)  # Wildcard
    
    # Projeções
    event_bus.subscribe("NecessidadeCriada", update_necessidades_view)
    event_bus.subscribe("NecessidadeAtualizada", update_necessidades_view)

# app/main.py
from app.events.handlers import setup_event_handlers

@app.on_event("startup")
async def startup():
    setup_event_handlers()
```

### Usar em Endpoints

```python
# app/routers/necessidades.py
from app.events.bus import event_bus
from app.events.domain import NecessidadeCriada

@router.post("/necessidades")
async def criar_necessidade(data: NecessidadeCreate, current_user: User):
    # Criar evento
    event = NecessidadeCriada(
        event_id=uuid4().hex,
        necessidade_id=None,  # Será gerado
        category=data.category,
        items=data.items,
        creator_id=current_user.id,
        timestamp=datetime.utcnow()
    )
    
    # Publicar evento
    await event_bus.publish(event)
    
    return {"id": event.necessidade_id}
```

## Evolução da Arquitetura

### Fase 1: In-Memory Event Bus (Atual)
```
FastAPI → EventBus (in-memory) → Handlers
```
✅ Simples  
✅ Rápido para desenvolver  
❌ Eventos perdidos se app crashar  
❌ Não escala horizontalmente  

### Fase 2: Redis Streams
```
FastAPI → Redis Streams → Workers → Handlers
```
✅ Persistente  
✅ Múltiplos consumers  
✅ Retry automático  
✅ Escala horizontalmente  

### Fase 3: RabbitMQ/Kafka
```
FastAPI → RabbitMQ → Microserviços → Handlers
```
✅ Dead letter queues  
✅ Routing complexo  
✅ Garantias de entrega  
✅ Produção-ready  

## Monitoramento de Eventos

```python
class EventMetrics:
    """Métricas de eventos"""
    
    @staticmethod
    async def track_event_published(event_type: str):
        # Prometheus
        event_published_counter.labels(event_type=event_type).inc()
    
    @staticmethod
    async def track_event_processing_time(event_type: str, duration: float):
        event_processing_histogram.labels(event_type=event_type).observe(duration)
    
    @staticmethod
    async def track_event_error(event_type: str, error: str):
        event_error_counter.labels(
            event_type=event_type,
            error_type=error
        ).inc()
```

## Testes

```python
# tests/test_events.py
import pytest
from app.events.bus import EventBus
from app.events.domain import NecessidadeCriada

@pytest.mark.asyncio
async def test_event_published_calls_handlers():
    bus = EventBus()
    called = False
    
    async def handler(event):
        nonlocal called
        called = True
    
    bus.subscribe("NecessidadeCriada", handler)
    
    event = NecessidadeCriada(...)
    await bus.publish(event)
    
    assert called

@pytest.mark.asyncio
async def test_event_sourcing_rebuilds_state():
    events = [
        NecessidadeCriada(necessidade_id=1, items=[...]),
        NecessidadeAtualizada(necessidade_id=1, changes={...}),
    ]
    
    necessidade = Necessidade.from_events(1, events)
    
    assert necessidade.id == 1
    assert necessidade.version == 2
```

---

**Próximo**: [Domain Model](./03-DOMAIN-MODEL.md)
