# 📋 Issues para Criar no GitHub

Este arquivo contém o conteúdo das issues que devem ser criadas manualmente no GitHub para organizar o trabalho do projeto.

---

## 1. 🔴 Crítico: Refatorar MapView para melhor performance

**Título**: `🔴 Crítico: Refatorar MapView para melhor performance`  
**Labels**: `bug`, `critical`, `frontend`, `performance`

**Corpo**:
```markdown
## 🐛 Descrição do Bug

O componente MapView possui problemas críticos de performance e estado que afetam a experiência do usuário.

## 📋 Problemas Identificados

- **Múltiplas re-renderizações**: O mapa é recriado desnecessariamente causando performance ruim
- **Marcadores duplicados**: Ao atualizar dados, marcadores antigos não são removidos corretamente  
- **Memory leaks**: Event listeners não são limpos adequadamente no cleanup
- **Estado inconsistente**: `locationsWithStatus` pode ficar dessincronizado com `deliveries`

## 🎯 Impacto

- Performance degradada
- Experiência do usuário comprometida
- Possível crash em dispositivos móveis

## ✅ Solução Proposta

### Passo 1: Usar useRef para manter instância do mapa
```javascript
const mapRef = useRef(null);
const markersRef = useRef([]);
```

### Passo 2: Criar função para limpar marcadores
```javascript
const clearMarkers = useCallback(() => {
  markersRef.current.forEach(marker => marker.remove());
  markersRef.current = [];
}, []);
```

### Passo 3: Mover lógica para hook customizado
- Criar `useMapMarkers()` hook
- Isolar lógica de atualização de marcadores
- Adicionar cleanup no useEffect return

## 📁 Arquivos Afetados

- `frontend/src/pages/MapView.jsx` (linhas ~76, ~300-617)

## 🧪 Como Testar

1. Abrir React DevTools Profiler
2. Verificar se mapa é criado apenas uma vez
3. Testar atualização de dados sem duplicar marcadores
4. Verificar memory leaks no cleanup

## 🏷️ Critérios de Aceite

- [ ] Mapa criado apenas uma vez
- [ ] Marcadores atualizados sem duplicação
- [ ] Sem warnings de memory leak
- [ ] Performance melhorada (medida com Profiler)

## 📊 Prioridade

🔴 **CRÍTICA** - Afeta funcionalidade core do sistema

## 🔗 Documentação Relacionada

- [BUGS.md - Item 1](https://github.com/rede-emergencia/euajudo/blob/main/BUGS.md#-bugs-críticos-alta-prioridade)
- [NEXT_STEPS.md - Task 1](https://github.com/rede-emergencia/euajudo/blob/main/NEXT_STEPS.md#-prioridade-crítica-fazer-agora)

## 🤝 Como Contribuir

1. Comente nesta issue dizendo que vai trabalhar
2. Crie branch: `git checkout -b fix/mapview-performance`
3. Siga os passos da solução proposta
4. Teste com React DevTools
5. Abra PR referenciando esta issue
```

---

## 2. 🔴 Crítico: Implementar Repository Pattern Completo

**Título**: `🔴 Crítico: Implementar Repository Pattern Completo`  
**Labels**: `enhancement`, `critical`, `backend`, `architecture`

