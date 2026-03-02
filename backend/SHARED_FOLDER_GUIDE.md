# Guia da Pasta `shared/` — O Que Deve e Não Deve Estar Lá

## ✅ O Que DEVE Estar em `shared/`

### 1. **Exceptions** (`shared/exceptions.py`)

Exceções **base** que são herdadas por múltiplos domínios:

```python
class DomainError(Exception):
    """Base exception para erros de domínio."""
    pass

class DonationError(DomainError): pass
class InventoryError(DomainError): pass
class ValidationError(DomainError): pass
```

**Por quê?** Hierarquia de exceções é compartilhada entre todos os domínios.

---

### 2. **Constants** (`shared/constants.py`)

Constantes **globais** usadas em múltiplos domínios:

```python
COMMITMENT_TTL_HOURS = 48
PICKUP_CODE_LENGTH = 6
MAX_ITEMS_PER_COMMITMENT = 10
DEFAULT_PAGE_SIZE = 20
```

**Por quê?** Valores que não mudam e são usados em vários lugares.

---

### 3. **Utils** (`shared/utils.py`)

Funções **utilitárias genéricas** sem lógica de negócio:

```python
def format_datetime(dt: datetime) -> str:
    """Formata datetime para display."""
    return dt.strftime("%d/%m/%Y %H:%M")

def generate_random_code(length: int = 6) -> str:
    """Gera código numérico aleatório."""
    return ''.join(str(secrets.randbelow(10)) for _ in range(length))
```

**Por quê?** Funções puras e reutilizáveis sem dependências de domínio.

---

## ❌ O Que NÃO DEVE Estar em `shared/`

### 1. **Schemas/DTOs** → `application/dtos/`

```python
# ❌ NÃO em shared/schemas.py
class DonationCommitRequest(BaseModel): pass

# ✅ SIM em application/dtos/requests/donation.py
class DonationCommitRequest(BaseModel): pass
```

**Por quê?** DTOs são específicos de domínio e camada de aplicação.

---

### 2. **Models** → `domain/models/`

```python
# ❌ NÃO em shared/models.py
class Delivery(Base): pass

# ✅ SIM em domain/models/delivery.py (futuro)
# ✅ OU em models.py (atual)
class Delivery(Base): pass
```

**Por quê?** Models são entidades de domínio, não código compartilhado.

---

### 3. **Enums de Domínio** → `domain/enums/`

```python
# ❌ NÃO em shared/enums.py
class DeliveryStatus(str, Enum): pass

# ✅ SIM em domain/enums/delivery.py (futuro)
# ✅ OU em enums.py (atual)
class DeliveryStatus(str, Enum): pass
```

**Por quê?** Enums são conceitos de domínio específico.

---

### 4. **Validators de Domínio** → `domain/validators/`

```python
# ❌ NÃO em shared/validators.py
class ConfirmationCodeValidator:
    def validate_code(self, code: str) -> bool:
        # Lógica específica de confirmação de doação
        pass

# ✅ SIM em domain/validators/confirmation.py (futuro)
# ✅ OU em validators.py (atual)
class ConfirmationCodeValidator: pass
```

**Por quê?** Validadores contêm regras de negócio específicas.

---

### 5. **Services** → `application/services/`

```python
# ❌ NÃO em shared/cancel_service.py
class CancelService:
    def cancel_entity(self, entity_type, entity_id): pass

# ✅ SIM em application/services/commitment_service.py
class CommitmentService:
    def cancel(self, commitment_id): pass
```

**Por quê?** Services orquestram lógica de negócio, não são utilitários.

---

### 6. **Repositories** → `infrastructure/repositories/`

```python
# ❌ NÃO em shared/repository.py
class BaseRepository: pass

# ✅ SIM em infrastructure/repositories/base.py
class BaseRepository: pass
```

**Por quê?** Repositories são infraestrutura de acesso a dados.

---

## 📋 Checklist: Devo Colocar em `shared/`?

Pergunte-se:

1. **É usado em múltiplos domínios?**
   - ❌ Não → Coloque no domínio específico
   - ✅ Sim → Continue

