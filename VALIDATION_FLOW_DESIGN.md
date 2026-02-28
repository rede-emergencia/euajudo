# 🔐 Sistema de Validação Bidirecional de Códigos

## 🎯 Conceito

**Lógica:** Quem busca tem que entregar o código, quem recebe tem que passar o código para validar.

---

## 📋 Fluxo Completo - Exemplo: Voluntário Entrega Marmitas

### **Etapa 1: Compromisso**
```
Voluntário aceita entregar 20 marmitas do Restaurante X para Abrigo Y
Status: PENDING_CONFIRMATION → RESERVED
Códigos gerados:
  - pickup_code: 123456 (para retirada no restaurante)
  - delivery_code: null (será gerado após retirada)
```

### **Etapa 2: Retirada no Restaurante**
```
1. Voluntário vai ao Restaurante X
2. Voluntário mostra código: 123456
3. Restaurante valida o código
4. Sistema muda status: RESERVED → PICKED_UP
5. Sistema gera delivery_code: 789012
```

### **Etapa 3: Entrega no Abrigo**
```
1. Voluntário vai ao Abrigo Y
2. Abrigo passa código para voluntário: 789012
3. Voluntário valida o código
4. Sistema muda status: PICKED_UP → DELIVERED
5. Voluntário volta ao estado IDLE
```

---

## 🔄 Estados da Delivery

```
AVAILABLE           → Disponível para compromisso
PENDING_CONFIRMATION → Voluntário se comprometeu (aguardando)
RESERVED            → Compromisso confirmado
PICKED_UP           → Retirado do fornecedor
IN_TRANSIT          → Em trânsito (opcional)
DELIVERED           → Entregue no destino
CANCELLED           → Cancelado
EXPIRED             → Expirado
```

---

## 🔐 Sistema de Códigos

### **Código de Retirada (pickup_code)**
- **Gerado:** Quando voluntário se compromete
- **Quem tem:** Voluntário
- **Quem valida:** Fornecedor/Restaurante
- **Ação:** Confirma que voluntário retirou os itens
- **Resultado:** Status RESERVED → PICKED_UP

### **Código de Entrega (delivery_code)**
- **Gerado:** Quando fornecedor valida pickup_code
- **Quem tem:** Abrigo/Destino
- **Quem valida:** Voluntário
- **Ação:** Confirma que voluntário entregou os itens
- **Resultado:** Status PICKED_UP → DELIVERED

---

## 🏗️ Arquitetura Modular

### **Wrapper de Validação**

```python
class ValidationConfig:
    """Configuração de validação para uma transação"""
    requires_pickup_validation: bool = True
    requires_delivery_validation: bool = True
    pickup_validator_role: str = "provider"  # Quem valida retirada
    delivery_validator_role: str = "shelter"  # Quem valida entrega
    
class TransactionValidator:
    """Sistema modular de validação"""
    
    def __init__(self, config: ValidationConfig):
        self.config = config
    
    def validate_pickup(self, code: str, delivery_id: int, user: User):
        """Valida código de retirada"""
        if not self.config.requires_pickup_validation:
            return True
        
        # Verificar se user tem role correto
        if self.config.pickup_validator_role not in user.roles:
            raise HTTPException(403, "Not authorized to validate pickup")
        
        # Validar código
        delivery = get_delivery(delivery_id)
        if delivery.pickup_code != code:
            raise HTTPException(400, "Invalid pickup code")
        
        # Atualizar status e gerar delivery_code
        delivery.status = DeliveryStatus.PICKED_UP
        delivery.picked_up_at = datetime.utcnow()
        delivery.delivery_code = generate_code()
        
        return delivery
    
    def validate_delivery(self, code: str, delivery_id: int, user: User):
        """Valida código de entrega"""
        if not self.config.requires_delivery_validation:
            return True
        
        # Verificar se user é o voluntário
        delivery = get_delivery(delivery_id)
        if delivery.volunteer_id != user.id:
            raise HTTPException(403, "Not authorized to validate delivery")
        
        # Validar código
        if delivery.delivery_code != code:
            raise HTTPException(400, "Invalid delivery code")
        
        # Atualizar status
        delivery.status = DeliveryStatus.DELIVERED
        delivery.delivered_at = datetime.utcnow()
        
        return delivery
```

