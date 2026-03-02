# Sistema de Controle de Estoque para Abrigos

## 🎯 Visão Geral

O abrigo precisa de um **sistema completo de gestão de estoque** onde ele controla suas necessidades, recebe doações, ajusta quantidades e tem visibilidade total do que entra e sai.

## 📋 Requisitos Funcionais

### 1. **Gestão de Necessidades (Inventory Items)**
- Abrigo define **itens que precisa** com quantidades
- Exemplo: "Preciso de 50 fraldas, 100L de água, 30 cobertores"
- Pode **adicionar novos itens** a qualquer momento
- Pode **aumentar/diminuir** quantidades necessárias
- Pode **remover itens** que não precisa mais (com validações)

### 2. **Controle de Entregas em Andamento**
- Visualizar **entregas comprometidas** (voluntários já confirmados)
- Visualizar **entregas em trânsito** (já coletadas)
- **Bloquear cancelamento** de entregas não canceláveis
- Permitir **cancelamento** apenas de entregas disponíveis/pendentes

### 3. **Entrada e Saída de Estoque**
- **Registrar recebimentos** de doações
- **Registrar consumo/distribuição** de itens
- **Histórico completo** de movimentações
- **Saldo atual** sempre atualizado

### 4. **Dashboard Completo**
- **Visão geral** do estoque atual
- **Gráficos** de necessidades vs recebido
- **Alertas** de itens críticos (baixo estoque)
- **Status** de cada categoria de item
- **Métricas** de doações recebidas

### 5. **Validações e Regras**
- ❌ **Não pode cancelar** entregas com status:
  - `reserved` (voluntário confirmado)
  - `picked_up` (já coletado)
  - `in_transit` (em trânsito)
- ✅ **Pode cancelar** entregas com status:
  - `available` (ainda disponível)
  - `pending_confirmation` (aguardando confirmação)
- ⚠️ **Avisar** quando tentar reduzir necessidade mas há entregas comprometidas

## 🗄️ Modelo de Dados

### **ShelterInventoryItem** (Novo)
```python
class ShelterInventoryItem(Base):
    id: int
    shelter_id: int  # FK para User (shelter)
    category_id: int  # FK para Category
    
    # Quantidades
    needed_quantity: int  # Quantidade que precisa
    current_stock: int    # Estoque atual
    in_transit: int       # Em trânsito (entregas confirmadas)
    
    # Metadados
    metadata: JSON  # Atributos específicos (tamanho, tipo, etc)
    priority: str   # urgent, high, medium, low
    
    # Controle
    active: bool
    created_at: datetime
    updated_at: datetime
```

### **InventoryMovement** (Novo)
```python
class InventoryMovement(Base):
    id: int
    inventory_item_id: int  # FK para ShelterInventoryItem
    
    # Tipo de movimentação
    type: str  # 'in' (entrada) ou 'out' (saída)
    quantity: int
    
    # Origem/Destino
    source_type: str  # 'donation', 'purchase', 'transfer', 'distribution', 'loss'
    delivery_id: int  # FK opcional para Delivery (se veio de doação)
    
    # Detalhes
    notes: str
    created_by: int  # FK para User
    created_at: datetime
```

## 🎨 Interface do Dashboard

