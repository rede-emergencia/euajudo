# 🎯 Visão Geral e Conceito

## Problema que Estamos Resolvendo

### Contexto Atual (MVP)
Sistema específico para **marmitas**:
- Fornecedores pedem insumos
- Voluntários compram e entregam insumos
- Fornecedores produzem marmitas
- Voluntários retiram e entregam marmitas
- Recebedores confirmam recebimento

### Visão de Futuro
Plataforma **genérica** que conecta **qualquer necessidade** com **qualquer oferta**:
- 🍱 Alimentos (marmitas, cestas básicas, refeições)
- 👕 Roupas (doações, roupas de inverno, uniformes)
- 💊 Medicamentos (remédios, fraldas, material hospitalar)
- 🛏️ Móveis (colchões, camas, mesas)
- 📚 Educação (livros, material escolar)
- 🔧 Serviços (consultas médicas, cortes de cabelo, reparos)

## Princípios Fundamentais

### 1. **Genericidade Desde o Início**
```
❌ EVITAR:
class PedidoMarmita
class ReservaMarmita
class EntregaMarmita

✅ PREFERIR:
class Event(type="necessidade", category="alimentos")
class Assignment(event_id, volunteer_id)
class Delivery(assignment_id, status)
```

### 2. **Event-Driven Architecture**
Todo o sistema é baseado em **eventos**:
- `NecessidadeCriada` → Alguém precisa de algo
- `OfertaPublicada` → Alguém pode fornecer algo
- `VoluntarioAceitou` → Alguém vai ajudar
- `ItemEntregue` → Entrega confirmada

### 3. **Modularidade**
Cada categoria tem seu **módulo independente**:
```
modules/
├── food/           # Regras específicas para alimentos
├── clothing/       # Regras específicas para roupas
├── medicine/       # Regras específicas para medicamentos
└── core/           # Lógica genérica compartilhada
```

### 4. **Escalabilidade Horizontal**
Sistema preparado para crescer:
- Multi-cidade desde o início (`city_id` em tudo)
- Separação clara de responsabilidades
- APIs desacopladas
- Database sharding-ready

## Evolução do Sistema

### Fase 1: MVP Atual (1-2 semanas)
**Objetivo**: Validar conceito com marmitas em Juiz de Fora

**Características**:
- Backend monolítico FastAPI
- Models específicos de marmita (temporário)
- Frontend React simples
- SQLite local
- Deploy single-server

**Limitações Conhecidas**:
- ⚠️ Código acoplado com "marmita"
- ⚠️ Não suporta outras categorias
- ⚠️ Escalabilidade limitada

### Fase 2: Refatoração Genérica (2-4 semanas)
**Objetivo**: Transformar em sistema genérico mantendo funcionalidade

**Ações**:
- ✅ Criar models genéricos (`Event`, `EventItem`, `Assignment`)
- ✅ Implementar plugin system
- ✅ Migrar dados de marmitas para formato genérico
- ✅ Adicionar segunda categoria (roupas ou medicamentos)
- ✅ Manter APIs compatíveis (versioning)

**Resultado**:
- ✅ Sistema suporta múltiplas categorias
- ✅ Código genérico e reutilizável
- ✅ Fácil adicionar novas categorias

### Fase 3: Event-Driven (1-2 meses)
**Objetivo**: Introduzir arquitetura orientada a eventos

**Ações**:
- Event bus (RabbitMQ ou Redis Streams)
- Event sourcing para auditoria
- Comunicação assíncrona entre módulos
- CQRS para leitura otimizada

**Resultado**:
- ✅ Sistema reativo e escalável
- ✅ Histórico completo de eventos
- ✅ Performance otimizada

### Fase 4: Microserviços (3-6 meses)
**Objetivo**: Escalar independentemente cada parte

**Serviços**:
```
auth-service       → Autenticação
event-service      → Criação de eventos
matching-service   → Match entre ofertas/necessidades
notification-service → Notificações
delivery-service   → Rastreamento
analytics-service  → Métricas
```

**Resultado**:
- ✅ Escalabilidade independente
- ✅ Times podem trabalhar separadamente
- ✅ Deploy independente por serviço

## Conceito Central: Event

### Estrutura Genérica
```python
class Event:
    id: int
    type: str           # "necessidade" | "oferta" | "entrega"
    category: str       # "alimentos" | "roupas" | "medicamentos"
    subcategory: str    # "marmitas" | "cestas" | "roupas_inverno"
    status: str         # "aberto" | "em_andamento" | "concluído"
    creator_id: int
    city_id: str
    metadata: JSON      # Campos específicos por categoria
    created_at: datetime
    expires_at: datetime
```

### Exemplos de Uso

#### Marmitas (Atual)
```python
{
  "type": "necessidade",
  "category": "alimentos",
  "subcategory": "marmitas",
  "metadata": {
    "quantidade": 120,
    "horario_entrega": "12:00-14:00",
    "vegetarianas": 30,
    "tipo_refeicao": "almoço"
  }
}
```

#### Roupas (Futuro)
```python
{
  "type": "necessidade",
  "category": "roupas",
  "subcategory": "roupas_inverno",
  "metadata": {
    "quantidade": 50,
    "tamanhos": {"P": 10, "M": 20, "G": 15, "GG": 5},
    "genero": "unissex",
    "idade_faixa": "adulto"
  }
}
```

