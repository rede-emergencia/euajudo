# Correções do Dashboard - Revisão Front/Back/Models ✅

**Data:** 2 de Março, 2026  
**Status:** Todos os métodos revisados e corrigidos

## 🐛 Bugs Corrigidos

### 1. **Editar Estoque - ID Undefined** ✅

**Problema:**
```
PUT http://localhost:8000/api/inventory/items/undefined 405 (Method Not Allowed)
```

**Causa:** O schema `CategoryStock` não incluía o campo `id` do InventoryItem.

**Correções:**

**backend/app/inventory_schemas.py:**
```python
class CategoryStock(BaseModel):
    id: int  # ← ADICIONADO - InventoryItem ID needed for updates
    category_id: int
    category_name: str
    ...
```

**backend/app/routers/inventory.py** (2 lugares):
```python
# Inventory by category
inventory_by_category.append(CategoryStock(
    id=item.id,  # ← ADICIONADO
    category_id=item.category_id,
    ...
))

# Low stock alerts
low_stock_alerts = [
    CategoryStock(
        id=item.id,  # ← ADICIONADO
        category_id=item.category_id,
        ...
    )
]
```

### 2. **Método HTTP Errado** ✅

**Problema:** Frontend usava `PUT` mas backend esperava `PATCH`

**Correção:**

**frontend/src/lib/api.js:**
```javascript
// ANTES (errado):
updateItem: (id, data) => api.put(`/api/inventory/items/${id}`, data),

// DEPOIS (correto):
updateItem: (id, data) => api.patch(`/api/inventory/items/${id}`, data),
```

---

## 📋 Revisão Completa de Todos os Métodos

### 1. **inventory.getDashboard()** ✅

**Frontend:**
```javascript
const res = await inventory.getDashboard();
```

**Backend:**
```python
@router.get("/dashboard", response_model=ShelterDashboardData)
def get_shelter_dashboard(...) -> ShelterDashboardData
```

**Models:** `ShelterDashboardData`, `CategoryStock` (com `id`), `InventoryStats`, `RecentActivity`, `ShelterRequestResponse`

**Status:** ✅ Funcionando (ID adicionado)

---

### 2. **inventory.getItems()** ✅

**Frontend:**
```javascript
// Não usado diretamente no dashboard - dados vêm do getDashboard
const res = await inventory.getItems(params);
```

**Backend:**
```python
@router.get("/items", response_model=List[InventoryItemResponse])
def list_inventory_items(...) -> List[InventoryItemResponse]
```

**Models:** `InventoryItemResponse` (já tem `id` ✅)

---

### 3. **inventory.createItem()** ✅

**Frontend:**
```javascript
await inventory.createItem({
    category_id: parseInt(stockForm.category_id),
    quantity_in_stock: parseInt(stockForm.quantity_in_stock),
    min_threshold: parseInt(stockForm.min_threshold) || 0,
});
```

**Backend:**
```python
@router.post("/items", response_model=InventoryItemResponse)
def create_inventory_item(item: InventoryItemCreate, ...)
```

**Models:**
- `InventoryItemCreate` (schema de entrada)
- `InventoryItemResponse` (schema de saída)
- `InventoryItem` (model SQLAlchemy)

**Funcionamento:**
- Se já existe item para a categoria → adiciona quantidade ao estoque existente
- Se não existe → cria novo item com `INITIAL_STOCK` transaction

**Status:** ✅ Funcionando

---

### 4. **inventory.updateItem()** ✅

**Frontend:**
```javascript
await inventory.updateItem(showStockForm.id, {
    quantity_in_stock: parseInt(stockForm.quantity_in_stock),
    min_threshold: parseInt(stockForm.min_threshold),
});
```

**Backend:**
```python
@router.patch("/items/{item_id}", response_model=InventoryItemResponse)
def update_inventory_item(item_id: int, update: InventoryItemUpdate, ...)
```

**Models:**
- `InventoryItemUpdate` (schema de entrada - quantity_in_stock, min_threshold, max_threshold, metadata_cache)
- `InventoryItemResponse` (schema de saída)
- `InventoryItem` (model SQLAlchemy)

**Funcionamento:**
- Calcula diferença de estoque
- Cria transaction `MANUAL_ADJUSTMENT`
- Atualiza timestamps

**Status:** ✅ Funcionando (após correções do ID e PATCH)

---

### 5. **inventory.getRequests()** ✅

**Frontend:**
```javascript
// Dados vêm do getDashboard via active_requests
```

**Backend:**
```python
@router.get("/requests", response_model=List[ShelterRequestResponse])
def list_shelter_requests(...)
```

**Models:** `ShelterRequestResponse` (já tem todos os campos ✅)

---

### 6. **inventory.createRequest()** ✅

