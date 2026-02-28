# Painel Admin V2 - Documentação da API

## 🎯 Visão Geral

Painel administrativo **unificado e profissional** para gestão completa do sistema VouAjudar.

### ✨ Características

- **Estrutura organizada**: Não há menu para cada tipo de pendente
- **Pendentes integrados**: Abrigos pendentes aparecem dentro da gestão de abrigos
- **API intuitiva**: Endpoints claros e bem documentados
- **Dashboard completo**: Overview do sistema em uma única chamada
- **Replicável**: Estrutura profissional para futuras expansões

---

## 🚀 Endpoints Principais

Base URL: `/api/admin/v2`

### 1. Dashboard & Overview

#### `GET /dashboard`
Retorna métricas completas do sistema para o dashboard admin.

**Resposta:**
```json
{
  "summary": {
    "total_users": 50,
    "active_users": 45,
    "pending_approvals": 5,
    "total_capacity": 350,
    "total_daily_need": 250,
    "active_categories": 6
  },
  "users": {
    "total": 50,
    "active": 45,
    "pending": 3,
    "volunteers": { "total": 20, "active": 18 },
    "shelters": { "total": 10, "active": 8 }
  },
  "locations": {
    "total": 12,
    "active": 10,
    "pending": 2,
    "total_capacity": 350,
    "total_daily_need": 250
  },
  "deliveries": {
    "total": 100,
    "pending": 25,
    "in_progress": 15
  },
  "categories": {
    "total": 10,
    "active": 6
  },
  "pending_items": {
    "users_pending_approval": 3,
    "locations_pending_approval": 2,
    "deliveries_pending_acceptance": 25
  }
}
```

---

### 2. Gestão de Usuários

#### `GET /users`
Lista todos os usuários com filtros avançados.

**Query Parameters:**
- `role` (opcional): `admin`, `volunteer`, `shelter`, `provider`
- `status` (opcional): `active`, `inactive`, `pending`
- `search` (opcional): Busca por nome ou email
- `skip` (padrão: 0): Paginação
- `limit` (padrão: 50): Itens por página

**Exemplo:**
```bash
GET /api/admin/v2/users?role=volunteer&status=active&search=joao
```

**Resposta:**
```json
{
  "items": [...],
  "total": 20,
  "skip": 0,
  "limit": 50,
  "filters": { "role": "volunteer", "status": "active", "search": "joao" }
}
```

#### `GET /users/pending`
Lista usuários pendentes de aprovação (integrado, não menu separado).

**Query Parameters:**
- `role` (opcional): Filtrar por role específico

#### `POST /users/{user_id}/approve`
Aprova um usuário pendente.

#### `POST /users/{user_id}/reject`
Rejeita um usuário.

**Body (opcional):**
```json
{ "reason": "Documentação incompleta" }
```

#### `POST /users/{user_id}/toggle-status`
Ativa/desativa um usuário.

#### `GET /users/{user_id}/details`
Retorna detalhes completos de um usuário incluindo:
- Informações básicas
- Deliveries associadas (se for voluntário)
- Location associado (se for abrigo)
- Estatísticas de atividade

**Resposta:**
```json
{
  "user": { ... },
  "roles": ["volunteer"],
  "stats": {
    "total_deliveries": 15,
    "completed_deliveries": 12
  }
}
```

---

### 3. Gestão de Abrigos

#### `GET /shelters`
Lista todos os abrigos com filtros.

**Query Parameters:**
- `status` (opcional): `active`, `inactive`, `pending`
- `city` (opcional): Filtrar por cidade
- `search` (opcional): Busca por nome, endereço ou contato

**Exemplo:**
```bash
GET /api/admin/v2/shelters?status=pending&city=juiz-de-fora
```

