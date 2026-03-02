# Quick Start - Sistema de Inventário para Abrigos V2

## Setup Rápido (5 minutos)

### 1. Criar Tabelas do Banco de Dados

```bash
cd backend
python migrate_inventory.py
```

**Saída esperada:**
```
🔄 Creating inventory management tables...
✅ Inventory tables created successfully!

Created tables:
  - inventory_items
  - inventory_transactions
  - shelter_requests
  - request_adjustments
  - shelter_request_deliveries
  - distribution_records
```

### 2. Iniciar Backend (se não estiver rodando)

```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

### 3. Acessar Dashboard V2

**URL:** `http://localhost:5173/shelter-dashboard-v2`

**Requisitos:**
- Usuário deve ter role `shelter`
- Estar logado no sistema

## Primeiro Uso

### 1. Configurar Estoque Inicial

**Endpoint:** `POST /api/inventory/items`

```json
{
  "category_id": 1,
  "quantity_in_stock": 100,
  "min_threshold": 10,
  "metadata_cache": {}
}
```

**Ou via Dashboard:**
- Acesse aba "Estoque"
- Clique em "Adicionar Item"
- Preencha categoria e quantidade inicial

### 2. Receber Primeira Doação

**Quando voluntário entrega:**

```bash
# 1. Marcar delivery como entregue (já existe no sistema)
POST /api/deliveries/{delivery_id}/deliver

# 2. Adicionar ao inventário
POST /api/inventory/receive-donation/{delivery_id}
```

**Resultado:**
- Estoque atualizado automaticamente
- Transação registrada no histórico
- Disponível para distribuição

### 3. Distribuir para Pessoa Final

**Via Dashboard:**
1. Acesse aba "Estoque"
2. Selecione categoria
3. Clique em "Distribuir"
4. Preencha:
   - Quantidade
   - Nome do beneficiário (opcional)
   - CPF (opcional)
   - Observações (opcional)
5. Confirme

**Via API:**
```json
POST /api/inventory/distribute
{
  "category_id": 1,
  "quantity": 5,
  "recipient_name": "Maria Silva",
  "recipient_document": "123.456.789-00",
  "notes": "Família com 3 crianças"
}
```

### 4. Ajustar Solicitação

**Cenário:** Pediu 200 fraldas, recebeu 30 externas, quer diminuir pedido

**Via Dashboard:**
1. Acesse aba "Solicitações"
2. Selecione solicitação
3. Clique em "Ajustar"
4. Escolha "Diminuir Quantidade"
5. Informe: 100
6. Motivo: "Recebemos doação externa"
7. Confirme

**Via API:**
```json
POST /api/inventory/requests/adjust/{request_id}
{
  "adjustment_type": "decrease",
  "quantity_change": 100,
  "reason": "Recebemos doação externa"
}
```

## Fluxo Completo de Exemplo

### Cenário: Abrigo precisa de cobertores

**1. Criar Solicitação (já existe no sistema atual)**
```
Abrigo cria pedido de 50 cobertores
→ ShelterRequest criada: quantity_requested = 50
```

**2. Voluntário Compromete**
```
Voluntário aceita entregar 20
→ quantity_pending = 20
```

**3. Voluntário Entrega**
```
POST /api/deliveries/{id}/deliver
→ Delivery status = delivered
```

**4. Abrigo Recebe no Inventário**
```
POST /api/inventory/receive-donation/{delivery_id}
→ InventoryItem: quantity_in_stock += 20
→ ShelterRequest: quantity_received = 20, quantity_pending = 0
→ Transaction: donation_received
```

**5. Abrigo Recebe Doação Externa**
```
Recebe 15 cobertores de doador local
→ Ajusta pedido: diminui 15 (de 50 para 35)
```

**6. Abrigo Distribui para Famílias**
```
POST /api/inventory/distribute
{
  "category_id": 2,
  "quantity": 10,
  "recipient_name": "Família Santos",
  "notes": "5 pessoas, 2 crianças"
}
→ InventoryItem: quantity_in_stock -= 10
→ DistributionRecord criado
→ Transaction: donation_given
```

## Dashboard - Visão Rápida

### Aba: Visão Geral
- **Cards de Métricas**: Total em estoque, recebido/distribuído no mês
- **Atividade Recente**: Últimas 10 transações
- **Atalhos Rápidos**: Acesso rápido a outras abas

