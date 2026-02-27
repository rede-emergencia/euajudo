# 🏗️ Monolito Modular - Guia Prático

## Conceito: "Microserviços" Dentro do Monolito

**Problema**: Microserviços reais = custo alto ($500/mês), complexidade, múltiplos deploys

**Solução**: Estruturar código como se fossem microserviços, mas rodar tudo junto

```
┌────────────────────────────────────────────────┐
│        FastAPI Application (Deploy Único)      │
├────────────────────────────────────────────────┤
│                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Event   │  │Assignment│  │ Delivery │    │
│  │ Service  │  │ Service  │  │ Service  │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │              │           │
│       └─────────────┼──────────────┘           │
│                     │                          │
│              ┌──────▼──────┐                   │
│              │  PostgreSQL │                   │
│              └─────────────┘                   │
└────────────────────────────────────────────────┘
         Custo: ~$50/mês (1 servidor)
```

### Quando Separar de Verdade?

Só se **2+ condições** forem verdadeiras:
- Tráfego > 1000 req/min
- Time > 10 pessoas
- Partes precisam escalar independente
- Database é gargalo

**Estimativa**: 6-12 meses no futuro (talvez nunca!)

## ✅ O Que Fazer AGORA

### 1. Remodelar Banco de Dados (Semana 1-2)

**SIM, faça isso AGORA!** É a base de tudo.

#### Antes (Específico):
```sql
CREATE TABLE pedido_marmita (
    id SERIAL PRIMARY KEY,
    quantidade_marmitas INTEGER,
    vegetariana BOOLEAN,
    -- campos específicos de marmita
);
```

#### Depois (Genérico):
```sql
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,        -- 'necessidade', 'oferta', 'entrega'
    category VARCHAR(100) NOT NULL,   -- 'alimentos', 'roupas', etc
    subcategory VARCHAR(100),
    status VARCHAR(50) NOT NULL,
    creator_id INTEGER NOT NULL,
    city_id VARCHAR(50) NOT NULL,
    
    -- JSONB para flexibilidade
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE event_items (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id),
    name VARCHAR(255) NOT NULL,
    quantity FLOAT NOT NULL,
    unit VARCHAR(50) NOT NULL,
    quantity_reserved FLOAT DEFAULT 0,
    quantity_delivered FLOAT DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para performance
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_city ON events(city_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_metadata ON events USING GIN(metadata);
```

### 2. Estruturar Código em "Serviços Internos" (Semana 2-4)

Organize como se fossem serviços separados, mas dentro da mesma aplicação:

```
backend/app/
├── core/                      # Compartilhado entre "serviços"
│   ├── database.py
│   ├── auth.py
│   └── config.py
│
├── services/                  # "Microserviços" internos
│   │
│   ├── events/               # Serviço de Eventos
│   │   ├── __init__.py
│   │   ├── models.py         # Event, EventItem
│   │   ├── schemas.py        # EventCreate, EventResponse
│   │   ├── service.py        # EventService (business logic)
│   │   ├── repository.py     # EventRepository (DB)
│   │   └── router.py         # API endpoints
│   │
│   ├── assignments/          # Serviço de Atribuições
│   │   ├── __init__.py
│   │   ├── models.py         # Assignment
│   │   ├── schemas.py
│   │   ├── service.py
│   │   ├── repository.py
│   │   └── router.py
│   │
│   ├── deliveries/           # Serviço de Entregas
│   │   ├── __init__.py
│   │   ├── models.py         # Delivery
│   │   ├── schemas.py
│   │   ├── service.py
│   │   ├── repository.py
│   │   └── router.py
│   │
│   ├── users/                # Serviço de Usuários
│   │   └── ...
│   │
│   └── notifications/        # Serviço de Notificações
│       └── ...
│
├── plugins/                   # Plugins por categoria
│   ├── food/
│   ├── clothing/
│   └── medicine/
│
└── main.py                   # Inicializa tudo junto
```

