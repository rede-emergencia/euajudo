# 🗺️ Roadmap - Migração para Event-Driven Microservices

Este documento descreve o plano de evolução do VouAjudar de um monólito modular para uma arquitetura de microserviços orientada a eventos.

**Visão**: Sistema escalável que pode ser consumido por múltiplos aplicativos através de eventos publicados.

---

## 📍 Estado Atual (Fase 0)

### Arquitetura Atual
```
┌─────────────────────────────────────────┐
│          Frontend (React)               │
│  - MapView, Dashboards, Components      │
└──────────────┬──────────────────────────┘
               │ HTTP/REST
┌──────────────▼──────────────────────────┐
│       Backend Monolito (FastAPI)        │
│  ┌─────────────────────────────────┐    │
│  │ Routers (API Endpoints)         │    │
│  ├─────────────────────────────────┤    │
│  │ Models (SQLAlchemy)             │    │
│  ├─────────────────────────────────┤    │
│  │ Database (SQLite)               │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### Características
✅ Funcional e operacional  
✅ Código genérico (ProductType, OrderStatus)  
✅ Estrutura modular (routers separados)  
⚠️ Acoplamento direto (queries inline)  
⚠️ Sem event sourcing  
⚠️ Difícil escalar horizontalmente  

---

## 🎯 Visão Final (Fase 5)

### Arquitetura Alvo
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   App Web    │  │  App Mobile  │  │ App Parceiro │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                  │
       └─────────────────┴──────────────────┘
                         │
              ┌──────────▼──────────┐
              │   API Gateway       │
              │  (Kong/Traefik)     │
              └──────────┬──────────┘
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
│  Batches    │  │ Deliveries  │  │  Resources  │
│  Service    │  │  Service    │  │   Service   │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                 │
       └────────────────┼─────────────────┘
                        │
              ┌─────────▼─────────┐
              │   Event Bus       │
              │ (Kafka/RabbitMQ)  │
              └─────────┬─────────┘
                        │
       ┌────────────────┼────────────────┐
       │                │                │
┌──────▼──────┐  ┌─────▼──────┐  ┌─────▼──────┐
│ Notification│  │ Analytics  │  │  Webhook   │
│  Service    │  │  Service   │  │  Service   │
└─────────────┘  └────────────┘  └────────────┘
```

### Características
✅ Escalável horizontalmente  
✅ Serviços independentes  
✅ Event sourcing completo  
✅ API pública para parceiros  
✅ Múltiplos consumers de eventos  
✅ Resiliência e fault tolerance  

---

## 📅 Fases de Migração

### ✅ Fase 0: Monólito Modular (ATUAL)
**Status**: Completo  
**Duração**: -  

**Entregas**:
- [x] Backend FastAPI funcional
- [x] Frontend React com mapa
- [x] Models genéricos (ProductBatch, Delivery, ResourceRequest)
- [x] Enums baseados em eventos
- [x] Routers separados por domínio

---

### 🔧 Fase 1: Repository Pattern & Interfaces (EM PROGRESSO)
**Status**: 40% completo  
**Duração Estimada**: 2-3 semanas  
**Prioridade**: 🔴 Alta  

#### Objetivos
Preparar código para desacoplamento através de abstrações

#### Tarefas

**Backend**:
- [ ] **1.1** Criar interfaces de Repository para cada entidade
  ```python
  # app/repositories/interfaces.py
  class IBatchRepository(ABC):
      @abstractmethod
      def create(self, batch: BatchCreate) -> ProductBatch: pass
      @abstractmethod
      def get_by_id(self, batch_id: int) -> Optional[ProductBatch]: pass
      @abstractmethod
      def list_ready(self) -> List[ProductBatch]: pass
  ```

- [ ] **1.2** Implementar repositories concretos
  ```python
  # app/repositories/batch_repository.py
  class BatchRepository(IBatchRepository):
      def __init__(self, db: Session):
          self.db = db
      
      def create(self, batch: BatchCreate) -> ProductBatch:
          # Implementação
  ```

