# Clean Architecture — Backend EuAjudo

## Visão Geral

O backend segue **Clean Architecture** com separação clara de camadas e responsabilidades.

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  Routers (FastAPI) - HTTP endpoints, auth, validation       │
│  DTOs (Pydantic) - Request/Response schemas                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                          │
│  Services - Business logic, orchestration, transactions      │
│  Service Interfaces (ABC) - Contracts for services          │
│  Events - Domain events (DonationCommitted, etc)            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     DOMAIN LAYER                             │
│  Models - Domain entities (User, Delivery, ShelterRequest)  │
│  Enums - Domain constants (DeliveryStatus, ProductType)     │
│  Validators - Business rules validation                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 INFRASTRUCTURE LAYER                         │
│  Repositories - Data access abstraction                     │
│  Database - SQLAlchemy ORM, migrations                      │
│  External APIs - Third-party integrations                   │
└─────────────────────────────────────────────────────────────┘
```

## Estrutura de Diretórios

```
backend/app/
├── domain/                      # Camada de Domínio
│   ├── models/                  # Entidades de domínio
│   │   ├── __init__.py
│   │   ├── user.py             # User, DeliveryLocation
│   │   ├── delivery.py         # Delivery
│   │   ├── shelter.py          # ShelterRequest, InventoryItem
│   │   └── category.py         # Category
│   ├── enums/                   # Enums de domínio
│   │   ├── __init__.py
│   │   ├── delivery.py         # DeliveryStatus
│   │   ├── user.py             # UserRole
│   │   └── product.py          # ProductType
│   └── validators/              # Regras de negócio
│       ├── __init__.py
│       ├── delivery.py         # DeliveryValidator
│       └── confirmation.py     # ConfirmationCodeValidator
│
├── application/                 # Camada de Aplicação
│   ├── services/                # Services com lógica de negócio
│   │   ├── interfaces/         # ABCs (contratos)
│   │   │   ├── __init__.py
│   │   │   ├── donation_service.py    # IDonationService
│   │   │   └── inventory_service.py   # IInventoryService
│   │   ├── __init__.py
│   │   ├── donation_service.py        # DonationService
│   │   ├── inventory_service.py       # InventoryService
│   │   └── transaction_service.py     # ResourceTransactionService
│   ├── dtos/                    # Data Transfer Objects
│   │   ├── requests/           # Request DTOs
│   │   │   ├── __init__.py
│   │   │   ├── donation.py    # DonationCommitRequest
│   │   │   ├── user.py        # UserCreateRequest, LoginRequest
│   │   │   └── inventory.py   # InventoryUpdateRequest
│   │   ├── responses/          # Response DTOs
│   │   │   ├── __init__.py
│   │   │   ├── donation.py    # DonationCommitResponse
│   │   │   ├── user.py        # UserResponse, TokenResponse
│   │   │   └── inventory.py   # InventoryItemResponse
│   │   └── __init__.py
│   └── events/                  # Domain events
│       ├── __init__.py
│       ├── event_bus.py        # EventBus, IEventBus
│       └── donation_events.py  # DonationCommitted, etc
│
├── infrastructure/              # Camada de Infraestrutura
│   ├── repositories/           # Data access
│   │   ├── interfaces/        # Repository ABCs
│   │   │   ├── __init__.py
│   │   │   └── base.py       # IRepository[T]
│   │   ├── __init__.py
│   │   ├── base.py           # BaseRepository[T]
│   │   ├── delivery_repository.py
│   │   ├── user_repository.py
│   │   └── ...
│   ├── database/              # Database config
│   │   ├── __init__.py
│   │   ├── session.py        # get_db, engine
│   │   └── migrations/       # Alembic migrations
│   └── logging/               # Logging config
│       ├── __init__.py
│       └── config.py         # setup_logging
│
├── presentation/               # Camada de Apresentação
│   ├── routers/               # FastAPI routers
│   │   ├── __init__.py
│   │   ├── donations.py      # /api/donations
│   │   ├── users.py          # /api/users
│   │   ├── auth.py           # /api/auth
│   │   └── inventory.py      # /api/inventory
│   ├── middleware/            # HTTP middleware
│   │   ├── __init__.py
│   │   ├── auth.py           # JWT auth
│   │   └── cors.py           # CORS config
│   └── dependencies/          # FastAPI dependencies
│       ├── __init__.py
│       └── auth.py           # get_current_user, require_approved
│
├── shared/                     # Código compartilhado
│   ├── __init__.py
│   ├── exceptions.py          # Custom exceptions
│   └── utils.py               # Utility functions
│
└── main.py                    # Application entry point
```

## Princípios de Design

### 1. Dependency Inversion (DIP)

**Camadas superiores NÃO dependem de camadas inferiores diretamente.**

✅ **Correto**:
```python
# application/services/interfaces/donation_service.py
class IDonationService(ABC):
    @abstractmethod
    def commit_donation(self, volunteer_id: int, ...) -> dict:
        pass

