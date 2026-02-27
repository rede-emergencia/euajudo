# 📋 Próximos Passos - Tarefas Prioritárias

Este documento lista tarefas específicas e acionáveis para contribuidores. Todas as tarefas estão organizadas por prioridade e complexidade.

**Última atualização**: 27 de Fevereiro de 2026

---

## 🔥 Prioridade CRÍTICA (Fazer Agora)

### 1. Refatorar MapView para Melhor Performance
**Complexidade**: 🟡 Média  
**Tempo Estimado**: 4-6 horas  
**Arquivo**: `frontend/src/pages/MapView.jsx`

**Problema**: 
- Mapa é recriado a cada atualização de estado
- Marcadores duplicados
- Memory leaks com event listeners

**Tarefas**:
- [ ] Usar `useRef` para manter instância do mapa
- [ ] Criar função `clearMarkers()` para limpar marcadores antigos
- [ ] Mover lógica de marcadores para hook customizado `useMapMarkers()`
- [ ] Adicionar cleanup no `useEffect` return
- [ ] Testar com React DevTools Profiler

**Código Sugerido**:
```javascript
const mapRef = useRef(null);
const markersRef = useRef([]);

const clearMarkers = useCallback(() => {
  markersRef.current.forEach(marker => marker.remove());
  markersRef.current = [];
}, []);

useEffect(() => {
  if (!mapRef.current) {
    mapRef.current = L.map('map', { center: [-21.7642, -43.3502], zoom: 13 });
  }
  
  clearMarkers();
  updateMarkers(mapRef.current);
  
  return () => {
    clearMarkers();
  };
}, [locations, batches, deliveries]);
```

**Critérios de Aceitação**:
- ✅ Mapa criado apenas uma vez
- ✅ Marcadores atualizados sem duplicação
- ✅ Sem warnings de memory leak
- ✅ Performance melhorada (medida com Profiler)

---

### 2. Implementar Repository Pattern Completo
**Complexidade**: 🔴 Alta  
**Tempo Estimado**: 8-12 horas  
**Arquivos**: `backend/app/repositories.py`, `backend/app/routers/*.py`

**Problema**:
- Queries SQL espalhadas pelos routers
- Difícil testar
- Código duplicado

**Tarefas**:

**Passo 1: Criar Interfaces** (2h)
- [ ] Criar `app/repositories/interfaces.py`
- [ ] Definir `IBatchRepository` com métodos abstratos
- [ ] Definir `IDeliveryRepository`
- [ ] Definir `IResourceRepository`

```python
# app/repositories/interfaces.py
from abc import ABC, abstractmethod
from typing import List, Optional
from app.models import ProductBatch
from app.schemas import BatchCreate

class IBatchRepository(ABC):
    @abstractmethod
    def create(self, batch: BatchCreate, provider_id: int) -> ProductBatch:
        pass
    
    @abstractmethod
    def get_by_id(self, batch_id: int) -> Optional[ProductBatch]:
        pass
    
    @abstractmethod
    def list_ready(self, product_type: Optional[str] = None) -> List[ProductBatch]:
        pass
    
    @abstractmethod
    def update_status(self, batch_id: int, status: str) -> ProductBatch:
        pass
```

**Passo 2: Implementar Repositories** (3h)
- [ ] Criar `app/repositories/batch_repository.py`
- [ ] Criar `app/repositories/delivery_repository.py`
- [ ] Criar `app/repositories/resource_repository.py`

```python
# app/repositories/batch_repository.py
from sqlalchemy.orm import Session, joinedload
from app.repositories.interfaces import IBatchRepository
from app.models import ProductBatch
from app.schemas import BatchCreate

class BatchRepository(IBatchRepository):
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, batch: BatchCreate, provider_id: int) -> ProductBatch:
        db_batch = ProductBatch(
            provider_id=provider_id,
            product_type=batch.product_type,
            quantity=batch.quantity,
            quantity_available=batch.quantity,
            description=batch.description,
            status="producing"
        )
        self.db.add(db_batch)
        self.db.commit()
        self.db.refresh(db_batch)
        return db_batch
    
    def get_by_id(self, batch_id: int) -> Optional[ProductBatch]:
        return self.db.query(ProductBatch)\
            .options(joinedload(ProductBatch.provider))\
            .filter(ProductBatch.id == batch_id)\
            .first()
    
    def list_ready(self, product_type: Optional[str] = None) -> List[ProductBatch]:
        query = self.db.query(ProductBatch)\
            .options(joinedload(ProductBatch.provider))\
            .filter(ProductBatch.status == "ready")
        
        if product_type:
            query = query.filter(ProductBatch.product_type == product_type)
        
        return query.all()
```

**Passo 3: Migrar Routers** (3h)
- [ ] Atualizar `routers/batches.py` para usar `BatchRepository`
- [ ] Atualizar `routers/deliveries.py` para usar `DeliveryRepository`
- [ ] Atualizar `routers/resources.py` para usar `ResourceRepository`

