# 🔄 Fluxo de Pedidos Parciais - EuAjudo

**Data**: 27 Fev 2026  
**Status**: ✅ Implementado e Pronto para Teste

---

## 🎯 Objetivo

Permitir que múltiplos voluntários se comprometam com **partes diferentes** de um mesmo pedido de doação, tornando o sistema mais flexível e escalável.

---

## 📋 Fluxo Completo

### 1️⃣ Fornecedor/Abrigo Cria Pedido

**Endpoint**: `POST /api/resources/requests`

**Payload**:
```json
{
  "quantity_meals": 50,
  "items": [
    {"name": "Arroz", "quantity": 10, "unit": "kg"},
    {"name": "Feijão", "quantity": 5, "unit": "kg"},
    {"name": "Carne", "quantity": 3, "unit": "kg"}
  ]
}
```

**Resultado**:
- Pedido criado com status `requesting`
- Cada item tem `quantity_reserved = 0`
- Pedido aparece no mapa com ícone laranja 🟠

---

### 2️⃣ Voluntário 1 Aceita Parte do Pedido

**Ação**: Clica no ícone laranja no mapa → Modal abre

**Modal Mostra**:
```
🛒 Reservar Ingredientes
Fornecedor X - Para 50 marmitas

💡 Dica: Você pode se comprometer com apenas PARTE dos ingredientes!

Ingredientes Disponíveis (3 de 3):

✓ Arroz
  Total: 10kg | Já reservado: 0kg
  Disponível: 10kg
  [Input: quantidade] kg

✓ Feijão  
  Total: 5kg | Já reservado: 0kg
  Disponível: 5kg
  [Input: quantidade] kg

✓ Carne
  Total: 3kg | Já reservado: 0kg
  Disponível: 3kg
  [Input: quantidade] kg
```

**Voluntário 1 Preenche**:
- Arroz: 10kg (tudo)
- Feijão: 2kg (parcial)
- Carne: 0kg (não pega)

**Resumo Mostrado**:
```
📋 Resumo da sua Reserva
✓ Arroz: 10kg
✓ Feijão: 2kg (de 5kg total)

2 de 3 ingredientes selecionados
```

**Backend Processa**:
```python
# Atualiza quantities_reserved
arroz.quantity_reserved = 10  # 10/10 = 100%
feijao.quantity_reserved = 2   # 2/5 = 40%
carne.quantity_reserved = 0    # 0/3 = 0%

# Verifica se TODOS os itens estão 100% reservados
all_items_fully_reserved = False  # Feijão e Carne ainda têm disponível

# Mantém status como REQUESTING
request.status = OrderStatus.REQUESTING
```

**Feedback ao Voluntário**:
```
✅ Reserva PARCIAL criada com sucesso!

📦 Você comprometeu a fornecer:
- 2 de 3 tipos de ingredientes

⚠️ IMPORTANTE:
- Outros voluntários podem reservar os itens restantes
- O pedido continuará visível no mapa até ser totalmente reservado

🔔 O fornecedor será notificado da sua contribuição!
```

**Mapa**: Pedido continua com ícone laranja 🟠 (ainda requesting)

---

### 3️⃣ Voluntário 2 Aceita Resto do Pedido

**Modal Mostra** (atualizado):
```
Ingredientes Disponíveis (2 de 3):

✓ Arroz
  Total: 10kg | Já reservado: 10kg
  Disponível: 0kg
  [Já totalmente reservado]

✓ Feijão  
  Total: 5kg | Já reservado: 2kg
  Disponível: 3kg
  [Input: quantidade] kg

✓ Carne
  Total: 3kg | Já reservado: 0kg
  Disponível: 3kg
  [Input: quantidade] kg
```

**Voluntário 2 Preenche**:
- Feijão: 3kg (completa)
- Carne: 3kg (tudo)

**Backend Processa**:
```python
# Atualiza quantities_reserved
feijao.quantity_reserved = 5   # 2 + 3 = 5/5 = 100%
carne.quantity_reserved = 3    # 0 + 3 = 3/3 = 100%

# Verifica se TODOS os itens estão 100% reservados
all_items_fully_reserved = True  # Todos completados!

# Atualiza status para RESERVED
request.status = OrderStatus.RESERVED
```

**Feedback ao Voluntário**:
```
✅ Reserva COMPLETA criada com sucesso!

📦 Você comprometeu a fornecer:
- TODOS os 2 ingredientes solicitados

✨ Parabéns! Você completou este pedido!
🔔 O fornecedor será notificado.
```

**Mapa**: Pedido **desaparece** ou muda para ícone amarelo 🟡 (reserved/idle)

