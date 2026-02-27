# 🏗️ Roadmap de Refatoração: Event-Driven Architecture

**Data**: Fevereiro 2026  
**Status Atual**: MVP Monolítico Funcional  
**Objetivo**: Arquitetura Event-Driven Generalista

---

## 📊 Análise da Situação Atual

### ✅ Pontos Positivos
- MVP funcional e validado com marmitas
- Código relativamente pequeno (~20 arquivos backend)
- Padrão claro: Necessidade → Oferta → Transporte
- Time entende o domínio
- Deploy funcionando no Render

### ⚠️ Limitações Atuais
- Acoplado a "marmitas" (hard-coded)
- CRUD tradicional (sem eventos)
- Monolito (difícil escalar partes específicas)
- Lógica de negócio espalhada nos routers
- Difícil adicionar novos tipos de recursos

---

## 🎯 Visão da Arquitetura Futura

### Conceito: Plataforma Generalista de Necessidades

```
┌─────────────────────────────────────────────────┐
│           FRONTEND (React SPA)                  │
│  - Dashboard Dinâmico por Tipo de Recurso      │
│  - Mapa Unificado (todos os recursos)          │
│  - Formulários Genéricos                       │
└──────────────────┬──────────────────────────────┘
                   │ REST API
                   ▼
┌─────────────────────────────────────────────────┐
│          API GATEWAY (FastAPI)                  │
│  - Roteamento                                   │
│  - Autenticação                                 │
│  - Rate Limiting                                │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────┴──────────┬──────────┬─────────┐
        ▼                     ▼          ▼         ▼
┌──────────────┐  ┌──────────────┐  ┌────────┐  ┌────────┐
│ Necessidades │  │   Ofertas    │  │Transp. │  │Notif.  │
│   Service    │  │   Service    │  │Service │  │Service │
└──────┬───────┘  └──────┬───────┘  └───┬────┘  └───┬────┘
       │                 │              │           │
       └─────────────────┴──────────────┴───────────┘
                         │
                    ┌────▼─────┐
                    │  REDIS   │
                    │ (Events) │
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │PostgreSQL│
                    │  (Data)  │
                    └──────────┘
```

### Tipos de Recursos Suportados

```python
RECURSOS = {
    "marmita": {
        "categoria": "alimentacao",
        "validade": "6 horas",
        "campos": ["tipo_refeicao", "restricoes"]
    },
    "roupa": {
        "categoria": "vestuario",
        "validade": None,
        "campos": ["tipo_peca", "tamanho", "genero"]
    },
    "item_higiene": {
        "categoria": "higiene",
        "validade": "conforme produto",
        "campos": ["tipo_item", "quantidade_ml"]
    },
    "colchao": {
        "categoria": "mobiliario",
        "validade": None,
        "campos": ["tamanho", "tipo", "condicao"]
    },
    "medicamento": {
        "categoria": "saude",
        "validade": "conforme produto",
        "campos": ["nome", "dosagem", "receita_necessaria"]
    }
}
```

---

## 📅 Roadmap de Implementação

### 🟢 FASE 1: Abstrações e Preparação (1 semana)
**Objetivo**: Criar camada de abstração sem quebrar nada

