# 🗺️ REVISÃO DA ARQUITETURA DO MAPA

**Data:** 2 de Março, 2026  
**Objetivo:** Entender como mostrar necessidades dos abrigos no mapa

---

## 🎯 **PROBLEMA ATUAL**

### **O que está acontecendo:**
- ✅ Mapa mostra 2 locations (abrigos)
- ❌ Todos os ícones aparecem VERDES
- ❌ Console mostra: `Resource requests loaded: []`
- ❌ Não está carregando os shelter requests

### **O que deveria acontecer:**
- 🔴 Abrigos com **necessidades ativas** → ícone VERMELHO
- 🟢 Abrigos sem necessidades → ícone VERDE
- 📋 Voluntário vê necessidades e pode se comprometer

---

## 📊 **MODELO ATUAL DO BANCO**

### **1. ShelterRequest (Necessidades do Abrigo)**
```sql
CREATE TABLE shelter_requests (
    id INTEGER PRIMARY KEY,
    shelter_id INTEGER,           -- ID do abrigo
    category_id INTEGER,          -- Categoria do produto/serviço
    quantity_requested INTEGER,   -- Quantidade solicitada
    quantity_received INTEGER,    -- Quantidade já recebida
    status TEXT,                  -- pending, partial, completed, cancelled
    notes TEXT,
    created_at TIMESTAMP
)
```

**Status:**
- `pending` - Aguardando doações
- `partial` - Parcialmente atendido
- `completed` - Totalmente atendido
- `cancelled` - Cancelado

### **2. InventoryItem (Estoque do Abrigo)**
```sql
CREATE TABLE inventory_items (
    id INTEGER PRIMARY KEY,
    shelter_id INTEGER,
    category_id INTEGER,
    quantity_in_stock INTEGER,
    quantity_reserved INTEGER,
    quantity_available INTEGER,
    min_threshold INTEGER
)
```

### **3. DeliveryLocation (Localização no Mapa)**
```sql
CREATE TABLE delivery_locations (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,              -- ID do usuário (abrigo)
    name TEXT,
    latitude REAL,
    longitude REAL,
    -- outros campos...
)
```

---

## 🔄 **FLUXO ATUAL**

### **Como funciona hoje:**
1. **Abrigo cria necessidade:**
   - Dashboard → "Pedir Produtos"
   - Seleciona categoria + quantidade
   - Cria `ShelterRequest` com status `pending`

2. **Mapa deveria mostrar:**
   - 🔴 Ícone vermelho se há `ShelterRequest` ativo
   - 🟢 Ícone verde se não há necessidades

3. **Voluntário vê e se compromete:**
   - Clica no ícone vermelho
   - Vê lista de necessidades
   - Se compromete a doar

---

## 🎯 **LÓGICA DE COR DO ÍCONE**

### **Regras:**
```javascript
// VERMELHO: Abrigo tem necessidades ativas
if (hasShelterRequests) {
  color = '#ef4444'  // vermelho
  status = '🔴 Precisa de doações'
}

// VERDE: Abrigo disponível (sem necessidades urgentes)
else {
  color = '#10b981'  // verde
  status = '✅ Disponível'
}
```

### **Como verificar se tem necessidades:**
```javascript
const activeShelterRequests = shelterRequests.filter(r =>
  r.shelter_id === location.user_id &&
  ['pending', 'partial', 'active'].includes(r.status)
);

const hasShelterRequests = activeShelterRequests.length > 0;
```

---

## 🚀 **FUTURO: MÚLTIPLOS TIPOS**

### **Tipos de necessidades:**
1. **Doações de Produtos** (atual)
   - Água, alimentos, roupas, etc.
   - Quantidade específica
   - Status: pending/partial/completed

2. **Solicitações de Serviços** (futuro)
   - Limpeza, manutenção, aulas
   - Duração, pessoas necessárias
   - Metadata diferente

3. **Entregas Diretas** (futuro)
   - Voluntário leva direto para abrigo
   - Sem passar por estoque

### **Ícones diferentes:**
- 🔴 Necessidades de produtos
- 🟣 Necessidades de serviços
- 🔵 Entregas em andamento
- 🟢 Disponível (sem necessidades)

---

## 🔍 **DIAGNÓSTICO DO PROBLEMA**

### **Por que está verde?**
1. ❌ Frontend não está carregando `shelterRequests`
2. ❌ Erro: `inventory is not defined` (já corrigido)
3. ❌ Array vazio: `Resource requests loaded: []`

### **O que precisa funcionar:**
```javascript
// MapView.jsx - loadData()
const responseShelterRequests = await inventory.getRequests();
const requests = responseShelterRequests.data || [];
setShelterRequests(requests);  // Deve ter 1 request

// Depois, na lógica de cor:
const activeShelterRequests = shelterRequests.filter(r =>
  r.shelter_id === location.user_id &&
  ['pending', 'partial', 'active'].includes(r.status)
);

if (activeShelterRequests.length > 0) {
  color = '#ef4444';  // VERMELHO
}
```

---

## ✅ **CORREÇÕES APLICADAS**

1. ✅ Adicionado import: `import { inventory } from '../lib/api';`
2. ✅ Mudado de `fetch()` para `inventory.getRequests()`
3. ✅ Adicionado try-catch para erros
4. ⏳ Aguardando teste no navegador

---

## 🎯 **PRÓXIMOS PASSOS**

### **Imediato:**
1. Testar no navegador se requests carregam
2. Verificar se ícone fica vermelho
3. Confirmar que voluntário vê necessidades

### **Futuro (Serviços):**
1. Criar tipo `ServiceRequest` separado
2. Adicionar ícone roxo para serviços
3. Modal diferente para serviços vs produtos
4. Filtros no mapa (produtos/serviços/todos)

---

## 📝 **RESUMO**

### **Arquitetura está correta:**
- ✅ `ShelterRequest` para necessidades
- ✅ `InventoryItem` para estoque
- ✅ `DeliveryLocation` para mapa
- ✅ Lógica de cor baseada em requests ativos

### **Problema era no frontend:**
- ❌ Não importava `inventory` module
- ❌ Usava `fetch()` sem autenticação
- ✅ Agora usa `inventory.getRequests()` com auth

### **Teste necessário:**
- Recarregar navegador
- Verificar console: `📋 Shelter requests carregados: 1`
- Verificar mapa: ícone vermelho em "Abrigo Centro de Operações"

**A arquitetura está correta - era só um bug de importação!** 🚀
