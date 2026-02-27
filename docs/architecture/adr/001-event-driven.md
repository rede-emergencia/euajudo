# ADR-001: Event-Driven Architecture

**Status**: Aprovado  
**Data**: Fevereiro 2026  
**Decisores**: Tech Lead, Product  

## Contexto

Sistema precisa ser escalável, suportar múltiplas categorias de produtos/serviços, e permitir auditoria completa de todas as operações. MVP atual usa CRUD tradicional com modelos específicos para marmitas.

## Decisão

Adotaremos **Event-Driven Architecture** com Event Sourcing e CQRS para o sistema genérico.

### Componentes:

1. **Event Store**: Armazena todos os eventos que aconteceram
2. **Event Bus**: Distribui eventos para consumers
3. **Projections**: Views otimizadas para leitura
4. **Domain Events**: Eventos de negócio

## Razões

### ✅ Vantagens

1. **Auditoria Completa**
   - Todo evento é registrado
   - Histórico completo de mudanças
   - Compliance facilitado

2. **Escalabilidade**
   - Processamento assíncrono
   - Separação leitura/escrita
   - Fácil adicionar consumers

3. **Desacoplamento**
   - Serviços independentes
   - Fácil adicionar funcionalidades
   - Sem dependências diretas

4. **Flexibilidade**
   - Fácil adicionar novos tipos de eventos
   - Replay de eventos possível
   - Time travel debugging

5. **Genericidade**
   - Eventos servem para qualquer categoria
   - Plugin system se encaixa perfeitamente
   - Extensível sem mudanças no core

### ❌ Desvantagens

1. **Complexidade**
   - Curva de aprendizado
   - Mais código inicial
   - Debugging mais difícil

2. **Eventual Consistency**
   - Leitura pode estar desatualizada
   - Precisa lidar com inconsistências temporárias

3. **Event Schema Evolution**
   - Precisa manter compatibilidade
   - Versionamento de eventos necessário

## Alternativas Consideradas

### 1. CRUD Tradicional
**Prós**:
- Simples
- Familiar
- Rápido de desenvolver

**Contras**:
- Não escala bem
- Sem histórico
- Difícil adicionar categorias

**Decisão**: ❌ Rejeitado - Não atende requisitos de escalabilidade

### 2. Event-Driven sem Event Sourcing
**Prós**:
- Mais simples que Event Sourcing
- Ainda tem benefícios de eventos

**Contras**:
- Sem histórico completo
- Não pode replay

**Decisão**: ❌ Rejeitado - Queremos auditoria completa

### 3. CQRS sem Events
**Prós**:
- Separação leitura/escrita
- Performance

**Contras**:
- Sem histórico
- Acoplamento maior

**Decisão**: ❌ Rejeitado - Queremos desacoplamento

## Implementação

### Fase 1: Event Bus In-Memory (MVP)
```python
class InMemoryEventBus:
    def publish(self, event):
        for handler in self.handlers[event.type]:
            handler(event)
```

**Quando**: Imediato  
**Risco**: Baixo  
**Esforço**: 1 dia  

### Fase 2: Event Store Básico
```python
class EventStore:
    def append(self, event):
        db.execute(
            "INSERT INTO event_store (type, data) VALUES (?, ?)",
            event.type, event.data
        )
```

**Quando**: Semana 2  
**Risco**: Baixo  
**Esforço**: 2 dias  

### Fase 3: CQRS com Projections
```python
@event_bus.subscribe("EventCreated")
def update_event_list_view(event):
    EventListView.create_from_event(event)
```

**Quando**: Semana 4  
**Risco**: Médio  
**Esforço**: 1 semana  

### Fase 4: Redis/RabbitMQ Event Bus
```python
class RedisEventBus:
    def publish(self, event):
        redis.publish(f"events:{event.type}", event.json())
```

**Quando**: Mês 3  
**Risco**: Alto  
**Esforço**: 2 semanas  

## Métricas de Sucesso

| Métrica | Baseline | Meta | Atual |
|---------|----------|------|-------|
| Latência p95 write | 500ms | < 200ms | - |
| Latência p95 read | 300ms | < 100ms | - |
| Eventos/segundo | 10 | > 100 | - |
| Downtime para deploy | 5min | 0min | - |

## Riscos e Mitigações

### Risco 1: Over-engineering para MVP
**Probabilidade**: Alta  
**Impacto**: Médio  
**Mitigação**: 
- Começar simples (in-memory)
- Evoluir conforme necessidade
- Feature flags para rollback

### Risco 2: Performance de Event Store
**Probabilidade**: Média  
**Impacto**: Alto  
**Mitigação**:
- Índices em event_store
- Particionamento por aggregate
- Archive de eventos antigos

### Risco 3: Event Schema Evolution
**Probabilidade**: Alta  
**Impacto**: Médio  
**Mitigação**:
- Versionamento de eventos
- Backward compatibility sempre
- Upcasters para migração

## Decisões Relacionadas

- [ADR-002: Monolito Modular](./002-modular-monolith.md)
- [ADR-003: PostgreSQL JSONB](./003-jsonb-choice.md)

## Revisão

Esta decisão deve ser revisada em **6 meses** ou quando:
- Sistema atinge 1000 req/min
- Time cresce para > 10 pessoas
- Necessidade de microserviços surge

## Referências

- [Event Sourcing - Martin Fowler](https://martinfowler.com/eaaDev/EventSourcing.html)
- [CQRS Journey - Microsoft](https://docs.microsoft.com/en-us/previous-versions/msp-n-p/jj554200(v=pandp.10))
- [Event-Driven Microservices - Chris Richardson](https://microservices.io/patterns/data/event-driven-architecture.html)

---

**Aprovado por**: Tech Lead  
**Data de aprovação**: Fevereiro 2026
