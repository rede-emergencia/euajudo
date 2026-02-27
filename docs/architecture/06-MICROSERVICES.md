# 🔧 Microserviços: Quando e Como

## Quando Migrar para Microserviços?

### ❌ **NÃO migre agora se:**
- Sistema tem < 5 desenvolvedores
- Tráfego < 1000 req/min
- Uma única cidade/região
- Funcionalidades ainda mudando rapidamente
- Time não tem experiência com microserviços

### ✅ **Migre quando:**
- Time > 10 desenvolvedores
- Necessidade de deploy independente
- Partes do sistema precisam escalar diferentemente
- Latência de rede não é crítica
- Time maduro em DevOps/SRE

## Monolito Modular (Atual Recomendado)

```
┌─────────────────────────────────────────────┐
│           FastAPI Application               │
├─────────────────────────────────────────────┤
│  Core    │ Food   │ Clothing │ Medicine    │
│  Module  │ Plugin │  Plugin  │  Plugin     │
├─────────────────────────────────────────────┤
│            Shared Database                  │
│              PostgreSQL                     │
└─────────────────────────────────────────────┘
```

**Vantagens**:
- ✅ Simples de desenvolver
- ✅ Fácil de testar
- ✅ Deploy único
- ✅ Sem latência de rede
- ✅ Transações ACID

## Microserviços (Futuro)

```
                    ┌──────────────┐
                    │ API Gateway  │
                    │   (Kong)     │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐      ┌─────▼─────┐     ┌─────▼─────┐
   │  Auth   │      │  Events   │     │ Matching  │
   │ Service │      │  Service  │     │  Service  │
   └────┬────┘      └─────┬─────┘     └─────┬─────┘
        │                 │                  │
   ┌────▼────┐      ┌─────▼─────┐     ┌─────▼─────┐
   │Auth DB  │      │Events DB  │     │Match DB   │
   └─────────┘      └───────────┘     └───────────┘
                           │
                    ┌──────▼───────┐
                    │  Event Bus   │
                    │ RabbitMQ/SQS │
                    └──────────────┘
```

## Service Boundaries

### 1. Auth Service
**Responsabilidade**: Autenticação e autorização

```python
# Endpoints
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
GET    /auth/me
PUT    /auth/profile
POST   /auth/forgot-password

# Database
- users
- roles
- permissions
- sessions

# Events Published
- UserRegistered
- UserLoggedIn
- UserUpdated
```

### 2. Event Service
**Responsabilidade**: Gerenciar eventos (necessidades, ofertas)

```python
# Endpoints
POST   /events
GET    /events
GET    /events/{id}
PUT    /events/{id}
DELETE /events/{id}
POST   /events/{id}/publish
POST   /events/{id}/cancel

# Database
- events
- event_items
- event_history

# Events Published
- EventCreated
- EventPublished
- EventUpdated
- EventCancelled
- EventCompleted
```

### 3. Assignment Service
**Responsabilidade**: Atribuições de voluntários

```python
# Endpoints
POST   /assignments
GET    /assignments
GET    /assignments/{id}
PUT    /assignments/{id}/accept
PUT    /assignments/{id}/start
PUT    /assignments/{id}/complete

# Database
- assignments
- assignment_items
- assignment_history

# Events Published
- AssignmentCreated
- AssignmentAccepted
- AssignmentStarted
- AssignmentCompleted
```

### 4. Delivery Service
**Responsabilidade**: Rastreamento de entregas

```python
# Endpoints
POST   /deliveries
GET    /deliveries/{id}
POST   /deliveries/{id}/location
POST   /deliveries/{id}/complete

# Database
- deliveries
- delivery_waypoints
- delivery_photos

# Events Published
- DeliveryStarted
- LocationUpdated
- DeliveryCompleted
```

### 5. Notification Service
**Responsabilidade**: Envio de notificações

```python
# Endpoints
POST   /notifications/email
POST   /notifications/sms
POST   /notifications/push

# Database
- notification_templates
- notification_log
- user_preferences

# Events Consumed
- * (qualquer evento pode gerar notificação)
```

### 6. Matching Service
**Responsabilidade**: Match entre necessidades e ofertas

```python
# Endpoints
POST   /matches/find
GET    /matches/{event_id}
POST   /matches/{id}/accept

# Database
- matches
- match_scores
- match_history

# Events Published
- MatchFound
- MatchAccepted
- MatchRejected
```

