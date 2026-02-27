# 🔧 Refatoração Prática - Seu Código Atual

## Situação Atual vs Desejada

### ❌ ANTES (Acoplado a Marmitas)
```python
# models.py
class PedidoMarmita(Base):
    quantidade_marmitas = Column(Integer)
    vegetariana = Column(Boolean)
    horario_entrega = Column(String)
    
class LoteMarmita(Base):
    produtor_id = Column(Integer)
    quantidade_produzida = Column(Integer)
```

**Problema**: Não serve para roupas, medicamentos, etc.

### ✅ DEPOIS (Genérico + Serviços Internos)
```python
# services/events/models.py
class Event(Base):
    type = Column(String)          # 'necessidade', 'oferta'
    category = Column(String)      # 'alimentos', 'roupas'
    metadata = Column(JSONB)       # {'quantidade': 100, 'vegetariana': True}
    
# services/assignments/models.py  
class Assignment(Base):
    event_id = Column(Integer)
    volunteer_id = Column(Integer)
```

**Vantagem**: Serve para qualquer coisa + Preparado para separar

## 🎯 Plano de Refatoração (4 Semanas)

### Semana 1: Criar Models Genéricos

```python
# services/events/models.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class EventType(str, enum.Enum):
    NECESSIDADE = "necessidade"
    OFERTA = "oferta"
    ENTREGA = "entrega"

class EventStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Event(Base):
    """
    Modelo genérico de Evento
    Substitui: PedidoMarmita, LoteMarmita, ReservaMarmita
    """
    __tablename__ = "events"
    
    # Core fields (sempre presentes)
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    subcategory = Column(String(100))
    status = Column(String(50), nullable=False, default="draft")
    
    # Relacionamentos
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    city_id = Column(String(50), nullable=False, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"))
    
    # Timeframe
    timeframe_start = Column(DateTime)
    timeframe_end = Column(DateTime)
    
    # Metadata flexível (campos específicos por categoria)
    metadata = Column(JSONB, nullable=False, default={})
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at = Column(DateTime)
    completed_at = Column(DateTime)
    cancelled_at = Column(DateTime)
    
    # Relationships
    creator = relationship("User", back_populates="events")
    location = relationship("Location")
    items = relationship("EventItem", back_populates="event", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="event")

class EventItem(Base):
    """
    Item de um evento
    Substitui: ItemInsumo
    """
    __tablename__ = "event_items"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    
    # Descrição do item
    name = Column(String(255), nullable=False)
    description = Column(Text)
    quantity = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)
    
    # Controle de reserva/entrega
    quantity_reserved = Column(Float, default=0)
    quantity_delivered = Column(Float, default=0)
    
    # Metadata específico do item
    category = Column(String(100))
    metadata = Column(JSONB, default={})
    
    # Relationships
    event = relationship("Event", back_populates="items")

# services/events/models.py continua...
class Location(Base):
    """
    Modelo genérico de Local
    Substitui: LocalEntrega
    """
    __tablename__ = "locations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(50))  # 'abrigo', 'fornecedor', 'ponto_entrega'
    
    city_id = Column(String(50), nullable=False, index=True)
    
    # Endereço
    address = Column(String(500))
    latitude = Column(Float)
    longitude = Column(Float)
    
    # Contato
    contact_name = Column(String(255))
    contact_phone = Column(String(50))
    
    # Metadata flexível
    metadata = Column(JSONB, default={})
    
    # Status
    active = Column(Boolean, default=True)
    approved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
```

### Semana 2: Migração de Dados

