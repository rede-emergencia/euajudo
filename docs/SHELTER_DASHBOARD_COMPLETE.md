# Dashboard Completo para Abrigos - Especificação

## 🎯 Visão Geral

O abrigo precisa de um dashboard COMPLETO e AUTÔNOMO com 4 abas principais:

1. **📦 Estoque** - Controle de inventário
2. **🚚 Entregas** - Controle de doações em andamento
3. **📊 Analíticos** - Gráficos e métricas
4. **📜 Histórico** - Movimentações completas

---

## 📦 ABA 1: ESTOQUE (Atual)

### Funcionalidades:
- ✅ Cards de métricas (total, críticos, em trânsito, recebidos)
- ✅ Lista de itens do inventário
- ✅ Adicionar/Editar/Remover itens
- ✅ Ajustar quantidades necessárias
- ✅ Registrar entrada/saída manual
- ❌ **FALTA:** Carregar categorias corretamente no modal

### Correções Necessárias:
```jsx
// Modal de adicionar item não carrega categorias
// Problema: useEffect não está sendo chamado ou API retorna vazio
// Solução: Verificar endpoint /api/categories e debug
```

---

## 🚚 ABA 2: ENTREGAS (NOVA)

### Objetivo:
Controlar TODAS as doações que estão sendo feitas para o abrigo.

### Funcionalidades:

#### 2.1 Visão Geral de Entregas
```
┌─────────────────────────────────────────┐
│ 🚚 Entregas em Andamento                │
├─────────────────────────────────────────┤
│                                          │
│ Status:                                  │
│ - Disponíveis: 5 (aguardando voluntário)│
│ - Confirmadas: 3 (voluntário a caminho) │
│ - Em Trânsito: 2 (coletadas)            │
│ - Entregues Hoje: 8                     │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ 💧 Água Mineral - 20L              │  │
│ │ Status: Confirmada                 │  │
│ │ Voluntário: João Silva             │  │
│ │ Previsão: Hoje, 14:30              │  │
│ │ [Ver Código] [Cancelar]            │  │
│ └────────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

#### 2.2 Cards de Entrega
- **Informações:**
  - Item e quantidade
  - Status atual
  - Voluntário responsável (se confirmado)
  - Data/hora de criação
  - Previsão de entrega
  - Código de confirmação

- **Ações:**
  - Ver código de confirmação
  - Cancelar entrega (se disponível)
  - Marcar como recebida (com código)
  - Ver histórico

#### 2.3 Filtros
- Por status (disponível, confirmada, em trânsito, entregue)
- Por categoria de item
- Por período
- Por voluntário

#### 2.4 Integração com Estoque
- Quando entrega é confirmada → `reserved_quantity++`
- Quando entrega é entregue → `current_stock++` + `reserved_quantity--`
- Quando entrega é cancelada → `reserved_quantity--`

---

## 📊 ABA 3: ANALÍTICOS (NOVA)

### Objetivo:
Visualizar métricas, tendências e insights do estoque.

### 3.1 Gráficos Principais

#### Gráfico 1: Necessário vs Estoque vs Em Trânsito
```
Gráfico de Barras Agrupadas
- Eixo X: Categorias (Água, Comida, Roupas, etc)
- Eixo Y: Quantidade
- Barras:
  - Vermelho: Necessário
  - Verde: Estoque Atual
  - Azul: Em Trânsito
```

#### Gráfico 2: Taxa de Atendimento por Categoria
```
Gráfico de Pizza
- Fatias coloridas por categoria
- Percentual de atendimento
- Legenda com valores
```

#### Gráfico 3: Evolução do Estoque (Últimos 30 dias)
```
Gráfico de Linha
- Eixo X: Dias
- Eixo Y: Quantidade total em estoque
- Linha mostrando tendência
```

#### Gráfico 4: Movimentações (Últimos 7 dias)
```
Gráfico de Barras Empilhadas
- Eixo X: Dias da semana
- Eixo Y: Quantidade
- Barras:
  - Verde: Entradas
  - Vermelho: Saídas