- [ ] **1.3** Migrar routers para usar repositories
  - `routers/batches.py` → `BatchRepository`
  - `routers/deliveries.py` → `DeliveryRepository`
  - `routers/resources.py` → `ResourceRepository`

- [ ] **1.4** Adicionar testes unitários para repositories
  ```python
  def test_batch_repository_create():
      repo = BatchRepository(db)
      batch = repo.create(BatchCreate(...))
      assert batch.id is not None
  ```

- [ ] **1.5** Criar Service Layer (opcional mas recomendado)
  ```python
  # app/services/batch_service.py
  class BatchService:
      def __init__(self, batch_repo: IBatchRepository):
          self.batch_repo = batch_repo
      
      def create_batch(self, data: BatchCreate) -> ProductBatch:
          # Business logic aqui
          return self.batch_repo.create(data)
  ```

**Frontend**:
- [ ] **1.6** Criar API client abstrato
  ```javascript
  // lib/api/client.js
  class ApiClient {
      async get(endpoint) { /* ... */ }
      async post(endpoint, data) { /* ... */ }
  }
  
  // lib/api/batches.js
  export const batchesApi = {
      list: () => client.get('/batches'),
      create: (data) => client.post('/batches', data),
  };
  ```

- [ ] **1.7** Refatorar componentes para usar API client
  - Remover fetch direto
  - Usar `batchesApi`, `deliveriesApi`, etc.

**Critérios de Aceitação**:
- ✅ Todos os routers usam repositories
- ✅ Cobertura de testes > 70%
- ✅ Sem queries diretas em routers
- ✅ Frontend usa API clients

---

### 🔜 Fase 2: Event Store & Event Bus (In-Memory)
**Status**: Não iniciado  
**Duração Estimada**: 3-4 semanas  
**Prioridade**: 🟡 Média  

#### Objetivos
Introduzir event sourcing sem complexidade de infraestrutura

#### Tarefas

**Event Store**:
- [ ] **2.1** Criar tabela de eventos
  ```python
  # app/models.py
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
  ```

- [ ] **2.2** Definir eventos de domínio
  ```python
  # app/events/domain.py
  @dataclass
  class BatchCreated:
      event_id: str
      batch_id: int
      provider_id: int
      product_type: str
      quantity: int
      timestamp: datetime
  
  @dataclass
  class BatchReady:
      event_id: str
      batch_id: int
      timestamp: datetime
  ```

- [ ] **2.3** Implementar Event Bus in-memory
  ```python
  # app/events/bus.py
  class InMemoryEventBus:
      def __init__(self):
          self.handlers = {}
      
      async def publish(self, event: Event):
          # Salvar no event store
          await self.save_to_store(event)
          
          # Notificar handlers
          handlers = self.handlers.get(event.event_type, [])
          for handler in handlers:
              await handler(event)
  ```

- [ ] **2.4** Criar handlers de eventos
  ```python
  # app/events/handlers/notifications.py
  async def send_notification_on_batch_ready(event: BatchReady):
      # Enviar notificação
      pass
  
  # app/events/handlers/analytics.py
  async def track_batch_created(event: BatchCreated):
      # Registrar analytics
      pass
  ```

- [ ] **2.5** Migrar endpoints para publicar eventos
  ```python
  @router.post("/batches")
  async def create_batch(data: BatchCreate):
      # Criar batch
      batch = batch_service.create(data)
      
      # Publicar evento
      await event_bus.publish(BatchCreated(
          event_id=uuid4().hex,
          batch_id=batch.id,
          provider_id=batch.provider_id,
          product_type=batch.product_type,
          quantity=batch.quantity,
          timestamp=datetime.utcnow()
      ))
      
      return batch
  ```

**Critérios de Aceitação**:
- ✅ Todos os eventos salvos no event store
- ✅ Handlers processam eventos corretamente
- ✅ Sistema funciona com e sem handlers
- ✅ Logs de eventos para auditoria

---