### **Página Principal - Visão Geral**
```
┌─────────────────────────────────────────────────────────┐
│ 📊 Dashboard - Controle de Estoque                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │ 📦 Itens │ │ ⚠️ Críti │ │ 🚚 Em    │ │ ✅ Recebi│   │
│ │ Ativos   │ │ cos      │ │ Trânsito │ │ dos Hoje │   │
│ │   12     │ │    3     │ │    8     │ │   15     │   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 📈 Gráfico: Necessidades vs Estoque Atual          │ │
│ │ [Gráfico de barras por categoria]                  │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 📋 Itens do Estoque                                 │ │
│ │ ┌──────────────────────────────────────────────┐   │ │
│ │ │ 💧 Água Mineral                               │   │ │
│ │ │ Necessário: 100L | Estoque: 30L | Falta: 70L │   │ │
│ │ │ Em trânsito: 20L (2 entregas confirmadas)    │   │ │
│ │ │ [+] [-] [✏️] [🗑️]                              │   │ │
│ │ └──────────────────────────────────────────────┘   │ │
│ │ ┌──────────────────────────────────────────────┐   │ │
│ │ │ 🍼 Fraldas Descartáveis                       │   │ │
│ │ │ Necessário: 50 | Estoque: 5 | Falta: 45      │   │ │
│ │ │ ⚠️ CRÍTICO - Abaixo de 20%                    │   │ │
│ │ │ [+] [-] [✏️] [🗑️]                              │   │ │
│ │ └──────────────────────────────────────────────┘   │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ [+ Adicionar Novo Item]                                 │
└─────────────────────────────────────────────────────────┘
```

### **Ações Rápidas em Cada Item**
- **[+]** - Aumentar necessidade
- **[-]** - Diminuir necessidade (com validação)
- **[✏️]** - Editar detalhes
- **[🗑️]** - Remover item (com validação)
- **[📊]** - Ver histórico de movimentações

### **Modal: Ajustar Quantidade**
```
┌─────────────────────────────────────────┐
│ Ajustar Necessidade - Água Mineral      │
├─────────────────────────────────────────┤
│                                          │
│ Quantidade atual necessária: 100L        │
│ Estoque atual: 30L                       │
│ Em trânsito: 20L                         │
│                                          │
│ Nova quantidade necessária:              │
│ [________] L                             │
│                                          │
│ ⚠️ Atenção: Há 20L em trânsito          │
│ (2 entregas confirmadas)                 │
│                                          │
│ [Cancelar] [Salvar]                      │
└─────────────────────────────────────────┘
```

### **Modal: Registrar Entrada/Saída**
```
┌─────────────────────────────────────────┐
│ Registrar Movimentação                   │
├─────────────────────────────────────────┤
│                                          │
│ Item: Água Mineral                       │
│                                          │
│ Tipo: ○ Entrada  ○ Saída                │
│                                          │
│ Quantidade: [____] L                     │
│                                          │
│ Origem/Destino:                          │
│ ▼ Doação recebida                        │
│   - Doação recebida                      │
│   - Compra                               │
│   - Transferência                        │
│   - Distribuição                         │
│   - Perda/Descarte                       │
│                                          │
│ Observações:                             │
│ [_____________________________]          │
│                                          │
│ [Cancelar] [Registrar]                   │
└─────────────────────────────────────────┘
```

## 🔄 Fluxos Principais

### **Fluxo 1: Abrigo Define Necessidade**
1. Abrigo acessa dashboard
2. Clica em "+ Adicionar Novo Item"
3. Seleciona categoria (ex: Água)
4. Define quantidade necessária (ex: 100L)
5. Define prioridade (urgente/alta/média/baixa)
6. Sistema cria `ShelterInventoryItem`
7. Item aparece no dashboard
8. Sistema cria automaticamente `Delivery` disponível para voluntários

### **Fluxo 2: Voluntário Doa**
1. Voluntário vê necessidade no mapa
2. Se compromete a doar 20L de água
3. Sistema atualiza `in_transit` do item (+20L)
4. Voluntário coleta e entrega
5. Sistema registra `InventoryMovement` (entrada +20L)
6. Sistema atualiza `current_stock` (+20L)
7. Sistema atualiza `in_transit` (-20L)

### **Fluxo 3: Abrigo Ajusta Necessidade**
1. Abrigo clica em [-] no item
2. Sistema mostra modal com validações
3. Se há entregas em trânsito, mostra aviso
4. Abrigo confirma nova quantidade
5. Sistema atualiza `needed_quantity`
6. Se reduzir abaixo do em trânsito, mostra alerta