### Aba: Estoque
- **Lista de Categorias**: Todas as categorias com estoque
- **Filtros**: Todos, Disponíveis, Estoque Baixo
- **Ação Principal**: Distribuir itens
- **Alertas**: Estoque baixo destacado em vermelho

### Aba: Solicitações
- **Solicitações Ativas**: Pedidos ainda não completados
- **Detalhes**: Solicitado, Recebido, Em Trânsito, Faltando
- **Ações**: Aumentar, Diminuir, Cancelar (com validações)

### Aba: Distribuições
- **Histórico**: Todas as distribuições realizadas
- **Filtros**: Por categoria, data
- **Detalhes**: Beneficiário, quantidade, data

### Aba: Análises
- **Taxa de Utilização**: % do estoque reservado
- **Taxa de Disponibilidade**: % do estoque disponível
- **Gráfico**: Distribuição por categoria
- **Métricas**: Categorias ativas, totais mensais

## Validações Importantes

### ❌ Não Pode Distribuir
- Quantidade maior que disponível
- Categoria sem estoque

### ❌ Não Pode Cancelar Totalmente
- Se houver itens em trânsito (quantity_pending > 0)
- Sistema mostra warning e permite cancelar apenas o restante

### ❌ Não Pode Diminuir Abaixo de Pending
- Se pediu 100, 30 em trânsito
- Pode diminuir no máximo para 30
- Sistema valida e mostra warning

### ✅ Pode Sempre
- Aumentar quantidade de solicitação
- Ajustar estoque manualmente
- Ver histórico completo
- Distribuir itens disponíveis

## Troubleshooting Rápido

### Erro: "Only shelters can access inventory"
**Solução:** Verificar se usuário tem role 'shelter'
```sql
SELECT id, email, roles FROM users WHERE email = 'seu@email.com';
-- roles deve conter 'shelter'
```

### Erro: "Insufficient stock"
**Solução:** Verificar quantidade disponível
```sql
SELECT quantity_in_stock, quantity_reserved, quantity_available 
FROM inventory_items 
WHERE shelter_id = X AND category_id = Y;
```

### Dashboard não carrega
**Solução:** Verificar se tabelas foram criadas
```bash
python migrate_inventory.py
```

### Transações não aparecem
**Solução:** Verificar se doações foram marcadas como recebidas
```bash
# Verificar deliveries entregues mas não adicionadas ao inventário
SELECT * FROM deliveries WHERE status = 'delivered' AND id NOT IN (
  SELECT delivery_id FROM inventory_transactions WHERE delivery_id IS NOT NULL
);
```

## Endpoints Principais

### Inventário
```
GET    /api/inventory/items                    # Listar estoque
POST   /api/inventory/items                    # Criar item
PATCH  /api/inventory/items/{id}               # Atualizar item
GET    /api/inventory/transactions             # Histórico
POST   /api/inventory/receive-donation/{id}    # Receber doação
```

### Distribuições
```
POST   /api/inventory/distribute               # Distribuir
GET    /api/inventory/distributions            # Listar
```

### Solicitações
```
GET    /api/inventory/requests                 # Listar
POST   /api/inventory/requests/adjust/{id}     # Ajustar
```

### Dashboard
```
GET    /api/inventory/dashboard                # Dados completos
```

## Próximos Passos

1. ✅ Configurar estoque inicial para todas as categorias
2. ✅ Testar fluxo completo: receber → distribuir
3. ✅ Configurar thresholds de estoque baixo
4. ✅ Treinar equipe no uso do dashboard
5. ✅ Configurar alertas (futuro)
6. ✅ Integrar com sistema de entregas (futuro)

## Suporte

- **Documentação Completa:** `SHELTER_INVENTORY_V2.md`
- **Logs Backend:** `backend/logs/` (se configurado)
- **Console Frontend:** F12 no navegador
- **API Docs:** `http://localhost:8000/docs`

## Checklist de Implementação

- [x] Criar modelos de inventário
- [x] Criar endpoints da API
- [x] Criar componente ShelterDashboardV2
- [x] Criar script de migração
- [x] Documentar sistema
- [ ] Executar migração no banco
- [ ] Testar fluxo completo
- [ ] Treinar usuários
- [ ] Configurar em produção
