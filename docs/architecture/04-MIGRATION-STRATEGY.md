# 🔄 Estratégia de Migração

## Visão Geral

Migração **incremental e segura** do MVP atual (específico de marmitas) para arquitetura genérica e escalável, sem quebrar funcionalidade existente.

## Princípios da Migração

### 1. **Strangler Fig Pattern**
Substituir gradualmente o sistema antigo pelo novo, sem big bang:

```
MVP Atual ──┐
            ├──> Sistema Híbrido ──> Sistema Genérico
Novo Código ┘
```

### 2. **Dual Write**
Escrever em ambos sistemas durante transição:

```python
async def criar_pedido(data):
    # Escreve no sistema antigo
    pedido_antigo = await criar_pedido_marmita_legacy(data)
    
    # Escreve no sistema novo
    event = await criar_event_generico(data)
    
    # Retorna novo
    return event
```

### 3. **Feature Flags**
Controlar rollout de novas features:

```python
if feature_flags.is_enabled("generic_events", user_id):
    return await use_generic_system()
else:
    return await use_legacy_system()
```

### 4. **Dark Launching**
Executar código novo em paralelo sem impactar usuários:

```python
# Sistema antigo (produção)
result = await legacy_system.process()

# Sistema novo (dark launch - só logs)
asyncio.create_task(
    new_system.process_and_log()
)

return result
```

## Plano de Migração (8 Semanas)

### 📅 Semana 1: Preparação
**Objetivo**: Setup e modelos genéricos

**Tarefas**:
- ✅ Criar models genéricos (`Event`, `EventItem`, `Assignment`)
- ✅ Configurar event store
- ✅ Implementar event bus básico (in-memory)
- ✅ Criar testes unitários para novos models
- ✅ Documentar decisões arquiteturais

**Entregas**:
```python
# app/models_generic.py
class Event(Base): ...
class EventItem(Base): ...
class Assignment(Base): ...

# app/events/bus.py
class EventBus: ...

# app/events/store.py
class EventStore: ...
```

**Critério de Sucesso**:
- ✅ Models genéricos criados e testados
- ✅ Event bus funcional
- ✅ 100% cobertura de testes nos novos modelos

---

### 📅 Semana 2: Adaptadores
**Objetivo**: Conectar sistemas antigo e novo

**Tarefas**:
- ✅ Criar adapters para converter models antigos em eventos
- ✅ Implementar dual-write em endpoints críticos
- ✅ Configurar feature flags
- ✅ Adicionar logs estruturados
- ✅ Monitoramento de discrepâncias

**Entregas**:
```python
# app/adapters/marmita_adapter.py
class MarmitaToEventAdapter:
    @staticmethod
    def pedido_to_event(pedido: PedidoMarmita) -> Event:
        """Converte PedidoMarmita para Event genérico"""
        return Event(
            type="necessidade",
            category="alimentos",
            subcategory="marmitas",
            metadata={
                "quantidade": pedido.quantidade,
                "horario_inicio": pedido.horario_inicio,
                "horario_fim": pedido.horario_fim
            }
        )
    
    @staticmethod
    def lote_to_event(lote: LoteMarmita) -> Event:
        """Converte LoteMarmita para Event genérico"""
        return Event(
            type="oferta",
            category="alimentos",
            subcategory="marmitas",
            metadata={
                "quantidade": lote.quantidade,
                "descricao": lote.descricao,
                "horario_limite": lote.horario_limite_retirada
            }
        )

# app/routers/pedidos_marmita.py
@router.post("/pedidos-marmita")
async def criar_pedido(data: PedidoCreate):
    # Sistema antigo
    pedido_legacy = PedidoMarmita(**data.dict())
    db.add(pedido_legacy)
    db.commit()
    
    # Sistema novo (dual-write)
    if feature_flags.is_enabled("dual_write_events"):
        event = MarmitaToEventAdapter.pedido_to_event(pedido_legacy)
        await event_bus.publish(EventCreated(event))
    
    return pedido_legacy
```

