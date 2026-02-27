# 🐛 Bugs Conhecidos e Issues Abertas

Este documento lista os bugs conhecidos, problemas em aberto e áreas que precisam de atenção no projeto EuAjudo.

**Última atualização**: 27 de Fevereiro de 2026

---

## 🔴 Bugs Críticos (Alta Prioridade)

### 1. MapView - Problemas de Renderização e Estado
**Arquivo**: `frontend/src/pages/MapView.jsx`  
**Linha**: ~76, ~300-617  
**Descrição**: O componente MapView possui vários problemas de estado e renderização:

- **Múltiplas re-renderizações**: O mapa é recriado desnecessariamente causando performance ruim
- **Marcadores duplicados**: Ao atualizar dados, marcadores antigos não são removidos corretamente
- **Memory leaks**: Event listeners não são limpos adequadamente no cleanup
- **Estado inconsistente**: `locationsWithStatus` pode ficar dessincronizado com `deliveries`

**Impacto**: Performance degradada, experiência do usuário comprometida

**Solução Proposta**:
```javascript
// Usar useRef para manter instância do mapa
const mapRef = useRef(null);
const markersRef = useRef([]);

// Limpar marcadores antes de adicionar novos
const clearMarkers = () => {
  markersRef.current.forEach(marker => marker.remove());
  markersRef.current = [];
};
```

**Status**: 🔧 Em progresso - Refatoração necessária

---

### 2. Repository Pattern - Implementação Incompleta
**Arquivo**: `backend/app/repositories.py`  
**Descrição**: O padrão Repository foi iniciado mas não está sendo usado consistentemente:

- Alguns routers usam queries diretas ao invés de repositories
- Falta abstração para operações complexas
- Não há interface clara para testes

**Arquivos Afetados**:
- `backend/app/routers/batches.py`
- `backend/app/routers/deliveries.py`
- `backend/app/routers/resources.py`

**Impacto**: Código duplicado, difícil de testar, violação de princípios SOLID

**Solução Proposta**:
1. Criar interfaces de repository para cada entidade
2. Migrar todas as queries para repositories
3. Adicionar testes unitários para repositories

**Status**: 🔧 Em progresso - Refatoração em andamento

---

## 🟡 Bugs Médios (Média Prioridade)

### 3. Validação de Códigos de Confirmação
**Arquivo**: `backend/app/routers/deliveries.py`  
**Linha**: ~200-250  
**Descrição**: 
- Códigos de confirmação não expiram
- Não há rate limiting para tentativas
- Possível vulnerabilidade de força bruta

**Impacto**: Segurança comprometida

**Solução Proposta**:
- Adicionar expiração de códigos (ex: 24h)
- Implementar rate limiting (max 5 tentativas)
- Adicionar logging de tentativas falhadas

**Status**: ⏳ Pendente

---

### 4. Tratamento de Erros no Frontend
**Arquivos**: Múltiplos componentes em `frontend/src/pages/`  
**Descrição**:
- Erros de API não são tratados consistentemente
- Mensagens de erro genéricas para o usuário
- Falta feedback visual em estados de loading

**Exemplos**:
- `VolunteerDashboard.jsx`: Fetch sem try-catch
- `ProviderDashboard.jsx`: Erros silenciosos
- `MapView.jsx`: Fallback para dados mock esconde erros reais

**Impacto**: UX ruim, difícil debugar problemas

**Solução Proposta**:
```javascript
// Criar hook customizado para API calls
const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const callApi = async (fn) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      return result;
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  return { loading, error, callApi };
};
```

**Status**: ⏳ Pendente

---

### 5. Sincronização de Enums entre Backend e Frontend
**Arquivos**: 
- `backend/app/enums.py`
- `frontend/src/shared/enums.js`
- `shared/enums.json`

**Descrição**:
- Três arquivos diferentes para os mesmos enums
- Fácil ficar dessincronizado
- Não há validação automática

**Impacto**: Bugs sutis, manutenção difícil

**Solução Proposta**:
- Usar `shared/enums.json` como fonte única de verdade
- Gerar `enums.py` e `enums.js` automaticamente
- Adicionar script de validação no CI/CD

**Status**: ⏳ Pendente

---

## 🟢 Bugs Baixos (Baixa Prioridade)

### 6. Logs Excessivos no Console
**Arquivo**: `frontend/src/pages/MapView.jsx`  
**Linhas**: ~173-486  
**Descrição**: Console.log em produção

**Solução**: Remover ou usar logger condicional

**Status**: ⏳ Pendente

---

### 7. Hardcoded URLs
**Arquivos**: Múltiplos  
**Descrição**: URLs da API hardcoded ao invés de usar variáveis de ambiente

**Exemplo**:
```javascript
// ❌ Errado
fetch('http://localhost:8000/api/batches')

// ✅ Correto
fetch(`${import.meta.env.VITE_API_URL}/api/batches`)
```

**Status**: ⏳ Pendente

---

