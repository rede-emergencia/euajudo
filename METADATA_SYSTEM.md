# 🏗️ Sistema de Categorias e Metadados

## 📋 Visão Geral

O sistema de categorias e metadados foi implementado para permitir **expansibilidade infinita** de tipos de produtos sem necessidade de alterar código ou banco de dados.

### ✨ Características

- **Categorias Hierárquicas**: Suporte a categorias pai/filho (ex: Roupas → Roupas Criança)
- **Atributos Dinâmicos**: Cada categoria pode ter seus próprios atributos configuráveis
- **Validação Automática**: Validação de tipos e valores obrigatórios
- **Compatibilidade Legada**: Mantém compatibilidade total com `ProductType` existente
- **Cache de Performance**: Metadados em JSON para queries rápidas
- **UI Dinâmica**: Frontend pode gerar formulários automaticamente baseado nos atributos

## 🎯 MVP Atual

### Categorias Ativas

#### 💧 Água
- **Atributos**:
  - Volume (obrigatório): 500ml, 1L, 5L, 20L
  - Tipo (opcional): Mineral, Filtrada, Potável

#### 🍱 Marmita
- **Atributos**:
  - Tipo de Refeição: Almoço, Jantar, Café, Lanche
  - Vegetariano: Sim, Não
  - Tamanho: P, M, G

### Categorias Futuras (Desativadas)

#### 👕 Roupas
- Tipo: Camiseta, Calça, Bermuda, Vestido, etc.
- Tamanho: PP, P, M, G, GG, XG
- Gênero: M, F, U
- Estado: Novo, Semi-novo, Usado

#### 👶 Roupas de Criança (subcategoria de Roupas)
- Idade: 0-6m, 6-12m, 1-2a, 2-4a, etc.
- Herda atributos da categoria pai

#### 🥫 Alimentos Não Perecíveis
- Tipo: Arroz, Feijão, Macarrão, Óleo, etc.
- Peso/Volume: texto livre

## 🚀 Como Usar

### 1. Setup Inicial

```bash
# Criar tabelas e popular categorias MVP
cd backend
python seed_categories.py

# Testar sistema
python test_metadata_system.py
```

### 2. Criar Batch com Metadados (Backend)

```python
from app.models import ProductBatch
from app.metadata_helpers import get_category_by_legacy_type, set_batch_metadata
from app.enums import ProductType, BatchStatus

# Buscar categoria
marmita = get_category_by_legacy_type(db, "meal")

# Criar batch (compatível com sistema legado)
batch = ProductBatch(
    provider_id=provider.id,
    product_type=ProductType.MEAL,  # Sistema legado (mantido)
    category_id=marmita.id,          # Novo sistema
    quantity=50,
    quantity_available=50,
    description="Marmitas vegetarianas",
    status=BatchStatus.PRODUCING
)
db.add(batch)
db.flush()

# Adicionar metadados
metadata = {
    "tipo_refeicao": "almoco",
    "vegetariano": "sim",
    "tamanho": "M"
}
set_batch_metadata(db, batch, metadata)
db.commit()
```

### 3. Recuperar e Exibir Metadados

```python
from app.metadata_helpers import get_batch_metadata, format_metadata_for_display

# Recuperar metadados (usa cache se disponível)
metadata = get_batch_metadata(batch)
# {'tipo_refeicao': 'almoco', 'vegetariano': 'sim', 'tamanho': 'M'}

# Formatar para exibição na UI
formatted = format_metadata_for_display(db, batch.category_id, metadata)
# {'Tipo de Refeição': 'Almoço', 'Vegetariano': 'Sim', 'Tamanho': 'Média'}
```

### 4. Validar Metadados

```python
from app.metadata_helpers import validate_metadata

metadata = {
    "tipo_refeicao": "almoco",
    "vegetariano": "sim",
    "tamanho": "XL"  # Valor inválido
}

is_valid, errors = validate_metadata(db, category_id, metadata)
# is_valid = False
# errors = ["Valor 'XL' inválido para 'Tamanho'. Valores válidos: ['P', 'M', 'G']"]
```

