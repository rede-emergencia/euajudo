# 🤖 Sistema de Agentes e Workflows - JFood

Documentação completa do sistema de padronização e qualidade do projeto JFood.

## 📖 Visão Geral

Este projeto utiliza um sistema de **agentes especializados** e **workflows padronizados** para manter alta qualidade de código e consistência, essencial para um projeto open-source.

### Por que Agentes e Workflows?

- ✅ **Consistência**: Padrões uniformes em todo o código
- ✅ **Qualidade**: Code reviews automáticos e checklists
- ✅ **Onboarding**: Novos desenvolvedores seguem padrões facilmente
- ✅ **Produtividade**: Processos otimizados e documentados
- ✅ **Open-Source Ready**: Código profissional e bem documentado

## 🗂️ Estrutura

```
.windsurf/
├── agents/                    # Agentes especializados
│   ├── README.md             # Documentação dos agentes
│   ├── ux-designer.md        # Especialista em UX/UI
│   ├── backend-architect.md  # Especialista em FastAPI
│   ├── code-quality.md       # Especialista em qualidade
│   ├── api-integrator.md     # Especialista em integração
│   ├── deployment-specialist.md  # Especialista em deploy
│   └── testing-specialist.md # Especialista em testes
│
└── workflows/                 # Workflows padronizados
    ├── README.md             # Documentação dos workflows
    ├── ux-review.md          # Review de UX/UI
    ├── new-feature.md        # Nova funcionalidade
    ├── deploy.md             # Deploy no Render
    ├── bug-fix.md            # Correção de bugs
    └── code-review.md        # Code review completo
```

## 🤖 Agentes Disponíveis

### 1. **UX/UI Designer** (`@ux-designer.md`)
Especialista em criar interfaces user-friendly e acessíveis.

**Use para**:
- Revisar páginas e componentes
- Padronizar design system
- Melhorar experiência do usuário
- Garantir acessibilidade

**Exemplo**:
```
@ux-designer.md Faça um review da página DashboardAbrigo.jsx
```

---

### 2. **Backend Architect** (`@backend-architect.md`)
Especialista em arquitetura de APIs RESTful com FastAPI.

**Use para**:
- Criar endpoints e routers
- Definir models e schemas
- Implementar autenticação
- Otimizar performance

**Exemplo**:
```
@backend-architect.md Crie um router CRUD para avaliacoes
```

---

### 3. **Code Quality** (`@code-quality.md`)
Especialista em qualidade de código e padrões.

**Use para**:
- Code review
- Refatorar código
- Estabelecer padrões
- Melhorar cobertura de testes

**Exemplo**:
```
@code-quality.md Review o código modificado nos últimos commits
```

---

### 4. **API Integrator** (`@api-integrator.md`)
Especialista em integração frontend-backend.

**Use para**:
- Criar services de API
- Implementar custom hooks
- Resolver CORS
- Otimizar comunicação

**Exemplo**:
```
@api-integrator.md Crie service e hook para notificacoes
```

---

### 5. **Deployment Specialist** (`@deployment-specialist.md`)
Especialista em deploy no Render.com.

**Use para**:
- Preparar deploy
- Configurar Render
- Migrar para PostgreSQL
- Resolver problemas de produção

**Exemplo**:
```
@deployment-specialist.md Prepare a aplicação para deploy
```

---

### 6. **Testing Specialist** (`@testing-specialist.md`)
Especialista em testes automatizados.

**Use para**:
- Criar testes
- Aumentar cobertura
- Configurar ambiente de testes
- Debugar testes

**Exemplo**:
```
@testing-specialist.md Crie testes para o router de pedidos
```

## 🔄 Workflows Disponíveis

### 1. `/ux-review` - Review de UX/UI
Processo completo para revisar e melhorar interfaces.

**Quando usar**: Antes de commits de páginas, refatoração visual

**Tempo**: 1-2 horas

---

### 2. `/new-feature` - Nova Funcionalidade
Guia completo para criar funcionalidade do backend ao frontend.

**Quando usar**: Adicionar novo recurso, criar endpoint, nova página

**Tempo**: 4-8 horas

---

### 3. `/deploy` - Deploy no Render
Processo de deploy completo no Render.com.

**Quando usar**: Primeiro deploy, atualização de produção

**Tempo**: 2-4 horas (primeiro deploy)

---

### 4. `/bug-fix` - Correção de Bugs
Processo sistemático para corrigir bugs.

**Quando usar**: Bug reportado, erro em testes

**Tempo**: 30min - 3 horas

---

### 5. `/code-review` - Code Review Completo
Review abrangente antes de commits importantes.

**Quando usar**: Antes de merge, deploy, preparar para open-source

**Tempo**: 1-3 horas

## 🚀 Guia Rápido de Uso

### Para Revisar UX de uma Página

```bash
# 1. Chamar workflow
/ux-review

# 2. Ou consultar agente diretamente
@ux-designer.md Review a página HomeWorking.jsx e sugira melhorias
```

### Para Criar Nova Funcionalidade