```python
# routers/batches.py
from app.repositories.batch_repository import BatchRepository

@router.post("/batches")
def create_batch(
    batch: BatchCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    repo = BatchRepository(db)
    return repo.create(batch, current_user.id)

@router.get("/batches/ready")
def list_ready_batches(
    product_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    repo = BatchRepository(db)
    return repo.list_ready(product_type)
```

**Passo 4: Adicionar Testes** (2h)
- [ ] Criar `tests/test_repositories.py`
- [ ] Testar cada método do repository
- [ ] Usar fixtures para setup/teardown

```python
# tests/test_repositories.py
import pytest
from app.repositories.batch_repository import BatchRepository
from app.schemas import BatchCreate

def test_batch_repository_create(db_session):
    repo = BatchRepository(db_session)
    batch_data = BatchCreate(
        product_type="meal",
        quantity=100,
        description="Test batch"
    )
    
    batch = repo.create(batch_data, provider_id=1)
    
    assert batch.id is not None
    assert batch.quantity == 100
    assert batch.status == "producing"

def test_batch_repository_list_ready(db_session):
    repo = BatchRepository(db_session)
    batches = repo.list_ready()
    
    assert all(b.status == "ready" for b in batches)
```

**Critérios de Aceitação**:
- ✅ Todas as queries movidas para repositories
- ✅ Routers usam apenas repositories
- ✅ Cobertura de testes > 80% nos repositories
- ✅ Sem queries SQL diretas em routers

---

### 3. Adicionar Tratamento de Erros Consistente no Frontend
**Complexidade**: 🟡 Média  
**Tempo Estimado**: 4-6 horas  
**Arquivos**: `frontend/src/lib/`, `frontend/src/pages/*.jsx`

**Problema**:
- Erros de API não tratados
- Mensagens genéricas
- Sem feedback visual

**Tarefas**:

**Passo 1: Criar Hook de API** (2h)
- [ ] Criar `frontend/src/hooks/useApi.js`

```javascript
// hooks/useApi.js
import { useState } from 'react';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callApi = async (apiFunction, onSuccess, onError) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiFunction();
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Erro desconhecido';
      setError(errorMessage);
      if (onError) onError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, callApi, setError };
};
```

**Passo 2: Criar Componentes de Feedback** (1h)
- [ ] Criar `components/LoadingSpinner.jsx`
- [ ] Criar `components/ErrorMessage.jsx`
- [ ] Criar `components/Toast.jsx`

```javascript
// components/ErrorMessage.jsx
export default function ErrorMessage({ message, onDismiss }) {
  if (!message) return null;
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-red-700">{message}</p>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="ml-3">
            <span className="sr-only">Dismiss</span>
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
```

**Passo 3: Refatorar Componentes** (2h)
- [ ] Atualizar `VolunteerDashboard.jsx`
- [ ] Atualizar `ProviderDashboard.jsx`
- [ ] Atualizar `MapView.jsx`

```javascript
// Exemplo de uso
import { useApi } from '../hooks/useApi';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';

export default function VolunteerDashboard() {
  const { loading, error, callApi, setError } = useApi();
  const [deliveries, setDeliveries] = useState([]);

  const loadDeliveries = () => {
    callApi(
      () => fetch('/api/deliveries').then(r => r.json()),
      (data) => setDeliveries(data),
      (err) => console.error('Failed to load deliveries:', err)
    );
  };

  return (
    <div>
      <ErrorMessage message={error} onDismiss={() => setError(null)} />
      {loading ? <LoadingSpinner /> : (
        <div>{/* content */}</div>
      )}
    </div>
  );
}
```

**Critérios de Aceitação**:
- ✅ Todos os fetch usam `useApi` hook
- ✅ Erros mostrados consistentemente
- ✅ Loading states visuais
- ✅ Mensagens de erro específicas

---

## 🟡 Prioridade ALTA (Próximas 2 Semanas)

### 4. Adicionar Paginação nos Endpoints
**Complexidade**: 🟢 Fácil  
**Tempo Estimado**: 2-3 horas  
**Arquivos**: `backend/app/routers/*.py`

**Tarefas**:
- [ ] Adicionar parâmetros `skip` e `limit` em todos os endpoints de listagem
- [ ] Retornar metadados de paginação (total, page, pages)
- [ ] Atualizar frontend para usar paginação

```python
from fastapi import Query

@router.get("/batches")
def list_batches(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    total = db.query(ProductBatch).count()
    batches = db.query(ProductBatch).offset(skip).limit(limit).all()
    
    return {
        "items": batches,
        "total": total,
        "skip": skip,
        "limit": limit
    }
```

---

### 5. Implementar Rate Limiting
**Complexidade**: 🟡 Média  
**Tempo Estimado**: 3-4 horas  
**Arquivos**: `backend/app/main.py`, `backend/requirements.txt`