#### Semana 1 - Dias 1-2: Models Genéricos
```python
# Criar em: backend/app/models_v2.py

class TipoRecurso(Base):
    """Catálogo de tipos de recursos suportados"""
    __tablename__ = "tipos_recurso"
    
    codigo = Column(String, primary_key=True)  # "marmita", "roupa"
    nome = Column(String, nullable=False)
    categoria = Column(String)
    unidade_padrao = Column(String)
    configuracao = Column(JSON)  # Campos obrigatórios, validações

class Recurso(Base):
    """Abstração genérica de qualquer item"""
    __tablename__ = "recursos"
    
    id = Column(Integer, primary_key=True)
    tipo_codigo = Column(String, ForeignKey("tipos_recurso.codigo"))
    quantidade = Column(Integer)
    unidade = Column(String)
    metadata = Column(JSON)  # Campos específicos do tipo
    
    tipo = relationship("TipoRecurso")

class Necessidade(Base):
    """Alguém precisa de algo"""
    __tablename__ = "necessidades"
    
    id = Column(Integer, primary_key=True)
    recurso_id = Column(Integer, ForeignKey("recursos.id"))
    local_id = Column(Integer, ForeignKey("locais_entrega.id"))
    solicitante_id = Column(Integer, ForeignKey("users.id"))
    
    janela_inicio = Column(DateTime)
    janela_fim = Column(DateTime)
    status = Column(String)  # "aberta", "atendida", "cancelada"
    
    recurso = relationship("Recurso")
    local = relationship("LocalEntrega")
    solicitante = relationship("User")

class Oferta(Base):
    """Alguém oferece algo"""
    __tablename__ = "ofertas"
    
    id = Column(Integer, primary_key=True)
    recurso_id = Column(Integer, ForeignKey("recursos.id"))
    fornecedor_id = Column(Integer, ForeignKey("users.id"))
    
    disponivel_em = Column(DateTime)
    expira_em = Column(DateTime, nullable=True)
    status = Column(String)  # "disponivel", "reservada", "entregue"
    
    recurso = relationship("Recurso")
    fornecedor = relationship("User")

class Transporte(Base):
    """Movimento de oferta para necessidade"""
    __tablename__ = "transportes"
    
    id = Column(Integer, primary_key=True)
    oferta_id = Column(Integer, ForeignKey("ofertas.id"))
    necessidade_id = Column(Integer, ForeignKey("necessidades.id"))
    voluntario_id = Column(Integer, ForeignKey("users.id"))
    
    origem = Column(String)  # Endereço ou coordenadas
    destino = Column(String)
    status = Column(String)  # "pendente", "em_rota", "entregue"
    
    retirado_em = Column(DateTime, nullable=True)
    entregue_em = Column(DateTime, nullable=True)
```

**Tarefas**:
- [ ] Criar `models_v2.py` com models genéricos
- [ ] Criar migration para novas tabelas
- [ ] Popular `tipos_recurso` com "marmita" inicial
- [ ] Criar adaptadores: `PedidoMarmita` → `Necessidade`
- [ ] Testes unitários dos models

**Impacto**: ✅ ZERO - Só adiciona tabelas, não muda nada

---

#### Semana 1 - Dias 3-5: Adaptadores e Coexistência
```python
# backend/app/adapters.py

class MarmitaAdapter:
    """Adapta entre modelo antigo e novo"""
    
    @staticmethod
    def pedido_to_necessidade(pedido: PedidoMarmita) -> Necessidade:
        """Converte PedidoMarmita para Necessidade"""
        recurso = Recurso(
            tipo_codigo="marmita",
            quantidade=pedido.quantidade,
            unidade="unidades",
            metadata={
                "horario_inicio": pedido.horario_inicio,
                "horario_fim": pedido.horario_fim
            }
        )
        
        necessidade = Necessidade(
            recurso=recurso,
            local_id=pedido.abrigo_id,
            solicitante_id=pedido.user_id,
            janela_inicio=parse_time(pedido.horario_inicio),
            janela_fim=parse_time(pedido.horario_fim),
            status="aberta" if pedido.status == "ativo" else "cancelada"
        )
        
        return necessidade
    
    @staticmethod
    def lote_to_oferta(lote: LoteMarmita) -> Oferta:
        """Converte LoteMarmita para Oferta"""
        recurso = Recurso(
            tipo_codigo="marmita",
            quantidade=lote.quantidade_disponivel,
            unidade="unidades",
            metadata={
                "descricao": lote.descricao,
                "horario_limite": lote.horario_limite_retirada
            }
        )
        
        oferta = Oferta(
            recurso=recurso,
            fornecedor_id=lote.produtor_id,
            disponivel_em=lote.created_at,
            expira_em=lote.horario_limite_retirada,
            status="disponivel" if lote.status == "disponivel" else "reservada"
        )
        
        return oferta

# Uso nos endpoints existentes
@router.post("/pedidos-marmita/")
def criar_pedido_marmita(pedido: PedidoCreate, db: Session = Depends(get_db)):
    # 1. Criar no modelo antigo (mantém compatibilidade)
    db_pedido = PedidoMarmita(**pedido.dict())
    db.add(db_pedido)
    db.commit()
    
    # 2. Criar no modelo novo (preparando migração)
    necessidade = MarmitaAdapter.pedido_to_necessidade(db_pedido)
    db.add(necessidade)
    db.commit()
    
    return db_pedido  # Frontend continua recebendo formato antigo
```

