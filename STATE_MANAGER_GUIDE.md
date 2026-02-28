# 🎯 Gerenciador de Estados Centralizado - VouAjudar

## 📋 Visão Geral

O **UserStateContext** é um gerenciador de estados centralizado que controla o estado de cada usuário (fornecedor, abrigo, voluntário) na aplicação VouAjudar.

### **Princípios Fundamentais:**

1. **Um Estado por Vez:** Cada usuário só pode ter UMA operação ativa por vez
2. **Sincronização Automática:** Estados são sincronizados com backend a cada 30 segundos
3. **UI Responsiva:** Interface responde automaticamente ao estado atual
4. **Cores Consistentes:** Header e bordas compartilham o mesmo estado e cor

---

## 🎨 Estados Disponíveis

### **1. `idle` - Disponível (Verde)**
```javascript
{
  background: '#dcfce7',
  border: '#bbf7d0',
  shadow: 'rgba(34, 197, 94, 0.2)',
  text: '#16a34a',
  label: 'Disponível'
}
```
- **Quando:** Usuário sem operações ativas
- **Ações permitidas:** Pode iniciar nova operação
- **Visual:** Verde claro

### **2. `reserved` - Em Movimento (Amarelo)**
```javascript
{
  background: '#fef3c7',
  border: '#fde68a',
  shadow: 'rgba(217, 119, 6, 0.2)',
  text: '#d97706',
  label: 'Em Movimento'
}
```
- **Quando:** Operação reservada, indo buscar
- **Ações permitidas:** Confirmar retirada, Cancelar
- **Visual:** Amarelo

### **3. `picked_up` / `in_transit` - Em Trânsito (Azul)**
```javascript
{
  background: '#dbeafe',
  border: '#93c5fd',
  shadow: 'rgba(59, 130, 246, 0.2)',
  text: '#2563eb',
  label: 'Em Trânsito'
}
```
- **Quando:** Item retirado, em trânsito para entrega
- **Ações permitidas:** Confirmar entrega
- **Visual:** Azul

### **4. `delivering` - Entregando (Roxo)**
```javascript
{
  background: '#e0e7ff',
  border: '#c7d2fe',
  shadow: 'rgba(99, 102, 241, 0.2)',
  text: '#6366f1',
  label: 'Entregando'
}
```
- **Quando:** Insumos adquiridos, indo entregar
- **Ações permitidas:** Confirmar entrega
- **Visual:** Roxo

---

## 🔧 Como Usar

### **1. Importar o Hook**
```javascript
import { useUserState } from '../contexts/UserStateContext';
```

### **2. Usar no Componente**
```javascript
function MyComponent() {
  const { 
    userState,           // Estado completo
    refreshState,        // Função para atualizar
    canStartNewOperation, // Verificar se pode iniciar nova operação
    getStateInfo,        // Obter informações do estado
    isIdle,              // Helpers booleanos
    isReserved,
    isPickedUp,
    isInTransit,
    isDelivering,
    colors               // Cores atuais
  } = useUserState();

  // Exemplo: Verificar se pode iniciar nova operação
  if (!canStartNewOperation()) {
    return <div>Você já tem uma operação ativa!</div>;
  }

  // Exemplo: Usar cores do estado
  return (
    <div style={{ 
      background: colors.background,
      border: `2px solid ${colors.border}`
    }}>
      <h1>{colors.label}</h1>
    </div>
  );
}
```

### **3. Atualizar Estado Após Ação**
```javascript
// Após confirmar retirada, cancelar, etc.
await refreshState();

// Ou disparar evento global
window.dispatchEvent(new Event('refreshUserState'));
```

---

## 📊 Estrutura do Estado

```javascript
{
  // Estado atual do usuário
  currentState: 'idle' | 'reserved' | 'picked_up' | 'in_transit' | 'delivering',
  
  // Operação ativa (apenas UMA)
  activeOperation: {
    type: 'delivery' | 'reservation',
    id: 123,
    status: 'reserved',
    title: 'Retirada em Andamento',
    description: '10 itens para Abrigo Central',
    createdAt: '2024-01-01T10:00:00Z',
    metadata: { /* dados completos */ }
  },
  
  // Histórico de operações (todas)
  operationHistory: [...],
  
  // Cores do estado atual
  stateColors: {
    background: '#fef3c7',
    border: '#fde68a',
    shadow: 'rgba(217, 119, 6, 0.2)',
    text: '#d97706',
    label: 'Em Movimento'
  },
  
  // Metadados
  lastUpdate: Date,
  isLoading: false,
  error: null
}
```

---

## 🔄 Fluxo de Estados

### **Voluntário - Entrega de Produtos**
```
idle (Verde)
  ↓ [Comprometer-se com entrega]
reserved (Amarelo) - "Retirada em Andamento"
  ↓ [Confirmar retirada]
picked_up (Azul) - "Entrega em Andamento"
  ↓ [Confirmar entrega]
idle (Verde)
```

### **Voluntário - Compra de Insumos**
```
idle (Verde)
  ↓ [Reservar insumos]
reserved (Amarelo) - "Compra de Insumos"
  ↓ [Confirmar aquisição]
delivering (Roxo) - "Entregando Insumos"
  ↓ [Confirmar entrega]
idle (Verde)
```