**Resposta:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Abrigo Centro",
      "address": "Rua...",
      "capacity": 200,
      "daily_need": 150,
      "active": true,
      "approved": false,
      "user_id": 5,
      "user": {
        "id": 5,
        "name": "João Silva",
        "email": "joao@...",
        "approved": false
      }
    }
  ],
  "total": 1,
  "filters": { "status": "pending", "city": "juiz-de-fora" }
}
```

#### `GET /shelters/pending`
Lista abrigos pendentes de aprovação (**dentro da gestão de abrigos, não menu separado**).

**Resposta:**
```json
[
  {
    "id": 1,
    "name": "Abrigo Centro",
    "capacity": 200,
    "daily_need": 150,
    "requested_by": {
      "id": 5,
      "name": "João Silva",
      "email": "joao@...",
      "created_at": "2024-01-15T10:00:00"
    }
  }
]
```

#### `GET /shelters/{shelter_id}/details`
Retorna detalhes completos de um abrigo.

**Resposta:**
```json
{
  "location": { ... },
  "user": { ... },
  "stats": {
    "total_deliveries": 50,
    "pending_deliveries": 10,
    "in_progress_deliveries": 5,
    "completed_deliveries": 35
  },
  "recent_deliveries": [ ... ]
}
```

#### `POST /shelters/{shelter_id}/approve`
Aprova um abrigo.

**Query Parameters:**
- `approve_user_too` (padrão: true): Também aprova o usuário associado

#### `POST /shelters/{shelter_id}/reject`
Rejeita um abrigo.

**Body (opcional):**
```json
{ "reason": "Endereço não confirmado" }
```

#### `PATCH /shelters/{shelter_id}`
Atualiza informações de um abrigo.

**Body:**
```json
{
  "name": "Novo Nome",
  "capacity": 250,
  "daily_need": 200,
  "active": true
}
```

---

### 4. Gestão de Categorias/Itens

#### `GET /categories`
Lista todas as categorias/itens disponíveis.

**Query Parameters:**
- `status` (opcional): `active`, `inactive`, `all`
- `search` (opcional): Busca por nome

**Resposta:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "agua",
      "display_name": "Água Potável",
      "icon": "💧",
      "active": true,
      "attributes": [...]
    }
  ],
  "summary": {
    "total": 10,
    "active": 6,
    "inactive": 4
  }
}
```

#### `GET /categories/{category_id}/details`
Retorna detalhes de uma categoria.

**Resposta:**
```json
{
  "category": { ... },
  "attributes": [...],
  "stats": {
    "total_deliveries": 100,
    "total_batches": 50,
    "attributes_count": 3
  }
}
```

#### `POST /categories`
Cria uma nova categoria/item.

**Body:**
```json
{
  "name": "geradores",
  "display_name": "Geradores de Energia",
  "description": "Geradores para emergências",
  "icon": "⚡",
  "color": "#FFC107",
  "sort_order": 10,
  "legacy_product_type": "generic",
  "active": true
}
```

#### `PATCH /categories/{category_id}`
Atualiza uma categoria.

#### `POST /categories/{category_id}/toggle`
Ativa/desativa uma categoria.

#### `POST /categories/{category_id}/attributes`
Adiciona um atributo a uma categoria.

**Body:**
```json
{
  "name": "potencia",
  "display_name": "Potência (W)",
  "attribute_type": "select",
  "required": true,
  "options": [
    {"value": "1000", "label": "1000W"},
    {"value": "2000", "label": "2000W"}
  ]
}
```

---

### 5. Gestão de Pedidos/Deliveries

#### `GET /deliveries`
Lista todos os pedidos com filtros.

**Query Parameters:**
- `status` (opcional): Filtrar por status
- `location_id` (opcional): Filtrar por abrigo
- `category_id` (opcional): Filtrar por categoria

**Resposta:**
```json
{
  "items": [
    {
      "id": 1,
      "status": "available",
      "quantity": 100,
      "location": { "id": 1, "name": "Abrigo Centro" },
      "volunteer": null,
      "category": { "id": 1, "display_name": "Água Potável", "icon": "💧" }
    }
  ],
  "total": 50,
  "skip": 0,
  "limit": 50
}
```

