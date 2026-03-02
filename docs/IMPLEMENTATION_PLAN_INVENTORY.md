# Plano de Implementação - Sistema de Estoque para Abrigos

## 🎯 Objetivo

Transformar o dashboard do abrigo de um sistema de "solicitações pontuais" para um **sistema completo de gestão de estoque** com controle total de entrada, saída e necessidades.

## 📊 Fases de Implementação

### **FASE 1: Backend - Modelos e API** (Prioridade ALTA)

#### 1.1 Criar Modelos de Dados
```python
# backend/models.py

class ShelterInventoryItem(Base):
    """Item do inventário/estoque do abrigo"""
    __tablename__ = "shelter_inventory_items"
    
    id = Column(Integer, primary_key=True)
    shelter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    
    # Quantidades
    needed_quantity = Column(Integer, nullable=False)  # Quanto precisa
    current_stock = Column(Integer, default=0)         # Quanto tem
    reserved_quantity = Column(Integer, default=0)     # Reservado (entregas confirmadas)
    
    # Configurações
    metadata_cache = Column(JSON, default={})  # Atributos específicos
    priority = Column(String, default="medium")  # urgent, high, medium, low
    min_stock_alert = Column(Integer, nullable=True)  # Alerta de estoque mínimo
    
    # Controle
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    shelter = relationship("User", back_populates="inventory_items")
    category = relationship("Category")
    movements = relationship("InventoryMovement", back_populates="inventory_item")


class InventoryMovement(Base):
    """Movimentação de estoque (entrada/saída)"""
    __tablename__ = "inventory_movements"
    
    id = Column(Integer, primary_key=True)
    inventory_item_id = Column(Integer, ForeignKey("shelter_inventory_items.id"), nullable=False)
    
    # Tipo de movimentação
    movement_type = Column(String, nullable=False)  # 'in' ou 'out'
    quantity = Column(Integer, nullable=False)
    
    # Origem/Destino
    source_type = Column(String, nullable=False)  
    # 'donation', 'purchase', 'transfer_in', 'distribution', 'loss', 'adjustment'
    
    delivery_id = Column(Integer, ForeignKey("deliveries.id"), nullable=True)
    
    # Detalhes
    notes = Column(Text, nullable=True)
    metadata = Column(JSON, default={})
    
    # Controle
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    inventory_item = relationship("ShelterInventoryItem", back_populates="movements")
    delivery = relationship("Delivery")
    created_by_user = relationship("User")
```

#### 1.2 Criar Endpoints da API

**Arquivo:** `backend/routers/shelter_inventory.py`

```python
# GET /api/shelter/inventory - Listar todos os itens do estoque
# POST /api/shelter/inventory - Criar novo item
# GET /api/shelter/inventory/{id} - Detalhes de um item
# PUT /api/shelter/inventory/{id} - Atualizar item
# DELETE /api/shelter/inventory/{id} - Remover item (com validações)

# POST /api/shelter/inventory/{id}/adjust - Ajustar quantidade necessária
# POST /api/shelter/inventory/{id}/movement - Registrar entrada/saída

# GET /api/shelter/inventory/dashboard - Métricas e KPIs
# GET /api/shelter/inventory/{id}/history - Histórico de movimentações
```

#### 1.3 Lógica de Negócio

**Regras Importantes:**

1. **Ao criar Delivery** → Incrementar `reserved_quantity`
2. **Ao cancelar Delivery** → Decrementar `reserved_quantity`
3. **Ao confirmar entrega** → Criar `InventoryMovement` (entrada) + Atualizar `current_stock` + Decrementar `reserved_quantity`
4. **Ao ajustar necessidade** → Validar se não há conflito com `reserved_quantity`
5. **Ao remover item** → Validar se `reserved_quantity == 0` e `current_stock == 0`

### **FASE 2: Frontend - Novo Dashboard** (Prioridade ALTA)

#### 2.1 Estrutura de Componentes

```
frontend/src/pages/
├── ShelterDashboard.jsx (REDESIGN COMPLETO)
│
frontend/src/components/shelter/
├── InventoryOverview.jsx       # Cards de métricas
├── InventoryItemCard.jsx       # Card de cada item
├── InventoryChart.jsx          # Gráficos
├── AddItemModal.jsx            # Modal adicionar item
├── AdjustQuantityModal.jsx     # Modal ajustar quantidade
├── MovementModal.jsx           # Modal registrar entrada/saída
├── ItemHistoryModal.jsx        # Modal histórico
└── InventoryFilters.jsx        # Filtros e busca
```

