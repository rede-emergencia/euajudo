# Sistema de Inventário para Abrigos V2

## Visão Geral

Sistema completo de gestão de inventário para abrigos, permitindo controle total de estoque, doações recebidas, distribuições para pessoas finais, e ajustes de solicitações.

## Arquitetura

### Backend Models

#### 1. **InventoryItem** - Estoque Atual
Representa o estoque atual de cada categoria por abrigo.

**Campos principais:**
- `quantity_in_stock`: Total em estoque
- `quantity_reserved`: Quantidade reservada (pedidos em andamento)
- `quantity_available`: Disponível para distribuição (in_stock - reserved)
- `min_threshold`: Alerta de estoque baixo
- `metadata_cache`: Metadados para filtros rápidos

**Relacionamentos:**
- Um abrigo pode ter múltiplos itens de inventário (um por categoria)
- Cada item tem histórico completo de transações

#### 2. **InventoryTransaction** - Histórico de Movimentações
Registro imutável de todas as movimentações de estoque.

**Tipos de Transação:**
- `donation_received`: Doação recebida de voluntário
- `donation_given`: Distribuído para pessoa final
- `manual_adjustment`: Ajuste manual de estoque
- `request_created`: Pedido criado (reserva)
- `request_cancelled`: Pedido cancelado (libera reserva)
- `request_adjusted`: Ajuste de quantidade do pedido
- `initial_stock`: Estoque inicial
- `expired`: Itens expirados/descartados
- `damaged`: Itens danificados/perdidos

**Campos de Auditoria:**
- `balance_after`: Saldo após transação
- `reserved_after`: Reservado após transação
- `available_after`: Disponível após transação

#### 3. **ShelterRequest** - Solicitações de Doação
Gerencia pedidos de doação com rastreamento de quantidades.

**Campos de Controle:**
- `quantity_requested`: Quantidade solicitada originalmente
- `quantity_received`: Já recebido
- `quantity_pending`: Em trânsito (não pode ser cancelado)
- `quantity_cancelled`: Quantidade cancelada

**Status:**
- `active`: Solicitação ativa
- `completed`: Totalmente atendida
- `cancelled`: Cancelada
- `partially_completed`: Parcialmente atendida

#### 4. **RequestAdjustment** - Histórico de Ajustes
Rastreia todos os ajustes feitos em solicitações.

**Tipos de Ajuste:**
- `increase`: Aumentar quantidade
- `decrease`: Diminuir quantidade
- `cancel`: Cancelar solicitação

**Validações:**
- Não permite cancelar itens em trânsito
- Não permite diminuir abaixo da quantidade em trânsito
- Registra warnings quando ajuste afeta entregas em andamento

#### 5. **DistributionRecord** - Distribuições para Pessoas Finais
Registra entregas para beneficiários finais.

**Campos:**
- `recipient_name`: Nome do beneficiário (opcional)
- `recipient_document`: CPF/documento (opcional)
- `photo_proof`: Foto comprobatória (opcional)
- `notes`: Observações

### Backend Endpoints

#### Inventário
```
GET    /api/inventory/items                    # Listar itens do estoque
POST   /api/inventory/items                    # Criar item de estoque
PATCH  /api/inventory/items/{item_id}          # Atualizar item
GET    /api/inventory/transactions             # Histórico de transações
POST   /api/inventory/receive-donation/{id}    # Marcar doação como recebida
```

#### Distribuições
```
POST   /api/inventory/distribute               # Distribuir itens
GET    /api/inventory/distributions            # Listar distribuições
```

#### Solicitações
```
GET    /api/inventory/requests                 # Listar solicitações
POST   /api/inventory/requests/adjust/{id}     # Ajustar solicitação
```

#### Dashboard
```
GET    /api/inventory/dashboard                # Dados completos do dashboard
```

### Frontend - ShelterDashboardV2

#### Abas do Dashboard

