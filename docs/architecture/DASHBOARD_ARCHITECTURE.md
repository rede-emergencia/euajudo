# Arquitetura Modular de Dashboard

## Visão Geral

O sistema de dashboard foi completamente refatorado para ser **modular, reutilizável e expansível**. A nova arquitetura permite:

- ✅ Adicionar novos tipos de usuários sem duplicar código
- ✅ Adicionar novos tipos de produtos sem modificar dashboards
- ✅ Reutilizar componentes entre diferentes papéis
- ✅ Configurar dashboards através de arquivos de configuração
- ✅ Manutenção centralizada e simplificada

## Arquitetura

### Backend

#### 1. Sistema de Configuração (`dashboard_config.py`)

Define widgets e layouts de dashboard para cada papel de usuário:

```python
# Tipos de widgets disponíveis
- STATS_CARD: Cartão de estatísticas
- LIST: Lista de itens com ações
- FORM: Formulário de criação/edição
- TIMELINE: Linha do tempo de atividades
- CHART: Gráficos
- TABLE: Tabela de dados
- QUICK_ACTIONS: Botões de ação rápida
```

**Exemplo de configuração:**

```python
PROVIDER_DASHBOARD = DashboardLayout(
    role="provider",
    title="Dashboard Fornecedor",
    widgets=[
        WidgetConfig(
            id="my_batches",
            type=WidgetType.LIST,
            title="Minhas Ofertas",
            data_source=WidgetDataSource.BATCHES,
            filters={"my": True, "active": True},
            primary_action=CREATE_BATCH_ACTION,
            item_actions=[CANCEL_ACTION]
        )
    ]
)
```

#### 2. Endpoints Genéricos (`routers/dashboard.py`)

- `GET /api/dashboard/config` - Retorna configuração do dashboard para o usuário atual
- `GET /api/dashboard/widgets/{widget_id}/data` - Retorna dados de um widget específico

**Fluxo:**
1. Frontend solicita configuração do dashboard
2. Backend identifica o papel do usuário
3. Retorna widgets configurados para aquele papel
4. Frontend renderiza widgets dinamicamente

### Frontend

#### 1. API Client (`lib/dashboardApi.js`)

Cliente HTTP para comunicação com o backend:

```javascript
dashboardApi.getConfig()          // Buscar configuração
dashboardApi.getWidgetData(id)    // Buscar dados do widget
dashboardApi.executeAction(...)   // Executar ação
```

#### 2. Custom Hooks (`hooks/useDashboard.js`)

Hooks React para gerenciar estado:

```javascript
const { config, loading } = useDashboard()      // Configuração do dashboard
const { data, reload } = useWidget(widgetId)    // Dados de um widget
```

#### 3. Componentes de Widget

**WidgetContainer**: Container genérico para todos os widgets
- Cabeçalho com título e ícone
- Botão de ação primária
- Botão de expandir/colapsar
- Loading state

**ListWidget**: Widget de lista reutilizável
- Renderização adaptativa baseada em tipo de dados
- Ações configuráveis por item
- Estados vazios personalizados
- Suporte a múltiplos tipos de produto

#### 4. Dashboard Unificado (`pages/UnifiedDashboard.jsx`)

Componente principal que:
- Carrega configuração do backend
- Renderiza widgets dinamicamente
- Gerencia modais e formulários
- Adapta-se automaticamente ao papel do usuário

## Como Adicionar Novo Tipo de Usuário

### 1. Backend - Definir Configuração

Em `dashboard_config.py`:

```python
NEW_ROLE_DASHBOARD = DashboardLayout(
    role="new_role",
    title="Dashboard Novo Papel",
    description="Descrição do dashboard",
    widgets=[
        WidgetConfig(
            id="my_items",
            type=WidgetType.LIST,
            title="Meus Itens",
            data_source=WidgetDataSource.BATCHES,
            filters={"my": True},
            primary_action=CREATE_ACTION,
            item_actions=[EDIT_ACTION, DELETE_ACTION]
        )
    ]
)

# Registrar no registry
DASHBOARD_REGISTRY["new_role"] = NEW_ROLE_DASHBOARD
```

### 2. Backend - Implementar Loader de Dados (se necessário)

Em `routers/dashboard.py`, adicione novo data source se necessário:

```python
def load_new_data_source(...):
    # Implementar lógica de carregamento
    return data
```

### 3. Frontend - Sem Modificações Necessárias!

O UnifiedDashboard automaticamente:
- Carrega a nova configuração
- Renderiza os widgets
- Aplica ações configuradas

## Como Adicionar Novo Tipo de Produto

### 1. Backend - Adicionar ao Enum

```python
class ProductType(str, Enum):
    MEAL = "meal"
    INGREDIENT = "ingredient"
    NEW_PRODUCT = "new_product"  # Adicionar aqui
```

### 2. Configurar Widget