---

## 🔧 Implementação Técnica

### Backend (`resources.py`)

**Validações**:
```python
# 1. Validar que item pertence ao request
if resource_item.request_id != reservation_data.request_id:
    raise HTTPException(400, "Item não pertence a este pedido")

# 2. Validar quantidade disponível
quantity_available = item.quantity - item.quantity_reserved
if requested > quantity_available:
    raise HTTPException(400, f"Apenas {quantity_available}{unit} disponíveis")

# 3. Atualizar quantity_reserved
resource_item.quantity_reserved += requested_quantity

# 4. Verificar completude
all_fully_reserved = all(
    item.quantity_reserved >= item.quantity 
    for item in request.items
)

# 5. Atualizar status do request
request.status = RESERVED if all_fully_reserved else REQUESTING
```

### Frontend (`IngredientReservationModal.jsx`)

**Features**:
- ✅ Lista todos os itens com disponibilidade
- ✅ Mostra quantidade total, reservada e disponível
- ✅ Permite input parcial por item
- ✅ Validação de quantidades
- ✅ Resumo visual da reserva
- ✅ Feedback diferenciado (parcial vs completo)
- ✅ Dica sobre reservas parciais

---

## 📊 Cenários de Teste

### Cenário 1: Reserva Parcial → Parcial → Completa
```
Request: 10kg Arroz, 5kg Feijão, 3kg Carne

V1: 5kg Arroz          → Status: REQUESTING
V2: 5kg Arroz, 2kg Feijão → Status: REQUESTING  
V3: 3kg Feijão, 3kg Carne → Status: RESERVED ✅
```

### Cenário 2: Reserva Completa Imediata
```
Request: 10kg Arroz, 5kg Feijão

V1: 10kg Arroz, 5kg Feijão → Status: RESERVED ✅
```

### Cenário 3: Múltiplos Voluntários, Um Item
```
Request: 20kg Arroz

V1: 5kg  → Status: REQUESTING
V2: 10kg → Status: REQUESTING
V3: 5kg  → Status: RESERVED ✅
```

---

## 🎨 UX/UI

### Visual do Modal

**Cores**:
- 🟢 Verde: Item disponível
- 🟡 Amarelo: Item parcialmente reservado
- 🔴 Vermelho: Erro/validação
- 🔵 Azul: Dicas e informações

**Feedback**:
- Banner azul: Dica sobre reservas parciais
- Cards verdes/amarelos: Status de cada item
- Resumo verde: Confirmação visual antes de enviar
- Alert diferenciado: Parcial vs Completo

### Fluxo no Mapa

```
Pedido Criado → 🟠 Laranja (requesting)
    ↓
V1 Reserva Parcial → 🟠 Laranja (ainda requesting)
    ↓
V2 Completa → 🟡 Amarelo (reserved) ou desaparece
```

---

## 🚀 Como Testar

### 1. Criar Pedido (Provider/Shelter)
```bash
# Login como provider
# Dashboard → Pedir Insumos
# Adicionar múltiplos itens com quantidades
```

### 2. Reservar Parcialmente (Volunteer 1)
```bash
# Login como volunteer
# Mapa → Clicar em ícone laranja
# Preencher APENAS alguns itens ou quantidades parciais
# Confirmar
# Verificar: pedido continua no mapa
```

### 3. Completar Pedido (Volunteer 2)
```bash
# Login como outro volunteer
# Mapa → Mesmo ícone laranja
# Ver itens restantes disponíveis
# Preencher o que falta
# Confirmar
# Verificar: pedido sai do mapa ou muda status
```

---

## ✅ Checklist de Implementação

- [x] Backend valida quantidades disponíveis
- [x] Backend atualiza `quantity_reserved` corretamente
- [x] Backend calcula status baseado em completude
- [x] Modal mostra todos os itens com disponibilidade
- [x] Modal permite input parcial
- [x] Modal valida quantidades máximas
- [x] Modal mostra resumo da reserva
- [x] Feedback diferenciado (parcial vs completo)
- [x] Mapa atualiza após reserva
- [x] Múltiplos voluntários podem reservar mesmo pedido

---

## 🎯 Benefícios

1. **Flexibilidade**: Voluntários podem contribuir com o que têm
2. **Escalabilidade**: Múltiplos voluntários = mais doações
3. **Transparência**: Todos veem o que falta
4. **Eficiência**: Pedidos não ficam bloqueados esperando um único voluntário
5. **UX**: Feedback claro sobre contribuição parcial vs completa

---

**Sistema de pedidos parciais totalmente funcional! 🎉**
