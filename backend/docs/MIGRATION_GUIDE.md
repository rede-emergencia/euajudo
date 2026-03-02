# Guia de Migração — Clean Architecture

## Objetivo

Migrar código legacy para a nova estrutura Clean Architecture com:
- ✅ Interfaces (ABCs) para todos os services
- ✅ DTOs organizados por domínio (requests/responses)
- ✅ Separação clara de camadas
- ✅ Código modular e testável

## Estrutura Antiga vs Nova

### Antes (Legacy)

```
app/
├── schemas.py                    # 405 linhas, tudo misturado
├── category_schemas.py           # Schemas de categoria
├── inventory_schemas.py          # Schemas de inventário
├── services/
│   └── donation_service.py       # Sem interface, acoplado ao DB
├── routers/
│   └── donations.py              # DTOs inline, sem reuso
└── repositories.py               # BaseRepository não usado
```

**Problemas**:
- ❌ Schemas espalhados em 3 arquivos diferentes
- ❌ Sem separação Request vs Response
- ❌ Services sem interfaces (difícil testar)
- ❌ DTOs inline nos routers (duplicação)
- ❌ Acoplamento direto com SQLAlchemy

### Depois (Clean Architecture)

```
app/
├── domain/                       # Camada de Domínio
│   ├── models/                   # Entidades (User, Delivery, etc)
│   ├── enums/                    # Enums de domínio
│   └── validators/               # Regras de validação
├── application/                  # Camada de Aplicação
│   ├── services/
│   │   ├── interfaces/          # ABCs (IDonationService)
│   │   └── donation_service.py  # Implementação
│   ├── dtos/
│   │   ├── requests/            # DTOs de entrada
│   │   └── responses/           # DTOs de saída
│   └── events/                  # Domain events
├── infrastructure/              # Camada de Infraestrutura
│   ├── repositories/            # Data access
│   ├── database/                # DB config
│   └── logging/                 # Logging config
├── presentation/                # Camada de Apresentação
│   ├── routers/                 # FastAPI routers
│   ├── dependencies/            # DI containers
│   └── middleware/              # HTTP middleware
└── shared/                      # Código compartilhado
    ├── exceptions.py            # Custom exceptions
    └── utils.py                 # Utilities
```

**Benefícios**:
- ✅ Separação clara de responsabilidades
- ✅ Testável (interfaces mockáveis)
- ✅ DTOs reutilizáveis e documentados
- ✅ Dependency Inversion (services não dependem de DB)
- ✅ Fácil onboarding de novos devs

## Passo a Passo

### 1. Migrar DTOs

#### Antes (schemas.py)

```python
# schemas.py - tudo misturado
class DonationItemIn(BaseModel):
    request_id: int
    quantity: int

class DonationCommitIn(BaseModel):
    shelter_id: int
    items: List[DonationItemIn]

class DonationCommitOut(BaseModel):
    success: bool
    code: str
    delivery_ids: List[int]
```

#### Depois (DTOs organizados)

```python
# application/dtos/requests/donation.py
class DonationItemRequest(BaseModel):
    """Item individual em compromisso de doação."""
    request_id: int = Field(..., gt=0, description="ID do ShelterRequest")
    quantity: int = Field(..., gt=0, description="Quantidade a doar")

class DonationCommitRequest(BaseModel):
    """Request para criar compromisso de doação."""
    shelter_id: int = Field(..., gt=0)
    items: List[DonationItemRequest] = Field(..., min_length=1)
    
    class Config:
        json_schema_extra = {"example": {...}}

# application/dtos/responses/donation.py
class DonationCommitResponse(BaseModel):
    """Response após criar compromisso."""
    success: bool = Field(..., description="Se criado com sucesso")
    code: str = Field(..., min_length=6, max_length=6)
    delivery_ids: List[int]
```

**Ações**:
1. Criar `application/dtos/requests/{domain}.py`
2. Criar `application/dtos/responses/{domain}.py`
3. Mover schemas de `schemas.py` para DTOs apropriados
4. Adicionar `Field()` com validações e documentação
5. Adicionar `json_schema_extra` com examples
6. Exportar em `__init__.py`

### 2. Criar Interface do Service

#### Antes (sem interface)

```python
# services/donation_service.py
class DonationService:
    def __init__(self, db: Session):
        self.db = db  # Acoplamento direto
    
    def commit_donation(self, ...):
        # Implementação
```

#### Depois (com interface ABC)