# application/services/donation_service.py
class DonationService(IDonationService):
    def __init__(self, delivery_repo: IRepository[Delivery]):
        self._delivery_repo = delivery_repo
```

❌ **Errado**:
```python
# Service depende diretamente de implementação concreta
class DonationService:
    def __init__(self, db: Session):
        self.db = db  # Acoplamento direto com SQLAlchemy
```

### 2. Single Responsibility (SRP)

**Cada classe tem UMA responsabilidade.**

- **Router**: HTTP, autenticação, validação de entrada
- **Service**: Lógica de negócio, orquestração, transações
- **Repository**: Acesso a dados, queries SQL
- **DTO**: Serialização/deserialização
- **Validator**: Regras de validação de domínio

### 3. Interface Segregation (ISP)

**Interfaces pequenas e específicas.**

✅ **Correto**:
```python
class IDeliveryRepository(IRepository[Delivery]):
    @abstractmethod
    def find_active_by_volunteer(self, volunteer_id: int) -> List[Delivery]:
        pass

class IUserRepository(IRepository[User]):
    @abstractmethod
    def find_by_email(self, email: str) -> Optional[User]:
        pass
```

❌ **Errado**:
```python
class IRepository:
    def find_active_by_volunteer(...)  # Só Delivery precisa
    def find_by_email(...)             # Só User precisa
    def lock_for_commitment(...)       # Só ShelterRequest precisa
```

### 4. Open/Closed Principle (OCP)

**Aberto para extensão, fechado para modificação.**

```python
# Adicionar novo tipo de notificação SEM modificar código existente
class INotificationService(ABC):
    @abstractmethod
    def send(self, message: str): pass

class EmailNotificationService(INotificationService):
    def send(self, message: str):
        # Implementação email

class SMSNotificationService(INotificationService):
    def send(self, message: str):
        # Implementação SMS
```

## Convenções de Nomenclatura

### DTOs (Data Transfer Objects)

**Request DTOs** (entrada da API):
```python
# application/dtos/requests/donation.py
class DonationCommitRequest(BaseModel):
    shelter_id: int
    items: List[DonationItemRequest]

class DonationItemRequest(BaseModel):
    request_id: int
    quantity: int = Field(..., gt=0)
```

**Response DTOs** (saída da API):
```python
# application/dtos/responses/donation.py
class DonationCommitResponse(BaseModel):
    success: bool
    code: str
    delivery_ids: List[int]

class DeliveryResponse(BaseModel):
    id: int
    volunteer_id: int
    status: DeliveryStatus
    quantity: int
    created_at: datetime
```

### Services

**Interface** (contrato):
```python
# application/services/interfaces/donation_service.py
class IDonationService(ABC):
    @abstractmethod
    def commit_donation(
        self, volunteer_id: int, shelter_id: int, items: List[CommitItem]
    ) -> DonationCommitResponse:
        """Volunteer commits to donate items."""
        pass
```

**Implementação**:
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
    
    def commit_donation(self, ...) -> DonationCommitResponse:
        # Implementação
```

### Repositories

**Interface**:
```python
# infrastructure/repositories/interfaces/base.py
class IRepository(ABC, Generic[T]):
    @abstractmethod
    def create(self, **kwargs) -> T: pass
    
    @abstractmethod
    def get_by_id(self, id: int) -> Optional[T]: pass
```

**Implementação**:
```python
# infrastructure/repositories/delivery_repository.py
class DeliveryRepository(BaseRepository[Delivery]):
    def find_active_by_volunteer(self, volunteer_id: int) -> List[Delivery]:
        # Query específica de domínio
```

## Fluxo de Dados

### Request → Response

```
1. HTTP Request
   ↓
2. Router (presentation/routers/donations.py)
   - Valida JWT token
   - Valida DonationCommitRequest (Pydantic)
   ↓
3. Service (application/services/donation_service.py)
   - Lógica de negócio
   - Usa repositories
   - Emite eventos
   ↓
4. Repository (infrastructure/repositories/delivery_repository.py)
   - Queries SQL
   - Retorna entidades de domínio
   ↓
5. Service retorna DTO
   ↓
6. Router serializa DonationCommitResponse
   ↓
7. HTTP Response (JSON)
```