### 5. API Endpoints

```bash
# Listar categorias ativas
GET /categories/

# Obter categoria específica
GET /categories/{category_id}

# Listar atributos de uma categoria
GET /categories/{category_id}/attributes

# Buscar categoria por ProductType legado
GET /categories/legacy-mapping/{product_type}

# Criar nova categoria (admin)
POST /categories/

# Criar novo atributo (admin)
POST /categories/{category_id}/attributes
```

## 📊 Estrutura do Banco de Dados

### Tabela: `categories`
```sql
- id: Integer (PK)
- name: String (unique) - Nome interno (ex: "agua", "roupa_crianca")
- display_name: String - Nome exibido (ex: "Água", "Roupas de Criança")
- description: Text
- icon: String - Emoji ou nome do ícone
- color: String - Cor hex para UI
- parent_id: Integer (FK) - Categoria pai (nullable)
- sort_order: Integer
- active: Boolean
- legacy_product_type: String - Mapeamento para ProductType legado
- created_at: DateTime
```

### Tabela: `category_attributes`
```sql
- id: Integer (PK)
- category_id: Integer (FK)
- name: String - Nome interno (ex: "tamanho")
- display_name: String - Nome exibido (ex: "Tamanho")
- attribute_type: String - "select", "text", "number", "boolean"
- required: Boolean
- sort_order: Integer
- options: JSON - Opções para tipo select
- min_value: Float - Validação para number
- max_value: Float - Validação para number
- max_length: Integer - Validação para text
- active: Boolean
- created_at: DateTime
```

### Tabela: `product_metadata`
```sql
- id: Integer (PK)
- batch_id: Integer (FK)
- attribute_id: Integer (FK)
- value: String
- created_at: DateTime
```

### Modificações em `product_batches`
```sql
+ category_id: Integer (FK) - Nova categoria
+ metadata_cache: JSON - Cache de metadados para queries rápidas
```

### Modificações em `deliveries`
```sql
+ category_id: Integer (FK) - Nova categoria
+ metadata_cache: JSON - Cache de metadados
```

## 🔄 Migração do Sistema Legado

O sistema mantém **100% de compatibilidade** com o código existente:

### Código Legado (continua funcionando)
```python
batch = ProductBatch(
    provider_id=provider.id,
    product_type=ProductType.MEAL,  # Ainda funciona!
    quantity=50,
    quantity_available=50
)
```

### Novo Sistema (opcional)
```python
batch = ProductBatch(
    provider_id=provider.id,
    product_type=ProductType.MEAL,  # Mantido para compatibilidade
    category_id=marmita.id,          # Novo sistema
    quantity=50,
    quantity_available=50
)
set_batch_metadata(db, batch, {"tamanho": "M"})
```

### Helper de Migração
```python
from app.metadata_helpers import migrate_batch_to_category

# Migrar batch existente para usar categorias
migrate_batch_to_category(db, batch, metadata={"tamanho": "M"})
```

## 🎨 Integração com Frontend

### 1. Buscar Categorias Disponíveis
```javascript
const response = await api.get('/categories/');
const categories = response.data;
// [{ id: 1, name: 'agua', display_name: 'Água', icon: '💧', ... }]
```

### 2. Buscar Atributos de uma Categoria
```javascript
const response = await api.get(`/categories/${categoryId}/attributes`);
const attributes = response.data;
// [{ name: 'volume', display_name: 'Volume', type: 'select', options: [...] }]
```

### 3. Gerar Formulário Dinâmico
```javascript
// Exemplo React
{attributes.map(attr => {
  if (attr.attribute_type === 'select') {
    return (
      <select name={attr.name} required={attr.required}>
        {attr.options.map(opt => (
          <option value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );
  }
  // ... outros tipos
})}
```

### 4. Criar Batch com Metadados
```javascript
const batchData = {
  product_type: 'meal',
  category_id: 2,
  quantity: 50,
  metadata: {
    tipo_refeicao: 'almoco',
    vegetariano: 'sim',
    tamanho: 'M'
  }
};

await api.post('/batches/', batchData);
```