```python
# application/services/interfaces/donation_service.py
class IDonationService(ABC):
    """Interface para serviço de doações."""
    
    @abstractmethod
    def commit_donation(
        self, volunteer_id: int, shelter_id: int, items: List[CommitItem]
    ) -> DonationCommitResponse:
        """Voluntário se compromete a doar itens."""
        pass

# application/services/donation_service.py
class DonationService(IDonationService):
    def __init__(
        self,
        delivery_repo: IRepository[Delivery],
        request_repo: IRepository[ShelterRequest],
        event_bus: IEventBus,
    ):
        self._delivery_repo = delivery_repo
        self._request_repo = request_repo
        self._event_bus = event_bus
    
    def commit_donation(self, ...) -> DonationCommitResponse:
        # Implementação usando repositories
```

**Ações**:
1. Criar `application/services/interfaces/{service_name}.py`
2. Definir interface ABC com `@abstractmethod`
3. Documentar cada método (docstrings)
4. Atualizar implementação para herdar da interface
5. Remover `db: Session` do constructor
6. Injetar repositories via DI

### 3. Atualizar Router

#### Antes (DTOs inline, service acoplado)

```python
# routers/donations.py
@router.post("/commitments")
def commit_donation(
    body: DonationCommitIn,  # DTO inline
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved),
):
    svc = DonationService(db)  # Criação direta
    result = svc.commit_donation(...)
    return DonationCommitOut(success=True, **result)
```

#### Depois (DTOs importados, DI)

```python
# presentation/routers/donations.py
from app.application.dtos import (
    DonationCommitRequest,
    DonationCommitResponse,
)
from app.application.services.interfaces import IDonationService
from app.presentation.dependencies import get_donation_service

@router.post("/commitments", response_model=DonationCommitResponse)
def commit_donation(
    body: DonationCommitRequest,
    current_user: User = Depends(require_approved),
    service: IDonationService = Depends(get_donation_service),
):
    return service.commit_donation(
        volunteer_id=current_user.id,
        shelter_id=body.shelter_id,
        items=[CommitItem(i.request_id, i.quantity) for i in body.items],
    )
```

**Ações**:
1. Importar DTOs de `application/dtos`
2. Importar interface do service
3. Criar dependency injection em `presentation/dependencies`
4. Usar `service: IService = Depends(get_service)`
5. Remover criação manual de service

### 4. Criar Dependency Injection

```python
# presentation/dependencies/services.py
from app.application.services.interfaces import IDonationService
from app.application.services import DonationService
from app.infrastructure.repositories import (
    DeliveryRepository,
    ShelterRequestRepository,
    LocationRepository,
)
from app.application.events import get_event_bus

def get_donation_service(
    db: Session = Depends(get_db),
    event_bus: IEventBus = Depends(get_event_bus),
) -> IDonationService:
    """Factory para DonationService com dependencies injetadas."""
    return DonationService(
        delivery_repo=DeliveryRepository(db),
        request_repo=ShelterRequestRepository(db),
        location_repo=LocationRepository(db),
        event_bus=event_bus,
    )
```

### 5. Atualizar Testes

#### Antes (testes acoplados)

```python
def test_commit_donation(db: Session):
    service = DonationService(db)  # Usa DB real
    result = service.commit_donation(...)
```

#### Depois (testes com mocks)

```python
from unittest.mock import Mock
from app.application.services.interfaces import IDonationService

def test_commit_donation():
    # Mock repositories
    delivery_repo = Mock(spec=IRepository[Delivery])
    request_repo = Mock(spec=IRepository[ShelterRequest])
    event_bus = Mock(spec=IEventBus)
    
    # Service com mocks
    service = DonationService(delivery_repo, request_repo, event_bus)
    
    # Setup mocks
    delivery_repo.create.return_value = Mock(id=101)
    request_repo.lock_for_commitment.return_value = Mock(...)
    
    # Test
    result = service.commit_donation(...)
    
    # Assertions
    assert result.success
    delivery_repo.create.assert_called_once()
    event_bus.emit.assert_called_once()
```

## Checklist de Migração

### Por Service

- [ ] Criar interface em `application/services/interfaces/{service}.py`
- [ ] Atualizar implementação para herdar da interface
- [ ] Remover `db: Session` do constructor
- [ ] Injetar repositories via DI
- [ ] Criar factory em `presentation/dependencies/services.py`
- [ ] Atualizar routers para usar DI
- [ ] Criar testes unitários com mocks
- [ ] Criar testes de integração end-to-end

### Por Domínio (DTOs)

- [ ] Criar `application/dtos/requests/{domain}.py`
- [ ] Criar `application/dtos/responses/{domain}.py`
- [ ] Mover schemas de `schemas.py`
- [ ] Adicionar validações com `Field()`
- [ ] Adicionar `json_schema_extra` com examples
- [ ] Exportar em `__init__.py`
- [ ] Atualizar imports nos routers
- [ ] Deletar schemas antigos