## Comunicação entre Serviços

### Síncrona (REST)
```python
# Assignment Service chama Event Service
async def create_assignment(event_id: int, volunteer_id: int):
    # 1. Verificar se evento existe (REST call)
    event = await event_service_client.get_event(event_id)
    
    if not event:
        raise NotFoundError("Evento não encontrado")
    
    # 2. Criar assignment
    assignment = Assignment(
        event_id=event_id,
        volunteer_id=volunteer_id
    )
    
    db.add(assignment)
    db.commit()
    
    return assignment
```

### Assíncrona (Events)
```python
# Event Service publica evento
await event_bus.publish(EventCreated(event_id=123))

# Notification Service consome
@event_bus.subscribe("EventCreated")
async def send_notification(event: EventCreated):
    users = await get_interested_users(event)
    
    for user in users:
        await send_email(
            to=user.email,
            template="new_event",
            data=event
        )
```

## Data Consistency

### Pattern: Saga
```python
class CreateDeliverySaga:
    """
    Coordena criação de entrega através de múltiplos serviços
    """
    
    async def execute(self, data: CreateDeliveryData):
        saga_id = uuid4()
        
        try:
            # Step 1: Criar assignment
            assignment = await assignment_service.create(
                event_id=data.event_id,
                volunteer_id=data.volunteer_id
            )
            
            # Step 2: Criar delivery
            delivery = await delivery_service.create(
                assignment_id=assignment.id,
                route=data.route
            )
            
            # Step 3: Notificar voluntário
            await notification_service.send(
                user_id=data.volunteer_id,
                type="new_delivery",
                data=delivery
            )
            
            return delivery
            
        except Exception as e:
            # Compensação - desfazer
            await self.compensate(saga_id)
            raise
    
    async def compensate(self, saga_id: str):
        """Desfaz operações"""
        # Cancelar assignment
        # Cancelar delivery
        # Enviar notificação de cancelamento
        pass
```

### Pattern: Eventual Consistency
```python
# Event Service atualiza seu DB
event.status = "completed"
db.commit()

# Publica evento
await event_bus.publish(EventCompleted(event_id=event.id))

# Assignment Service eventualmente sincroniza
@event_bus.subscribe("EventCompleted")
async def on_event_completed(event: EventCompleted):
    assignments = db.query(Assignment).filter(
        Assignment.event_id == event.event_id,
        Assignment.status == "active"
    ).all()
    
    for assignment in assignments:
        assignment.status = "completed"
    
    db.commit()
```

## Service Discovery

```yaml
# docker-compose.yml
version: '3.8'

services:
  consul:
    image: consul:latest
    ports:
      - "8500:8500"
  
  auth-service:
    build: ./services/auth
    environment:
      - CONSUL_HOST=consul
    depends_on:
      - consul
  
  event-service:
    build: ./services/events
    environment:
      - CONSUL_HOST=consul
    depends_on:
      - consul
```

```python
# Service registration
from consul import Consul

class ServiceRegistry:
    def __init__(self, consul_host: str):
        self.consul = Consul(host=consul_host)
    
    def register(self, name: str, host: str, port: int):
        self.consul.agent.service.register(
            name=name,
            service_id=f"{name}-{uuid4().hex[:8]}",
            address=host,
            port=port,
            check={
                "http": f"http://{host}:{port}/health",
                "interval": "10s"
            }
        )
    
    def discover(self, service_name: str) -> List[str]:
        _, services = self.consul.health.service(service_name, passing=True)
        return [
            f"http://{s['Service']['Address']}:{s['Service']['Port']}"
            for s in services
        ]
```

## API Gateway

```python
# Kong configuration
services:
  - name: event-service
    url: http://event-service:8001
    routes:
      - name: events
        paths:
          - /api/events
        methods:
          - GET
          - POST
        plugins:
          - name: rate-limiting
            config:
              minute: 100
          - name: jwt
            config:
              secret_is_base64: false

  - name: auth-service
    url: http://auth-service:8002
    routes:
      - name: auth
        paths:
          - /api/auth
        plugins:
          - name: rate-limiting
            config:
              minute: 20
```

## Monitoring & Tracing

