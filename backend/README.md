# 🚀 VouAjudar Backend - API Genérica de Conexão Social

API REST escalável e genérica para gerenciamento de recursos, produtos e entregas em situações de emergência e necessidade social.

**Arquitetura Event-Driven** preparada para escalar em microserviços.

## Tecnologias

- **FastAPI**: Framework web moderno e rápido
- **SQLAlchemy**: ORM para banco de dados
- **SQLite**: Banco de dados (fácil migração para PostgreSQL)
- **JWT**: Autenticação via tokens
- **Pydantic**: Validação de dados

## Instalação

1. Criar ambiente virtual:
```bash
python -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate
```

2. Instalar dependências:
```bash
pip install -r requirements.txt
```

3. Configurar variáveis de ambiente:
```bash
cp .env.example .env
# Edite o .env e altere o SECRET_KEY
```

4. Executar servidor:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Documentação da API

Após iniciar o servidor, acesse:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Estrutura

```
backend/
├── app/
│   ├── routers/          # Endpoints da API
│   ├── models.py         # Modelos do banco de dados
│   ├── schemas.py        # Schemas Pydantic
│   ├── database.py       # Configuração do banco
│   ├── auth.py           # Autenticação JWT
│   └── main.py           # Aplicação principal
├── requirements.txt      # Dependências
└── .env                  # Variáveis de ambiente
```

## Arquitetura

### Event-Driven Design

O backend utiliza arquitetura orientada a eventos com:
- **Models genéricos**: `ProductBatch`, `Delivery`, `ResourceRequest`
- **Enums baseados em eventos**: `OrderStatus`, `DeliveryStatus`, `BatchStatus`
- **Repository Pattern**: Abstração de acesso a dados
- **Validators**: Validação específica por tipo de produto

### Perfis de Usuário

- **Provider (Fornecedor)**: Solicita recursos e oferece produtos
- **Volunteer (Voluntário)**: Reserva recursos e realiza entregas
- **Receiver (Recebedor)**: Locais que recebem produtos
- **Admin**: Gerencia usuários, locais e aprovações

## Fluxos Principais

### 1. Fluxo de Recursos
1. Fornecedor cria pedido de recursos (ingredientes, materiais, etc.)
2. Voluntário reserva (total ou parcial)
3. Voluntário entrega recursos ao fornecedor
4. Fornecedor confirma recebimento

### 2. Fluxo de Produtos
1. Fornecedor cria lote de produtos (refeições, roupas, etc.)
2. Fornecedor marca como pronto
3. Sistema disponibiliza para entrega
4. Voluntário aceita entrega
5. Voluntário confirma entrega no local de destino

### 3. Endpoints Principais

- `/api/batches` - Gerenciamento de lotes de produtos
- `/api/deliveries` - Gerenciamento de entregas
- `/api/resources` - Gerenciamento de recursos e reservas
- `/api/locations` - Locais de entrega
- `/api/admin` - Administração de usuários
- `/api/auth` - Autenticação

## Regras de Negócio

- Fornecedor pode ter múltiplos pedidos de recursos ativos
- Voluntário pode ter até 2 reservas ativas simultaneamente
- Pedidos de recursos expiram em 2 dias (configurável por tipo)
- Lotes de produtos expiram em 6 horas (configurável por tipo)
- Entregas expiram em 3 horas
- Sistema de códigos de confirmação para segurança
- Fornecedores e voluntários aprovados automaticamente
- Admin aprova locais de entrega (recebedores)

## Tipos de Produtos Suportados

```python
ProductType:
  - MEAL: Refeições
  - INGREDIENT: Ingredientes
  - CLOTHING: Roupas
  - MEDICINE: Medicamentos
  - GENERIC: Genérico
```

Fácil adicionar novos tipos através do enum `ProductType`.

## 🧪 Testes

```bash
# Rodar todos os testes
pytest

# Com cobertura
pytest --cov=app --cov-report=html

# Teste específico
pytest tests/test_batches.py
```

## 🚀 Deploy em Produção

### Render.com (Recomendado)
1. Conecte seu repositório ao Render
2. Configure as variáveis de ambiente
3. Deploy automático

### Docker
```bash
# Build
docker build -t euajudo-backend .

# Run
docker run -p 8000:8000 euajudo-backend
```

## 📚 Documentação

- **API Docs**: http://localhost:8000/docs (Swagger)
- **ReDoc**: http://localhost:8000/redoc
- **Arquitetura**: [docs/architecture/](../docs/architecture/)
- **Contribuição**: [CONTRIBUTING.md](../CONTRIBUTING.md)

## 🔧 Desenvolvimento

### Estrutura de Arquivos
```
backend/app/
├── routers/          # Endpoints da API
├── models.py         # Models SQLAlchemy genéricos
├── schemas.py        # Schemas Pydantic
├── enums.py          # Enumerações (ProductType, Status)
├── validators.py     # Validadores por tipo de produto
├── repositories.py   # Repository pattern
└── main.py           # Aplicação FastAPI
```

### Adicionando Novo Tipo de Produto
1. Adicione em `ProductType` enum
2. Crie validator específico (se necessário)
3. Teste endpoints
4. Documente no README principal