#### 2.2 Novo Layout do Dashboard

```jsx
<ShelterDashboard>
  {/* Header com métricas */}
  <InventoryOverview 
    totalItems={12}
    criticalItems={3}
    inTransit={8}
    receivedToday={15}
  />
  
  {/* Gráficos */}
  <InventoryChart 
    data={inventoryData}
    type="bar" // ou "line" ou "pie"
  />
  
  {/* Filtros */}
  <InventoryFilters 
    onFilterChange={handleFilter}
    categories={categories}
  />
  
  {/* Lista de itens */}
  <div className="inventory-grid">
    {inventoryItems.map(item => (
      <InventoryItemCard 
        key={item.id}
        item={item}
        onIncrease={() => handleAdjust(item.id, 'increase')}
        onDecrease={() => handleAdjust(item.id, 'decrease')}
        onEdit={() => handleEdit(item.id)}
        onDelete={() => handleDelete(item.id)}
        onViewHistory={() => handleHistory(item.id)}
      />
    ))}
  </div>
  
  {/* Botão adicionar */}
  <FloatingActionButton onClick={handleAddItem} />
</ShelterDashboard>
```

#### 2.3 Card de Item do Estoque

```jsx
<InventoryItemCard>
  {/* Header */}
  <div className="card-header">
    <CategoryIcon icon={item.category.icon} />
    <h3>{item.category.name}</h3>
    <PriorityBadge priority={item.priority} />
  </div>
  
  {/* Métricas */}
  <div className="metrics">
    <Metric label="Necessário" value={item.needed_quantity} />
    <Metric label="Estoque" value={item.current_stock} color="green" />
    <Metric label="Falta" value={item.needed_quantity - item.current_stock} color="red" />
  </div>
  
  {/* Barra de progresso */}
  <ProgressBar 
    current={item.current_stock}
    reserved={item.reserved_quantity}
    needed={item.needed_quantity}
  />
  
  {/* Alertas */}
  {item.reserved_quantity > 0 && (
    <Alert type="info">
      🚚 {item.reserved_quantity} unidades em trânsito
    </Alert>
  )}
  
  {item.current_stock < item.min_stock_alert && (
    <Alert type="warning">
      ⚠️ Estoque abaixo do mínimo
    </Alert>
  )}
  
  {/* Ações */}
  <div className="actions">
    <IconButton icon="+" onClick={onIncrease} />
    <IconButton icon="-" onClick={onDecrease} />
    <IconButton icon="edit" onClick={onEdit} />
    <IconButton icon="trash" onClick={onDelete} />
    <IconButton icon="history" onClick={onViewHistory} />
  </div>
</InventoryItemCard>
```

### **FASE 3: Integração com Sistema Existente** (Prioridade MÉDIA)

#### 3.1 Migração de Dados

```python
# Script de migração: backend/migrations/migrate_to_inventory.py

def migrate_deliveries_to_inventory():
    """
    Migrar deliveries existentes para o novo sistema de inventário
    """
    # 1. Agrupar deliveries por shelter + category
    # 2. Criar ShelterInventoryItem para cada grupo
    # 3. Calcular needed_quantity (soma de deliveries disponíveis)
    # 4. Calcular reserved_quantity (soma de deliveries confirmadas)
    # 5. Manter deliveries existentes vinculados
```

#### 3.2 Sincronização Automática

```python
# Quando Delivery é criado
@event.listens_for(Delivery, 'after_insert')
def update_inventory_on_delivery_create(mapper, connection, target):
    # Incrementar reserved_quantity do item correspondente
    pass

# Quando Delivery é confirmado (entregue)
@event.listens_for(Delivery, 'after_update')
def update_inventory_on_delivery_confirm(mapper, connection, target):
    if target.status == 'delivered':
        # Criar InventoryMovement (entrada)
        # Incrementar current_stock
        # Decrementar reserved_quantity
        pass

# Quando Delivery é cancelado
@event.listens_for(Delivery, 'after_update')
def update_inventory_on_delivery_cancel(mapper, connection, target):
    if target.status == 'cancelled':
        # Decrementar reserved_quantity
        pass
```

### **FASE 4: Gráficos e Visualizações** (Prioridade MÉDIA)