2. **É uma função pura sem lógica de negócio?**
   - ❌ Não → Coloque em service/validator
   - ✅ Sim → Continue

3. **É uma constante global ou exception base?**
   - ✅ Sim → Coloque em `shared/`
   - ❌ Não → Revise a arquitetura

---

## 🎯 Estrutura Correta de `shared/`

```
shared/
├── __init__.py           # Exports
├── exceptions.py         # ✅ Exceções base (DomainError, etc)
├── constants.py          # ✅ Constantes globais (TTL, tamanhos, etc)
└── utils.py              # ✅ Funções utilitárias puras
```

**Total**: 4 arquivos simples e focados.

---

## ❌ Anti-Pattern: `shared/` Inchado

```
shared/
├── schemas/              # ❌ ERRADO - DTOs vão em application/dtos/
├── models/               # ❌ ERRADO - Models vão em domain/models/
├── services/             # ❌ ERRADO - Services vão em application/services/
├── validators/           # ❌ ERRADO - Validators vão em domain/validators/
└── repositories/         # ❌ ERRADO - Repositories vão em infrastructure/
```

**Problema**: `shared/` vira lixeira de código sem organização clara.

---

## 🔑 Regra de Ouro

> **`shared/` é para código REALMENTE compartilhado e GENÉRICO.**
> 
> Se tem lógica de negócio ou é específico de domínio, NÃO vai em `shared/`.

---

## 📚 Exemplos Práticos

### ✅ Correto: Função Utilitária

```python
# shared/utils.py
def format_datetime(dt: datetime) -> str:
    """Formata datetime - usado em donation, inventory, user."""
    return dt.strftime("%d/%m/%Y %H:%M")
```

**Por quê?** Função pura, sem lógica de negócio, usada em múltiplos domínios.

---

### ❌ Errado: Lógica de Negócio

```python
# ❌ shared/donation_utils.py
def calculate_donation_expiry(created_at: datetime) -> datetime:
    """Calcula expiração de doação - ESPECÍFICO de donation."""
    return created_at + timedelta(hours=48)

# ✅ CORRETO: application/services/donation_service.py
class DonationService:
    def _calculate_expiry(self, created_at: datetime) -> datetime:
        return created_at + timedelta(hours=COMMITMENT_TTL_HOURS)
```

**Por quê?** Regra de negócio específica de doação pertence ao DonationService.

---

## 🚀 Migração de `cancel_service.py`

### Situação Atual

`cancel_service.py` está em `services/` mas é um **service genérico** de cancelamento.

### Problema

- Não é um utilitário simples (tem lógica de negócio)
- Não é específico de um domínio (genérico demais)
- Mistura responsabilidades (delivery, batch, resource)

### Solução Recomendada

**Criar `CommitmentService` genérico** que encapsula padrão commit/cancel/confirm:

```
application/services/
├── interfaces/
│   └── commitment_service.py    # ICommitmentService[T]
└── commitment_service.py         # Implementação genérica
```

**DonationService** herda/usa `CommitmentService`:

```python
class DonationService(CommitmentService[Delivery]):
    """Especialização de CommitmentService para doações."""
    pass
```

**Benefícios**:
- ✅ Reuso de lógica commit/cancel/confirm
- ✅ Padrão consistente entre domínios
- ✅ Testável e modular
- ✅ Não polui `shared/`

---

## 📖 Resumo

| Tipo de Código | Onde Colocar | Exemplo |
|----------------|--------------|---------|
| Exceções base | `shared/exceptions.py` | `DomainError` |
| Constantes globais | `shared/constants.py` | `COMMITMENT_TTL_HOURS` |
| Funções utilitárias puras | `shared/utils.py` | `format_datetime()` |
| DTOs | `application/dtos/` | `DonationCommitRequest` |
| Models | `domain/models/` | `Delivery` |
| Enums | `domain/enums/` | `DeliveryStatus` |
| Validators | `domain/validators/` | `ConfirmationCodeValidator` |
| Services | `application/services/` | `DonationService` |
| Repositories | `infrastructure/repositories/` | `DeliveryRepository` |

**Mantenha `shared/` simples, focado e genérico.**
