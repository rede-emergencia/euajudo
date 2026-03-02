# Backend Architecture — EuAjudo

## 🏗️ Clean Architecture Implementada

O backend segue **Clean Architecture** com separação clara de camadas e responsabilidades.

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  📍 presentation/routers/ - FastAPI endpoints                │
│  📦 application/dtos/ - Request/Response schemas             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                          │
│  🔧 application/services/ - Business logic                   │
│  📋 application/services/interfaces/ - Service ABCs          │
│  📡 application/events/ - Domain events                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     DOMAIN LAYER                             │
│  🎯 domain/models/ - Entities (User, Delivery, etc)         │
│  📊 domain/enums/ - Domain constants                         │
│  ✅ domain/validators/ - Business rules                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 INFRASTRUCTURE LAYER                         │
│  💾 infrastructure/repositories/ - Data access               │
│  🗄️ infrastructure/database/ - SQLAlchemy config             │
│  📝 infrastructure/logging/ - Logging setup                  │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Estrutura de Diretórios

### Atual (Migração em Progresso)

```
backend/app/
├── application/                 # ✅ NOVO - Camada de Aplicação
│   ├── services/
│   │   ├── interfaces/         # ✅ Service ABCs (IDonationService)
│   │   └── donation_service.py # ✅ Implementação
│   ├── dtos/
│   │   ├── requests/           # ✅ Request DTOs organizados
│   │   └── responses/          # ✅ Response DTOs organizados
│   └── events/                 # Domain events
│
├── infrastructure/              # Camada de Infraestrutura
│   ├── repositories/           # ✅ Repository Pattern implementado
│   │   ├── base.py            # IRepository[T], BaseRepository[T]
│   │   ├── delivery_repository.py
│   │   ├── shelter_request_repository.py
│   │   ├── user_repository.py
│   │   ├── location_repository.py
│   │   ├── inventory_repository.py
│   │   └── category_repository.py
│   └── logging/
│       └── config.py          # ✅ Logging centralizado
│
├── shared/                      # ✅ NOVO - Código compartilhado
│   ├── exceptions.py           # ✅ Custom exceptions
│   └── utils.py
│
├── core/                        # Core utilities
│   ├── events.py               # Event bus
│   └── logging_config.py       # ✅ Logging setup
│
├── services/                    # ⚠️ LEGACY - Migrar para application/
│   ├── donation_service.py     # ✅ Atualizado para usar interface
│   ├── inventory_service.py    # ⚠️ Parcialmente migrado
│   ├── transaction_service.py  # ⚠️ Pendente migração
│   └── cancel_service.py       # ⚠️ Pendente migração
│
├── routers/                     # ⚠️ LEGACY - Migrar para presentation/
│   ├── donations.py            # ✅ Atualizado para usar DTOs novos
│   ├── users.py
│   ├── auth.py
│   └── ...
│
├── models.py                    # ⚠️ LEGACY - Migrar para domain/models/
├── inventory_models.py          # ⚠️ LEGACY - Migrar para domain/models/
├── enums.py                     # ⚠️ LEGACY - Migrar para domain/enums/
├── validators.py                # ⚠️ LEGACY - Migrar para domain/validators/
├── schemas.py                   # ⚠️ LEGACY - Substituir por DTOs
├── category_schemas.py          # ⚠️ LEGACY - Substituir por DTOs
├── inventory_schemas.py         # ⚠️ LEGACY - Substituir por DTOs
└── main.py                      # Application entry point
```

## ✅ O Que Já Foi Implementado

### 1. Repository Pattern Completo

**8 repositories** com interface ABC e implementações concretas:
- `IRepository[T]` — Interface genérica
- `BaseRepository[T]` — Implementação base com CRUD + logging
- `DeliveryRepository` — Queries de Delivery
- `ShelterRequestRepository` — Queries de ShelterRequest
- `UserRepository` — Queries de User
- `LocationRepository` — Queries de DeliveryLocation
- `InventoryItemRepository` — Queries de InventoryItem
- `CategoryRepository` — Queries de Category

