# 🏗️ Revisão Completa da Arquitetura do Ecossistema

**Data:** 2 de Março, 2026  
**Status:** Análise Detalhada

---

## 📊 ESTADO ATUAL DO BANCO DE DADOS

### 1. **MODELOS PRINCIPAIS**

#### **User** (Polimórfico - usa roles)
```
- Voluntário (volunteer)
- Abrigo (shelter)
- Fornecedor/Provider (provider)
- Admin (admin)
```

#### **DeliveryLocation**
- Locais físicos onde deliveries podem ser entregues
- Vinculado a um User (shelter)
- Tem coordenadas, capacidade, horários

#### **Category** (Sistema Novo e Flexível) ✅
- Sistema hierárquico de categorias
- Suporta atributos dinâmicos (tamanho, cor, tipo)
- Metadata cache para performance
- **BOM PARA FUTURO** - Pode representar produtos OU serviços

#### **ProductBatch**
- Lote de produtos criado por provider
- Vinculado a Category
- Status: PRODUCING, READY, RESERVED, DELIVERED, EXPIRED

#### **Delivery** (Modelo Central) ⭐
```sql
id
batch_id (nullable)          -- Pode ser NULL para commitments diretos
location_id                  -- Onde entregar
volunteer_id (nullable)      -- Quem vai entregar
parent_delivery_id           -- Para splits de entregas
product_type (enum)          -- Legado
category_id                  -- Novo sistema
quantity
status: AVAILABLE, RESERVED, PICKED_UP, IN_TRANSIT, DELIVERED, CANCELLED, EXPIRED
metadata_cache (JSON)
pickup_code, delivery_code
timestamps
```

#### **ShelterRequest** (Pedidos de Doação) ⭐
```sql
id
shelter_id                   -- Quem está pedindo
category_id                  -- O que está pedindo
quantity_requested
quantity_received
quantity_pending
quantity_cancelled
status: active, completed, cancelled
notes
timestamps
```

#### **InventoryItem** (Estoque do Abrigo) ⭐
```sql
id
shelter_id
category_id
quantity_in_stock
quantity_reserved
quantity_available
min_threshold, max_threshold
metadata_cache
```

#### **DistributionRecord** (Distribuição para Beneficiários) ⭐
```sql
id
shelter_id
category_id
quantity
recipient_name, recipient_document
status: active, cancelled
distributed_at
```

---

## 🔄 FLUXO ATUAL (Doação Simples)

### **Cenário 1: Voluntário Doa para Abrigo**

```
1. Abrigo cria ShelterRequest
   └─> shelter_requests (status=active)

2. Sistema cria Delivery vinculada ao request
   └─> deliveries (status=available, batch_id=NULL, volunteer_id=NULL)

3. Voluntário vê no mapa e se compromete
   └─> deliveries (status=reserved, volunteer_id=123)
   └─> Gera delivery_code

4. Voluntário entrega no abrigo
   └─> Abrigo confirma com delivery_code
   └─> deliveries (status=delivered)
   └─> inventory_items (quantity_in_stock += X)
   └─> inventory_transactions (DONATION_RECEIVED)

5. Abrigo distribui para beneficiário
   └─> distribution_records (criado)
   └─> inventory_items (quantity_in_stock -= X)
   └─> inventory_transactions (DONATION_GIVEN)
```

### **Cenário 2: Provider Cria Lote (Marmitas)**

```
1. Provider cria ProductBatch
   └─> product_batches (status=PRODUCING)

2. Provider marca como pronto
   └─> product_batches (status=READY)

3. Sistema cria Deliveries automaticamente
   └─> deliveries (batch_id=X, status=available)

4. Voluntário reserva
   └─> deliveries (status=reserved, volunteer_id=123)
   └─> Gera pickup_code

5. Voluntário retira com provider
   └─> Provider confirma com pickup_code
   └─> deliveries (status=picked_up)

6. Voluntário entrega no abrigo
   └─> Abrigo confirma com delivery_code
   └─> deliveries (status=delivered)
```

---