#### 4.1 Biblioteca de Gráficos

Usar **Recharts** (leve e fácil de usar)

```bash
npm install recharts
```

#### 4.2 Tipos de Gráficos

1. **Gráfico de Barras**: Necessário vs Estoque vs Em Trânsito
```jsx
<BarChart data={inventoryData}>
  <Bar dataKey="needed" fill="#ef4444" name="Necessário" />
  <Bar dataKey="stock" fill="#10b981" name="Estoque" />
  <Bar dataKey="reserved" fill="#3b82f6" name="Em Trânsito" />
</BarChart>
```

2. **Gráfico de Pizza**: Distribuição por Prioridade
```jsx
<PieChart>
  <Pie data={priorityData} dataKey="value" nameKey="name" />
</PieChart>
```

3. **Gráfico de Linha**: Evolução do Estoque
```jsx
<LineChart data={historyData}>
  <Line type="monotone" dataKey="stock" stroke="#10b981" />
</LineChart>
```

### **FASE 5: Validações e UX** (Prioridade ALTA)

#### 5.1 Validações Críticas

```javascript
// Ao diminuir necessidade
const handleDecreaseNeed = (itemId) => {
  const item = inventoryItems.find(i => i.id === itemId);
  
  if (item.reserved_quantity > 0) {
    showConfirm(
      'Atenção: Entregas em Trânsito',
      `Há ${item.reserved_quantity} unidades já confirmadas por voluntários.
       Reduzir a necessidade pode resultar em excesso de estoque.
       Deseja continuar?`,
      () => proceedWithDecrease(itemId)
    );
  } else {
    proceedWithDecrease(itemId);
  }
};

// Ao remover item
const handleDeleteItem = (itemId) => {
  const item = inventoryItems.find(i => i.id === itemId);
  
  if (item.reserved_quantity > 0) {
    showError(
      'Não é Possível Remover',
      `Há ${item.reserved_quantity} unidades em trânsito.
       Aguarde as entregas serem concluídas ou cancele-as primeiro.`
    );
    return;
  }
  
  if (item.current_stock > 0) {
    showConfirm(
      'Confirmar Remoção',
      `Há ${item.current_stock} unidades em estoque.
       Deseja realmente remover este item?`,
      () => proceedWithDelete(itemId)
    );
  } else {
    proceedWithDelete(itemId);
  }
};
```

#### 5.2 Feedback Visual

- **Loading states** em todas as ações
- **Animações suaves** ao adicionar/remover itens
- **Toasts** para confirmações rápidas
- **Modais** para ações importantes
- **Cores semânticas** (verde/amarelo/vermelho)

### **FASE 6: Testes e Refinamento** (Prioridade MÉDIA)

#### 6.1 Testes Backend

```python
# tests/test_inventory.py

def test_create_inventory_item():
    """Criar item de inventário"""
    pass

def test_adjust_quantity_with_reserved():
    """Não permitir reduzir abaixo do reservado"""
    pass

def test_delete_item_with_stock():
    """Não permitir deletar com estoque"""
    pass

def test_movement_updates_stock():
    """Movimentação atualiza estoque corretamente"""
    pass

def test_delivery_sync_with_inventory():
    """Delivery sincroniza com inventário"""
    pass
```

#### 6.2 Testes Frontend

- Testar fluxo completo de adicionar item
- Testar ajuste de quantidades
- Testar validações
- Testar gráficos com dados reais
- Testar responsividade

## 📅 Cronograma Estimado

| Fase | Descrição | Tempo Estimado |
|------|-----------|----------------|
| 1 | Backend - Modelos e API | 2-3 dias |
| 2 | Frontend - Novo Dashboard | 3-4 dias |
| 3 | Integração | 1-2 dias |
| 4 | Gráficos | 1-2 dias |
| 5 | Validações e UX | 1-2 dias |
| 6 | Testes | 1-2 dias |
| **TOTAL** | | **9-15 dias** |

## 🚀 Próximos Passos

1. ✅ Documentação criada
2. ⏳ Aprovação do plano
3. ⏳ Implementar FASE 1 (Backend)
4. ⏳ Implementar FASE 2 (Frontend)
5. ⏳ Testes e ajustes
6. ⏳ Deploy MVP

---

**Status:** Aguardando aprovação para iniciar implementação  
**Última atualização:** 02/03/2026