**Tarefas**:
- [ ] Criar `adapters.py` com conversores
- [ ] Modificar endpoints para criar em ambos os modelos
- [ ] Criar endpoint `/api/v2/necessidades/` (novo)
- [ ] Testes de integração dos adaptadores
- [ ] Documentar coexistência no README

**Impacto**: ✅ BAIXO - API antiga continua funcionando

---

### 🟡 FASE 2: Event Bus e Eventos (1 semana)
**Objetivo**: Introduzir eventos sem dependências externas

#### Semana 2 - Dias 1-3: Event Bus em Memória
```python
# backend/app/event_bus.py

from typing import Callable, Dict, List, Any
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class EventType(str, Enum):
    # Necessidades
    NECESSIDADE_CRIADA = "necessidade.criada"
    NECESSIDADE_CANCELADA = "necessidade.cancelada"
    NECESSIDADE_ATENDIDA = "necessidade.atendida"
    
    # Ofertas
    OFERTA_DISPONIBILIZADA = "oferta.disponibilizada"
    OFERTA_RESERVADA = "oferta.reservada"
    OFERTA_EXPIRADA = "oferta.expirada"
    
    # Transporte
    TRANSPORTE_ACEITO = "transporte.aceito"
    TRANSPORTE_RETIRADO = "transporte.retirado"
    TRANSPORTE_ENTREGUE = "transporte.entregue"

@dataclass
class Event:
    event_type: EventType
    aggregate_id: str
    data: Dict[str, Any]
    timestamp: datetime = field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self):
        return {
            "event_type": self.event_type.value,
            "aggregate_id": self.aggregate_id,
            "data": self.data,
            "timestamp": self.timestamp.isoformat(),
            "metadata": self.metadata
        }

class EventBus:
    def __init__(self):
        self._handlers: Dict[EventType, List[Callable]] = {}
        self._events: List[Event] = []  # Event store em memória
    
    def publish(self, event: Event):
        """Publica evento e chama handlers síncronos."""
        logger.info(f"Publishing event: {event.event_type} - {event.aggregate_id}")
        self._events.append(event)
        
        handlers = self._handlers.get(event.event_type, [])
        for handler in handlers:
            try:
                handler(event)
            except Exception as e:
                logger.error(f"Handler error for {event.event_type}: {e}")
    
    async def publish_async(self, event: Event):
        """Publica evento e chama handlers assíncronos."""
        logger.info(f"Publishing async event: {event.event_type}")
        self._events.append(event)
        
        handlers = self._handlers.get(event.event_type, [])
        for handler in handlers:
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(event)
                else:
                    handler(event)
            except Exception as e:
                logger.error(f"Async handler error: {e}")
    
    def subscribe(self, event_type: EventType, handler: Callable):
        """Registra handler para tipo de evento."""
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)
        logger.info(f"Subscribed handler to {event_type}")
    
    def get_events(self, aggregate_id: str = None) -> List[Event]:
        """Retorna eventos (opcionalmente filtrados por aggregate)."""
        if aggregate_id:
            return [e for e in self._events if e.aggregate_id == aggregate_id]
        return self._events

# Singleton global
event_bus = EventBus()
```