### Exemplo Completo

```python
# 1. DTO Request
class DonationCommitRequest(BaseModel):
    shelter_id: int
    items: List[DonationItemRequest]

# 2. Router
@router.post("/commitments", response_model=DonationCommitResponse)
def commit_donation(
    body: DonationCommitRequest,
    current_user: User = Depends(get_current_user),
    donation_service: IDonationService = Depends(get_donation_service),
):
    return donation_service.commit_donation(
        volunteer_id=current_user.id,
        shelter_id=body.shelter_id,
        items=[CommitItem(i.request_id, i.quantity) for i in body.items],
    )

# 3. Service Interface
class IDonationService(ABC):
    @abstractmethod
    def commit_donation(...) -> DonationCommitResponse: pass

# 4. Service Implementation
class DonationService(IDonationService):
    def commit_donation(...) -> DonationCommitResponse:
        # Usa repositories
        delivery = self._delivery_repo.create(...)
        
        # Emite evento
        self._event_bus.emit(DonationCommitted(...))
        
        return DonationCommitResponse(
            success=True,
            code=code,
            delivery_ids=[delivery.id]
        )

# 5. DTO Response
class DonationCommitResponse(BaseModel):
    success: bool
    code: str
    delivery_ids: List[int]
```

## Dependency Injection

**FastAPI Dependencies** para injetar services:

```python
# presentation/dependencies/services.py
def get_donation_service(
    db: Session = Depends(get_db),
    event_bus: IEventBus = Depends(get_event_bus),
) -> IDonationService:
    return DonationService(
        delivery_repo=DeliveryRepository(db),
        request_repo=ShelterRequestRepository(db),
        location_repo=LocationRepository(db),
        event_bus=event_bus,
    )

# Router usa dependency
@router.post("/commitments")
def commit_donation(
    service: IDonationService = Depends(get_donation_service),
):
    return service.commit_donation(...)
```

## Testes

### Unit Tests (Services)

```python
# tests/unit/services/test_donation_service.py
def test_commit_donation_success():
    # Mock repositories
    delivery_repo = Mock(spec=IRepository[Delivery])
    request_repo = Mock(spec=IRepository[ShelterRequest])
    event_bus = Mock(spec=IEventBus)
    
    # Service com mocks
    service = DonationService(delivery_repo, request_repo, event_bus)
    
    # Test
    result = service.commit_donation(...)
    
    # Assertions
    assert result.success
    delivery_repo.create.assert_called_once()
    event_bus.emit.assert_called_once()
```

### Integration Tests (Full Stack)

```python
# tests/integration/test_donation_flow.py
def test_donation_flow_end_to_end(client: TestClient, db: Session):
    # Login
    response = client.post("/api/auth/login", ...)
    token = response.json()["access_token"]
    
    # Commit donation
    response = client.post(
        "/api/donations/commitments",
        headers={"Authorization": f"Bearer {token}"},
        json={"shelter_id": 1, "items": [{"request_id": 1, "quantity": 10}]}
    )
    
    assert response.status_code == 201
    assert "code" in response.json()
```

## Migrando Código Legacy

### Antes (schemas.py monolítico)

```python
# schemas.py - 405 linhas, tudo misturado
class UserBase(BaseModel): ...
class DeliveryResponse(BaseModel): ...
class CategoryResponse(BaseModel): ...
```

### Depois (DTOs organizados)

```
application/dtos/
├── requests/
│   ├── user.py          # UserCreateRequest, UserUpdateRequest
│   ├── delivery.py      # DeliveryCreateRequest
│   └── donation.py      # DonationCommitRequest
└── responses/
    ├── user.py          # UserResponse, TokenResponse
    ├── delivery.py      # DeliveryResponse
    └── donation.py      # DonationCommitResponse
```

## Checklist para Novos Desenvolvedores

- [ ] Leia este documento completo
- [ ] Entenda as 4 camadas: Presentation, Application, Domain, Infrastructure
- [ ] Sempre crie interface (ABC) antes de implementação
- [ ] DTOs separados: Request vs Response
- [ ] Services recebem repositories via DI, não `db: Session`
- [ ] Repositories abstraem queries, Services orquestram lógica
- [ ] Routers apenas HTTP, sem lógica de negócio
- [ ] Testes unitários mockam dependencies
- [ ] Logging em todas as camadas
- [ ] Eventos para ações importantes

## Referências

- [Clean Architecture (Uncle Bob)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