**Corpo**:
```markdown
## 🎯 Descrição

O padrão Repository foi iniciado mas não está sendo usado consistentemente. Precisamos completar a implementação para melhorar testabilidade e manutenção.

## 📋 Problemas Atuais

- Queries SQL espalhadas pelos routers
- Difícil testar
- Código duplicado
- Violação de princípios SOLID

## ✅ Solução Proposta

### Passo 1: Criar Interfaces (2h)
- Criar `app/repositories/interfaces.py`
- Definir interfaces para Batch, Delivery, Resource repositories

### Passo 2: Implementar Repositories (3h)
- Criar `app/repositories/batch_repository.py`
- Criar `app/repositories/delivery_repository.py`
- Criar `app/repositories/resource_repository.py`

### Passo 3: Migrar Routers (3h)
- Atualizar `routers/batches.py` para usar repositories
- Atualizar `routers/deliveries.py` para usar repositories
- Atualizar `routers/resources.py` para usar repositories

### Passo 4: Adicionar Testes (2h)
- Criar `tests/test_repositories.py`
- Testar cada método com cobertura > 80%

## 📁 Arquivos Afetados

- `backend/app/repositories.py`
- `backend/app/routers/batches.py`
- `backend/app/routers/deliveries.py`
- `backend/app/routers/resources.py`
- `backend/tests/test_repositories.py`

## 🏷️ Critérios de Aceite

- [ ] Todas as queries movidas para repositories
- [ ] Routers usam apenas repositories
- [ ] Cobertura de testes > 80% nos repositories
- [ ] Sem queries SQL diretas em routers

## 📊 Prioridade

🔴 **CRÍTICA** - Afeta arquitetura e manutenibilidade

## 🔗 Documentação Relacionada

- [BUGS.md - Item 2](https://github.com/rede-emergencia/euajudo/blob/main/BUGS.md#-bugs-críticos-alta-prioridade)
- [NEXT_STEPS.md - Task 2](https://github.com/rede-emergencia/euajudo/blob/main/NEXT_STEPS.md#-prioridade-crítica-fazer-agora)
- [ROADMAP.md - Fase 1](https://github.com/rede-emergencia/euajudo/blob/main/ROADMAP.md#-fase-1-repository-pattern--interfaces-em-progresso)

## 🤝 Como Contribuir

1. Comente nesta issue dizendo que vai trabalhar
2. Crie branch: `git checkout -b feature/repository-pattern`
3. Siga os passos da solução proposta
4. Adicione testes
5. Abra PR referenciando esta issue
```

---

## 3. 🟡 Médio: Adicionar Tratamento de Erros Consistente no Frontend

**Título**: `🟡 Médio: Adicionar Tratamento de Erros Consistente no Frontend`  
**Labels**: `enhancement`, `medium`, `frontend`, `ux`

**Corpo**:
```markdown
## 🎯 Descrição

Erros de API não são tratados consistentemente no frontend, resultando em UX ruim e dificuldade de debug.

## 📋 Problemas Atuais

- Erros de API não tratados
- Mensagens genéricas para o usuário
- Falta feedback visual em estados de loading
- Exemplos: VolunteerDashboard, ProviderDashboard, MapView

## ✅ Solução Proposta

### Passo 1: Criar Hook de API (2h)
- Criar `frontend/src/hooks/useApi.js`
- Centralizar tratamento de erros
- Adicionar loading states

### Passo 2: Criar Componentes de Feedback (1h)
- Criar `components/LoadingSpinner.jsx`
- Criar `components/ErrorMessage.jsx`
- Criar `components/Toast.jsx`

### Passo 3: Refatorar Componentes (2h)
- Atualizar VolunteerDashboard.jsx
- Atualizar ProviderDashboard.jsx
- Atualizar MapView.jsx

## 📁 Arquivos Afetados

- `frontend/src/hooks/useApi.js`
- `frontend/src/components/LoadingSpinner.jsx`
- `frontend/src/components/ErrorMessage.jsx`
- `frontend/src/components/Toast.jsx`
- `frontend/src/pages/VolunteerDashboard.jsx`
- `frontend/src/pages/ProviderDashboard.jsx`
- `frontend/src/pages/MapView.jsx`

## 🏷️ Critérios de Aceite

- [ ] Todos os fetch usam `useApi` hook
- [ ] Erros mostrados consistentemente
- [ ] Loading states visuais
- [ ] Mensagens de erro específicas

## 📊 Prioridade

🟡 **MÉDIA** - Afeta UX mas tem workaround

## 🔗 Documentação Relacionada

- [BUGS.md - Item 4](https://github.com/rede-emergencia/euajudo/blob/main/BUGS.md#-bugs-médios-média-prioridade)
- [NEXT_STEPS.md - Task 3](https://github.com/rede-emergencia/euajudo/blob/main/NEXT_STEPS.md#-prioridade-crítica-fazer-agora)

## 🤝 Como Contribuir

1. Comente nesta issue dizendo que vai trabalhar
2. Crie branch: `git checkout -b feature/error-handling`
3. Siga os passos da solução proposta
4. Teste todos os cenários de erro
5. Abra PR referenciando esta issue
```