### Distributed Tracing (Jaeger)
```python
from opentelemetry import trace
from opentelemetry.exporter.jaeger import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

# Setup
tracer_provider = TracerProvider()
jaeger_exporter = JaegerExporter(
    agent_host_name="jaeger",
    agent_port=6831,
)
tracer_provider.add_span_processor(
    BatchSpanProcessor(jaeger_exporter)
)
trace.set_tracer_provider(tracer_provider)
tracer = trace.get_tracer(__name__)

# Use in service
@router.post("/events")
async def create_event(data: EventCreate):
    with tracer.start_as_current_span("create_event") as span:
        span.set_attribute("event.category", data.category)
        
        # Validação
        with tracer.start_as_current_span("validate"):
            validate(data)
        
        # Salvar
        with tracer.start_as_current_span("save_to_db"):
            event = save(data)
        
        # Publicar
        with tracer.start_as_current_span("publish_event"):
            await event_bus.publish(event)
        
        return event
```

### Service Mesh (Istio) - Futuro
```yaml
# Virtual Service
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: event-service
spec:
  hosts:
    - event-service
  http:
    - match:
        - headers:
            version:
              exact: v2
      route:
        - destination:
            host: event-service
            subset: v2
    - route:
        - destination:
            host: event-service
            subset: v1
          weight: 90
        - destination:
            host: event-service
            subset: v2
          weight: 10
```

## Deployment Strategy

### Blue-Green Deployment
```yaml
# Blue (current)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: event-service-blue
spec:
  replicas: 3
  template:
    metadata:
      labels:
        app: event-service
        version: blue

---
# Green (new)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: event-service-green
spec:
  replicas: 3
  template:
    metadata:
      labels:
        app: event-service
        version: green

---
# Service (switch traffic)
apiVersion: v1
kind: Service
metadata:
  name: event-service
spec:
  selector:
    app: event-service
    version: green  # Switch here
```

## Database per Service

```
Auth Service     Event Service    Assignment Service
     │                │                    │
     ▼                ▼                    ▼
  ┌──────┐        ┌──────┐            ┌──────┐
  │Auth  │        │Events│            │Assign│
  │  DB  │        │  DB  │            │  DB  │
  └──────┘        └──────┘            └──────┘
```

**Vantagens**:
- ✅ Serviços independentes
- ✅ Escolher melhor DB por serviço
- ✅ Escalar DB independentemente

**Desafios**:
- ❌ Joins cross-database
- ❌ Transações distribuídas
- ❌ Data duplication

**Solução**: Event sourcing + CQRS

## Custo de Microserviços

### Complexidade
- Mais serviços para gerenciar
- Debugging distribuído difícil
- Testes de integração complexos
- DevOps overhead aumenta

### Infraestrutura
```yaml
# Monolito
- 1 API server
- 1 Database
- Total: ~$50/mês

# Microserviços (6 services)
- 6 API servers
- 6 Databases
- 1 API Gateway
- 1 Service Mesh
- 1 Message Queue
- 1 Service Discovery
- Total: ~$500/mês
```

### Time
- Precisa especialistas em:
  - Kubernetes
  - Service mesh
  - Distributed tracing
  - Event-driven architecture

## Quando Cada Pattern?

| Padrão | Usar Quando | Evitar Quando |
|--------|-------------|---------------|
| **Monolito Modular** | MVP, time pequeno, funcionalidades mudando | Necessita escala independente |
| **Microserviços** | Time grande, partes precisam escalar diferente | Time pequeno, sem experiência |
| **Serverless** | Tráfego esporádico, funções isoladas | Tráfego constante, latência crítica |
| **Service Mesh** | Muitos microserviços, necessita observabilidade | Poucos serviços, simplicidade prioritária |

## Recomendação para JFood

### Fase 1 (Atual): Monolito Modular
- 1 aplicação FastAPI
- Plugins por categoria
- 1 PostgreSQL
- Deploy simples

### Fase 2 (6-12 meses): Serviços Críticos
Extrair apenas serviços que precisam escalar:
- Notification Service (alto volume)
- Matching Service (CPU intensivo)

Manter monolito para:
- Auth
- Events
- Assignments

### Fase 3 (12-24 meses): Microserviços Completos
Se demanda justificar:
- Todos os serviços separados
- Service mesh
- Event sourcing completo

---

**Próximo**: [Data Model](./07-DATA-MODEL.md)