---

### 6. Relatórios

#### `GET /reports/overview`
Relatório geral do sistema.

**Query Parameters:**
- `days` (padrão: 30): Dias para análise

**Resposta:**
```json
{
  "period_days": 30,
  "since": "2024-01-01T00:00:00",
  "users": {
    "new_total": 10,
    "new_volunteers": 5,
    "new_shelters": 3
  },
  "deliveries": {
    "new_total": 50,
    "completed": 45,
    "success_rate_percent": 90.0
  }
}
```

---

## 🎨 Estrutura Recomendada para Frontend

### Menu Admin Unificado

```
📊 Dashboard
   └─ Overview completo do sistema
   └─ Métricas principais
   └─ Itens pendentes destacados

👥 Usuários
   └─ Todos os usuários (com filtros)
   └─ Pendentes (tab/filtro, não menu separado)
   └─ Detalhes por usuário

🏠 Abrigos
   └─ Todos os abrigos (com filtros)
   └─ Pendentes (tab/filtro, não menu separado)
   └─ Detalhes por abrigo
   └─ Estatísticas de uso

📦 Categorias/Itens
   └─ Lista de categorias
   └─ Ativar/Desativar itens
   └─ Gerenciar atributos
   └─ Criar novos itens

📋 Pedidos
   └─ Todos os pedidos
   └─ Por status
   └─ Por abrigo/categoria

📈 Relatórios
   └─ Overview do sistema
   └─ Métricas de desempenho
```

---

## 💡 Fluxos de Uso

### Fluxo 1: Aprovar Novo Abrigo

1. **Admin acessa** Dashboard → vê "2 abrigos pendentes"
2. **Clica** em "Abrigos" → tab "Pendentes"
3. **Visualiza** lista de abrigos pendentes
4. **Clica** em abrigo → vê detalhes completos
5. **Aprova** abrigo (e usuário automaticamente)
6. **Abrigo** fica ativo no sistema

### Fluxo 2: Gerenciar Categorias

1. **Admin acessa** "Categorias/Itens"
2. **Visualiza** todas as categorias (ativas e inativas)
3. **Ativa/Desativa** itens conforme necessidade
4. **Adiciona** nova categoria se necessário
5. **Configura** atributos da categoria

### Fluxo 3: Visualizar Estatísticas

1. **Admin acessa** Dashboard
2. **Visualiza** métricas em tempo real:
   - Pessoas atendidas
   - Recursos disponíveis
   - Pedidos pendentes
   - Taxa de sucesso

---

## 🔐 Autenticação

Todos os endpoints requerem autenticação como admin:

```bash
Authorization: Bearer <token_admin>
```

---

## 🎯 Benefícios da Estrutura

### ✅ Organização Profissional
- Não há menu para cada tipo de pendente
- Pendentes integrados no contexto da entidade
- Navegação intuitiva e lógica

### ✅ Replicável
- Estrutura padronizada
- Fácil adicionar novas entidades
- Padrão consistente de endpoints

### ✅ Intuitivo
- Nomes claros de endpoints
- Filtros consistentes
- Respostas enriquecidas com dados relacionados

### ✅ Completo
- Dashboard com overview
- Gestão de todas as entidades
- Relatórios e métricas
- Ações administrativas

---

## 📁 Arquivos

- **Router**: `backend/app/routers/admin_unified.py`
- **Registro**: `backend/app/main.py` (linha 93)
- **Documentação**: Este arquivo

---

## 🚀 Próximos Passos

1. ✅ **API implementada** e registrada
2. 🔜 **Testar** endpoints
3. 🔜 **Documentar** no Swagger/OpenAPI
4. 🔜 **Criar** frontend seguindo estrutura recomendada

---

**🎉 Painel Admin V2 pronto para uso!**
