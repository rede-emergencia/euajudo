# Análise do Sistema de Estados do Frontend

## ✅ Backend Validado

**Teste executado:** `backend/test_generic_flow.py`

```
✅ TESTE PASSOU!
- Commitment parcial cria nova delivery
- Cancelamento deleta delivery corretamente  
- Nenhuma delivery órfã fica no banco
```

**Conclusão:** Backend está 100% funcional. O problema está no frontend.

---

## ❌ Problemas Identificados no Frontend

### 1. **Delay nos Botões "Me Comprometer"**

**Sintoma:** Ao fazer login, botões aparecem como "Somente Voluntários" por alguns segundos antes de liberar.

**Causa:** `MapView.jsx` usa função local `getUserActiveCommitments()` que:
- Verifica dados locais (`deliveries`, `resourceRequests`) que podem estar desatualizados
- Não sincroniza com `UserStateContext`
- Depende de `loadData()` que roda a cada 10 segundos

**Código problemático:**
```javascript
// MapView.jsx linha 152-174
const getUserActiveCommitments = () => {
  // Usa UserStateContext mas dados locais podem estar desatualizados
  const hasActiveOperation = userState.activeOperation !== null;
  // ...
};

const isUserIdle = () => {
  const { hasActiveCommitment } = getUserActiveCommitments();
  return !hasActiveCommitment;
};
```

### 2. **Polling Excessivo**

**Problema:** `MapView.jsx` carrega dados a cada 10 segundos:

```javascript
// MapView.jsx linha 184-192
useEffect(() => {
  loadData();
  const interval = setInterval(() => {
    loadData();
  }, 10000); // ❌ Polling a cada 10s
  return () => clearInterval(interval);
}, []);
```

**Impacto:**
- Requisições desnecessárias ao backend
- Delay na atualização de estado
- Não é event-driven

### 3. **Múltiplas Fontes de Verdade**

**Problema:** Estado do usuário vem de 3 lugares diferentes:

1. **UserStateContext** - Carrega deliveries ativas via API
2. **MapView local state** - `deliveries`, `resourceRequests`, `batches`
3. **Função local** - `getUserActiveCommitments()` verifica localmente

**Resultado:** Inconsistências e delays.

---

## ✅ Soluções Propostas

### 1. **Tornar Event-Driven**

Remover polling e usar eventos:

```javascript
// Após commit
await handleDeliveryCommitment(deliveryId, quantity);
window.dispatchEvent(new Event('refreshUserState')); // ✅ Event-driven
await loadData(); // Recarregar dados do mapa
```

### 2. **Única Fonte de Verdade**

Usar apenas `UserStateContext` para verificar estado do usuário:

```javascript
// MapView.jsx
const isUserIdle = () => {
  return userState.activeOperation === null; // ✅ Simples e direto
};
```

### 3. **Remover Polling**

Carregar dados apenas quando necessário:

```javascript
useEffect(() => {
  loadData(); // ✅ Carregar apenas no mount
}, []);

// Recarregar apenas após ações do usuário
const handleAction = async () => {
  await performAction();
  await loadData(); // ✅ Recarregar após ação
  refreshState(); // ✅ Atualizar UserStateContext
};
```

---

## 🔍 Endpoints e Payloads Usados

### MapView carrega:

1. **`GET /api/locations/?active_only=true`**
   - Retorna: `[{id, name, latitude, longitude, ...}]`

2. **`GET /api/deliveries/`**
   - Retorna: `[{id, volunteer_id, status, quantity, ...}]`
   - **Problema:** Retorna TODAS as deliveries, não filtra por usuário

3. **`GET /api/batches/ready`**
   - Retorna: `[{id, quantity_available, ...}]`

4. **`GET /api/resources/requests?status=requesting`**
   - Retorna: `[{id, items, ...}]`

5. **`GET /api/users/`**
   - Retorna: `[{id, email, roles, ...}]`
   - **Problema:** Retorna TODOS os usuários

### UserStateContext carrega:

1. **`GET /api/deliveries/`**
   - Filtra localmente: `d.volunteer_id === user.id`
   - **Problema:** Deveria filtrar no backend

2. **`GET /api/resources/reservations/`**
   - Filtra localmente: `r.user_id === user.id`

---

## 🎯 Implementação Recomendada

### Passo 1: Simplificar `isUserIdle()`

```javascript
// MapView.jsx
const isUserIdle = () => {
  return !userState.activeOperation;
};
```

### Passo 2: Remover Polling

```javascript
// MapView.jsx
useEffect(() => {
  loadData();
  // ❌ REMOVER: setInterval(loadData, 10000)
}, []);
```

### Passo 3: Event-Driven Updates

```javascript
// Após commit
const handleDeliveryCommitment = async (deliveryId, quantity) => {
  // ... fazer commit
  await loadData();
  refreshState(); // Dispara evento para UserStateContext
};

// Após cancel (já existe no Header)
const handleCancelOperation = async () => {
  await cancelEntity(...);
  refreshState(); // ✅ Já implementado
};
```

### Passo 4: Adicionar Filtro no Backend (Opcional)

```python
# deliveries.py
@router.get("/my-active")
def get_my_active_deliveries(current_user: User = Depends(get_current_active_user)):
    """Retorna apenas deliveries ativas do usuário atual"""
    return db.query(Delivery).filter(
        Delivery.volunteer_id == current_user.id,
        Delivery.status.in_([...])
    ).all()
```

---

## 📊 Fluxo Correto

```
1. Login → UserStateContext.loadUserState()
2. MapView carrega dados do mapa
3. Usuário clica "Me Comprometer"
   → isUserIdle() verifica userState.activeOperation
   → Se idle, permite commitment
4. Após commitment:
   → loadData() atualiza mapa
   → refreshState() atualiza UserStateContext
   → Header/Dashboard detectam nova delivery
5. Usuário cancela em "Ações"
   → cancelEntity() deleta delivery
   → refreshState() atualiza UserStateContext
   → isUserIdle() retorna true
6. Usuário pode fazer novo commitment
```

---

## 🐛 Logs Adicionados para Debug

### UserStateContext:
```
🔄 UserStateContext: loadUserState chamado
📦 UserStateContext: Deliveries recebidas: 5
📦 UserStateContext: Todas deliveries: [...]
  Delivery 1: volunteer_id=3, match=true, status=pending_confirmation
✅ UserStateContext: Active deliveries encontradas: 1
🎯 UserStateContext: Estado final: { operationsCount: 1, activeOperation: {...} }
```

### Header:
```
🗑️ Header: Cancelando operação: { type: "delivery", id: 6 }
✅ Header: Cancelamento sucesso
```

---

## ✅ Próximos Passos

1. ✅ Simplificar `isUserIdle()` no MapView
2. ✅ Remover polling de 10s
3. ✅ Garantir `refreshState()` após todas as ações
4. ✅ Testar fluxo completo com logs
5. ⏳ Remover logs após validação