### 8. Falta de Paginação
**Arquivos**: Todos os endpoints de listagem  
**Descrição**: 
- Endpoints retornam todos os registros
- Pode causar problemas de performance com muitos dados

**Endpoints Afetados**:
- `GET /api/batches`
- `GET /api/deliveries`
- `GET /api/resources/requests`
- `GET /api/locations`

**Solução Proposta**:
```python
@router.get("/batches")
def list_batches(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return db.query(ProductBatch).offset(skip).limit(limit).all()
```

**Status**: ⏳ Pendente

---

## 🔵 Melhorias de Performance

### 9. N+1 Queries
**Arquivo**: `backend/app/routers/deliveries.py`  
**Descrição**: Queries não usam eager loading, causando N+1

**Exemplo**:
```python
# ❌ N+1 problem
deliveries = db.query(Delivery).all()
for d in deliveries:
    print(d.batch.provider.name)  # Query por delivery!

# ✅ Solução
deliveries = db.query(Delivery)\
    .options(joinedload(Delivery.batch).joinedload(ProductBatch.provider))\
    .all()
```

**Status**: ⏳ Pendente

---

### 10. Falta de Índices no Banco
**Arquivo**: `backend/app/models.py`  
**Descrição**: Queries comuns não têm índices

**Índices Necessários**:
```python
# Adicionar em models.py
__table_args__ = (
    Index('idx_delivery_status_location', 'status', 'location_id'),
    Index('idx_batch_status_provider', 'status', 'provider_id'),
    Index('idx_resource_status', 'status'),
)
```

**Status**: ⏳ Pendente

---

## 🎨 Problemas de UX/UI

### 11. Feedback Visual Inconsistente
**Descrição**: Estados de loading, sucesso e erro não são consistentes entre páginas

**Solução**: Criar componentes compartilhados:
- `<LoadingSpinner />`
- `<ErrorMessage />`
- `<SuccessToast />`
- `<EmptyState />`

**Status**: ⏳ Pendente

---

### 12. Responsividade Mobile
**Descrição**: Algumas páginas não são totalmente responsivas

**Páginas Afetadas**:
- `MapView.jsx` - Controles do mapa em mobile
- `Admin.jsx` - Tabelas não scrollam horizontalmente
- `ProviderDashboard.jsx` - Cards muito largos

**Status**: ⏳ Pendente

---

## 🔒 Problemas de Segurança

### 13. Falta de Rate Limiting
**Descrição**: Nenhum endpoint tem rate limiting

**Solução**:
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/auth/login")
@limiter.limit("5/minute")
async def login(request: Request, ...):
    ...
```

**Status**: ⏳ Pendente

---

### 14. CORS Muito Permissivo
**Arquivo**: `backend/app/main.py`  
**Descrição**: CORS permite qualquer origem em produção

**Solução**:
```python
origins = [
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
]
```

**Status**: ⏳ Pendente

---

## 📝 Problemas de Documentação

### 15. Falta de Docstrings
**Descrição**: Muitas funções sem documentação

**Status**: ⏳ Pendente

---

### 16. API Docs Incompleta
**Descrição**: Schemas Pydantic sem `description` e `example`

**Solução**:
```python
class BatchCreate(BaseModel):
    product_type: ProductType = Field(
        ..., 
        description="Tipo de produto do lote",
        example="meal"
    )
    quantity: int = Field(
        ..., 
        description="Quantidade de itens no lote",
        example=100,
        gt=0
    )
```

**Status**: ⏳ Pendente

---

## 🧪 Problemas de Testes

### 17. Cobertura de Testes Baixa
**Descrição**: 
- Backend: ~40% de cobertura
- Frontend: ~10% de cobertura

**Áreas Sem Testes**:
- Routers de deliveries
- Componentes de modal
- Validadores customizados

**Status**: ⏳ Pendente

---

### 18. Falta de Testes de Integração
**Descrição**: Apenas testes unitários, sem testes E2E

**Solução**: Adicionar Playwright/Cypress para testes E2E

**Status**: ⏳ Pendente

---

## 📊 Como Contribuir

Para trabalhar em qualquer bug:

1. **Comente na issue** dizendo que vai trabalhar nele
2. **Crie uma branch**: `git checkout -b fix/nome-do-bug`
3. **Implemente a correção** seguindo os padrões do projeto
4. **Adicione testes** para prevenir regressão
5. **Abra um PR** referenciando este documento

---

## 🏷️ Labels de Prioridade

- 🔴 **Crítico**: Afeta funcionalidade core, precisa ser resolvido ASAP
- 🟡 **Médio**: Afeta UX ou pode causar problemas futuros
- 🟢 **Baixo**: Melhorias que podem esperar
- 🔵 **Performance**: Otimizações
- 🎨 **UX/UI**: Melhorias visuais
- 🔒 **Segurança**: Vulnerabilidades
- 📝 **Docs**: Documentação
- 🧪 **Testes**: Cobertura de testes

---

**Encontrou um novo bug?** Abra uma issue usando o template apropriado!