---

## 📱 Interface de Validação

### **Tela do Fornecedor (Validar Retirada)**
```
┌─────────────────────────────────────┐
│ Validar Retirada                    │
├─────────────────────────────────────┤
│ Voluntário: Maria Silva             │
│ Produto: 20 marmitas                │
│                                     │
│ Digite o código do voluntário:      │
│ [______]                            │
│                                     │
│ [✅ Validar Retirada]               │
└─────────────────────────────────────┘
```

### **Tela do Voluntário (Validar Entrega)**
```
┌─────────────────────────────────────┐
│ Validar Entrega                     │
├─────────────────────────────────────┤
│ Destino: Abrigo São Francisco       │
│ Produto: 20 marmitas                │
│                                     │
│ Digite o código do abrigo:          │
│ [______]                            │
│                                     │
│ [✅ Confirmar Entrega]              │
└─────────────────────────────────────┘
```

---

## 🔧 Endpoints da API

### **POST /api/deliveries/{id}/validate-pickup**
```json
Request:
{
  "code": "123456"
}

Response:
{
  "id": 10,
  "status": "PICKED_UP",
  "pickup_code": "123456",
  "delivery_code": "789012",
  "picked_up_at": "2026-02-28T01:30:00"
}
```

### **POST /api/deliveries/{id}/validate-delivery**
```json
Request:
{
  "code": "789012"
}

Response:
{
  "id": 10,
  "status": "DELIVERED",
  "delivery_code": "789012",
  "delivered_at": "2026-02-28T02:00:00"
}
```

---

## 🎨 Fluxo Visual Completo

```
┌──────────────┐
│  Voluntário  │
│  se compromete│
└──────┬───────┘
       │ Status: RESERVED
       │ pickup_code: 123456
       ▼
┌──────────────┐
│ Fornecedor   │
│ valida código│ ← Voluntário mostra 123456
└──────┬───────┘
       │ Status: PICKED_UP
       │ delivery_code: 789012
       ▼
┌──────────────┐
│  Voluntário  │
│ valida código│ ← Abrigo passa 789012
└──────┬───────┘
       │ Status: DELIVERED
       ▼
┌──────────────┐
│   Completo   │
│ Voluntário   │
│ volta IDLE   │
└──────────────┘
```

---

## 🔄 Configurações por Tipo de Transação

### **Entrega de Marmitas (Fornecedor → Abrigo)**
```python
ValidationConfig(
    requires_pickup_validation=True,
    requires_delivery_validation=True,
    pickup_validator_role="provider",
    delivery_validator_role="volunteer"
)
```

### **Doação Direta (Voluntário → Abrigo)**
```python
ValidationConfig(
    requires_pickup_validation=False,  # Sem retirada
    requires_delivery_validation=True,
    delivery_validator_role="volunteer"
)
```

### **Coleta de Insumos (Fornecedor → Fornecedor)**
```python
ValidationConfig(
    requires_pickup_validation=True,
    requires_delivery_validation=True,
    pickup_validator_role="provider",
    delivery_validator_role="provider"
)
```

---

## ✅ Benefícios do Sistema Modular

1. **Flexível** - Pode ativar/desativar validações
2. **Reutilizável** - Mesma lógica para diferentes transações
3. **Configurável** - Define quem valida cada etapa
4. **Seguro** - Códigos únicos e verificação de roles
5. **Rastreável** - Timestamps de cada validação

---

## 🚀 Implementação

### **Prioridade 1: Backend**
1. Criar `ValidationConfig` e `TransactionValidator`
2. Adicionar endpoints de validação
3. Atualizar modelo Delivery com timestamps

### **Prioridade 2: Frontend**
1. Criar componente `CodeValidationModal`
2. Adicionar botões de validação no dashboard
3. Mostrar códigos apropriados para cada role

### **Prioridade 3: Testes**
1. Testar fluxo completo de validação
2. Testar diferentes configurações
3. Testar casos de erro (código inválido, role errado)

---

**Sistema de validação bidirecional modular e configurável!** 🎯