**Benefícios**:
- ✅ Logging automático em todas as operações
- ✅ Queries de domínio encapsuladas
- ✅ Testável (fácil de mockar)
- ✅ Reusável entre services

### 2. Service Interfaces (ABCs)

**`IDonationService`** — Interface para DonationService:
```python
class IDonationService(ABC):
    @abstractmethod
    def commit_donation(...) -> dict: pass
    
    @abstractmethod
    def cancel_donation(...) -> bool: pass
    
    @abstractmethod
    def confirm_delivery(...): pass
```

**Benefícios**:
- ✅ Contratos claros
- ✅ Fácil de mockar em testes
- ✅ Dependency Inversion Principle

### 3. DTOs Organizados

**Request DTOs** (`application/dtos/requests/`):
- `DonationCommitRequest` — Criar compromisso
- `DonationItemRequest` — Item individual
- `ConfirmDeliveryRequest` — Confirmar entrega

**Response DTOs** (`application/dtos/responses/`):
- `DonationCommitResponse` — Resultado do compromisso
- `DeliveryResponse` — Dados de delivery

**Benefícios**:
- ✅ Validação automática (Pydantic)
- ✅ Documentação Swagger automática
- ✅ Separação clara Request vs Response
- ✅ Reutilizável entre routers

### 4. Exceptions Compartilhadas

**`shared/exceptions.py`**:
```python
class DomainError(Exception): pass
class DonationError(DomainError): pass
class ValidationError(DomainError): pass
class NotFoundError(DomainError): pass
```

**Benefícios**:
- ✅ Hierarquia clara
- ✅ Tratamento consistente de erros
- ✅ Código compartilhado

### 5. Logging Centralizado

**`core/logging_config.py`**:
- Console + arquivo diário
- Formato estruturado
- Logs automáticos em repositories

**Exemplo**:
```
[2026-03-02 14:30:12] [INFO] [app.services.donation_service] Donation committed: code=847291
[2026-03-02 14:30:12] [DEBUG] [app.repositories.delivery_repository] Created Delivery with id=101
```

## 🎯 Próximos Passos (Migração Completa)

### Fase 1: DTOs (Baixo Risco)

- [ ] Migrar `schemas.py` → `application/dtos/requests/user.py`
- [ ] Migrar `category_schemas.py` → `application/dtos/requests/category.py`
- [ ] Migrar `inventory_schemas.py` → `application/dtos/requests/inventory.py`
- [ ] Deletar arquivos legacy após migração

### Fase 2: Service Interfaces (Médio Risco)

- [ ] Criar `IInventoryService` interface
- [ ] Criar `ITransactionService` interface
- [ ] Atualizar implementações para herdar interfaces

### Fase 3: Reorganizar Estrutura (Alto Risco)

- [ ] Mover `models.py` → `domain/models/user.py`, `delivery.py`, etc
- [ ] Mover `enums.py` → `domain/enums/delivery.py`, `user.py`, etc
- [ ] Mover `validators.py` → `domain/validators/`
- [ ] Mover `routers/` → `presentation/routers/`
- [ ] Atualizar todos os imports

### Fase 4: Dependency Injection

- [ ] Criar `presentation/dependencies/services.py`
- [ ] Criar factories para services
- [ ] Atualizar routers para usar DI

## 📚 Documentação

### Guias Disponíveis

1. **`docs/CLEAN_ARCHITECTURE.md`** — Arquitetura completa
   - Princípios de design (SOLID)
   - Estrutura de diretórios
   - Convenções de nomenclatura
   - Exemplos completos

2. **`docs/REPOSITORY_PATTERN.md`** — Repository Pattern
   - Como criar novo repository
   - Quando usar cada camada
   - Padrões corretos vs anti-patterns
   - Checklist para novos devs

3. **`docs/MIGRATION_GUIDE.md`** — Guia de migração
   - Passo a passo para migrar código legacy
   - Exemplos de antes/depois
   - Troubleshooting
   - Ordem recomendada