### 3. Implementar Padrão de Serviço

Cada "serviço" segue o mesmo padrão:

```python
# services/events/service.py
class EventService:
    """
    Serviço de Eventos - Business Logic
    
    Se virar microserviço: copiar essa pasta para repo separado
    """
    
    def __init__(self, repository: EventRepository):
        self.repository = repository
    
    async def create_event(
        self,
        type: str,
        category: str,
        creator_id: int,
        metadata: dict,
        items: list
    ) -> Event:
        """Cria novo evento"""
        
        # Validação
        plugin = plugin_registry.get(category)
        plugin.validate_metadata(metadata)
        
        # Criar entidade
        event = Event(
            type=type,
            category=category,
            creator_id=creator_id,
            metadata=metadata
        )
        
        # Salvar
        event = await self.repository.save(event)
        
        # Publicar evento (mesmo se for interno)
        await event_bus.publish(EventCreated(event_id=event.id))
        
        return event

# services/events/router.py
from fastapi import APIRouter, Depends
from .service import EventService
from .schemas import EventCreate, EventResponse

router = APIRouter(prefix="/events", tags=["events"])

@router.post("", response_model=EventResponse)
async def create_event(
    data: EventCreate,
    service: EventService = Depends(get_event_service)
):
    """Endpoint para criar evento"""
    return await service.create_event(
        type=data.type,
        category=data.category,
        creator_id=current_user.id,
        metadata=data.metadata,
        items=data.items
    )

# main.py
from services.events.router import router as events_router
from services.assignments.router import router as assignments_router
from services.deliveries.router import router as deliveries_router

app = FastAPI()

# Registrar todos os "serviços"
app.include_router(events_router, prefix="/api/v2")
app.include_router(assignments_router, prefix="/api/v2")
app.include_router(deliveries_router, prefix="/api/v2")
```

## 🎯 Regras de Ouro

### ✅ PERMITIDO (baixo acoplamento):

```python
# Serviço A pode chamar Serviço B via interface
from services.events.service import EventService

class AssignmentService:
    def __init__(self, event_service: EventService):
        self.event_service = event_service
    
    async def create_assignment(self, event_id: int):
        # Chamar outro serviço via método
        event = await self.event_service.get_event(event_id)
```

### ✅ MELHOR AINDA (event-driven):

```python
# Comunicação via eventos (preparado para distribuir)
@event_bus.subscribe("EventPublished")
async def on_event_published(event_data):
    """Handler em outro serviço"""
    # Assignment service reage a evento
    await notify_volunteers(event_data)
```

### ❌ PROIBIDO (alto acoplamento):

```python
# NÃO acessar diretamente modelo de outro serviço
from services.events.models import Event  # ❌
db.query(Event).filter(...)  # ❌

# NÃO importar repositório de outro serviço
from services.events.repository import EventRepository  # ❌
```

## 💰 Comparação de Custos

### Opção 1: Monolito Modular (AGORA)
```
Servidor: $50/mês (Render, 1 instância)
Database: Incluído
Total: ~$50/mês
```

**Capacidade**: 100-500 req/min tranquilo

### Opção 2: Microserviços Reais (FUTURO)
```
API Gateway: $50/mês
Event Service: $50/mês
Assignment Service: $50/mês
Delivery Service: $50/mês
User Service: $50/mês
Database: $100/mês (precisa ser robusto)
Load Balancer: $50/mês
Monitoring: $100/mês
Total: ~$500/mês
```

**Capacidade**: 10,000+ req/min

### Opção 3: Monolito Tradicional (NÃO FAZER)
```
Custo: $50/mês
Capacidade: Similar
Problema: Código acoplado, difícil migrar depois
```

## 📈 Plano de Evolução

### Fase 1: Monolito Modular (HOJE - 8 semanas)
- Remodelar banco → genérico
- Estruturar código em serviços internos
- Event bus in-memory
- **Custo: $50/mês**
- **Deploy: 1 aplicação**