**Handlers de Exemplo**:
```python
# backend/app/handlers/necessidades.py

from app.event_bus import event_bus, Event, EventType
from app.models_v2 import Necessidade, Oferta
from app.services.matching import tentar_match

def quando_necessidade_criada(event: Event):
    """Handler: quando uma necessidade é criada, tentar match com ofertas."""
    necessidade_id = event.aggregate_id
    
    # Buscar ofertas disponíveis do mesmo tipo
    tipo_recurso = event.data["tipo_recurso"]
    ofertas = buscar_ofertas_disponiveis(tipo_recurso)
    
    for oferta in ofertas:
        if tentar_match(necessidade_id, oferta.id):
            # Publicar evento de match
            event_bus.publish(Event(
                event_type=EventType.OFERTA_RESERVADA,
                aggregate_id=str(oferta.id),
                data={
                    "necessidade_id": necessidade_id,
                    "oferta_id": str(oferta.id)
                }
            ))
            break

def quando_oferta_disponibilizada(event: Event):
    """Handler: quando oferta disponibilizada, notificar interessados."""
    oferta_id = event.aggregate_id
    tipo_recurso = event.data["tipo_recurso"]
    
    # Buscar necessidades abertas do mesmo tipo
    necessidades = buscar_necessidades_abertas(tipo_recurso)
    
    # Notificar voluntários
    notificar_voluntarios(tipo_recurso, oferta_id, necessidades)

# Registrar handlers
event_bus.subscribe(EventType.NECESSIDADE_CRIADA, quando_necessidade_criada)
event_bus.subscribe(EventType.OFERTA_DISPONIBILIZADA, quando_oferta_disponibilizada)
```

**Tarefas**:
- [ ] Criar `event_bus.py` com EventBus em memória
- [ ] Definir eventos de domínio (EventType)
- [ ] Criar handlers básicos
- [ ] Modificar 1 endpoint para publicar eventos
- [ ] Testes unitários do EventBus

**Impacto**: ⚠️ MÉDIO - Refatoração interna, API igual

---

#### Semana 2 - Dias 4-5: Integrar Eventos nos Endpoints
```python
# backend/app/routers/necessidades_v2.py

from app.event_bus import event_bus, Event, EventType
from app.models_v2 import Necessidade, Recurso

@router.post("/v2/necessidades/", response_model=NecessidadeResponse)
async def criar_necessidade(
    cmd: CriarNecessidadeCommand,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # 1. Validar comando
    if cmd.quantidade <= 0:
        raise HTTPException(400, "Quantidade deve ser positiva")
    
    # 2. Criar recurso
    recurso = Recurso(
        tipo_codigo=cmd.tipo_recurso,
        quantidade=cmd.quantidade,
        unidade=cmd.unidade,
        metadata=cmd.metadata or {}
    )
    db.add(recurso)
    
    # 3. Criar necessidade
    necessidade = Necessidade(
        recurso=recurso,
        local_id=cmd.local_id,
        solicitante_id=current_user.id,
        janela_inicio=cmd.janela_inicio,
        janela_fim=cmd.janela_fim,
        status="aberta"
    )
    db.add(necessidade)
    db.commit()
    db.refresh(necessidade)
    
    # 4. Publicar evento
    await event_bus.publish_async(Event(
        event_type=EventType.NECESSIDADE_CRIADA,
        aggregate_id=str(necessidade.id),
        data={
            "tipo_recurso": cmd.tipo_recurso,
            "quantidade": cmd.quantidade,
            "local_id": cmd.local_id,
            "solicitante_id": current_user.id
        },
        metadata={
            "user_email": current_user.email,
            "user_roles": current_user.roles
        }
    ))
    
    return necessidade
```

**Tarefas**:
- [ ] Criar routers v2 com eventos
- [ ] Migrar lógica de negócio para handlers
- [ ] Criar comandos (CriarNecessidade, CriarOferta)
- [ ] Testes de integração com eventos
- [ ] Documentar eventos no Swagger

**Impacto**: ⚠️ MÉDIO - Nova API v2, v1 continua funcionando

---

### 🟠 FASE 3: Redis e Persistência de Eventos (1 semana)
**Objetivo**: Event store persistente e comunicação assíncrona

#### Semana 3 - Dias 1-2: Redis Setup
```yaml
# docker-compose.yml (desenvolvimento)
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://...
    depends_on:
      - redis

volumes:
  redis_data:
```