### **Fluxo 4: Abrigo Registra Consumo**
1. Abrigo distribui 10L de água
2. Clica em "Registrar Saída"
3. Informa quantidade e motivo
4. Sistema cria `InventoryMovement` (saída -10L)
5. Sistema atualiza `current_stock` (-10L)

## 🎯 Métricas e Indicadores

### **KPIs no Dashboard**
- **Taxa de Atendimento**: (Estoque + Em Trânsito) / Necessário
- **Itens Críticos**: Estoque < 20% do necessário
- **Entregas Pendentes**: Quantidade em trânsito
- **Movimentação Diária**: Entradas e saídas do dia
- **Top Necessidades**: Itens com maior déficit

### **Gráficos**
1. **Barras**: Necessário vs Estoque vs Em Trânsito (por categoria)
2. **Pizza**: Distribuição de prioridades
3. **Linha**: Evolução do estoque ao longo do tempo
4. **Barras Horizontais**: Top 5 itens mais críticos

## ✅ Validações Importantes

### **Ao Diminuir Necessidade**
```javascript
if (newQuantity < currentInTransit) {
  showWarning(
    'Atenção!',
    `Há ${currentInTransit} unidades em trânsito. 
     Reduzir a necessidade pode resultar em excesso de estoque.`
  );
}
```

### **Ao Remover Item**
```javascript
if (item.in_transit > 0) {
  showError(
    'Não é possível remover',
    `Há ${item.in_transit} unidades em trânsito. 
     Aguarde as entregas ou cancele-as primeiro.`
  );
  return;
}

if (item.current_stock > 0) {
  showConfirm(
    'Confirmar remoção',
    `Há ${item.current_stock} unidades em estoque. 
     Deseja realmente remover este item?`
  );
}
```

### **Ao Cancelar Entrega**
```javascript
if (['reserved', 'picked_up', 'in_transit'].includes(delivery.status)) {
  showError(
    'Não é possível cancelar',
    'Esta entrega já foi confirmada pelo voluntário e não pode ser cancelada.'
  );
  return;
}
```

## 🚀 Implementação

### **Backend (Prioridade)**
1. Criar models: `ShelterInventoryItem`, `InventoryMovement`
2. Criar endpoints CRUD para inventory items
3. Criar endpoints para movimentações
4. Criar endpoint de métricas/dashboard
5. Adicionar validações de negócio
6. Integrar com sistema de deliveries existente

### **Frontend (Prioridade)**
1. Redesenhar `ShelterDashboard` completo
2. Criar componentes de cards de estoque
3. Implementar gráficos (Chart.js ou Recharts)
4. Criar modais de ajuste/movimentação
5. Adicionar validações e feedbacks
6. Implementar atualização em tempo real

## 📱 Usabilidade

### **Princípios**
- **Visão Rápida**: Dashboard mostra tudo em uma tela
- **Ações Rápidas**: Botões [+][-] para ajustes imediatos
- **Feedback Claro**: Sempre mostrar o que está acontecendo
- **Validações Preventivas**: Evitar erros antes que aconteçam
- **Histórico Completo**: Rastreabilidade de todas as ações

### **Responsividade**
- Desktop: Layout em grid com gráficos lado a lado
- Tablet: Layout em coluna única com gráficos empilhados
- Mobile: Cards compactos com ações em menu

## 🎨 Paleta de Cores

- **Verde** (#10b981): Estoque OK (>50% do necessário)
- **Amarelo** (#f59e0b): Atenção (20-50% do necessário)
- **Vermelho** (#ef4444): Crítico (<20% do necessário)
- **Azul** (#3b82f6): Em trânsito
- **Cinza** (#6b7280): Inativo/Histórico

---

**Última atualização:** 02/03/2026  
**Status:** Planejamento - Aguardando aprovação para implementação