## 🔧 Administração

### Ativar Categoria Futura

```python
# Via Python
db.query(Category).filter(Category.name == "roupas").update({"active": True})
db.commit()
```

```bash
# Via API
PATCH /categories/{category_id}
{
  "active": true
}
```

### Criar Nova Categoria

```bash
POST /categories/
{
  "name": "brinquedos",
  "display_name": "Brinquedos",
  "description": "Brinquedos para crianças",
  "icon": "🧸",
  "color": "#FF6B6B",
  "legacy_product_type": "generic"
}
```

### Adicionar Atributo a Categoria

```bash
POST /categories/{category_id}/attributes
{
  "name": "faixa_etaria",
  "display_name": "Faixa Etária",
  "attribute_type": "select",
  "required": true,
  "options": [
    {"value": "0-3", "label": "0-3 anos"},
    {"value": "3-6", "label": "3-6 anos"},
    {"value": "6-12", "label": "6-12 anos"}
  ]
}
```

## 📈 Expansão Futura

### Exemplo: Adicionar "Roupas" ao MVP

1. **Ativar categoria**:
```python
python -c "
from app.database import SessionLocal
from app.models import Category
db = SessionLocal()
db.query(Category).filter(Category.name == 'roupas').update({'active': True})
db.commit()
print('✅ Categoria Roupas ativada!')
"
```

2. **Usar no código**:
```python
roupas = get_category_by_legacy_type(db, "clothing")
batch = ProductBatch(
    product_type=ProductType.CLOTHING,
    category_id=roupas.id,
    quantity=20
)
set_batch_metadata(db, batch, {
    "tipo": "camiseta",
    "tamanho": "M",
    "genero": "U"
})
```

3. **Frontend automaticamente**:
   - Detecta nova categoria disponível
   - Carrega atributos
   - Gera formulário dinamicamente

## 🎯 Benefícios

### ✅ Expansibilidade
- Adicionar novos tipos de produtos sem alterar código
- Categorias hierárquicas (ex: Roupas → Roupas Criança)
- Atributos customizáveis por categoria

### ✅ Validação
- Validação automática de tipos e valores
- Atributos obrigatórios configuráveis
- Mensagens de erro amigáveis

### ✅ Performance
- Cache JSON para queries rápidas
- Índices otimizados
- Lazy loading de metadados

### ✅ UX
- UI dinâmica gerada automaticamente
- Labels amigáveis
- Formatação automática para exibição

### ✅ Compatibilidade
- 100% compatível com código existente
- Migração gradual opcional
- Sem breaking changes

## 📝 Próximos Passos

1. ✅ Sistema implementado e testado
2. ✅ Categorias MVP criadas (Água, Marmita)
3. ✅ Categorias futuras preparadas (Roupas, Alimentos)
4. 🔜 Atualizar frontend para usar categorias
5. 🔜 Migrar batches existentes (opcional)
6. 🔜 Adicionar mais categorias conforme necessidade

## 🐛 Troubleshooting

### Categorias não aparecem
```bash
# Executar seed de categorias
python backend/seed_categories.py
```

### Metadados não validam
```python
# Verificar atributos da categoria
from app.metadata_helpers import get_category_attributes
attrs = get_category_attributes(db, category_id)
for attr in attrs:
    print(f"{attr.name}: {attr.options}")
```

### Erro ao criar batch
```python
# Verificar se categoria existe e está ativa
category = db.query(Category).filter(Category.id == category_id).first()
print(f"Ativa: {category.active if category else 'Não encontrada'}")
```

## 📚 Referências

- **Modelos**: `backend/app/models.py` (linhas 20-96)
- **Schemas**: `backend/app/category_schemas.py`
- **Helpers**: `backend/app/metadata_helpers.py`
- **Router**: `backend/app/routers/categories.py`
- **Seed**: `backend/seed_categories.py`
- **Testes**: `backend/test_metadata_system.py`

---

**🎉 Sistema pronto para produção e expansão futura!**