---

## 4. 🟡 Médio: Implementar Paginação nos Endpoints

**Título**: `🟡 Médio: Implementar Paginação nos Endpoints`  
**Labels**: `enhancement`, `medium`, `backend`, `performance`

**Corpo**:
```markdown
## 🎯 Descrição

Endpoints de listagem retornam todos os registros, o que pode causar problemas de performance com muitos dados.

## 📋 Problemas Atuais

- Endpoints retornam todos os registros
- Pode causar timeout com muitos dados
- Sem controle sobre quantidade de dados

## ✅ Solução Proposta

### Adicionar Paginação em Todos os Endpoints de Listagem

Endpoints afetados:
- `GET /api/batches`
- `GET /api/deliveries`
- `GET /api/resources/requests`
- `GET /api/locations`

### Implementação
```python
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

## 📁 Arquivos Afetados

- `backend/app/routers/batches.py`
- `backend/app/routers/deliveries.py`
- `backend/app/routers/resources.py`
- `backend/app/routers/locations.py`

## 🏷️ Critérios de Aceite

- [ ] Todos os endpoints de listagem têm paginação
- [ ] Retornam metadados (total, skip, limit)
- [ ] Frontend atualizado para usar paginação
- [ ] Performance melhorada com datasets grandes

## 📊 Prioridade

🟡 **MÉDIA** - Melhoria de performance importante

## 🔗 Documentação Relacionada