**Critério de Sucesso**:
- ✅ Dual-write funcionando sem erros
- ✅ 0 discrepâncias entre sistemas
- ✅ Feature flags operacionais

---

### 📅 Semana 3: Migração de Dados
**Objetivo**: Migrar dados existentes para formato genérico

**Tarefas**:
- ✅ Criar scripts de migração
- ✅ Migrar pedidos de marmita → eventos
- ✅ Migrar lotes → eventos
- ✅ Migrar entregas → assignments
- ✅ Validar integridade dos dados

**Entregas**:
```python
# scripts/migrate_to_generic.py
async def migrate_pedidos_marmita():
    """Migra pedidos de marmita para eventos genéricos"""
    pedidos = db.query(PedidoMarmita).all()
    
    for pedido in pedidos:
        # Verificar se já migrado
        existing = db.query(Event).filter(
            Event.metadata["legacy_pedido_id"].astext == str(pedido.id)
        ).first()
        
        if existing:
            continue
        
        # Converter e salvar
        event = MarmitaToEventAdapter.pedido_to_event(pedido)
        event.metadata["legacy_pedido_id"] = pedido.id
        
        db.add(event)
        
        # Migrar items
        for item in pedido.items:
            event_item = EventItem(
                event_id=event.id,
                name=item.nome,
                quantity=item.quantidade,
                unit=item.unidade
            )
            db.add(event_item)
    
    db.commit()
    print(f"Migrados {len(pedidos)} pedidos")

# Rodar migração
# python -m scripts.migrate_to_generic
```

**Critério de Sucesso**:
- ✅ 100% dos dados migrados
- ✅ Integridade referencial mantida
- ✅ Rollback disponível

---

### 📅 Semana 4: APIs Genéricas
**Objetivo**: Criar endpoints genéricos mantendo compatibilidade

**Tarefas**:
- ✅ Criar endpoints genéricos `/events`
- ✅ Manter endpoints legados como aliases
- ✅ Implementar versionamento de API
- ✅ Documentar com OpenAPI
- ✅ Testes de integração

**Entregas**:
```python
# app/routers/events.py
@router.post("/v2/events", response_model=EventResponse)
async def criar_event(
    data: EventCreate,
    current_user: User = Depends(get_current_user)
):
    """Endpoint genérico para criar eventos"""
    
    # Validação específica por categoria
    validator = CategoryValidatorFactory.get(data.category)
    validator.validate(data)
    
    # Criar evento
    event = Event(
        type=data.type,
        category=data.category,
        creator_id=current_user.id,
        city_id=data.city_id or current_user.city_id,
        metadata=data.metadata
    )
    
    # Adicionar items
    for item_data in data.items:
        item = EventItem(**item_data.dict())
        event.items.append(item)
    
    # Salvar
    db.add(event)
    db.commit()
    
    # Publicar evento
    await event_bus.publish(EventCreated(event))
    
    return event

# Manter compatibilidade com endpoints antigos
@router.post("/pedidos-marmita")
async def criar_pedido_marmita_legacy(data: PedidoMarmitaCreate):
    """Endpoint legado - redireciona para genérico"""
    
    # Converter para formato genérico
    event_data = EventCreate(
        type="necessidade",
        category="alimentos",
        subcategory="marmitas",
        metadata=data.dict()
    )
    
    # Usar endpoint genérico
    event = await criar_event(event_data)
    
    # Retornar no formato antigo
    return PedidoMarmitaResponse.from_event(event)
```

**Critério de Sucesso**:
- ✅ APIs genéricas funcionais
- ✅ Compatibilidade com clientes antigos
- ✅ Documentação atualizada

---

### 📅 Semana 5: Frontend Genérico
**Objetivo**: Atualizar frontend para usar APIs genéricas