```python
# backend/app/event_store_redis.py

import redis
import json
from typing import List, Callable
from app.event_bus import Event, EventType

class RedisEventStore:
    def __init__(self, redis_url: str):
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.pubsub = self.redis.pubsub()
    
    def append(self, event: Event):
        """Adiciona evento ao stream Redis."""
        stream_name = f"events:{event.event_type.value}"
        
        self.redis.xadd(
            stream_name,
            event.to_dict(),
            maxlen=10000  # Manter últimos 10k eventos
        )
        
        # Publicar também no pub/sub para consumo em tempo real
        self.redis.publish(
            f"channel:{event.event_type.value}",
            json.dumps(event.to_dict())
        )
    
    def read_stream(self, event_type: EventType, from_id: str = "0") -> List[Event]:
        """Lê eventos de um stream."""
        stream_name = f"events:{event_type.value}"
        events = self.redis.xread({stream_name: from_id}, count=100)
        
        result = []
        for stream, messages in events:
            for msg_id, data in messages:
                result.append(self._parse_event(data))
        
        return result
    
    def subscribe(self, event_types: List[EventType], handler: Callable):
        """Consome eventos em tempo real."""
        channels = [f"channel:{et.value}" for et in event_types]
        self.pubsub.subscribe(*channels)
        
        for message in self.pubsub.listen():
            if message['type'] == 'message':
                event_data = json.loads(message['data'])
                event = self._parse_event(event_data)
                handler(event)
    
    def _parse_event(self, data: dict) -> Event:
        return Event(
            event_type=EventType(data['event_type']),
            aggregate_id=data['aggregate_id'],
            data=json.loads(data['data']) if isinstance(data['data'], str) else data['data'],
            timestamp=datetime.fromisoformat(data['timestamp']),
            metadata=json.loads(data.get('metadata', '{}')) if isinstance(data.get('metadata'), str) else data.get('metadata', {})
        )

# Configuração
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
event_store = RedisEventStore(redis_url)
```

**Tarefas**:
- [ ] Adicionar Redis ao docker-compose
- [ ] Criar `event_store_redis.py`
- [ ] Migrar EventBus para usar Redis
- [ ] Configurar Redis no Render (ou usar local)
- [ ] Testes de persistência de eventos

**Impacto**: ⚠️ MÉDIO - Adiciona dependência, mas opcional em dev

---

#### Semana 3 - Dias 3-5: Workers Assíncronos
```python
# backend/app/workers/matching_worker.py

import asyncio
from app.event_store_redis import event_store
from app.event_bus import EventType
from app.services.matching import processar_match

async def worker_matching():
    """Worker que processa eventos de matching."""
    
    def handle_event(event):
        if event.event_type == EventType.NECESSIDADE_CRIADA:
            processar_match_necessidade(event)
        elif event.event_type == EventType.OFERTA_DISPONIBILIZADA:
            processar_match_oferta(event)
    
    # Consumir eventos em tempo real
    event_store.subscribe(
        [EventType.NECESSIDADE_CRIADA, EventType.OFERTA_DISPONIBILIZADA],
        handle_event
    )

if __name__ == "__main__":
    asyncio.run(worker_matching())
```

```bash
# Procfile (Render.com)
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
worker: python -m app.workers.matching_worker
```

**Tarefas**:
- [ ] Criar workers para processar eventos
- [ ] Separar lógica de negócio em services
- [ ] Configurar workers no Render
- [ ] Monitoramento de workers
- [ ] Testes de workers

**Impacto**: 🔴 MÉDIO-ALTO - Nova infraestrutura

---

### 🔴 FASE 4: Microserviços (2 semanas)
**Objetivo**: Separar em serviços independentes

#### Semana 4-5: Separação Gradual

**Estrutura Final**:
```
backend/
├── services/
│   ├── gateway/              # API Gateway (porta 8000)
│   │   ├── main.py
│   │   ├── routes.py
│   │   └── auth.py
│   │
│   ├── necessidades/         # Serviço de Necessidades (porta 8001)
│   │   ├── main.py
│   │   ├── handlers.py
│   │   ├── commands.py
│   │   └── queries.py
│   │
│   ├── ofertas/              # Serviço de Ofertas (porta 8002)
│   │   ├── main.py
│   │   ├── handlers.py
│   │   └── matching.py
│   │
│   ├── transporte/           # Serviço de Transporte (porta 8003)
│   │   ├── main.py
│   │   ├── handlers.py
│   │   └── routing.py
│   │
│   └── notificacoes/         # Serviço de Notificações (porta 8004)
│       ├── main.py
│       ├── handlers.py
│       └── templates/
│
├── shared/                   # Código compartilhado
│   ├── events.py
│   ├── event_bus.py
│   ├── models.py
│   └── database.py
│
└── docker-compose.yml
```

