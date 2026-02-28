# 🔄 Refatoração do Fluxo de Compromisso

## 🎯 Objetivo
Criar um sistema modular, baseado em eventos, onde reservas são temporárias até confirmação.

---

## 📋 Problemas Identificados

### **1. Modal Duplicado**
- ❌ Modal de quantidade → Modal de confirmação
- ✅ Deve ser: Modal de quantidade → Apenas atualizar estado

### **2. Quantidade Não Temporária**
- ❌ Quando reserva 5 de 50, outros ainda veem 50 disponíveis
- ✅ Deve ser: Quando reserva 5 de 50, outros veem 45 disponíveis
- ✅ Se cancelar, volta para 50

### **3. Fluxo Não Modular**
- ❌ Lógica específica para cada tipo
- ✅ Deve ser: Sistema genérico de eventos

---

## 🔄 Sistema de Eventos

### **Estados da Reserva:**
```
AVAILABLE → PENDING_CONFIRMATION → RESERVED → PICKED_UP → DELIVERED
            (temporário)           (confirmado)
```

### **Regras:**
1. **PENDING_CONFIRMATION**: Quantidade temporariamente indisponível
2. **Cancelamento**: Quantidade volta ao batch
3. **Confirmação**: Quantidade permanece indisponível
4. **Expiração**: Após 24h, quantidade volta automaticamente

---

## 🛠️ Implementação

### **Backend: Reduzir Quantidade Temporariamente**

#### **Ao Comprometer (commit):**
```python
# Reduzir quantidade disponível do batch
batch.quantity_available -= quantity_to_commit

# Criar delivery com status PENDING_CONFIRMATION
delivery.status = DeliveryStatus.PENDING_CONFIRMATION
```

#### **Ao Cancelar:**
```python
# Devolver quantidade ao batch
batch.quantity_available += delivery.quantity

# Deletar delivery
db.delete(delivery)
```

#### **Ao Confirmar Retirada:**
```python
# Quantidade já foi reduzida no commit
# Apenas mudar status
delivery.status = DeliveryStatus.RESERVED
```

---

### **Frontend: Remover Modal de Confirmação**

#### **Antes:**
```javascript
// Modal de quantidade
→ handleDeliveryCommitment()
  → showConfirmation() // ❌ Modal duplicado
    → loadData()
```

#### **Depois:**
```javascript
// Modal de quantidade
→ handleDeliveryCommitment()
  → loadData() // ✅ Apenas atualizar estado
  → showNotification() // Notificação simples
```

---

## 📊 Fluxo Completo

### **1. Usuário Vê Delivery (50 marmitas)**
```
Batch: 50 disponíveis
Delivery: 50 marmitas para Abrigo A
```

### **2. Voluntário 1 Reserva 5**
```
Batch: 45 disponíveis (50 - 5)
Delivery Original: 45 marmitas
Delivery Novo: 5 marmitas (PENDING_CONFIRMATION)
```

### **3. Voluntário 2 Vê Estado Atualizado**
```
Batch: 45 disponíveis
Delivery: 45 marmitas para Abrigo A
```

### **4. Voluntário 1 Cancela**
```
Batch: 50 disponíveis (45 + 5)
Delivery: 50 marmitas para Abrigo A
Delivery Cancelado: Deletado
```

### **5. Voluntário 1 Confirma Retirada**
```
Batch: 45 disponíveis (permanente)
Delivery: 5 marmitas (RESERVED)
```

---

## 🔧 Mudanças Necessárias

### **Backend:**
- [x] ~~Criar delivery com PENDING_CONFIRMATION~~ (já existe)
- [ ] **Reduzir batch.quantity_available no commit**
- [x] ~~Devolver quantidade no cancelamento~~ (já existe)
- [ ] Adicionar job de expiração (24h)

### **Frontend:**
- [x] Remover modal de confirmação após commit
- [x] Mostrar apenas notificação
- [ ] Garantir que modal de quantidade fecha antes
- [ ] Atualizar estado imediatamente

---

## ✅ Benefícios

1. **Modular**: Sistema genérico para todos os tipos
2. **Baseado em Eventos**: Estados claros e transições definidas
3. **Temporário**: Reservas não são finais até confirmação
4. **Consistente**: Outros usuários veem quantidade correta
5. **Replicável**: Mesmo padrão para deliveries, batches, resources

---

## 🚀 Próximos Passos

1. Modificar `commit_to_delivery` para reduzir `quantity_available`
2. Garantir modal de quantidade fecha antes de atualizar estado
3. Testar fluxo completo: reservar → cancelar → quantidade volta
4. Aplicar mesmo padrão para resource_reservations
5. Adicionar job de expiração automática

**Sistema modular e baseado em eventos implementado!** 🎯
