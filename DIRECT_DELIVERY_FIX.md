# 🔧 Correção: Fluxo de Cancelamento de Entregas Diretas

## 🐛 Problema Identificado

Quando um voluntário se comprometia parcialmente com uma entrega direta (sem batch) e depois cancelava, a quantidade não retornava à delivery original.

### Cenário do Bug

1. **Delivery original**: 30 roupas (status: AVAILABLE)
2. **Voluntário comita parcialmente**: 10 roupas
   - Sistema cria nova delivery: 10 roupas (PENDING_CONFIRMATION)
   - Sistema reduz delivery original: 30 → 20 roupas
3. **Voluntário cancela** o commitment de 10 roupas
4. **BUG**: Sistema deletava a delivery, mas os 10 itens não voltavam para a delivery original
5. **Resultado**: 10 itens desapareciam do sistema!

## ✅ Solução Implementada

### Código Corrigido

**Arquivo**: `backend/app/routers/deliveries.py`

**Antes** (linhas 393-406):
```python
# Return quantity to batch (if has batch)
quantity_returned = 0
if delivery.batch_id:
    batch = db.query(ProductBatch).filter(ProductBatch.id == delivery.batch_id).first()
    if batch:
        batch.quantity_available += delivery.quantity
        quantity_returned = delivery.quantity
else:
    # For direct deliveries (no batch), just delete - quantity was virtual
    quantity_returned = delivery.quantity

db.delete(delivery)
db.commit()
```

**Depois** (linhas 393-424):
```python
# Return quantity based on delivery type
quantity_returned = 0

if delivery.batch_id:
    # Has batch - return to batch.quantity_available
    batch = db.query(ProductBatch).filter(ProductBatch.id == delivery.batch_id).first()
    if batch:
        batch.quantity_available += delivery.quantity
        quantity_returned = delivery.quantity
else:
    # Direct delivery (no batch) - find original AVAILABLE delivery and return quantity
    # This handles the case where a volunteer committed partially and we split the delivery
    original_delivery = db.query(Delivery).filter(
        Delivery.location_id == delivery.location_id,
        Delivery.product_type == delivery.product_type,
        Delivery.status == DeliveryStatus.AVAILABLE,
        Delivery.volunteer_id.is_(None),
        Delivery.batch_id.is_(None)
    ).first()
    
    if original_delivery:
        # Return quantity to original delivery
        original_delivery.quantity += delivery.quantity
        quantity_returned = delivery.quantity
    else:
        # No original delivery found - quantity was virtual or original was fully committed
        # Just delete the delivery
        quantity_returned = delivery.quantity

db.delete(delivery)
db.commit()
```

### Lógica da Correção

1. **Se tem batch**: Devolve quantidade ao `batch.quantity_available` (já funcionava)
2. **Se é entrega direta** (sem batch):
   - Busca a delivery original (AVAILABLE, sem voluntário, mesmo location e product_type)
   - Se encontrar: **devolve a quantidade** à delivery original
   - Se não encontrar: apenas deleta (caso de commitment total)

## 🧪 Como Testar

### 1. Executar o Script de Teste

```bash
cd backend
python test_direct_delivery_flow.py
```

### 2. Teste Manual via Dashboard

1. **Login como Abrigo**
   - Criar pedido de 30 roupas (entrega direta)

2. **Login como Voluntário**
   - Acessar mapa
   - Comprometer-se com 10 roupas (parcial)
   - Verificar que delivery original ficou com 20

3. **Cancelar o Commitment**
   - Ir em "Ações" → Cancelar entrega
   - Verificar que delivery original voltou para 30 ✅

### 3. Verificação no Banco de Dados