- [BUGS.md - Item 8](https://github.com/rede-emergencia/euajudo/blob/main/BUGS.md#-bugs-baixos-baixa-prioridade)
- [NEXT_STEPS.md - Task 4](https://github.com/rede-emergencia/euajudo/blob/main/NEXT_STEPS.md#-prioridade-alta-próximas-2-semanas)

## 🤝 Como Contribuir

1. Comente nesta issue dizendo que vai trabalhar
2. Crie branch: `git checkout -b feature/pagination`
3. Implemente paginação em todos os endpoints
4. Atualize frontend se necessário
5. Abra PR referenciando esta issue
```

---

## 5. 🟡 Médio: Implementar Rate Limiting

**Título**: `🟡 Médio: Implementar Rate Limiting`  
**Labels**: `enhancement`, `medium`, `backend`, `security`

**Corpo**:
```markdown
## 🎯 Descrição

Nenhum endpoint tem rate limiting, o que representa um risco de segurança.

## 📋 Problemas Atuais

- Sem proteção contra abuso
- Possível DoS
- Sem controle de uso

## ✅ Solução Proposta

### Adicionar slowapi ao backend
```bash
pip install slowapi
```

### Configurar limiter global
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

### Adicionar rate limits específicos
```python
@router.post("/auth/login")
@limiter.limit("5/minute")
async def login(request: Request, credentials: LoginRequest):
    ...
```

## 📁 Arquivos Afetados

- `backend/requirements.txt`
- `backend/app/main.py`
- `backend/app/routers/auth.py`
- `backend/app/routers/batches.py`
- `backend/app/routers/deliveries.py`

## 🏷️ Critérios de Aceite

- [ ] slowapi instalado e configurado
- [ ] Rate limiting global funcionando
- [ ] Rate limits específicos em endpoints críticos
- [ ] Testes de rate limiting passando

## 📊 Prioridade

🟡 **MÉDIA** - Melhoria de segurança importante

## 🔗 Documentação Relacionada

- [BUGS.md - Item 13](https://github.com/rede-emergencia/euajudo/blob/main/BUGS.md#-problemas-de-segurança)
- [NEXT_STEPS.md - Task 5](https://github.com/rede-emergencia/euajudo/blob/main/NEXT_STEPS.md#-prioridade-alta-próximas-2-semanas)

## 🤝 Como Contribuir

1. Comente nesta issue dizendo que vai trabalhar
2. Crie branch: `git checkout -b feature/rate-limiting`
3. Implemente rate limiting
4. Adicione testes
5. Abra PR referenciando esta issue
```

---

## 6. 🟢 Fácil: Adicionar Índices no Banco de Dados

**Título**: `🟢 Fácil: Adicionar Índices no Banco de Dados`  
**Labels**: `enhancement`, `easy`, `backend`, `performance`

**Corpo**:
```markdown
## 🎯 Descrição

Queries comuns não têm índices, afetando performance do banco.

## 📋 Problemas Atuais

- Queries lentas com muitos dados
- N+1 queries sem otimização
- Falta de índices compostos

## ✅ Solução Proposta

### Adicionar índices em models.py
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

## 📁 Arquivos Afetados

- `backend/app/models.py`

## 🏷️ Critérios de Aceite

- [ ] Índices compostos adicionados
- [ ] Queries principais otimizadas
- [ ] Performance melhorada (medida)

## 📊 Prioridade

🟢 **FÁCIL** - Melhoria simples com grande impacto

## 🔗 Documentação Relacionada

- [BUGS.md - Item 10](https://github.com/rede-emergencia/euajudo/blob/main/BUGS.md#-melhorias-de-performance)
- [NEXT_STEPS.md - Task 6](https://github.com/rede-emergencia/euajudo/blob/main/NEXT_STEPS.md#-prioridade-alta-próximas-2-semanas)

## 🤝 Como Contribuir

1. Comente nesta issue dizendo que vai trabalhar
2. Crie branch: `git checkout -b feature/database-indexes`
3. Adicione índices em models.py
4. Teste performance das queries
5. Abra PR referenciando esta issue
```

---

## 7. 🟡 Médio: Corrigir Sincronização de Enums

**Título**: `🟡 Médio: Corrigir Sincronização de Enums`  
**Labels**: `enhancement`, `medium`, `backend`, `frontend`

**Corpo**:
```markdown
## 🎯 Descrição

Três arquivos diferentes para os mesmos enums, fácil ficar dessincronizado.

## 📋 Problemas Atuais

- `backend/app/enums.py`
- `frontend/src/shared/enums.js`
- `shared/enums.json`
- Fácil ficar dessincronizado
- Não há validação automática

## ✅ Solução Proposta

### Criar script de geração
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

### Adicionar validação no CI/CD
- Script que valida se enums estão sincronizados
- Falha no build se estiverem dessincronizados

## 📁 Arquivos Afetados

- `scripts/generate_enums.py`
- `backend/app/enums.py`
- `frontend/src/shared/enums.js`
- `.github/workflows/validate-enums.yml`

## 🏷️ Critérios de Aceite

- [ ] Script de geração funcionando
- [ ] Enums gerados automaticamente
- [ ] Validação no CI/CD
- [ ] Fonte única de verdade em `shared/enums.json`

## 📊 Prioridade

🟡 **MÉDIA** - Prevenção de bugs futuros

## 🔗 Documentação Relacionada

- [BUGS.md - Item 5](https://github.com/rede-emergencia/euajudo/blob/main/BUGS.md#-bugs-médios-média-prioridade)
- [NEXT_STEPS.md - Task 7](https://github.com/rede-emergencia/euajudo/blob/main/NEXT_STEPS.md#-prioridade-alta-próximas-2-semanas)

## 🤝 Como Contribuir

1. Comente nesta issue dizendo que vai trabalhar
2. Crie branch: `git checkout -b feature/enum-sync`
3. Crie script de geração
4. Adicione validação no CI/CD
5. Abra PR referenciando esta issue
```

---

## 📋 Como Criar as Issues

1. **Acesse**: https://github.com/rede-emergencia/euajudo/issues
2. **Clique**: "New issue"
3. **Use templates** ou copie o conteúdo acima
4. **Adicione labels** apropriadas
5. **Assign** se quiser trabalhar na issue

## 🎯 Ordem Sugerida

1. **Issues Críticas** (🔴): MapView, Repository Pattern
2. **Issues Médias** (🟡): Error Handling, Paginação, Rate Limiting, Enums
3. **Issues Fáceis** (🟢): Database Indexes

## 📊 Total de Issues

- **🔴 Críticas**: 2
- **🟡 Médias**: 4  
- **🟢 Fáceis**: 1
- **Total**: 7 issues prioritárias

---

**Pronto para organizar o trabalho!** 🎉

Com estas issues, contribuidores novos saberão exatamente o que fazer e como começar.