## ✅ FLUXO FUNCIONA PARA CASO ATUAL?

### **SIM!** O fluxo está funcionando:

1. ✅ Abrigo pode criar pedido (ShelterRequest)
2. ✅ Sistema cria Delivery vinculada
3. ✅ Voluntário vê no mapa e se compromete
4. ✅ Voluntário entrega
5. ✅ Abrigo recebe no estoque
6. ✅ Abrigo distribui para beneficiário

**Problema identificado hoje:** Ícone vermelho não aparecia quando abrigo criava pedido
**Solução:** Mapa agora verifica `shelter_requests` além de `deliveries`

---

## 🚀 PREPARAÇÃO PARA FUTURO

### **Cenário Futuro 1: Logística (Retirar → Entregar)**

**Exemplo:** Voluntário retira doação em ponto A e leva para ponto B

```
OPÇÃO A - Usar Delivery Atual (RECOMENDADO) ✅
----------------------------------------
Delivery já tem tudo que precisa:
- pickup_code (confirma retirada no ponto A)
- delivery_code (confirma entrega no ponto B)
- picked_up_at, delivered_at (timestamps)
- status: PICKED_UP (retirou) → IN_TRANSIT → DELIVERED

ADICIONAR:
- pickup_location_id (novo campo) → Onde retirar
- delivery_location_id (renomear location_id) → Onde entregar

Delivery {
    pickup_location_id    -- Ponto A (nova doação, provider, etc)
    delivery_location_id  -- Ponto B (abrigo, beneficiário, etc)
    volunteer_id
    pickup_code
    delivery_code
    status: AVAILABLE → RESERVED → PICKED_UP → IN_TRANSIT → DELIVERED
}
```

### **Cenário Futuro 2: Serviços (Limpar, Cortar Árvore)**

**Exemplo:** Voluntário presta serviço de limpeza, carpintaria, etc.

```
OPÇÃO A - Usar Category + Delivery (RECOMENDADO) ✅
---------------------------------------------------
Category já é genérico o suficiente:

categories:
  - name: "servico_limpeza"
    display_name: "Serviço de Limpeza"
    icon: "🧹"

category_attributes:
  - category_id: servico_limpeza
    name: "tipo_servico"
    options: ["limpeza_geral", "organizacao", "desinfeccao"]
  
  - category_id: servico_limpeza
    name: "duracao_estimada"
    attribute_type: "number"
    unit: "horas"

Delivery {
    category_id: servico_limpeza
    quantity: 1 (número de voluntários necessários)
    metadata_cache: {
        "tipo_servico": "limpeza_geral",
        "duracao_estimada": 4
    }
    status: AVAILABLE → RESERVED → IN_PROGRESS → COMPLETED
}

AJUSTES NECESSÁRIOS:
1. Adicionar status IN_PROGRESS para serviços em andamento
2. Adicionar campo service_started_at, service_completed_at
3. Adicionar campo requires_skills (JSON array de habilidades)
```

---

## 🛠️ MUDANÇAS NECESSÁRIAS

### **1. MODELO DELIVERY (Prioridade ALTA)**

```python
class Delivery(Base):
    # ATUAL
    location_id = Column(Integer, ForeignKey("delivery_locations.id"))
    
    # MUDAR PARA:
    pickup_location_id = Column(Integer, ForeignKey("delivery_locations.id"), nullable=True)
    delivery_location_id = Column(Integer, ForeignKey("delivery_locations.id"), nullable=False)
    
    # ADICIONAR para suporte a serviços:
    service_started_at = Column(DateTime, nullable=True)
    service_completed_at = Column(DateTime, nullable=True)
    requires_skills = Column(JSON, nullable=True)  # ["limpeza", "carpintaria"]
    
    # ATUALIZAR status enum para incluir:
    # ... IN_PROGRESS (para serviços em andamento)
```

### **2. ENUM DeliveryStatus (Prioridade ALTA)**

