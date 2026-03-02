# Repository Pattern — Guia de Implementação

## O que é?

Repository Pattern abstrai o acesso a dados. **Services** contêm lógica de negócio e transações. **Repositories** encapsulam queries SQL.

## Estrutura

```
app/
├── repositories/
│   ├── base.py                    # IRepository (ABC) + BaseRepository (genérico)
│   ├── delivery_repository.py     # DeliveryRepository herda BaseRepository
│   ├── shelter_request_repository.py
│   ├── user_repository.py
│   ├── location_repository.py
│   └── __init__.py                # Exports centralizados
├── services/
│   └── donation_service.py        # Usa repositories, não db.query diretamente
└── routers/
    └── donations.py               # Chama services, não repositories
```

## Camadas

```
Router (HTTP)
    ↓ chama
Service (Business Logic)
    ↓ usa
Repository (Data Access)
    ↓ executa
SQLAlchemy ORM
    ↓ gera
SQL
```

## Interface IRepository[T]

Todas as repositories implementam esta interface ABC:

```python
from app.repositories.base import IRepository, BaseRepository

class MyRepository(BaseRepository[MyModel]):
    def __init__(self, db: Session):
        super().__init__(MyModel, db)
    
    # Métodos de domínio específicos
    def find_by_custom_field(self, value: str) -> List[MyModel]:
        return self.db.query(self.model_class).filter(...).all()
```

### Métodos Base (herdados de BaseRepository)

| Método | Descrição |
|---|---|
| `create(**kwargs)` | Cria nova entidade, retorna instância |
| `get_by_id(id, lock=False)` | Busca por ID, `lock=True` usa FOR UPDATE |
| `list_all(order_by, limit)` | Lista todas as entidades |
| `filter_by(**filters)` | Filtra por field=value |
| `update(instance, **kwargs)` | Atualiza atributos |
| `delete(id)` | Deleta por ID |
| `delete_instance(instance)` | Deleta instância |
| `exists(id)` | Verifica se existe |
| `count(**filters)` | Conta entidades |
| `commit()` | Commit transação |
| `rollback()` | Rollback transação |
| `flush()` | Flush sem commit |
| `refresh(instance)` | Refresh da DB |

**IMPORTANTE**: 
- `commit()`, `rollback()`, `flush()` são **expostos** mas **gerenciados pelo Service**.
- Repository **não decide** quando commitar — Service decide.

## Como Criar um Novo Repository

### 1. Crie o arquivo em `app/repositories/`

```python
# app/repositories/category_repository.py
"""
CategoryRepository - Data access for Category entities.

Domain-specific queries:
  - find_active: get active categories
  - find_by_product_type: filter by product type
"""
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models import Category
from .base import BaseRepository


class CategoryRepository(BaseRepository[Category]):
    """Repository for Category entities with domain-specific queries."""
    
    def __init__(self, db: Session):
        super().__init__(Category, db)
    
    def find_active(self) -> List[Category]:
        """Find all active categories."""
        result = (
            self.db.query(Category)
            .filter(Category.active == True)
            .order_by(Category.display_name.asc())
            .all()
        )
        
        self._logger.debug(f"Found {len(result)} active categories")
        return result
    
    def find_by_name(self, name: str) -> Optional[Category]:
        """Find category by name (unique)."""
        result = (
            self.db.query(Category)
            .filter(Category.name == name)
            .first()
        )
        
        self._logger.debug(f"Lookup category by name={name}, found={result is not None}")
        return result
```

### 2. Exporte em `__init__.py`

```python
# app/repositories/__init__.py
from .category_repository import CategoryRepository

__all__ = [
    # ... outros
    "CategoryRepository",
]
```

### 3. Use no Service

```python
# app/services/my_service.py
from app.repositories import CategoryRepository

class MyService:
    def __init__(self, db: Session):
        self.db = db
        self._category_repo = CategoryRepository(db)
    
    def do_something(self, category_name: str):
        try:
            # Usa repository, não db.query
            category = self._category_repo.find_by_name(category_name)
            if not category:
                raise ValueError("Category not found")
            
            # ... lógica de negócio ...
            
            self._category_repo.commit()
        except Exception as exc:
            self._category_repo.rollback()
            raise
```

## Quando Usar Cada Camada

### ❌ NÃO faça no Router

```python
# ❌ ERRADO: Router com lógica de negócio
@router.post("/items")
def create_item(data: ItemIn, db: Session = Depends(get_db)):
    if db.query(Item).filter(Item.name == data.name).first():
        raise HTTPException(400, "Item already exists")
    
    item = Item(**data.dict())
    db.add(item)
    db.commit()
    return item
```

### ❌ NÃO faça no Service

```python
# ❌ ERRADO: Service com queries diretas
class MyService:
    def create_item(self, name: str):
        existing = self.db.query(Item).filter(Item.name == name).first()
        if existing:
            raise ValueError("Already exists")
        
        item = Item(name=name)
        self.db.add(item)
        self.db.commit()
```