### **Fornecedor**
```
idle (Verde)
  ↓ [Publicar lote]
idle (Verde) - Aguardando voluntários
  ↓ [Voluntário se compromete]
idle (Verde) - Aguardando retirada
```

### **Abrigo**
```
idle (Verde)
  ↓ [Solicitar itens]
idle (Verde) - Aguardando atendimento
  ↓ [Receber itens]
idle (Verde)
```

---

## 🎯 Regras de Negócio

### **1. Uma Operação por Vez**
```javascript
// CORRETO: Verificar antes de iniciar nova operação
if (canStartNewOperation()) {
  // Iniciar nova operação
} else {
  showNotification('Você já tem uma operação ativa!', 'error');
}
```

### **2. Cancelamento Apenas em `reserved`**
```javascript
// CORRETO: Só pode cancelar se ainda não pegou
if (userState.currentState === 'reserved') {
  // Permitir cancelamento
} else {
  showNotification('Não é possível cancelar após retirada', 'error');
}
```

### **3. Sincronização Automática**
```javascript
// Atualização automática a cada 30 segundos
// Não precisa fazer nada, é automático!

// Mas pode forçar atualização após ação:
await refreshState();
```

---

## 🔔 Eventos Globais

### **`userStateChange`**
Disparado quando o estado do usuário muda.

```javascript
window.addEventListener('userStateChange', (event) => {
  console.log('Novo estado:', event.detail.state);
  console.log('Cores:', event.detail.colors);
  console.log('Tem operação ativa:', event.detail.hasActiveOperation);
  console.log('Operação:', event.detail.operation);
});
```

### **`refreshUserState`**
Disparado para forçar atualização do estado.

```javascript
// Disparar após ação
window.dispatchEvent(new Event('refreshUserState'));
```

---

## 📱 Integração com Componentes

### **Header.jsx**
```javascript
// O Header já está integrado e usa o UserStateContext
// Cores e estados são sincronizados automaticamente
```

### **App.jsx**
```javascript
// O App.jsx ouve eventos de mudança de estado
// Atualiza bordas e background automaticamente
```

### **Dashboards**
```javascript
// Dashboards devem usar useUserState() para:
// 1. Verificar se pode iniciar nova operação
// 2. Mostrar/esconder botões baseado no estado
// 3. Atualizar cores e visual
```

---

## 🎨 Exemplo Completo

```javascript
import { useUserState } from '../contexts/UserStateContext';

function VolunteerDashboard() {
  const { 
    userState, 
    canStartNewOperation, 
    refreshState,
    colors 
  } = useUserState();

  const handleCommit = async (deliveryId) => {
    // 1. Verificar se pode iniciar nova operação
    if (!canStartNewOperation()) {
      showNotification('Você já tem uma operação ativa!', 'error');
      return;
    }

    // 2. Fazer a ação
    await api.commitToDelivery(deliveryId);

    // 3. Atualizar estado
    await refreshState();

    // 4. Feedback
    showNotification('Compromisso confirmado!', 'success');
  };

  const handleCancel = async () => {
    // 1. Verificar se pode cancelar
    if (userState.currentState !== 'reserved') {
      showNotification('Não é possível cancelar após retirada', 'error');
      return;
    }

    // 2. Fazer a ação
    await api.cancelDelivery(userState.activeOperation.id);

    // 3. Atualizar estado
    await refreshState();

    // 4. Feedback
    showNotification('Operação cancelada!', 'success');
  };

  return (
    <div style={{ 
      background: colors.background,
      border: `2px solid ${colors.border}`
    }}>
      <h1>{colors.label}</h1>
      
      {userState.activeOperation ? (
        <div>
          <p>{userState.activeOperation.title}</p>
          <p>{userState.activeOperation.description}</p>
          
          {userState.currentState === 'reserved' && (
            <button onClick={handleCancel}>
              Cancelar
            </button>
          )}
        </div>
      ) : (
        <button onClick={() => handleCommit(123)}>
          Comprometer-se
        </button>
      )}
    </div>
  );
}
```

---

## 🚀 Benefícios

### **1. Consistência**
- ✅ Cores sempre sincronizadas (Header + Bordas + Background)
- ✅ Estado único e centralizado
- ✅ Lógica de negócio em um só lugar

### **2. Simplicidade**
- ✅ Um hook para tudo: `useUserState()`
- ✅ Atualização automática a cada 30s
- ✅ Eventos globais para sincronização

### **3. Segurança**
- ✅ Uma operação por vez (garantido)
- ✅ Validações centralizadas
- ✅ Estado sempre sincronizado com backend

### **4. Performance**
- ✅ Atualização inteligente (apenas quando necessário)
- ✅ Cache de estado
- ✅ Eventos eficientes

---

## 🎯 Resumo

**O UserStateContext é o coração da aplicação VouAjudar.**

Ele garante que:
- ✅ Cada usuário tem apenas UMA operação ativa
- ✅ UI responde automaticamente ao estado
- ✅ Cores são consistentes em toda aplicação
- ✅ Estados são sincronizados com backend
- ✅ Lógica de negócio é centralizada

**Use `useUserState()` em todos os componentes que precisam saber o estado do usuário!**