**1. Visão Geral (Overview)**
- Cards de estatísticas principais
- Atividade recente (últimas 10 transações)
- Atalhos rápidos para outras seções

**2. Estoque (Inventory)**
- Lista de todas as categorias em estoque
- Filtros: Todos, Disponíveis, Estoque Baixo
- Informações por item:
  - Quantidade em estoque
  - Quantidade reservada
  - Quantidade disponível
  - Alertas de estoque baixo
- Ação: Distribuir itens

**3. Solicitações (Requests)**
- Lista de solicitações ativas
- Informações por solicitação:
  - Quantidade solicitada
  - Quantidade recebida
  - Quantidade em trânsito
  - Quantidade faltando
- Ações:
  - Aumentar quantidade
  - Diminuir quantidade (com validação)
  - Cancelar (com validação de itens em trânsito)

**4. Distribuições (Distributions)**
- Histórico de distribuições para pessoas finais
- Informações de beneficiários
- Datas e quantidades

**5. Análises (Analytics)**
- Taxa de utilização do estoque
- Taxa de disponibilidade
- Distribuição por categoria (gráfico)
- Métricas mensais

#### Componentes Principais

**StatCard**
- Exibe métricas com ícone, valor e tendência
- Cores personalizáveis

**InventoryTab**
- Gerenciamento visual do estoque
- Filtros e ações rápidas

**RequestsTab**
- Visualização de solicitações
- Ajustes com validação

**DistributeModal**
- Modal para distribuir itens
- Campos para beneficiário (opcional)
- Validação de quantidade disponível

**AdjustRequestModal**
- Modal para ajustar solicitações
- Três tipos: aumentar, diminuir, cancelar
- Validações automáticas de itens em trânsito
- Warnings visuais

## Fluxos Principais

### 1. Receber Doação
```
1. Voluntário entrega doação (status: delivered)
2. Abrigo marca como recebida via API
3. Sistema cria/atualiza InventoryItem
4. Cria InventoryTransaction (donation_received)
5. Atualiza quantidades disponíveis
```

### 2. Distribuir para Pessoa Final
```
1. Abrigo seleciona categoria e quantidade
2. Sistema valida quantidade disponível
3. Cria DistributionRecord
4. Cria InventoryTransaction (donation_given)
5. Atualiza estoque (diminui)
```

### 3. Ajustar Solicitação

**Aumentar:**
```
1. Abrigo seleciona "aumentar"
2. Informa quantidade adicional
3. Sistema atualiza quantity_requested
4. Cria RequestAdjustment
```

**Diminuir:**
```
1. Abrigo seleciona "diminuir"
2. Sistema valida: não pode diminuir abaixo de quantity_pending
3. Se válido, atualiza quantity_requested
4. Cria RequestAdjustment com warning se necessário
```

**Cancelar:**
```
1. Abrigo seleciona "cancelar"
2. Sistema verifica quantity_pending
3. Se > 0, mostra warning mas não permite cancelar totalmente
4. Cancela apenas o que não está em trânsito
5. Atualiza status para 'cancelled'
```

## Analytics Importantes

### Métricas de Estoque
- **Total em Estoque**: Soma de todos os itens
- **Itens com Estoque Baixo**: Abaixo do threshold
- **Taxa de Utilização**: (Reservado / Total) × 100
- **Taxa de Disponibilidade**: (Disponível / Total) × 100

### Métricas Mensais
- **Recebido no Mês**: Total de doações recebidas
- **Distribuído no Mês**: Total distribuído para pessoas
- **Solicitações Ativas**: Pedidos ainda não completados
- **Solicitações Pendentes**: Com itens em trânsito

### Alertas
- **Estoque Baixo**: quantity_available ≤ min_threshold
- **Itens em Trânsito**: Não podem ser cancelados
- **Ajustes com Warning**: Quando afeta entregas em andamento

## Casos de Uso