### ✅ Padrão Correto

```python
# ✅ CORRETO: Repository abstrai queries
class ItemRepository(BaseRepository[Item]):
    def find_by_name(self, name: str) -> Optional[Item]:
        return self.db.query(Item).filter(Item.name == name).first()

# ✅ CORRETO: Service usa repository
class ItemService:
    def __init__(self, db: Session):
        self._item_repo = ItemRepository(db)
    
    def create_item(self, name: str) -> Item:
        try:
            if self._item_repo.find_by_name(name):
                raise ValueError("Item already exists")
            
            item = self._item_repo.create(name=name)
            self._item_repo.commit()
            return item
        except Exception:
            self._item_repo.rollback()
            raise

# ✅ CORRETO: Router chama service
@router.post("/items")
def create_item_endpoint(data: ItemIn, db: Session = Depends(get_db)):
    svc = ItemService(db)
    try:
        item = svc.create_item(data.name)
        return item
    except ValueError as e:
        raise HTTPException(400, str(e))
```

## Logging Automático

Todos os repositories têm logging automático:

```
[2026-03-02 14:35:12] [DEBUG] [app.repositories.delivery_repository] Found 3 active deliveries for volunteer 42
[2026-03-02 14:35:13] [DEBUG] [app.repositories.delivery_repository] Created Delivery with id=101
[2026-03-02 14:35:14] [INFO] [app.services.donation_service] Donation committed: code=847291, deliveries=[101,102]
```

Configure nível de log em `main.py`:

```python
from app.core.logging_config import setup_logging
setup_logging(log_level="DEBUG", log_dir="logs")  # DEBUG, INFO, WARNING, ERROR
```

## Transações ACID

**Service é dono da transação**. Repository apenas expõe `commit()` e `rollback()`:

```python
class MyService:
    def complex_operation(self):
        try:
            # 1. Operação 1
            item = self._item_repo.create(name="x")
            
            # 2. Operação 2
            user = self._user_repo.get_by_id(1, lock=True)
            user.items_count += 1
            self._user_repo.flush()  # Flush sem commit
            
            # 3. Operação 3
            self._event_bus.emit(ItemCreated(item.id))
            
            # 4. Commit ÚNICO no final
            self._item_repo.commit()
            
        except Exception:
            # Rollback automático em erro
            self._item_repo.rollback()
            raise
```

**Regra de ouro**: Um commit por operação de negócio, não um por entidade.

## Migrando Código Legacy

### Antes (legacy)

```python
# Legacy: Service com queries diretas
class LegacyService:
    def cancel_order(self, order_id: int):
        order = self.db.query(Order).filter(Order.id == order_id).with_for_update().first()
        if not order:
            raise ValueError("Not found")
        
        items = self.db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
        for item in items:
            self.db.delete(item)
        
        self.db.delete(order)
        self.db.commit()
```

### Depois (com repositories)

```python
# 1. Criar OrderRepository
class OrderRepository(BaseRepository[Order]):
    def get_with_lock(self, order_id: int) -> Optional[Order]:
        return self.db.query(Order).filter(Order.id == order_id).with_for_update().first()

# 2. Criar OrderItemRepository
class OrderItemRepository(BaseRepository[OrderItem]):
    def find_by_order(self, order_id: int) -> List[OrderItem]:
        return self.db.query(OrderItem).filter(OrderItem.order_id == order_id).all()

# 3. Refatorar Service
class OrderService:
    def __init__(self, db: Session):
        self._order_repo = OrderRepository(db)
        self._item_repo = OrderItemRepository(db)
    
    def cancel_order(self, order_id: int):
        try:
            order = self._order_repo.get_with_lock(order_id)
            if not order:
                raise ValueError("Not found")
            
            items = self._item_repo.find_by_order(order_id)
            for item in items:
                self._item_repo.delete_instance(item)
            
            self._order_repo.delete_instance(order)
            self._order_repo.commit()
        except Exception:
            self._order_repo.rollback()
            raise
```

## Checklist para Novo Service

- [ ] Cria repositories no `__init__(self, db: Session)`
- [ ] Usa `self._repo.method()` em vez de `self.db.query()`
- [ ] `try/except` com `commit()` e `rollback()`
- [ ] Logging de operações importantes
- [ ] Testes unitários do service

## Benefícios

✅ **Testabilidade**: Mock repositories, não SQLAlchemy  
✅ **Reusabilidade**: Mesma query em múltiplos services  
✅ **Logging**: Automático em todas as operações  
✅ **Manutenibilidade**: Mudanças de schema isoladas nos repositories  
✅ **Consistência**: Interface ABC garante padrão uniforme  

## Exemplos Reais

Veja implementações completas:
- `app/services/donation_service.py` — usa 3 repositories
- `app/repositories/delivery_repository.py` — queries de domínio
- `tests/test_donation_flow.py` — testes com services+repositories