```sql
-- Ver deliveries de roupas
SELECT id, location_id, product_type, quantity, status, volunteer_id, batch_id
FROM deliveries
WHERE product_type = 'clothing'
ORDER BY created_at DESC;

-- Antes do cancelamento:
-- ID=1: 20 roupas, AVAILABLE, volunteer_id=NULL (original reduzida)
-- ID=2: 10 roupas, PENDING_CONFIRMATION, volunteer_id=3 (commitment)

-- Depois do cancelamento:
-- ID=1: 30 roupas, AVAILABLE, volunteer_id=NULL (restaurada) ✅
-- ID=2: DELETADO
```

## 📊 Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ESTADO INICIAL                                           │
├─────────────────────────────────────────────────────────────┤
│ Delivery #1: 30 roupas (AVAILABLE, volunteer=NULL)         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. VOLUNTÁRIO COMITA 10 ROUPAS (PARCIAL)                   │
├─────────────────────────────────────────────────────────────┤
│ Delivery #1: 20 roupas (AVAILABLE, volunteer=NULL)         │
│ Delivery #2: 10 roupas (PENDING_CONFIRMATION, volunteer=3) │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. VOLUNTÁRIO CANCELA                                       │
├─────────────────────────────────────────────────────────────┤
│ ✅ CORREÇÃO: Busca delivery original (#1)                  │
│ ✅ CORREÇÃO: Devolve 10 roupas → #1.quantity += 10         │
│ ✅ Deleta delivery #2                                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. ESTADO FINAL (CORRETO)                                   │
├─────────────────────────────────────────────────────────────┤
│ Delivery #1: 30 roupas (AVAILABLE, volunteer=NULL) ✅      │
│ Delivery #2: DELETADO                                       │
└─────────────────────────────────────────────────────────────┘
```

## 🏗️ Arquitetura Event-Driven (Futuro)

Atualmente o sistema usa **transações síncronas** para gerenciar quantidades. Para escalar, considere implementar:

### Event Sourcing

```python
# Eventos de domínio
DeliveryCommitted(delivery_id, volunteer_id, quantity, timestamp)
DeliveryPartiallyCommitted(original_id, new_id, quantity, timestamp)
DeliveryCancelled(delivery_id, quantity_returned, timestamp)
QuantityRestored(delivery_id, quantity, timestamp)
```

### Benefícios

- ✅ **Auditoria completa**: Histórico de todas as mudanças
- ✅ **Replay**: Reconstruir estado a partir de eventos
- ✅ **Escalabilidade**: Processamento assíncrono
- ✅ **Resiliência**: Retry automático em falhas

### Implementação Sugerida

Ver documentação completa em: `docs/architecture/02-EVENT-DRIVEN-DESIGN.md`

## 🔍 Casos de Teste Cobertos

- ✅ Commitment parcial + cancelamento (quantidade restaurada)
- ✅ Commitment total + cancelamento (delivery deletada)
- ✅ Commitment com batch + cancelamento (quantidade volta ao batch)
- ✅ Commitment sem batch + cancelamento (quantidade volta à delivery original)

## 📝 Notas Técnicas

### Por que não usar Event Sourcing agora?

1. **Complexidade**: Adiciona overhead significativo
2. **Time-to-market**: Solução síncrona resolve o problema imediato
3. **Escala atual**: Sistema ainda não precisa de processamento assíncrono
4. **Migração futura**: Pode ser implementado incrementalmente

### Quando migrar para Event-Driven?

- Quando houver **>1000 deliveries/dia**
- Quando precisar de **auditoria detalhada** (compliance)
- Quando houver **múltiplos microsserviços** consumindo eventos
- Quando precisar de **processamento assíncrono** (notificações, analytics)

## ✅ Checklist de Validação

- [x] Código corrigido em `deliveries.py`
- [x] Script de teste criado (`test_direct_delivery_flow.py`)
- [x] Documentação atualizada
- [ ] Testes E2E atualizados (próximo passo)
- [ ] Deploy em staging
- [ ] Validação com usuários reais

---

**Data da correção**: 28 de fevereiro de 2026  
**Desenvolvedor**: Lucas Motta (via Cascade AI)