### 🔜 Fase 3: CQRS & Read Models
**Status**: Não iniciado  
**Duração Estimada**: 4-5 semanas  
**Prioridade**: 🟡 Média  

#### Objetivos
Separar leitura de escrita para melhor performance

#### Tarefas

- [ ] **3.1** Criar read models (projeções)
  ```python
  # app/models/read_models.py
  class BatchListView(Base):
      """Modelo otimizado para listagem"""
      __tablename__ = "batch_list_view"
      
      id = Column(Integer, primary_key=True)
      provider_name = Column(String)
      product_type = Column(String, index=True)
      status = Column(String, index=True)
      quantity_available = Column(Integer)
      created_at = Column(DateTime, index=True)
      # Desnormalizado para queries rápidas
  ```

- [ ] **3.2** Criar projections (atualizadores de read models)
  ```python
  # app/events/projections/batch_projection.py
  class BatchProjection:
      async def on_batch_created(self, event: BatchCreated):
          # Atualizar read model
          batch_view = BatchListView(
              id=event.batch_id,
              provider_name=await get_provider_name(event.provider_id),
              product_type=event.product_type,
              status="producing",
              quantity_available=event.quantity,
              created_at=event.timestamp
          )
          db.add(batch_view)
          await db.commit()
  ```

- [ ] **3.3** Separar endpoints de leitura e escrita
  ```python
  # Escrita (commands)
  @router.post("/batches")  # Usa write model
  
  # Leitura (queries)
  @router.get("/batches")   # Usa read model
  ```

- [ ] **3.4** Adicionar cache para read models
  ```python
  @router.get("/batches")
  @cache(expire=60)  # Cache de 1 minuto
  async def list_batches():
      return db.query(BatchListView).all()
  ```

**Critérios de Aceitação**:
- ✅ Read models atualizados via eventos
- ✅ Queries 10x mais rápidas
- ✅ Cache funcionando
- ✅ Eventual consistency aceitável

---

### 🔜 Fase 4: Redis Event Bus & Workers
**Status**: Não iniciado  
**Duração Estimada**: 3-4 semanas  
**Prioridade**: 🟢 Baixa  

#### Objetivos
Adicionar persistência e processamento assíncrono

#### Tarefas

- [ ] **4.1** Setup Redis
  ```yaml
  # docker-compose.yml
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  ```

- [ ] **4.2** Implementar Redis Event Bus
  ```python
  # app/events/redis_bus.py
  class RedisEventBus:
      def __init__(self, redis_url: str):
          self.redis = Redis.from_url(redis_url)
      
      async def publish(self, event: Event):
          # Publicar no Redis Stream
          await self.redis.xadd(
              f"events:{event.event_type}",
              {"data": event.json()}
          )
  ```

- [ ] **4.3** Criar workers para processar eventos
  ```python
  # workers/event_processor.py
  async def process_events():
      while True:
          events = await redis.xread({"events:*": "$"})
          for event in events:
              await handle_event(event)
  ```

- [ ] **4.4** Adicionar retry e dead letter queue
  ```python
  async def handle_event_with_retry(event):
      for attempt in range(3):
          try:
              await handle_event(event)
              break
          except Exception as e:
              if attempt == 2:
                  # Enviar para DLQ
                  await redis.lpush("dlq", event.json())
  ```

**Critérios de Aceitação**:
- ✅ Eventos persistidos no Redis
- ✅ Workers processam eventos
- ✅ Retry automático funciona
- ✅ DLQ captura falhas

---

### 🔜 Fase 5: Microserviços & API Pública
**Status**: Não iniciado  
**Duração Estimada**: 8-12 semanas  
**Prioridade**: 🟢 Baixa  

#### Objetivos
Separar em serviços independentes e expor API pública

#### Tarefas

**Separação de Serviços**:
- [ ] **5.1** Criar serviço de Batches
  ```
  batches-service/
  ├── app/
  │   ├── api/
  │   ├── domain/
  │   ├── infrastructure/
  │   └── main.py
  ├── Dockerfile
  └── requirements.txt
  ```

