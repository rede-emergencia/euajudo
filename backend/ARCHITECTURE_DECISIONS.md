# Decisões de Arquitetura — Backend EuAjudo

## 1. Pasta `shared/` — O Que Deve Estar Lá

### ✅ Decisão: Manter `shared/` Simples e Focado

**Conteúdo de `shared/`**:
```
shared/
├── __init__.py           # Exports
├── exceptions.py         # Exceções base (DomainError, etc)
├── constants.py          # Constantes globais (TTL, tamanhos, etc)
└── utils.py              # Funções utilitárias puras
```

**Princípios**:
1. **Apenas código REALMENTE compartilhado** entre múltiplos domínios
2. **Sem lógica de negócio** — apenas utilitários puros
3. **Sem subpastas por domínio** — organizado por tipo de código

**Exemplos do que VAI**:
- ✅ `DomainError` (exceção base)
- ✅ `COMMITMENT_TTL_HOURS` (constante global)
- ✅ `format_datetime()` (função utilitária pura)

**Exemplos do que NÃO VAI**:
- ❌ DTOs → `application/dtos/`
- ❌ Models → `domain/models/`
- ❌ Enums → `domain/enums/`
- ❌ Services → `application/services/`
- ❌ Validators → `domain/validators/`

**Referência**: `SHARED_FOLDER_GUIDE.md`

---

## 2. `cancel_service.py` → `CommitmentService` Genérico

### ❌ Problema com `cancel_service.py`

**Situação atual**:
- Service genérico de cancelamento em `services/cancel_service.py`
- Mistura responsabilidades (delivery, batch, resource)
- Não é utilitário simples (tem lógica de negócio)
- Não é específico de domínio (genérico demais)

**Código atual**:
```python
class CancelService:
    def cancel_entity(self, entity_type, entity_id, user_id):
        # Lógica genérica de cancelamento
        pass
```

### ✅ Solução: `CommitmentService` Genérico

**Nova arquitetura**:
```
application/services/
├── interfaces/
│   └── commitment_service.py    # ICommitmentService[T] (ABC genérica)
└── commitment_service.py         # Implementação base (futuro)
```

**Interface genérica**:
```python
class ICommitmentService(ABC, Generic[T]):
    """
    Interface genérica para padrão commit/cancel/confirm.
    
    T = tipo da entidade (Delivery, ResourceReservation, etc)
    """
    
    @abstractmethod
    def commit(self, user_id, target_id, items, **kwargs) -> Dict:
        """Cria compromisso."""
        pass
    
    @abstractmethod
    def cancel(self, commitment_id, user_id, reason=None) -> bool:
        """Cancela compromisso."""
        pass
    
    @abstractmethod
    def confirm(self, commitment_id, code, user_id, **kwargs) -> T:
        """Confirma compromisso."""
        pass
```

**Uso em domínios específicos**:
```python
# DonationService herda/usa CommitmentService
class DonationService(ICommitmentService[Delivery]):
    """Especialização para doações."""
    
    def commit(self, volunteer_id, shelter_id, items):
        # Implementação específica de doação
        pass
```

**Benefícios**:
- ✅ Reuso de lógica commit/cancel/confirm
- ✅ Padrão consistente entre domínios
- ✅ Testável e modular
- ✅ Não polui `shared/` com services

**Status**: Interface criada, implementação pendente (opcional)

---

## 3. Clean Architecture — Estrutura Final

### Camadas Implementadas

```
backend/app/
├── application/                 # Camada de Aplicação
│   ├── services/
│   │   ├── interfaces/         # ABCs (3 interfaces)
│   │   │   ├── donation_service.py
│   │   │   ├── inventory_service.py
│   │   │   └── commitment_service.py  # ✅ NOVO
│   │   └── ...
│   ├── dtos/                    # DTOs organizados (9 DTOs)
│   │   ├── requests/
│   │   └── responses/
│   └── events/
│
├── infrastructure/              # Camada de Infraestrutura
│   └── repositories/           # 8 repositories
│
├── presentation/                # Camada de Apresentação
│   └── dependencies/           # DI factories
│
├── shared/                      # ✅ Código compartilhado (4 arquivos)
│   ├── exceptions.py
│   ├── constants.py            # ✅ NOVO
│   ├── utils.py                # ✅ NOVO
│   └── __init__.py
│
└── core/
    └── logging_config.py
```

---

## 4. Padrão de Compromissos (Commitment Pattern)

### Conceito

**Compromisso** = Ação que pode ser:
1. **Criada** (commit)
2. **Cancelada** (cancel)
3. **Confirmada** (confirm)

### Exemplos no Sistema