**Tarefas**:
- ✅ Criar components genéricos
- ✅ Implementar plugin system no frontend
- ✅ Migrar páginas gradualmente
- ✅ A/B testing
- ✅ Rollback plan

**Entregas**:
```jsx
// src/components/Event/EventCard.jsx
function EventCard({ event }) {
  // Renderizar baseado em category
  const CategoryComponent = getCategoryComponent(event.category);
  
  return (
    <div className="event-card">
      <CategoryComponent event={event} />
      <EventActions event={event} />
    </div>
  );
}

// src/plugins/categories/food.jsx
export const FoodEventCard = ({ event }) => (
  <div>
    <h3>🍱 {event.metadata.tipo_refeicao}</h3>
    <p>Quantidade: {event.metadata.quantidade} marmitas</p>
    <p>Horário: {event.metadata.horario_entrega}</p>
  </div>
);

// src/plugins/registry.js
const CATEGORY_COMPONENTS = {
  'alimentos': FoodEventCard,
  'roupas': ClothingEventCard,
  'medicamentos': MedicineEventCard
};
```

**Critério de Sucesso**:
- ✅ Frontend usa APIs genéricas
- ✅ UX mantida ou melhorada
- ✅ Performance não degradada

---

### 📅 Semana 6: Nova Categoria (Roupas)
**Objetivo**: Validar genericidade adicionando segunda categoria

**Tarefas**:
- ✅ Implementar plugin de roupas
- ✅ Criar validações específicas
- ✅ Adicionar UI para roupas
- ✅ Testar fluxo completo
- ✅ Documentar aprendizados

**Entregas**:
```python
# app/plugins/clothing.py
class ClothingPlugin(CategoryPlugin):
    category = "roupas"
    
    def validate_metadata(self, metadata: Dict) -> None:
        """Validações específicas para roupas"""
        required = ["tamanhos", "genero", "estacao"]
        for field in required:
            if field not in metadata:
                raise ValidationError(f"Campo {field} obrigatório para roupas")
        
        # Validar tamanhos
        valid_sizes = ["PP", "P", "M", "G", "GG", "XG"]
        for size in metadata["tamanhos"].keys():
            if size not in valid_sizes:
                raise ValidationError(f"Tamanho inválido: {size}")
    
    def enrich_event(self, event: Event) -> Event:
        """Adiciona informações específicas"""
        # Calcular total de peças
        total = sum(metadata["tamanhos"].values())
        event.metadata["total_pecas"] = total
        
        return event
    
    def match_score_modifier(self, score: float, metadata: Dict) -> float:
        """Modifica score de matching baseado em especificidades"""
        # Priorizar urgência de inverno
        if metadata.get("estacao") == "inverno":
            score *= 1.2
        
        return score
```

**Critério de Sucesso**:
- ✅ Segunda categoria funcionando
- ✅ Zero alteração em código core
- ✅ Plugin isolado e testável

---

### 📅 Semana 7: Limpeza e Otimização
**Objetivo**: Remover código legado e otimizar

**Tarefas**:
- ✅ Remover models específicos de marmita
- ✅ Remover endpoints legados
- ✅ Otimizar queries
- ✅ Adicionar índices
- ✅ Refatorar código duplicado

**Entregas**:
```python
# Remover (deprecated)
# app/models.py - PedidoMarmita, LoteMarmita, etc.
# app/routers/pedidos_marmita.py
# app/routers/lotes_marmita.py

# Manter apenas
# app/models_generic.py - Event, EventItem, Assignment
# app/routers/events.py
# app/routers/assignments.py

# Otimizações
# migrations/add_indexes.py
def upgrade():
    op.create_index(
        'idx_events_category_city_status',
        'events',
        ['category', 'city_id', 'status']
    )
    
    op.create_index(
        'idx_events_metadata_gin',
        'events',
        ['metadata'],
        postgresql_using='gin'
    )
```