```

### 3.2 Métricas Avançadas

#### KPIs Principais:
- **Taxa de Atendimento Geral:** 67%
- **Itens Críticos:** 3 de 12
- **Tempo Médio de Reposição:** 2.5 dias
- **Doações Recebidas (Mês):** 145 itens
- **Distribuições (Mês):** 98 itens
- **Saldo Mensal:** +47 itens

#### Tabela de Performance por Categoria:
```
┌──────────┬──────────┬─────────┬──────────┬────────┐
│ Categoria│ Necessário│ Estoque │ Déficit  │ Taxa   │
├──────────┼──────────┼─────────┼──────────┼────────┤
│ 💧 Água  │ 100L     │ 30L     │ 70L      │ 30%    │
│ 🍞 Comida│ 50kg     │ 45kg    │ 5kg      │ 90%    │
│ 👕 Roupas│ 200      │ 50      │ 150      │ 25%    │
└──────────┴──────────┴─────────┴──────────┴────────┘
```

### 3.3 Alertas e Insights
- ⚠️ "3 itens estão em nível crítico"
- 📈 "Estoque de água aumentou 20% esta semana"
- 📉 "Roupas estão sendo distribuídas mais rápido que repostas"
- 🎯 "Meta de 80% de atendimento atingida em 6 categorias"

---

## 📜 ABA 4: HISTÓRICO (NOVA)

### Objetivo:
Visualizar TODAS as movimentações de estoque com filtros avançados.

### 4.1 Timeline de Movimentações
```
┌─────────────────────────────────────────┐
│ 📜 Histórico de Movimentações           │
├─────────────────────────────────────────┤
│                                          │
│ [Filtros] [Exportar CSV]                │
│                                          │
│ 02/03/2026 14:30                        │
│ ↑ ENTRADA - 20L Água Mineral            │
│ Tipo: Doação recebida                   │
│ Voluntário: João Silva                  │
│ Obs: Entrega confirmada                 │
│ ─────────────────────────────────────   │
│                                          │
│ 02/03/2026 10:15                        │
│ ↓ SAÍDA - 10kg Arroz                    │
│ Tipo: Distribuição                      │
│ Responsável: Maria Santos               │
│ Obs: Distribuição para famílias         │
│ ─────────────────────────────────────   │
└─────────────────────────────────────────┘
```

### 4.2 Filtros Avançados
- **Período:**
  - Hoje
  - Últimos 7 dias
  - Últimos 30 dias
  - Personalizado (data início/fim)

- **Tipo de Movimentação:**
  - Todas
  - Apenas Entradas
  - Apenas Saídas

- **Categoria:**
  - Todas
  - Água
  - Comida
  - Roupas
  - etc.

- **Origem/Tipo:**
  - Doação recebida
  - Compra
  - Transferência
  - Distribuição
  - Perda/Descarte
  - Ajuste manual

### 4.3 Exportação
- **CSV:** Exportar para Excel
- **PDF:** Relatório formatado
- **Filtros aplicados:** Exporta apenas o que está filtrado

---

## 🔧 IMPLEMENTAÇÃO TÉCNICA

### Backend - Endpoints Adicionais Necessários:

```python
# Entregas do Abrigo
GET /api/shelter/deliveries
  - Lista todas as entregas relacionadas ao abrigo
  - Filtros: status, category_id, date_range
  - Retorna: delivery com volunteer info

POST /api/shelter/deliveries/{id}/cancel
  - Cancela entrega (se status permitir)
  - Atualiza reserved_quantity do item

# Analíticos
GET /api/shelter/inventory/analytics
  - Retorna dados para gráficos
  - Métricas agregadas
  - Tendências

GET /api/shelter/inventory/analytics/chart-data
  - Dados formatados para gráficos específicos
  - Parâmetros: chart_type, date_range

# Histórico
GET /api/shelter/inventory/history
  - Lista completa de movimentações
  - Filtros avançados
  - Paginação

GET /api/shelter/inventory/export
  - Exporta dados em CSV/PDF
  - Filtros aplicados
```

### Frontend - Estrutura de Componentes:

```
ShelterInventoryDashboard.jsx (Principal)
├── TabNavigation (Abas)
├── EstoqueTab (Atual - já implementado)
├── EntregasTab (NOVO)
│   ├── DeliveryCard
│   ├── DeliveryFilters
│   └── DeliveryStatusBadge
├── AnaliticosTab (NOVO)
│   ├── ChartsSection
│   │   ├── BarChart (Recharts)
│   │   ├── PieChart (Recharts)
│   │   └── LineChart (Recharts)
│   ├── MetricsGrid
│   └── InsightsPanel
└── HistoricoTab (NOVO)
    ├── MovementTimeline
    ├── AdvancedFilters
    └── ExportButton
```

### Bibliotecas Necessárias:

```bash
npm install recharts  # Para gráficos
npm install date-fns  # Para manipulação de datas
npm install react-csv # Para exportar CSV
```

---

## 🎨 DESIGN SYSTEM

### Cores por Status:
- **Disponível:** #3b82f6 (Azul)
- **Confirmada:** #f59e0b (Laranja)
- **Em Trânsito:** #8b5cf6 (Roxo)
- **Entregue:** #10b981 (Verde)
- **Cancelada:** #ef4444 (Vermelho)

### Ícones:
- Estoque: 📦
- Entregas: 🚚
- Analíticos: 📊
- Histórico: 📜

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Correções Urgentes
- [ ] Corrigir carregamento de categorias no modal
- [ ] Testar criação de item do zero
- [ ] Validar todos os endpoints

### Fase 2: Aba Entregas
- [ ] Criar endpoint GET /api/shelter/deliveries
- [ ] Criar componente EntregasTab
- [ ] Implementar cards de entrega
- [ ] Adicionar filtros
- [ ] Integrar com estoque (reserved_quantity)

### Fase 3: Aba Analíticos
- [ ] Instalar Recharts
- [ ] Criar endpoint /api/shelter/inventory/analytics
- [ ] Implementar gráficos
- [ ] Adicionar métricas avançadas
- [ ] Criar insights automáticos

### Fase 4: Aba Histórico
- [ ] Melhorar endpoint de histórico
- [ ] Criar timeline de movimentações
- [ ] Implementar filtros avançados
- [ ] Adicionar exportação CSV/PDF

### Fase 5: Testes e Refinamento
- [ ] Testar fluxo completo
- [ ] Validar performance
- [ ] Ajustar UX
- [ ] Documentar

---

**Status:** Planejamento completo - Pronto para implementação
**Prioridade:** ALTA - Sistema crítico para MVP
**Estimativa:** 2-3 dias de desenvolvimento