| Domínio | Entidade | Commit | Cancel | Confirm |
|---------|----------|--------|--------|---------|
| Doação | `Delivery` | Voluntário se compromete | Voluntário cancela | Abrigo confirma com código |
| Reserva | `ResourceReservation` | Usuário reserva | Usuário cancela | Provider confirma |
| Pedido | `ResourceRequest` | Abrigo pede | Abrigo cancela | — |

### Interface Genérica

`ICommitmentService[T]` fornece contrato padrão para todos os domínios.

**Vantagens**:
- Consistência entre domínios
- Código reutilizável
- Fácil de testar
- Documentação clara

---

## 5. Dependency Injection

### Padrão Implementado

**Factory pattern** em `presentation/dependencies/services.py`:

```python
def get_donation_service(db: Session = Depends(get_db)) -> IDonationService:
    """Factory para DonationService."""
    return DonationService(db)
```

**Uso nos routers**:
```python
@router.post("/commitments")
def commit_donation(
    service: IDonationService = Depends(get_donation_service),
):
    return service.commit_donation(...)
```

**Benefícios**:
- ✅ Dependency Inversion Principle
- ✅ Testável (fácil de mockar)
- ✅ Centralizado e reutilizável

---

## 6. DTOs Organizados

### Estrutura

```
application/dtos/
├── requests/
│   ├── donation.py        # DonationCommitRequest, etc
│   ├── user.py            # UserCreateRequest, etc
│   └── inventory.py       # InventoryItemUpdateRequest, etc
└── responses/
    ├── donation.py        # DonationCommitResponse
    ├── delivery.py        # DeliveryResponse
    ├── user.py            # UserResponse, TokenResponse
    └── inventory.py       # InventoryItemResponse, etc
```

### Convenções

- **Request DTOs**: `{Domain}{Action}Request`
- **Response DTOs**: `{Domain}Response`
- Sempre incluir `Field()` com validações
- Sempre incluir `json_schema_extra` com examples

**Benefícios**:
- Validação automática (Pydantic)
- Documentação Swagger automática
- Separação clara Request vs Response

---

## 7. Repository Pattern

### Estrutura

```
infrastructure/repositories/
├── base.py                      # IRepository[T], BaseRepository[T]
├── delivery_repository.py       # Queries de Delivery
├── shelter_request_repository.py
├── user_repository.py
├── location_repository.py
├── inventory_repository.py
└── category_repository.py
```

### Princípios

1. **Interface ABC** (`IRepository[T]`) define contrato
2. **BaseRepository[T]** implementa CRUD genérico
3. **Repositories específicos** adicionam queries de domínio
4. **Logging automático** em todas as operações

**Benefícios**:
- Testável (fácil de mockar)
- Queries encapsuladas
- Reusável entre services

---

## 8. Logging Centralizado

### Configuração

**`core/logging_config.py`**:
- Console + arquivo diário (`logs/euajudo_YYYYMMDD.log`)
- Formato estruturado: `[timestamp] [level] [module] message`
- Logs automáticos em repositories

**Exemplo**:
```
[2026-03-02 14:30:12] [INFO] [app.services.donation_service] Donation committed: code=847291
[2026-03-02 14:30:12] [DEBUG] [app.repositories.delivery_repository] Created Delivery with id=101
```

---

## 9. Testes

### Status

**27/27 testes passando** ✅

### Cobertura

- ✅ Donation flow (commit, cancel, confirm)
- ✅ ACID transactions
- ✅ Repository pattern
- ✅ Logging
- ✅ Event bus
- ✅ DTOs validation

---

## 10. Próximos Passos (Opcionais)

### Fase 1: Implementar CommitmentService Base
- [ ] Criar `CommitmentService` genérico
- [ ] Refatorar `DonationService` para herdar/usar
- [ ] Migrar `cancel_service.py` para novo padrão

### Fase 2: Completar Migração de Services
- [ ] Criar `IInventoryService` implementação
- [ ] Criar `ITransactionService` interface
- [ ] Atualizar todos os services para usar interfaces

### Fase 3: Reorganizar Estrutura de Pastas
- [ ] Mover `models.py` → `domain/models/`
- [ ] Mover `enums.py` → `domain/enums/`
- [ ] Mover `validators.py` → `domain/validators/`
- [ ] Mover `routers/` → `presentation/routers/`
- [ ] Mover `services/` → `application/services/`

---

## Referências

- **Clean Architecture**: `docs/CLEAN_ARCHITECTURE.md`
- **Repository Pattern**: `docs/REPOSITORY_PATTERN.md`
- **Migration Guide**: `docs/MIGRATION_GUIDE.md`
- **Shared Folder**: `SHARED_FOLDER_GUIDE.md`
- **Status**: `CLEAN_ARCHITECTURE_STATUS.md`