4. **`FLUXO_DOACAO_VALIDADO.md`** — Fluxo frontend-backend
   - Validação completa do fluxo de doação
   - Código real de cada camada
   - Database changes
   - Logs de exemplo

## 🧪 Testes

**27/27 testes passando** ✅

```bash
$ pytest tests/test_donation_flow.py tests/test_basic.py -v
======================== 27 passed in 3.16s ========================
```

**Cobertura**:
- ✅ Donation flow (commit, cancel, confirm)
- ✅ ACID transactions
- ✅ Repository pattern
- ✅ Logging
- ✅ Event bus

## 🔑 Princípios Aplicados

### SOLID

- **S**ingle Responsibility: Cada classe tem uma responsabilidade
- **O**pen/Closed: Aberto para extensão, fechado para modificação
- **L**iskov Substitution: Interfaces substituíveis
- **I**nterface Segregation: Interfaces pequenas e específicas
- **D**ependency Inversion: Dependa de abstrações, não implementações

### Clean Architecture

- **Separation of Concerns**: Camadas bem definidas
- **Dependency Rule**: Dependências apontam para dentro
- **Testability**: Fácil de testar com mocks
- **Independence**: Frameworks são detalhes

## 🚀 Como Usar

### Criar Novo Service

```python
# 1. Criar interface
class IMyService(ABC):
    @abstractmethod
    def do_something(self, param: int) -> Result: pass

# 2. Implementar
class MyService(IMyService):
    def __init__(self, repo: IRepository[MyModel]):
        self._repo = repo
    
    def do_something(self, param: int) -> Result:
        # Lógica de negócio
        return result

# 3. Usar no router
@router.post("/endpoint")
def endpoint(service: IMyService = Depends(get_my_service)):
    return service.do_something(...)
```

### Criar Novo DTO

```python
# application/dtos/requests/my_domain.py
class MyRequest(BaseModel):
    field: int = Field(..., gt=0, description="Description")
    
    class Config:
        json_schema_extra = {"example": {"field": 10}}

# application/dtos/responses/my_domain.py
class MyResponse(BaseModel):
    success: bool
    data: dict
```

### Criar Novo Repository

```python
# infrastructure/repositories/my_repository.py
class MyRepository(BaseRepository[MyModel]):
    def find_by_custom_field(self, value: str) -> List[MyModel]:
        return self.db.query(MyModel).filter(...).all()
```

## 📊 Status da Migração

| Componente | Status | Progresso |
|-----------|--------|-----------|
| Repository Pattern | ✅ Completo | 100% |
| Service Interfaces | 🟡 Parcial | 33% (1/3) |
| DTOs Organizados | 🟡 Parcial | 20% (donation only) |
| Logging Centralizado | ✅ Completo | 100% |
| Exceptions Compartilhadas | ✅ Completo | 100% |
| Dependency Injection | ⚠️ Pendente | 0% |
| Reorganização de Estrutura | ⚠️ Pendente | 0% |

**Legenda**:
- ✅ Completo e testado
- 🟡 Parcialmente implementado
- ⚠️ Pendente

## 🎓 Onboarding de Novos Desenvolvedores

1. Leia `docs/CLEAN_ARCHITECTURE.md`
2. Entenda as 4 camadas: Presentation, Application, Domain, Infrastructure
3. Sempre crie interface (ABC) antes de implementação
4. DTOs separados: Request vs Response
5. Services recebem repositories via DI, não `db: Session`
6. Repositories abstraem queries, Services orquestram lógica
7. Routers apenas HTTP, sem lógica de negócio
8. Testes unitários mockam dependencies

## 📞 Suporte

- **Arquitetura**: `docs/CLEAN_ARCHITECTURE.md`
- **Repository Pattern**: `docs/REPOSITORY_PATTERN.md`
- **Migração**: `docs/MIGRATION_GUIDE.md`
- **Fluxo de Doação**: `FLUXO_DOACAO_VALIDADO.md`