```python
# alembic/versions/002_migrate_to_generic.py
"""Migrar dados de marmitas para eventos genéricos"""

def upgrade():
    # 1. Criar Location a partir de LocalEntrega
    op.execute("""
        INSERT INTO locations (name, type, city_id, address, latitude, longitude, contact_name, contact_phone, metadata, active, approved, created_at)
        SELECT 
            nome,
            'abrigo',
            city_id,
            endereco,
            latitude,
            longitude,
            responsavel,
            telefone,
            jsonb_build_object(
                'capacidade', capacidade,
                'necessidade_diaria', necessidade_diaria,
                'horario_funcionamento', horario_funcionamento
            ),
            ativo,
            aprovado,
            created_at
        FROM locais_entrega
    """)
    
    # 2. Migrar PedidoMarmita → Event (necessidade)
    op.execute("""
        INSERT INTO events (type, category, creator_id, city_id, location_id, status, metadata, created_at)
        SELECT 
            'necessidade',
            'alimentos',
            abrigo_id,
            city_id,
            (SELECT id FROM locations WHERE name = (SELECT nome FROM locais_entrega WHERE id = pm.abrigo_id)),
            CASE 
                WHEN status = 'pendente' THEN 'active'
                WHEN status = 'reservado' THEN 'in_progress'
                WHEN status = 'entregue' THEN 'completed'
                WHEN status = 'cancelado' THEN 'cancelled'
                ELSE 'draft'
            END,
            jsonb_build_object(
                'quantidade', quantidade_marmitas,
                'vegetariana', vegetariana,
                'observacoes', observacoes,
                'data_necessidade', data_necessidade,
                'horario', horario,
                'urgencia', urgencia
            ),
            created_at
        FROM pedidos_marmita pm
    """)
    
    # 3. Migrar LoteMarmita → Event (oferta)
    op.execute("""
        INSERT INTO events (type, category, creator_id, city_id, status, metadata, created_at)
        SELECT 
            'oferta',
            'alimentos',
            produtor_id,
            city_id,
            CASE 
                WHEN status = 'aguardando_insumos' THEN 'draft'
                WHEN status = 'producao' THEN 'active'
                WHEN status = 'disponivel' THEN 'active'
                WHEN status = 'reservado' THEN 'in_progress'
                WHEN status = 'entregue' THEN 'completed'
                ELSE 'draft'
            END,
            jsonb_build_object(
                'quantidade_produzida', quantidade_produzida,
                'quantidade_disponivel', quantidade_disponivel,
                'data_producao', data_producao,
                'data_validade', data_validade,
                'tipo_marmita', tipo_marmita,
                'vegetariana', vegetariana
            ),
            created_at
        FROM lotes_marmita
    """)
    
    # 4. Criar EventItems para cada Event
    op.execute("""
        INSERT INTO event_items (event_id, name, quantity, unit, metadata)
        SELECT 
            e.id,
            CASE 
                WHEN e.metadata->>'vegetariana' = 'true' THEN 'Marmita Vegetariana'
                ELSE 'Marmita'
            END,
            (e.metadata->>'quantidade')::float,
            'unidades',
            jsonb_build_object(
                'tipo', COALESCE(e.metadata->>'tipo_marmita', 'padrão')
            )
        FROM events e
        WHERE e.category = 'alimentos'
    """)

def downgrade():
    # Rollback: restaurar tabelas antigas
    op.execute("DELETE FROM event_items")
    op.execute("DELETE FROM events WHERE category = 'alimentos'")
```

### Semana 3: Criar Serviços Internos

```python
# services/events/service.py
from typing import List, Optional
from sqlalchemy.orm import Session
from .models import Event, EventItem
from .schemas import EventCreate, EventUpdate
from app.plugins.registry import plugin_registry
from app.events.bus import event_bus

class EventService:
    """
    Serviço de Eventos - Business Logic
    
    IMPORTANTE: Este serviço está DENTRO do monolito mas estruturado
    como se fosse um microserviço separado. No futuro, se necessário,
    basta copiar esta pasta para um repositório separado.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    async def create_event(
        self,
        data: EventCreate,
        creator_id: int,
        city_id: str
    ) -> Event:
        """Cria novo evento"""
        
        # 1. Validar metadata com plugin
        plugin = plugin_registry.get(data.category)
        plugin.validate_metadata(data.metadata)
        
        # 2. Criar evento
        event = Event(
            type=data.type,
            category=data.category,
            subcategory=data.subcategory,
            creator_id=creator_id,
            city_id=city_id,
            location_id=data.location_id,
            timeframe_start=data.timeframe_start,
            timeframe_end=data.timeframe_end,
            metadata=data.metadata,
            status="draft"
        )
        
        # 3. Adicionar items
        for item_data in data.items:
            item = EventItem(**item_data.dict())
            event.items.append(item)
        
        # 4. Enriquecer com plugin
        event = plugin.enrich_event(event)
        
        # 5. Salvar
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        
        # 6. Publicar evento (preparado para ser distribuído)
        await event_bus.publish({
            "type": "EventCreated",
            "event_id": event.id,
            "category": event.category,
            "creator_id": creator_id
        })
        
        return event
    
    async def publish_event(self, event_id: int, user_id: int) -> Event:
        """Publica evento (torna visível)"""
        
        event = self.db.query(Event).filter(Event.id == event_id).first()
        if not event:
            raise ValueError("Evento não encontrado")
        
        if event.creator_id != user_id:
            raise PermissionError("Apenas o criador pode publicar")
        
        if event.status != "draft":
            raise ValueError("Evento já publicado")
        
        # Validar antes de publicar
        plugin = plugin_registry.get(event.category)
        plugin.validate_metadata(event.metadata)
        
        event.status = "active"
        event.published_at = datetime.utcnow()
        self.db.commit()
        
        # Evento
        await event_bus.publish({
            "type": "EventPublished",
            "event_id": event.id,
            "category": event.category
        })
        
        return event
    
    def list_events(
        self,
        type: Optional[str] = None,
        category: Optional[str] = None,
        city_id: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        per_page: int = 20
    ) -> dict:
        """Lista eventos com filtros"""
        
        query = self.db.query(Event)
        
        if type:
            query = query.filter(Event.type == type)
        if category:
            query = query.filter(Event.category == category)
        if city_id:
            query = query.filter(Event.city_id == city_id)
        if status:
            query = query.filter(Event.status == status)
        
        total = query.count()
        
        events = query.offset((page - 1) * per_page).limit(per_page).all()
        
        return {
            "items": events,
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page
        }

# services/events/router.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.auth import get_current_user
from .service import EventService
from .schemas import EventCreate, EventResponse

router = APIRouter(prefix="/events", tags=["events"])

@router.post("", response_model=EventResponse, status_code=201)
async def create_event(
    data: EventCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Cria novo evento"""
    service = EventService(db)
    event = await service.create_event(
        data=data,
        creator_id=current_user.id,
        city_id=current_user.city_id
    )
    return event

@router.get("", response_model=dict)
def list_events(
    type: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Lista eventos"""
    service = EventService(db)
    return service.list_events(
        type=type,
        category=category,
        city_id=current_user.city_id,
        status=status,
        page=page,
        per_page=per_page
    )

@router.post("/{event_id}/publish", response_model=EventResponse)
async def publish_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Publica evento"""
    service = EventService(db)
    return await service.publish_event(event_id, current_user.id)
```