### Geral

- [ ] Mover models para `domain/models/`
- [ ] Mover enums para `domain/enums/`
- [ ] Mover validators para `domain/validators/`
- [ ] Mover repositories para `infrastructure/repositories/`
- [ ] Mover routers para `presentation/routers/`
- [ ] Criar `shared/exceptions.py`
- [ ] Atualizar `main.py` com nova estrutura
- [ ] Executar todos os testes
- [ ] Atualizar documentação

## Ordem de Migração Recomendada

1. **DTOs** (baixo risco, alto impacto)
   - Migrar `schemas.py` → `application/dtos/`
   - Atualizar imports nos routers

2. **Exceptions** (baixo risco)
   - Criar `shared/exceptions.py`
   - Migrar de `DonationError` inline para shared

3. **Service Interfaces** (médio risco)
   - Criar interfaces para services existentes
   - Não quebra código existente

4. **Dependency Injection** (médio risco)
   - Criar factories em `presentation/dependencies/`
   - Atualizar routers gradualmente

5. **Reorganizar Estrutura** (alto risco, fazer por último)
   - Mover models → `domain/models/`
   - Mover enums → `domain/enums/`
   - Mover repositories → `infrastructure/repositories/`
   - Atualizar todos os imports

## Exemplo Completo: Migração de Donation

### 1. DTOs

```bash
# Criar arquivos
touch app/application/dtos/requests/donation.py
touch app/application/dtos/responses/donation.py
```

```python
# application/dtos/requests/donation.py
class DonationCommitRequest(BaseModel):
    shelter_id: int = Field(..., gt=0)
    items: List[DonationItemRequest] = Field(..., min_length=1)

# application/dtos/responses/donation.py
class DonationCommitResponse(BaseModel):
    success: bool
    code: str = Field(..., min_length=6, max_length=6)
    delivery_ids: List[int]
```

### 2. Interface

```python
# application/services/interfaces/donation_service.py
class IDonationService(ABC):
    @abstractmethod
    def commit_donation(...) -> DonationCommitResponse: pass
```

### 3. Service

```python
# application/services/donation_service.py
class DonationService(IDonationService):
    def __init__(
        self,
        delivery_repo: IRepository[Delivery],
        request_repo: IRepository[ShelterRequest],
        event_bus: IEventBus,
    ):
        self._delivery_repo = delivery_repo
        self._request_repo = request_repo
        self._event_bus = event_bus
```

### 4. DI

```python
# presentation/dependencies/services.py
def get_donation_service(
    db: Session = Depends(get_db),
) -> IDonationService:
    return DonationService(
        delivery_repo=DeliveryRepository(db),
        request_repo=ShelterRequestRepository(db),
        event_bus=get_event_bus(),
    )
```

### 5. Router

```python
# presentation/routers/donations.py
from app.application.dtos import DonationCommitRequest, DonationCommitResponse
from app.application.services.interfaces import IDonationService

@router.post("/commitments", response_model=DonationCommitResponse)
def commit_donation(
    body: DonationCommitRequest,
    service: IDonationService = Depends(get_donation_service),
):
    return service.commit_donation(...)
```

### 6. Testes

```python
# tests/unit/services/test_donation_service.py
def test_commit_donation_success():
    delivery_repo = Mock(spec=IRepository[Delivery])
    service = DonationService(delivery_repo, ...)
    
    result = service.commit_donation(...)
    
    assert result.success
    delivery_repo.create.assert_called_once()
```

## Troubleshooting

### Circular Imports

**Problema**: `ImportError: cannot import name 'X' from partially initialized module`

**Solução**: Use `TYPE_CHECKING` para imports de tipo:

```python
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.domain.models import User

def my_function(user: "User"):  # String annotation
    pass
```

### Testes Quebrando

**Problema**: Testes antigos usam `db: Session` diretamente

**Solução**: Criar fixtures para services com mocks:

```python
@pytest.fixture
def donation_service():
    delivery_repo = Mock(spec=IRepository[Delivery])
    return DonationService(delivery_repo, ...)
```

### Imports Muito Longos

**Problema**: `from app.application.dtos.responses.donation import DonationCommitResponse`

**Solução**: Usar `__init__.py` para re-exports:

```python
# application/dtos/__init__.py
from .responses.donation import DonationCommitResponse

# Agora pode usar:
from app.application.dtos import DonationCommitResponse
```

## Recursos

- [Clean Architecture (Uncle Bob)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [FastAPI Dependency Injection](https://fastapi.tiangolo.com/tutorial/dependencies/)
- [Pydantic Field Validation](https://docs.pydantic.dev/latest/concepts/fields/)
- [Python ABC](https://docs.python.org/3/library/abc.html)