- [ ] **5.2** Criar serviço de Deliveries
- [ ] **5.3** Criar serviço de Resources
- [ ] **5.4** Criar serviço de Notifications
- [ ] **5.5** Criar serviço de Analytics

**API Gateway**:
- [ ] **5.6** Setup Kong/Traefik
  ```yaml
  # kong.yml
  services:
    - name: batches
      url: http://batches-service:8000
      routes:
        - paths: [/api/batches]
  ```

- [ ] **5.7** Adicionar autenticação (OAuth2/JWT)
- [ ] **5.8** Adicionar rate limiting
- [ ] **5.9** Adicionar API keys para parceiros

**Event Bus Produção**:
- [ ] **5.10** Migrar para Kafka ou RabbitMQ
  ```yaml
  # docker-compose.yml
  kafka:
    image: confluentinc/cp-kafka:latest
    environment:
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
  ```

**Webhook Service**:
- [ ] **5.11** Criar serviço de webhooks
  ```python
  # webhooks-service/
  # Permite parceiros receberem eventos
  @router.post("/webhooks/subscribe")
  async def subscribe(url: str, events: List[str]):
      # Registrar webhook
      pass
  ```

**Documentação API Pública**:
- [ ] **5.12** OpenAPI spec completa
- [ ] **5.13** Portal de desenvolvedores
- [ ] **5.14** SDKs (Python, JavaScript, etc.)

**Critérios de Aceitação**:
- ✅ Serviços independentes deployáveis
- ✅ API Gateway funcionando
- ✅ Webhooks para parceiros
- ✅ Documentação completa
- ✅ SDKs disponíveis

---

## 🎯 Métricas de Sucesso

### Performance
- [ ] Latência p95 < 200ms
- [ ] Throughput > 1000 req/s
- [ ] Uptime > 99.9%

### Escalabilidade
- [ ] Escala horizontal automática
- [ ] Suporta 10k+ usuários simultâneos
- [ ] Processa 100k+ eventos/dia

### Qualidade
- [ ] Cobertura de testes > 80%
- [ ] Zero downtime deploys
- [ ] Rollback automático em falhas

---

## 🛠️ Stack Tecnológica

### Atual
- **Backend**: FastAPI, SQLAlchemy, SQLite
- **Frontend**: React, Vite, TailwindCSS
- **Deploy**: Manual

### Fase 4
- **Event Bus**: Redis Streams
- **Workers**: Python async workers
- **Database**: PostgreSQL

### Fase 5
- **Event Bus**: Kafka / RabbitMQ
- **API Gateway**: Kong / Traefik
- **Service Mesh**: Istio (opcional)
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack
- **Tracing**: Jaeger
- **Deploy**: Kubernetes

---

## 📚 Recursos e Referências

### Documentação Interna
- [Event-Driven Design](docs/architecture/02-EVENT-DRIVEN-DESIGN.md)
- [Domain Model](docs/architecture/03-DOMAIN-MODEL.md)
- [Migration Strategy](docs/architecture/04-MIGRATION-STRATEGY.md)

### Leitura Recomendada
- [Building Microservices - Sam Newman](https://www.oreilly.com/library/view/building-microservices/9781491950340/)
- [Domain-Driven Design - Eric Evans](https://www.domainlanguage.com/ddd/)
- [Event Sourcing - Martin Fowler](https://martinfowler.com/eaaDev/EventSourcing.html)
- [CQRS Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/cqrs)

---

## 🤝 Como Contribuir

Cada fase tem tarefas específicas que podem ser trabalhadas independentemente:

1. **Escolha uma tarefa** da fase atual
2. **Comente na issue** correspondente
3. **Crie uma branch**: `git checkout -b feature/task-X.Y`
4. **Implemente** seguindo os padrões
5. **Abra um PR** com referência à tarefa

**Dúvidas?** Abra uma discussion no GitHub!

---

**Última atualização**: 27 de Fevereiro de 2026  
**Próxima revisão**: Após conclusão da Fase 1