**Frontend:**
```javascript
await inventory.createRequest({
    category_id: parseInt(requestForm.category_id),
    quantity_requested: parseInt(requestForm.quantity_requested),
    notes: requestForm.notes || null,
});

// Dispara evento para atualizar mapa
window.dispatchEvent(new CustomEvent('shelterRequestCreated', {...}));
```

**Backend:**
```python
@router.post("/requests", response_model=ShelterRequestResponse)
def create_shelter_request(request: ShelterRequestCreate, ...)
```

**Models:**
- `ShelterRequestCreate` (category_id, quantity_requested, notes)
- `ShelterRequest` (model SQLAlchemy)

**Status:** ✅ Funcionando

---

### 7. **inventory.adjustRequest()** ✅

**Frontend:**
```javascript
await inventory.adjustRequest(showAdjustForm, {
    adjustment_type,  // 'increase' | 'decrease'
    quantity_change,
    reason: adjustForm.reason || 'Ajuste manual',
});
```

**Backend:**
```python
@router.post("/requests/adjust/{request_id}", response_model=RequestAdjustmentResponse)
def adjust_request(request_id: int, adjustment: RequestAdjustmentCreate, ...)
```

**Models:**
- `RequestAdjustmentCreate` (adjustment_type, quantity_change, reason)
- `RequestAdjustmentResponse` (com can_adjust, warning_message)
- `RequestAdjustment` (model SQLAlchemy)

**Funcionamento:**
- Validações: não pode ajustar se completed/cancelled
- `increase` → adiciona à quantidade
- `decrease` → subtrai (mínimo: quantity_pending)
- Cria registro de ajuste

**Status:** ✅ Funcionando

---

### 8. **inventory.cancelRequest()** ✅

**Frontend:**
```javascript
await inventory.cancelRequest(requestId);
```

**Backend:**
```python
@router.post("/requests/{request_id}/cancel")
def cancel_shelter_request(request_id: int, ...)
```

**Models:** `ShelterRequest` (status, cancelled_at)

**Status:** ✅ Funcionando

---

### 9. **inventory.distribute()** ✅

**Frontend:**
```javascript
await inventory.distribute({
    category_id: parseInt(distributeForm.category_id),
    quantity: parseInt(distributeForm.quantity),
    recipient_name: distributeForm.recipient_name || null,
    recipient_document: distributeForm.recipient_document || null,
    notes: distributeForm.notes || null,
});
```

**Backend:**
```python
@router.post("/distribute", response_model=DistributionRecordResponse)
def distribute_items(distribution: DistributionRecordCreate, ...)
```

**Models:**
- `DistributionRecordCreate` (category_id, quantity, recipient_name, recipient_document, notes, distribution_metadata)
- `DistributionRecordResponse`
- `DistributionRecord` (model SQLAlchemy)
- `InventoryTransaction` (com type DONATION_GIVEN)

**Funcionamento:**
- Verifica estoque disponível
- Subtrai do inventory_item
- Cria transaction `DONATION_GIVEN`
- Cria distribution_record

**Status:** ✅ Funcionando (modal atualizado com dropdown de categorias)

---

### 10. **inventory.getShelterDeliveries()** ✅

**Frontend:**
```javascript
const res = await inventory.getShelterDeliveries();
setShelterDeliveries(res.data || []);
```

**Backend:**
```python
@router.get("/shelter-deliveries")
def list_shelter_deliveries(...)
```

**Retorna:** Lista de objetos delivery com:
```python
{
    "id": d.id,
    "quantity": d.quantity,
    "status": d.status.value,
    "category_id": d.category_id,
    "category_name": category.display_name,
    "volunteer_name": volunteer.name,
    "delivery_code": d.delivery_code,
    "pickup_code": d.pickup_code,
    "created_at": d.created_at.isoformat(),
    "delivered_at": d.delivered_at.isoformat() if delivered,
    "parent_delivery_id": d.parent_delivery_id,
}
```

**Status:** ✅ Funcionando

---

## 🎯 Resumo das Correções

| Problema | Arquivo | Correção |
|----------|---------|----------|
| ID undefined no edit | `inventory_schemas.py` | Adicionado `id: int` em `CategoryStock` |
| ID undefined no edit | `routers/inventory.py` | Adicionado `id=item.id` em 2 lugares |
| Método HTTP errado | `api.js` | `PUT` → `PATCH` |

## ✅ Status Final

Todos os métodos do dashboard estão funcionando corretamente:

- ✅ Adicionar estoque (createItem)
- ✅ Editar estoque (updateItem) - **CORRIGIDO**
- ✅ Criar pedido (createRequest)
- ✅ Ajustar pedido (adjustRequest)
- ✅ Cancelar pedido (cancelRequest)
- ✅ Distribuir (distribute)
- ✅ Listar entregas (getShelterDeliveries)
- ✅ Dashboard (getDashboard) - **CORRIGIDO**

**O dashboard está pronto para uso!** 🚀