### Semana 4: Integrar no Main

```python
# main.py
from fastapi import FastAPI
from app.database import engine, Base

# Importar routers dos "serviços"
from services.events.router import router as events_router
from services.assignments.router import router as assignments_router
from services.deliveries.router import router as deliveries_router
from services.users.router import router as users_router

# Criar tabelas
Base.metadata.create_all(bind=engine)

# App única (monolito)
app = FastAPI(
    title="JFood API",
    description="Plataforma genérica de conexão necessidades-ofertas",
    version="2.0.0"
)

# Registrar todos os "serviços" (mas tudo na mesma app)
app.include_router(events_router, prefix="/api/v2")
app.include_router(assignments_router, prefix="/api/v2")
app.include_router(deliveries_router, prefix="/api/v2")
app.include_router(users_router, prefix="/api/v2")

# Ainda é 1 aplicação, 1 deploy, 1 servidor!
```

## 📊 Comparação: Antes vs Depois

### Estrutura de Pastas

**ANTES** (tudo misturado):
```
backend/app/
├── models.py           # 500 linhas, tudo junto
├── schemas.py          # 300 linhas
├── routers/
│   ├── marmitas.py
│   ├── insumos.py
│   └── entregas.py
└── main.py
```

**DEPOIS** (separado por serviço):
```
backend/
├── app/
│   ├── core/           # Compartilhado
│   │   ├── database.py
│   │   └── auth.py
│   │
│   ├── services/       # "Microserviços" internos
│   │   ├── events/
│   │   │   ├── models.py
│   │   │   ├── schemas.py
│   │   │   ├── service.py
│   │   │   ├── repository.py
│   │   │   └── router.py
│   │   │
│   │   ├── assignments/
│   │   └── deliveries/
│   │
│   └── plugins/        # Plugins por categoria
│       └── food/
│
└── main.py             # Registra tudo
```

### Custo e Deploy

| Aspecto | Antes | Depois | Futuro Microserviços |
|---------|-------|--------|---------------------|
| **Estrutura** | Monolito acoplado | Monolito modular | Serviços separados |
| **Deploy** | 1 aplicação | 1 aplicação | 5+ aplicações |
| **Servidores** | 1 | 1 | 5+ |
| **Custo/mês** | $50 | $50 | $500 |
| **Complexidade** | Baixa | Média | Alta |
| **Preparação** | ❌ Não | ✅ Sim | ✅ Sim |

## ✅ Vantagens da Abordagem

1. **Custo mantém baixo**: ~$50/mês
2. **Código organizado**: Fácil navegar
3. **Testável**: Cada serviço testado isoladamente
4. **Preparado**: Se precisar separar, só copiar pasta
5. **Time pequeno**: 2-3 devs conseguem manter
6. **Performance**: Sem latência de rede

## 🚀 Se Precisar Separar (Futuro)

```bash
# Quando tráfego > 1000 req/min, basta:

# 1. Copiar serviço para novo repo
cp -r services/events/ ../jfood-events-service/

# 2. Criar Dockerfile
# 3. Deploy separado
# 4. Atualizar chamadas para HTTP

# Pronto! Código já estava preparado.
```

## 📝 Resumo Executivo

✅ **Remodelar banco**: SIM, agora (genérico)  
✅ **Estruturar em serviços**: SIM, agora (preparação)  
❌ **Deploy separado**: NÃO, só no futuro se necessário  
💰 **Custo**: Mantém $50/mês  
🎯 **Resultado**: Arquitetura limpa + Baixo custo + Flexível

---

**Você está 100% no caminho certo!** Prepare o código, mas mantenha o deploy simples e barato.