**Critério de Sucesso**:
- ✅ Código legado removido
- ✅ Performance melhorada
- ✅ Cobertura de testes mantida

---

### 📅 Semana 8: Documentação e Handoff
**Objetivo**: Finalizar e documentar

**Tarefas**:
- ✅ Atualizar toda documentação
- ✅ Criar guias para desenvolvedores
- ✅ Gravar demos
- ✅ Treinar time
- ✅ Planejar próximas features

**Entregas**:
- 📚 Documentação completa
- 🎥 Video tutoriais
- 📊 Métricas de sucesso
- 🗺️ Roadmap futuro

**Critério de Sucesso**:
- ✅ Time consegue adicionar categorias
- ✅ Documentação clara e completa
- ✅ Zero bugs críticos

## Estratégias de Rollback

### Nível 1: Feature Flag
```python
# Desabilitar feature nova
feature_flags.disable("generic_events")

# Sistema volta para legado automaticamente
```

### Nível 2: Dual Read
```python
# Ler de ambos sistemas e comparar
legacy_data = await get_from_legacy()
new_data = await get_from_generic()

if compare(legacy_data, new_data):
    return new_data
else:
    log_discrepancy()
    return legacy_data  # Fallback seguro
```

### Nível 3: Rollback de Deploy
```bash
# Git
git revert <commit-hash>
git push origin main

# Docker
docker rollback jfood-api

# Kubernetes
kubectl rollout undo deployment/jfood-api
```

### Nível 4: Restauração de Backup
```bash
# Banco de dados
pg_restore --dbname=jfood backup_before_migration.dump

# Código
git reset --hard <commit-before-migration>
```

## Checklist de Segurança

### Antes de Cada Deploy
- [ ] Backup completo do banco
- [ ] Testes de integração passando
- [ ] Feature flags configuradas
- [ ] Monitoramento ativo
- [ ] Equipe de plantão alertada
- [ ] Rollback plan revisado

### Durante Deploy
- [ ] Deploy gradual (canary)
- [ ] Monitorar logs em tempo real
- [ ] Verificar métricas de erro
- [ ] Testar funcionalidades críticas
- [ ] Comunicar status

### Após Deploy
- [ ] Validar dados migrados
- [ ] Verificar performance
- [ ] Coletar feedback
- [ ] Documentar issues
- [ ] Planejar próximos passos

## Métricas de Sucesso

### Técnicas
| Métrica | Antes | Meta | Atual |
|---------|-------|------|-------|
| Tempo para adicionar categoria | N/A | < 2 dias | - |
| Cobertura de testes | 60% | > 80% | - |
| Performance p95 | 300ms | < 200ms | - |
| Bugs em produção | 5/mês | < 2/mês | - |

### Negócio
| Métrica | Antes | Meta | Atual |
|---------|-------|------|-------|
| Categorias ativas | 1 | 3+ | - |
| Cidades | 1 | 3+ | - |
| Usuários ativos | 100 | 500+ | - |
| Eventos/dia | 20 | 100+ | - |

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Perda de dados na migração | Baixa | Alto | Backup + dual-write + validação |
| Performance degradada | Média | Médio | Load testing + índices + cache |
| Bugs em produção | Média | Alto | Feature flags + canary + rollback |
| Resistência do time | Baixa | Médio | Documentação + treinamento |
| Over-engineering | Média | Baixo | MVP incremental + validação |

## Comunicação

### Stakeholders
- **Devs**: Daily updates, code reviews, pair programming
- **Produto**: Weekly demos, roadmap alignment
- **Usuários**: Beta testing, feedback loops
- **Negócio**: Métricas semanais, ROI tracking

### Canais
- 💬 Slack: #jfood-migration
- 📧 Email: Weekly digest
- 📊 Dashboard: Métricas em tempo real
- 📝 Docs: Confluence/Notion

---

**Próximo**: [Arquitetura Modular](./05-MODULAR-ARCHITECTURE.md)