### Fase 2: Otimização (Mês 3-6)
- Redis para event bus
- Cache agressivo
- Índices otimizados
- **Custo: $70/mês** (+ Redis)
- **Deploy: 1 aplicação**

### Fase 3: Microserviços (SE necessário, mês 6+)
- Extrair serviço de notificações (primeiro)
- API Gateway
- Service mesh
- **Custo: $200-500/mês**
- **Deploy: 3-5 aplicações**

## 🛠️ Como Migrar o Banco Atual

### Script de Migração (Alembic)

```python
# alembic/versions/001_create_generic_tables.py
def upgrade():
    # 1. Criar novas tabelas genéricas
    op.create_table(
        'events',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('category', sa.String(100), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('creator_id', sa.Integer, nullable=False),
        sa.Column('city_id', sa.String(50), nullable=False),
        sa.Column('metadata', JSONB, default='{}'),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
    )
    
    # 2. Migrar dados antigos
    op.execute("""
        INSERT INTO events (type, category, creator_id, city_id, metadata)
        SELECT 
            'necessidade',
            'alimentos',
            user_id,
            city_id,
            jsonb_build_object(
                'quantidade', quantidade_marmitas,
                'vegetariana', vegetariana,
                'horario_entrega', horario_entrega
            )
        FROM pedido_marmita
    """)
    
    # 3. Manter tabela antiga por segurança (deletar depois)
    # Não dropar ainda!

def downgrade():
    # Rollback se der problema
    op.drop_table('events')
```

### Dual Write (Transição Segura)

```python
# Durante migração, escrever nos 2 lugares
class EventService:
    async def create_event(self, data):
        # Novo modelo
        event = Event(**data)
        await db.save(event)
        
        # Modelo antigo (temporário)
        if data['category'] == 'alimentos':
            pedido = PedidoMarmita(
                quantidade_marmitas=data['metadata']['quantidade']
            )
            await db.save(pedido)
        
        return event
```

Depois de validar (2-4 semanas), parar de escrever no antigo.

## ✅ Checklist de Preparação

### Banco de Dados
- [ ] Criar tabelas genéricas (`events`, `event_items`)
- [ ] Migrar dados existentes
- [ ] Dual write por 2 semanas
- [ ] Validar migração
- [ ] Dropar tabelas antigas

### Estrutura de Código
- [ ] Criar pasta `services/`
- [ ] Separar em módulos independentes
- [ ] Cada serviço tem seu router
- [ ] Interface clara entre serviços
- [ ] Event bus interno funcionando

### Testes
- [ ] Testes unitários por serviço
- [ ] Testes de integração
- [ ] Performance OK (< 200ms p95)

### Deploy
- [ ] Continua sendo 1 aplicação
- [ ] Docker compose atualizado
- [ ] CI/CD funcionando
- [ ] Rollback testado

## 📊 Quando Separar de Verdade?

Use esta matriz de decisão:

| Fator | Threshold | Seu Atual | Precisa? |
|-------|-----------|-----------|----------|
| Requests/min | > 1000 | ~10 | ❌ |
| Time | > 10 devs | 2-3 | ❌ |
| Database CPU | > 80% | ~20% | ❌ |
| Deploy issues | Semanal | Raro | ❌ |

**Conclusão**: Fique no monolito modular por pelo menos 6-12 meses!

## 💡 Resumo

1. **✅ SIM**: Remodelar banco AGORA (genérico)
2. **✅ SIM**: Estruturar em serviços internos AGORA
3. **❌ NÃO**: Separar em microserviços reais AGORA
4. **💰 Custo**: Mantém ~$50/mês
5. **🚀 Futuro**: Preparado para separar SE necessário

**Você ganha**: Arquitetura limpa + Custo baixo + Flexibilidade futura

---

**Bottom line**: Você está 100% certo! Prepare o código agora, mas mantenha tudo junto (barato) até realmente precisar separar.