**Tarefas**:
- [ ] Adicionar `slowapi` ao requirements.txt
- [ ] Configurar limiter global
- [ ] Adicionar rate limits específicos em endpoints críticos

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@router.post("/auth/login")
@limiter.limit("5/minute")
async def login(request: Request, credentials: LoginRequest):
    ...
```

---

### 6. Adicionar Índices no Banco de Dados
**Complexidade**: 🟢 Fácil  
**Tempo Estimado**: 1-2 horas  
**Arquivo**: `backend/app/models.py`

**Tarefas**:
- [ ] Adicionar índices compostos em queries comuns
- [ ] Criar migration (ou recriar banco)

```python
class Delivery(Base):
    __tablename__ = "deliveries"
    
    # ... campos existentes ...
    
    __table_args__ = (
        Index('idx_delivery_status_location', 'status', 'location_id'),
        Index('idx_delivery_volunteer', 'volunteer_id', 'status'),
    )

class ProductBatch(Base):
    __tablename__ = "product_batches"
    
    # ... campos existentes ...
    
    __table_args__ = (
        Index('idx_batch_status_provider', 'status', 'provider_id'),
        Index('idx_batch_product_type', 'product_type', 'status'),
    )
```

---

### 7. Corrigir Sincronização de Enums
**Complexidade**: 🟡 Média  
**Tempo Estimado**: 3-4 horas  
**Arquivos**: `shared/enums.json`, scripts de geração

**Tarefas**:
- [ ] Criar script `scripts/generate_enums.py`
- [ ] Gerar `backend/app/enums.py` a partir de `shared/enums.json`
- [ ] Gerar `frontend/src/shared/enums.js` a partir de `shared/enums.json`
- [ ] Adicionar validação no CI/CD

```python
# scripts/generate_enums.py
import json

with open('shared/enums.json') as f:
    enums = json.load(f)

# Gerar Python
with open('backend/app/enums.py', 'w') as f:
    f.write("from enum import Enum\n\n")
    for enum_name, values in enums.items():
        f.write(f"class {enum_name}(str, Enum):\n")
        for value in values:
            f.write(f"    {value.upper()} = '{value}'\n")
        f.write("\n")

# Gerar JavaScript
with open('frontend/src/shared/enums.js', 'w') as f:
    f.write("export const enums = ")
    json.dump(enums, f, indent=2)
```

---

## 🟢 Prioridade MÉDIA (Próximo Mês)

### 8. Adicionar Testes E2E com Playwright
**Complexidade**: 🔴 Alta  
**Tempo Estimado**: 8-12 horas

**Tarefas**:
- [ ] Setup Playwright
- [ ] Criar testes para fluxos principais
- [ ] Integrar no CI/CD

---

### 9. Melhorar Responsividade Mobile
**Complexidade**: 🟡 Média  
**Tempo Estimado**: 6-8 horas

**Tarefas**:
- [ ] Auditar todas as páginas em mobile
- [ ] Corrigir MapView para mobile
- [ ] Adicionar menu hamburguer
- [ ] Testar em dispositivos reais

---

### 10. Implementar Event Store (Fase 2 do Roadmap)
**Complexidade**: 🔴 Alta  
**Tempo Estimado**: 12-16 horas

Ver detalhes em [ROADMAP.md](ROADMAP.md#fase-2)

---

## 📊 Como Escolher uma Tarefa

### Para Iniciantes (🟢 Fácil)
- Tarefa #4: Paginação
- Tarefa #6: Índices
- Tarefa #7: Sincronização de Enums

### Para Intermediários (🟡 Média)
- Tarefa #1: Refatorar MapView
- Tarefa #3: Tratamento de Erros
- Tarefa #5: Rate Limiting

### Para Avançados (🔴 Alta)
- Tarefa #2: Repository Pattern
- Tarefa #8: Testes E2E
- Tarefa #10: Event Store

---

## 🎯 Fluxo de Trabalho

1. **Escolha uma tarefa** que corresponda ao seu nível
2. **Comente na issue** dizendo que vai trabalhar nela
3. **Crie uma branch**: `git checkout -b feature/task-X`
4. **Siga o guia** passo a passo da tarefa
5. **Teste localmente**: `make test`
6. **Abra um PR** com:
   - Descrição clara do que foi feito
   - Screenshots (se UI)
   - Checklist de critérios de aceitação
7. **Responda ao code review**
8. **Merge!** 🎉

---

## 📚 Recursos Úteis

- [CONTRIBUTING.md](CONTRIBUTING.md) - Guia de contribuição
- [BUGS.md](BUGS.md) - Bugs conhecidos
- [ROADMAP.md](ROADMAP.md) - Visão de longo prazo
- [docs/architecture/](docs/architecture/) - Documentação técnica

---

**Dúvidas?** Abra uma discussion no GitHub ou comente na issue!

**Última atualização**: 27 de Fevereiro de 2026