```python
WidgetConfig(
    id="new_product_list",
    type=WidgetType.LIST,
    title="Produtos Novos",
    data_source=WidgetDataSource.BATCHES,
    filters={"product_type": "new_product"}
)
```

### 3. Frontend - ListWidget Adapta Automaticamente

O ListWidget já suporta:
- Múltiplos product_types
- Renderização genérica de campos
- Ícones e labels configuráveis

## Como Adicionar Novo Widget Type

### 1. Backend - Adicionar tipo ao Enum

```python
class WidgetType(str, Enum):
    STATS_CARD = "stats_card"
    LIST = "list"
    NEW_WIDGET = "new_widget"  # Adicionar
```

### 2. Frontend - Criar Componente

```jsx
// components/widgets/NewWidget.jsx
export default function NewWidget({ widget }) {
  const { data } = useWidget(widget.id);
  
  return (
    <div>
      {/* Renderizar conteúdo do widget */}
    </div>
  );
}
```

### 3. Frontend - Registrar no UnifiedDashboard

```jsx
const renderWidget = (widget) => {
  switch (widget.type) {
    case 'new_widget':
      return <NewWidget widget={widget} />;
    // outros casos...
  }
}
```

## Benefícios da Nova Arquitetura

### 1. Código Reduzido
- **Antes**: ~3 arquivos por papel (Provider, Shelter, Volunteer) = 9 arquivos
- **Depois**: 1 dashboard + componentes reutilizáveis = 5 arquivos

### 2. Manutenção Simplificada
- Correção de bugs em um lugar afeta todos os dashboards
- Componentes testados e validados uma vez
- Lógica centralizada no backend

### 3. Expansibilidade
- Adicionar novo papel: 1 arquivo de config
- Adicionar novo produto: 1 linha de enum
- Adicionar novo widget: 1 componente React

### 4. Consistência
- UX unificada entre dashboards
- Padrões visuais consistentes
- Comportamento previsível

## Migração Gradual

Os dashboards antigos foram mantidos para compatibilidade:
- `/dashboard/fornecedor` - Dashboard antigo (Provider)
- `/dashboard/voluntario` - Dashboard antigo (Volunteer)
- `/dashboard/abrigo` - Dashboard antigo (Shelter)
- `/dashboard` - **Novo dashboard unificado** ✨

Recomenda-se migrar gradualmente os usuários para `/dashboard`.

## Estrutura de Arquivos

```
backend/
├── app/
│   ├── dashboard_config.py       # Configurações de widgets e layouts
│   └── routers/
│       └── dashboard.py          # Endpoints genéricos

frontend/
├── src/
│   ├── components/
│   │   └── widgets/
│   │       ├── WidgetContainer.jsx   # Container genérico
│   │       └── ListWidget.jsx        # Widget de lista
│   ├── hooks/
│   │   └── useDashboard.js       # Hooks de dashboard
│   ├── lib/
│   │   └── dashboardApi.js       # Cliente API
│   └── pages/
│       └── UnifiedDashboard.jsx  # Dashboard unificado
```

## Próximos Passos

1. ✅ Implementar widgets faltantes (STATS_CARD, CHART, TIMELINE)
2. ✅ Adicionar suporte a filtros avançados
3. ✅ Implementar persistência de preferências do usuário
4. ✅ Adicionar testes automatizados
5. ✅ Migrar completamente para novo dashboard
6. ✅ Remover dashboards legados

## Exemplos de Uso

### Adicionar Dashboard para Administrador

```python
# backend/app/dashboard_config.py
ADMIN_DASHBOARD = DashboardLayout(
    role="admin",
    title="Painel Administrativo",
    widgets=[
        WidgetConfig(
            id="stats",
            type=WidgetType.STATS_CARD,
            title="Estatísticas do Sistema",
            data_source=WidgetDataSource.STATS
        ),
        WidgetConfig(
            id="pending_approvals",
            type=WidgetType.LIST,
            title="Aprovações Pendentes",
            data_source=WidgetDataSource.USERS,
            filters={"approved": False}
        )
    ]
)
```

Pronto! Nenhuma alteração no frontend necessária.

### Adicionar Widget de Gráfico

```jsx
// frontend/src/components/widgets/ChartWidget.jsx
import { useWidget } from '../../hooks/useDashboard';
import { LineChart } from 'recharts';

export default function ChartWidget({ widget }) {
  const { data } = useWidget(widget.id);
  
  return (
    <LineChart data={data}>
      {/* Configuração do gráfico */}
    </LineChart>
  );
}
```

Registrar no UnifiedDashboard e usar!

## Conclusão

A nova arquitetura modular transforma o dashboard em um sistema:
- **Flexível**: Adapta-se a qualquer papel ou produto
- **Reutilizável**: Componentes usados por todos
- **Manutenível**: Correções em um lugar
- **Escalável**: Fácil adicionar funcionalidades
- **Consistente**: UX unificada

Esta é a base para crescimento sustentável do sistema.