```python
class DeliveryStatus(str, Enum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    IN_PROGRESS = "in_progress"  # NOVO - para serviços
    DELIVERED = "delivered"
    COMPLETED = "completed"      # NOVO - para serviços
    CANCELLED = "cancelled"
    EXPIRED = "expired"
```

### **3. MIGRATION (Prioridade ALTA)**

```python
def upgrade():
    # Renomear coluna
    op.alter_column('deliveries', 'location_id', new_column_name='delivery_location_id')
    
    # Adicionar nova coluna
    op.add_column('deliveries', Column('pickup_location_id', Integer, ForeignKey('delivery_locations.id')))
    
    # Adicionar campos de serviço
    op.add_column('deliveries', Column('service_started_at', DateTime))
    op.add_column('deliveries', Column('service_completed_at', DateTime))
    op.add_column('deliveries', Column('requires_skills', JSON))
```

### **4. CRIAR TIPOS DE CATEGORIA PARA SERVIÇOS**

```python
# Seed com categorias de serviços
services = [
    {
        "name": "servico_limpeza",
        "display_name": "Serviço de Limpeza",
        "icon": "🧹",
        "attributes": [
            {"name": "tipo", "type": "select", "options": ["geral", "pesada", "organizacao"]},
            {"name": "duracao_horas", "type": "number", "min": 1, "max": 8}
        ]
    },
    {
        "name": "servico_manutencao",
        "display_name": "Serviço de Manutenção",
        "icon": "🔧",
        "attributes": [
            {"name": "tipo", "type": "select", "options": ["eletrica", "hidraulica", "carpintaria"]},
            {"name": "urgencia", "type": "select", "options": ["baixa", "media", "alta"]}
        ]
    },
    {
        "name": "servico_jardinagem",
        "display_name": "Serviço de Jardinagem",
        "icon": "🌳",
        "attributes": [
            {"name": "tipo", "type": "select", "options": ["poda", "corte_arvore", "limpeza_terreno"]}
        ]
    }
]
```

---

## 📋 RESUMO E RECOMENDAÇÕES

### **✅ PONTOS FORTES DA ARQUITETURA ATUAL**

1. ✅ **Category é genérico** - Pode representar produtos OU serviços
2. ✅ **Delivery é flexível** - batch_id nullable permite commitments diretos
3. ✅ **Metadata cache** - Performance sem joins complexos
4. ✅ **Inventory tracking** - Rastreamento completo de estoque
5. ✅ **Transaction audit** - InventoryTransaction é imutável
6. ✅ **Status tracking** - DeliveryStatus cobre maioria dos casos

### **⚠️ AJUSTES NECESSÁRIOS (Ordem de Prioridade)**

#### **PRIORIDADE 1 - Suporte a Logística (Retirar → Entregar)**
```
1. Renomear location_id → delivery_location_id
2. Adicionar pickup_location_id
3. Migration segura com fallback
4. Atualizar queries e endpoints
```

#### **PRIORIDADE 2 - Suporte a Serviços**
```
1. Adicionar IN_PROGRESS ao DeliveryStatus
2. Adicionar service_started_at, service_completed_at
3. Adicionar requires_skills (JSON)
4. Criar seed de categorias de serviços
```

#### **PRIORIDADE 3 - Melhorias de UX**
```
1. Dashboard de voluntário com histórico
2. Ratings e reviews
3. Notificações push
4. Chat entre voluntário e solicitante
```

---

## 🎯 CONCLUSÃO

### **O sistema atual ESTÁ PRONTO para o fluxo básico:**
✅ Abrigo pede → Voluntário se compromete → Voluntário entrega

### **Com as mudanças propostas, estará PREPARADO para:**
✅ Logística (retirar em A, entregar em B)
✅ Serviços diversos (limpeza, manutenção, etc)
✅ Múltiplos tipos de transações
✅ Escalabilidade futura

### **A arquitetura é SÓLIDA:**
- Modelos genéricos e extensíveis
- Separação clara de responsabilidades
- Audit trail completo
- Performance otimizada

### **Próximo Passo:**
Implementar as mudanças de PRIORIDADE 1 para permitir logística completa.
