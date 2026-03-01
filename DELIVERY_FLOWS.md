# Fluxos de Entrega - Design Document

## Identificação dos Fluxos

### FLUXO 1: Entrega Direta (Direct Delivery)
**Identificador**: `batch_id = NULL`
**Descrição**: Voluntário se compromete a entregar algo diretamente ao abrigo (ex: compra marmitas e entrega)

**Atores**:
- Voluntário (entregador)
- Abrigo (recebedor)

**Sequência**:
1. Abrigo cria solicitação → Status: `AVAILABLE`
2. Voluntário aceita (`/commit`) → Status: `PENDING_CONFIRMATION`
3. Voluntário entrega e pede código ao abrigo → Abrigo mostra `delivery_code`
4. Voluntário valida código (`/validate-delivery`) → Status: `DELIVERED`

**Status Utilizados**:
- `AVAILABLE` - Disponível para voluntário aceitar
- `PENDING_CONFIRMATION` - Voluntário aceitou, está preparando/comprando
- `DELIVERED` - Entregue com sucesso

**Códigos**:
- `delivery_code` - Gerado quando voluntário aceita, abrigo mostra para voluntário validar

---

### FLUXO 2: Entrega com Retirada (Pickup & Delivery)
**Identificador**: `batch_id != NULL`
**Descrição**: Voluntário busca produtos em um fornecedor e entrega ao abrigo

**Atores**:
- Fornecedor (doador)
- Voluntário (transportador)
- Abrigo (recebedor)

**Sequência**:
1. Fornecedor cria batch → Delivery criada → Status: `AVAILABLE`
2. Voluntário aceita (`/commit`) → Status: `PENDING_CONFIRMATION`
3. Voluntário vai ao fornecedor, fornecedor mostra `pickup_code`
4. Voluntário valida retirada (`/confirm-pickup`) → Status: `PICKED_UP` + gera `delivery_code`
5. Voluntário vai ao abrigo, abrigo mostra `delivery_code`
6. Voluntário valida entrega (`/validate-delivery`) → Status: `DELIVERED`

**Status Utilizados**:
- `AVAILABLE` - Disponível para voluntário aceitar
- `PENDING_CONFIRMATION` - Voluntário aceitou, indo buscar no fornecedor
- `PICKED_UP` - Voluntário retirou do fornecedor, indo entregar
- `DELIVERED` - Entregue com sucesso ao abrigo

**Códigos**:
- `pickup_code` - Gerado quando voluntário aceita, fornecedor mostra para voluntário validar retirada
- `delivery_code` - Gerado após retirada confirmada, abrigo mostra para voluntário validar entrega

---

## Status Enum Correto

```python
class DeliveryStatus(str, Enum):
    # Comum a ambos os fluxos
    AVAILABLE = "available"                    # Disponível para aceitar
    PENDING_CONFIRMATION = "pending_confirmation"  # Voluntário aceitou
    DELIVERED = "delivered"                    # Finalizado com sucesso
    CANCELLED = "cancelled"                    # Cancelado
    EXPIRED = "expired"                        # Expirado
    
    # Específico do FLUXO 2 (com retirada)
    PICKED_UP = "picked_up"                   # Retirado do fornecedor
    
    # Deprecated (não usar mais)
    # RESERVED = "reserved"
    # IN_TRANSIT = "in_transit"
```

---

## Endpoints e Responsabilidades

### `/commit` - Voluntário aceita entrega
- **Ambos os fluxos**
- Status: `AVAILABLE` → `PENDING_CONFIRMATION`
- Gera: `pickup_code` (FLUXO 2) e `delivery_code` (FLUXO 1)

### `/confirm-pickup` - Voluntário confirma retirada no fornecedor
- **Apenas FLUXO 2** (batch_id presente)
- Status: `PENDING_CONFIRMATION` → `PICKED_UP`
- Valida: `pickup_code`
- Gera: `delivery_code` (se ainda não existe)

### `/validate-delivery` - Voluntário confirma entrega no abrigo
- **Ambos os fluxos**
- Status: `PENDING_CONFIRMATION` (FLUXO 1) ou `PICKED_UP` (FLUXO 2) → `DELIVERED`
- Valida: `delivery_code`

---

## Lógica de Detecção de Fluxo

```python
def is_direct_delivery(delivery):
    return delivery.batch_id is None

def is_pickup_delivery(delivery):
    return delivery.batch_id is not None
```

---

## Frontend - Exibição de Ações

### Para Voluntário:

**FLUXO 1 (Direct Delivery)**:
- Status `PENDING_CONFIRMATION`: Mostrar campo para digitar código do abrigo e confirmar entrega

**FLUXO 2 (Pickup & Delivery)**:
- Status `PENDING_CONFIRMATION`: Mostrar campo para digitar código do fornecedor e confirmar retirada
- Status `PICKED_UP`: Mostrar campo para digitar código do abrigo e confirmar entrega

### Para Abrigo:

**Ambos os fluxos**:
- Status `PENDING_CONFIRMATION` (FLUXO 1): Mostrar `delivery_code` para o voluntário
- Status `PICKED_UP` (FLUXO 2): Mostrar `delivery_code` para o voluntário

### Para Fornecedor:

**FLUXO 2 apenas**:
- Status `PENDING_CONFIRMATION`: Mostrar `pickup_code` para o voluntário