#### Medicamentos (Futuro)
```python
{
  "type": "necessidade",
  "category": "medicamentos",
  "subcategory": "medicamentos_basicos",
  "metadata": {
    "itens": [
      {"nome": "Dipirona", "quantidade": 100, "unidade": "comprimidos"},
      {"nome": "Paracetamol", "quantidade": 50, "unidade": "comprimidos"}
    ],
    "urgencia": "alta",
    "receita_necessaria": false
  }
}
```

## Atores do Sistema

### Atores Genéricos
1. **Creator** (Criador)
   - Cria eventos de necessidade
   - Exemplos: Abrigo, ONG, Pessoa física

2. **Provider** (Provedor)
   - Cria eventos de oferta
   - Exemplos: Fornecedor, Doador, Empresa

3. **Volunteer** (Voluntário)
   - Aceita assignments
   - Faz entregas/coletas
   - Exemplos: Entregador, Comprador

4. **Receiver** (Recebedor)
   - Confirma recebimentos
   - Exemplos: Abrigo, Beneficiário

### Mapeamento Atual → Genérico

| MVP (Marmitas) | Genérico | Papel |
|----------------|----------|-------|
| Fornecedor | Provider | Cria oferta de marmitas |
| Abrigo | Creator/Receiver | Solicita e recebe marmitas |
| Voluntário Comprador | Volunteer | Compra e entrega insumos |
| Voluntário Entregador | Volunteer | Retira e entrega marmitas |

## Fluxos Genéricos

### Fluxo 1: Necessidade → Oferta → Entrega
```
1. Creator cria necessidade
   └─> Event(type="necessidade", category="X")

2. Provider vê necessidade e cria oferta
   └─> Event(type="oferta", parent_event_id=1)

3. Volunteer aceita oferta
   └─> Assignment(event_id=2, volunteer_id=Y)

4. Volunteer faz entrega
   └─> Delivery(assignment_id=3, status="entregue")

5. Receiver confirma recebimento
   └─> Event(status="concluído")
```

### Fluxo 2: Oferta → Matching → Entrega
```
1. Provider cria oferta
   └─> Event(type="oferta", category="X")

2. Sistema faz matching com necessidades
   └─> Match(offer_event_id=1, need_event_id=5)

3. Volunteer aceita match
   └─> Assignment(event_id=1)

4. Volunteer entrega
   └─> Delivery(assignment_id=3)
```

## Decisões Arquiteturais Principais

### Por que Event-Driven?
✅ **Flexibilidade**: Fácil adicionar novos tipos de eventos  
✅ **Auditoria**: Histórico completo de tudo que aconteceu  
✅ **Escalabilidade**: Processamento assíncrono  
✅ **Desacoplamento**: Serviços não dependem uns dos outros  

### Por que Monolito Modular Primeiro?
✅ **Simplicidade**: Mais fácil desenvolver e testar  
✅ **Performance**: Sem latência de rede entre módulos  
✅ **Deploy**: Um único artefato  
✅ **Evolução**: Pode virar microserviços depois  

### Por que PostgreSQL + JSONB?
✅ **Relacional**: Para dados estruturados (users, locations)  
✅ **Flexível**: JSONB para metadata específica por categoria  
✅ **Performance**: Índices em campos JSON  
✅ **Transações**: ACID garantido  

## Métricas de Sucesso

### Técnicas
- ⏱️ Tempo para adicionar nova categoria: **< 2 dias**
- 📦 Tamanho do código específico vs genérico: **< 20% específico**
- 🧪 Cobertura de testes: **> 80%**
- 🚀 Performance: **< 200ms p95** para APIs principais

### Negócio
- 🌍 Múltiplas cidades suportadas
- 📊 Múltiplas categorias ativas
- 👥 Crescimento de usuários sem refatoração
- 🔌 API pública para integrações

## Riscos e Mitigações

### Risco 1: Over-engineering
**Problema**: Arquitetura muito complexa para MVP  
**Mitigação**: Começar simples, evoluir conforme necessidade real

### Risco 2: Abstrações erradas
**Problema**: Modelo genérico não serve para todas categorias  
**Mitigação**: Validar com 2-3 categorias diferentes antes de generalizar

### Risco 3: Performance
**Problema**: JSONB pode ser mais lento que campos dedicados  
**Mitigação**: Usar índices GIN, cache, desnormalização quando necessário

### Risco 4: Complexidade de migração
**Problema**: Migrar código existente é arriscado  
**Mitigação**: Strangler Fig Pattern, dual-write temporário, feature flags

## Próximos Passos

1. ✅ Ler [Event-Driven Design](./02-EVENT-DRIVEN-DESIGN.md)
2. ✅ Estudar [Domain Model](./03-DOMAIN-MODEL.md)
3. ✅ Seguir [Estratégia de Migração](./04-MIGRATION-STRATEGY.md)
4. ✅ Implementar primeiro módulo genérico
5. ✅ Validar com marmitas + 1 categoria nova

---

**Versão**: 1.0  
**Data**: Fevereiro 2026  
**Status**: 🟢 Aprovado para implementação