### Caso 1: Abrigo Pede 200 Fraldas
```
1. Cria solicitação: quantity_requested = 200
2. Voluntário 1 compromete 30: quantity_pending = 30
3. Voluntário 1 entrega: quantity_received = 30, quantity_pending = 0
4. Abrigo recebe doação externa de 100 fraldas
5. Abrigo ajusta pedido: diminui 100 (de 200 para 100)
6. Faltam ainda 70 fraldas
```

### Caso 2: Cancelamento Parcial
```
1. Solicitação: 200 itens
2. Em trânsito: 30 itens
3. Abrigo tenta cancelar
4. Sistema permite cancelar apenas 170
5. Mostra warning: "30 itens em trânsito não podem ser cancelados"
6. Abrigo deve aguardar entrega dos 30 ou ajustar após receber
```

### Caso 3: Distribuição para Pessoa Final
```
1. Abrigo tem 50 cobertores em estoque
2. Família chega precisando de 3 cobertores
3. Abrigo distribui via dashboard:
   - Quantidade: 3
   - Beneficiário: "Maria Silva" (opcional)
   - CPF: "123.456.789-00" (opcional)
4. Estoque atualizado: 47 cobertores
5. Registro criado para auditoria
```

## Migração e Setup

### 1. Criar Tabelas
```bash
cd backend
python migrate_inventory.py
```

### 2. Iniciar Backend
```bash
cd backend
python -m uvicorn app.main:app --reload
```

### 3. Acessar Dashboard
```
http://localhost:5173/shelter-dashboard-v2
```

## Segurança e Validações

### Backend
- ✅ Apenas usuários com role 'shelter' podem acessar
- ✅ Validação de quantidade disponível antes de distribuir
- ✅ Validação de itens em trânsito antes de cancelar
- ✅ Auditoria completa de todas as transações
- ✅ Registros imutáveis de histórico

### Frontend
- ✅ Validação de formulários
- ✅ Confirmações para ações críticas
- ✅ Mensagens de erro claras
- ✅ Warnings visuais para ajustes arriscados
- ✅ Desabilita ações quando não aplicável

## Próximos Passos

### Melhorias Futuras
1. **Relatórios PDF**: Gerar relatórios de distribuição
2. **Fotos**: Upload de fotos de comprovação
3. **QR Codes**: Para rastreamento de beneficiários
4. **Notificações**: Alertas de estoque baixo via email/SMS
5. **Integração**: Sincronizar com sistema de entregas
6. **Dashboard Admin**: Visão consolidada de todos os abrigos
7. **Previsão**: ML para prever necessidades futuras
8. **Metas**: Definir metas de distribuição

### Integrações Necessárias
- [ ] Conectar recebimento de doações com deliveries
- [ ] Atualizar ShelterRequest quando delivery é entregue
- [ ] Sincronizar quantity_pending com deliveries em trânsito
- [ ] Webhook para atualizar estoque automaticamente

## Troubleshooting

### Problema: Estoque negativo
**Causa**: Distribuição sem validação adequada
**Solução**: Backend valida quantity_available antes de permitir

### Problema: Não consigo cancelar solicitação
**Causa**: Itens em trânsito (quantity_pending > 0)
**Solução**: Aguardar entrega ou ajustar após receber

### Problema: Dashboard não carrega
**Causa**: Tabelas não criadas
**Solução**: Executar migrate_inventory.py

### Problema: Erro 403 ao acessar
**Causa**: Usuário não tem role 'shelter'
**Solução**: Verificar roles do usuário no banco

## Suporte

Para dúvidas ou problemas:
1. Verificar logs do backend
2. Verificar console do navegador
3. Consultar esta documentação
4. Verificar validações no código

## Changelog

### v2.0.0 (2024)
- ✅ Sistema completo de inventário
- ✅ Rastreamento de transações
- ✅ Ajuste de solicitações com validação
- ✅ Distribuição para pessoas finais
- ✅ Dashboard analítico completo
- ✅ Alertas de estoque baixo
- ✅ Auditoria completa