```bash
# 1. Chamar workflow (recomendado)
/new-feature

# 2. Ou consultar agentes individualmente
@backend-architect.md Crie router para avaliacoes
@api-integrator.md Crie service para avaliacoes
@ux-designer.md Crie interface para avaliacoes
@testing-specialist.md Crie testes para avaliacoes
```

### Para Corrigir um Bug

```bash
# 1. Chamar workflow
/bug-fix

# 2. Ou consultar agente
@code-quality.md Como corrigir [PROBLEMA] sem quebrar [FUNCIONALIDADE]?
```

### Para Fazer Deploy

```bash
# 1. Chamar workflow
/deploy

# 2. Ou consultar agente
@deployment-specialist.md Prepare a aplicação para deploy no Render
```

## 📋 Padrões Estabelecidos

### Design System (UX)
- **Cores**: Azul (#2563eb), Verde (#16a34a), Vermelho (#dc2626)
- **Espaçamento**: Escala Tailwind (4, 6, 8, 12, 16, 24px)
- **Bordas**: `rounded-lg` (8px)
- **Sombras**: `shadow-md` para cards, `shadow-lg` para modais

### Backend (FastAPI)
- **Estrutura**: Repository pattern com routers modulares
- **Autenticação**: JWT com OAuth2
- **Validação**: Pydantic schemas
- **Testes**: pytest com cobertura mínima de 70%

### Frontend (React)
- **Componentes**: Funcionais com hooks
- **Estado**: Custom hooks para dados
- **Estilo**: TailwindCSS
- **Ícones**: Lucide React

### Integração
- **API**: Service layer centralizado
- **Error Handling**: Tratamento robusto com feedback visual
- **Loading**: Estados de loading em todas as requisições

## 🎯 Fluxo de Trabalho Recomendado

### 1. Nova Funcionalidade
```
/new-feature → Implementar → /code-review → Commit → /deploy
```

### 2. Correção de Bug
```
/bug-fix → Implementar → Testar → Commit
```

### 3. Melhoria de UX
```
/ux-review → Implementar → Testar → Commit
```

### 4. Preparação para Release
```
/code-review → Ajustes → /deploy → Monitorar
```

## 📚 Documentação Completa

Para detalhes completos, consulte:

- **Agentes**: `.windsurf/agents/README.md`
- **Workflows**: `.windsurf/workflows/README.md`
- **Cada Agente**: `.windsurf/agents/[nome].md`
- **Cada Workflow**: `.windsurf/workflows/[nome].md`

## 💡 Dicas para Contribuidores

### Antes de Começar
1. Leia `.windsurf/agents/README.md`
2. Familiarize-se com os workflows
3. Consulte agentes durante desenvolvimento

### Durante Desenvolvimento
1. Use workflows para tarefas complexas
2. Consulte agentes para dúvidas específicas
3. Siga os padrões estabelecidos

### Antes de Commit
1. Execute `/code-review`
2. Rode testes: `pytest` (backend) e `npm test` (frontend)
3. Verifique linters
4. Commit com mensagem descritiva

### Antes de Deploy
1. Execute `/deploy`
2. Teste localmente
3. Verifique variáveis de ambiente
4. Monitore logs após deploy

## 🔧 Comandos Úteis

### Backend
```bash
# Testes
cd backend
pytest --cov=app --cov-report=html

# Linting
flake8 app/
black app/ --check

# Servidor
uvicorn app.main:app --reload
```

### Frontend
```bash
# Testes
cd frontend
npm test -- --coverage

# Linting
npm run lint

# Dev server
npm run dev
```

## 🤝 Contribuindo

### Para Melhorar Agentes
1. Identifique padrão faltante
2. Atualize `.windsurf/agents/[agente].md`
3. Teste as mudanças
4. Documente

### Para Criar Workflows
1. Identifique processo repetitivo
2. Crie `.windsurf/workflows/[nome].md`
3. Siga template padrão
4. Teste e documente

## 📞 Suporte

- **Dúvidas sobre agentes**: Consulte `.windsurf/agents/README.md`
- **Dúvidas sobre workflows**: Consulte `.windsurf/workflows/README.md`
- **Issues**: Abra issue no GitHub
- **Melhorias**: Pull requests são bem-vindos!

## 🎓 Recursos de Aprendizado

### Para Iniciantes
1. Leia este documento
2. Explore `.windsurf/agents/README.md`
3. Use `/ux-review` em uma página simples
4. Pratique com `/bug-fix`

### Para Intermediários
1. Use `/new-feature` para criar recurso completo
2. Experimente consultar múltiplos agentes
3. Customize workflows existentes

### Para Avançados
1. Crie novos agentes especializados
2. Otimize workflows
3. Contribua com melhorias ao sistema

---

## 🌟 Benefícios do Sistema

- ✅ **Código Consistente**: Padrões uniformes
- ✅ **Alta Qualidade**: Reviews automáticos
- ✅ **Produtividade**: Processos otimizados
- ✅ **Documentação**: Tudo documentado
- ✅ **Onboarding Rápido**: Novos devs produtivos rapidamente
- ✅ **Open-Source Ready**: Código profissional

---

**Desenvolvido com ❤️ para manter JFood como referência de qualidade em projetos open-source**