**Tarefas**:
- [ ] Criar API Gateway
- [ ] Separar serviço de Necessidades
- [ ] Separar serviço de Ofertas
- [ ] Separar serviço de Transporte
- [ ] Criar serviço de Notificações
- [ ] Testes E2E entre serviços
- [ ] Deploy gradual no Render

**Impacto**: 🔴 ALTO - Mudança significativa

---

## 💰 Análise de Custos

### Desenvolvimento (Local)
```
Docker Desktop: Grátis
Redis: Grátis (container)
PostgreSQL: Grátis (container)
Total: R$ 0/mês
```

### Produção - Opção 1: Monolito com Eventos
```
Backend (1 container com todos serviços): $7/mês
Redis (25MB): Grátis (Render) ou $10/mês
PostgreSQL: Grátis
Frontend: Grátis
Total: $7-17/mês
```

### Produção - Opção 2: Microserviços Completos
```
API Gateway: $7/mês
Necessidades Service: $7/mês
Ofertas Service: $7/mês
Transporte Service: $7/mês
Notificações Service: $7/mês
Redis: $10/mês
PostgreSQL: $7/mês
Frontend: Grátis
Total: ~$52/mês
```

**Recomendação**: Começar com Opção 1, migrar para Opção 2 quando tiver tráfego.

---

## ⚠️ Riscos e Mitigações

### Risco 1: Complexidade Aumentada
**Mitigação**: Migração gradual, manter código antigo funcionando

### Risco 2: Performance Degradada
**Mitigação**: Benchmarks em cada fase, otimizar antes de prosseguir

### Risco 3: Bugs em Produção
**Mitigação**: Feature flags, deploy gradual, rollback fácil

### Risco 4: Custo Aumentado
**Mitigação**: Começar com monolito event-driven, separar depois

### Risco 5: Time Sobrecarregado
**Mitigação**: Fazer 1 fase por vez, pausar se necessário

---

## ✅ Checklist de Decisão

Antes de começar, responda:

- [ ] **MVP está estável?** (Sim = pode refatorar)
- [ ] **Time tem bandwidth?** (Precisa de 3-4 semanas)
- [ ] **Há planos de adicionar novos recursos?** (Sim = refatorar ajuda)
- [ ] **Infraestrutura está ok?** (Redis disponível?)
- [ ] **Testes estão adequados?** (Cobertura >70%)

Se 4+ respostas "Sim": **FAÇA a refatoração**  
Se 2-3 respostas "Sim": **CONSIDERE fazer**  
Se 0-1 respostas "Sim": **ESPERE mais**

---

## 🎯 Recomendação Final

### ✅ SIM, FAÇA A REFATORAÇÃO

**Justificativa**:
1. MVP validado, momento certo
2. Código ainda pequeno (fácil migrar)
3. Visão clara do domínio genérico
4. Event-driven facilita generalização
5. Preparação para escala futura

### 📋 Comece por:
1. **Fase 1** (1 semana): Abstrações
2. **Avalie**: Se funcionou bem, continue
3. **Fase 2** (1 semana): Event Bus
4. **Avalie**: Se está trazendo valor, continue
5. **Fase 3+**: Quando tiver demanda real

### 🚫 NÃO faça:
- Big bang (reescrever tudo de uma vez)
- Microserviços prematuros (sem tráfego que justifique)
- Sobre-engenharia (YAGNI - You Aren't Gonna Need It)

---

## 📞 Próximos Passos

1. **Ler este documento completo**
2. **Consultar**: `@architecture-refactoring.md` para detalhes técnicos
3. **Decidir**: Começar Fase 1 ou esperar?
4. **Se sim**: Criar branch `feature/event-driven`
5. **Implementar**: Fase 1 (abstrações)
6. **Testar**: Tudo funcionando?
7. **Avaliar**: Vale continuar para Fase 2?

---

**Última atualização**: Fevereiro 2026  
**Consulte**: `@architecture-refactoring.md` para suporte durante implementação
