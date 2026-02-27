# 🤝 Guia de Contribuição

Obrigado por considerar contribuir com o **EuAjudo**! Este documento fornece diretrizes para contribuir com o projeto.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Posso Contribuir?](#como-posso-contribuir)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Padrões de Código](#padrões-de-código)
- [Processo de Pull Request](#processo-de-pull-request)
- [Convenções de Commit](#convenções-de-commit)

## 📜 Código de Conduta

Este projeto adere a um código de conduta. Ao participar, você concorda em manter um ambiente respeitoso e acolhedor para todos.

## 🎯 Como Posso Contribuir?

### Reportar Bugs

Antes de criar um bug report:
- Verifique se o bug já não foi reportado
- Colete informações sobre o bug (versão, sistema operacional, logs)

Ao criar um bug report, inclua:
- Descrição clara do problema
- Passos para reproduzir
- Comportamento esperado vs atual
- Screenshots (se aplicável)
- Informações do ambiente

### Sugerir Melhorias

Sugestões de melhorias são bem-vindas! Ao sugerir:
- Use um título claro e descritivo
- Forneça uma descrição detalhada da melhoria
- Explique por que essa melhoria seria útil
- Liste exemplos de como funcionaria

### Contribuir com Código

1. **Issues para Iniciantes**: Procure por issues marcadas com `good first issue`
2. **Áreas de Contribuição**:
   - 🐛 Correção de bugs
   - ✨ Novas funcionalidades
   - 📝 Documentação
   - 🎨 Melhorias de UI/UX
   - 🧪 Testes
   - 🌍 Internacionalização
   - ♿ Acessibilidade

## 🛠️ Configuração do Ambiente

### Pré-requisitos

- Python 3.8+
- Node.js 16+
- Git

### Setup do Backend

```bash
cd backend

# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env conforme necessário

# Inicializar banco de dados
python init_db.py

# Rodar servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Setup do Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Rodar em desenvolvimento
npm run dev
```

### Rodar Testes

**Backend:**
```bash
cd backend
pytest
pytest --cov=app  # Com cobertura
```

**Frontend:**
```bash
cd frontend
npm test
```

## 📝 Padrões de Código

### Python (Backend)

- **Style Guide**: PEP 8
- **Formatação**: Use `black` para formatação automática
- **Linting**: Use `flake8`
- **Type Hints**: Sempre que possível
- **Docstrings**: Para funções públicas

```python
# Exemplo
def create_resource_request(
    db: Session,
    provider_id: int,
    items: List[ResourceItemCreate]
) -> ResourceRequest:
    """
    Cria um novo pedido de recursos.
    
    Args:
        db: Sessão do banco de dados
        provider_id: ID do fornecedor
        items: Lista de itens solicitados
        
    Returns:
        ResourceRequest criado
    """
    # Implementação
```

### JavaScript/React (Frontend)

- **Style Guide**: Airbnb JavaScript Style Guide
- **Componentes**: Functional components com hooks
- **Formatação**: Use Prettier
- **Linting**: ESLint configurado

```jsx
// Exemplo
import { useState, useEffect } from 'react';

export default function ResourceList({ providerId }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch resources
  }, [providerId]);

  return (
    <div className="space-y-4">
      {/* Componente */}
    </div>
  );
}
```

### Nomenclatura

- **Variáveis/Funções**: `snake_case` (Python), `camelCase` (JavaScript)
- **Classes**: `PascalCase`
- **Constantes**: `UPPER_SNAKE_CASE`
- **Componentes React**: `PascalCase`
- **Arquivos**: `snake_case.py`, `PascalCase.jsx`

### Estrutura de Arquivos

**Backend:**
```
backend/app/
├── routers/          # Endpoints da API
│   ├── batches.py
│   ├── deliveries.py
│   └── resources.py
├── models.py         # Models SQLAlchemy
├── schemas.py        # Schemas Pydantic
├── enums.py          # Enumerações
├── validators.py     # Validadores
└── repositories.py   # Repository pattern
```

**Frontend:**
```
frontend/src/
├── components/       # Componentes reutilizáveis
├── pages/           # Páginas/rotas
├── contexts/        # React contexts
├── hooks/           # Custom hooks
└── lib/             # Utilitários
```

## 🔄 Processo de Pull Request

### Antes de Submeter

1. ✅ Código segue os padrões estabelecidos
2. ✅ Testes passam (`pytest` e `npm test`)
3. ✅ Código está formatado (`black`, `prettier`)
4. ✅ Sem warnings de linting
5. ✅ Documentação atualizada (se necessário)
6. ✅ Commit messages seguem convenção

### Criando o PR

1. **Fork** o repositório
2. **Clone** seu fork
3. **Crie uma branch** descritiva:
   ```bash
   git checkout -b feature/adiciona-filtro-produtos
   git checkout -b fix/corrige-validacao-entrega
   git checkout -b docs/atualiza-readme
   ```

4. **Faça suas mudanças** seguindo os padrões
5. **Commit** com mensagens claras
6. **Push** para seu fork
7. **Abra um PR** com:
   - Título claro e descritivo
   - Descrição detalhada das mudanças
   - Referência a issues relacionadas
   - Screenshots (se UI)

### Template de PR

```markdown
## Descrição
[Descrição clara do que foi mudado e por quê]

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova funcionalidade
- [ ] Breaking change
- [ ] Documentação

## Como Testar
1. [Passo 1]
2. [Passo 2]

## Checklist
- [ ] Código segue padrões do projeto
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada
- [ ] Sem warnings de linting
```

## 📝 Convenções de Commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]
```

### Tipos

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (não afeta código)
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Manutenção

### Exemplos

```bash
feat(batches): adiciona filtro por tipo de produto
fix(deliveries): corrige validação de código de confirmação
docs(readme): atualiza instruções de instalação
refactor(models): simplifica relacionamentos
test(resources): adiciona testes para reservas
```

## 🏗️ Arquitetura do Projeto

### Event-Driven Architecture

O sistema usa arquitetura orientada a eventos:
- **Models genéricos**: `ProductBatch`, `Delivery`, `ResourceRequest`
- **Enums baseados em eventos**: `OrderStatus`, `DeliveryStatus`, `BatchStatus`
- **Preparado para microserviços**: Estrutura modular

### Adicionando Novos Tipos de Produtos

1. Adicione o tipo em `ProductType` enum
2. Crie validator específico (se necessário)
3. Atualize frontend para suportar novo tipo
4. Adicione testes

Consulte [docs/architecture/](docs/architecture/) para mais detalhes.

## 🧪 Testes

### Backend

```bash
# Rodar todos os testes
pytest

# Com cobertura
pytest --cov=app --cov-report=html

# Teste específico
pytest tests/test_batches.py
```

### Frontend

```bash
# Rodar testes
npm test

# Com cobertura
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Cobertura Mínima

- Backend: 70%
- Frontend: 60%

## 📚 Recursos Úteis

- [Documentação FastAPI](https://fastapi.tiangolo.com/)
- [Documentação React](https://react.dev/)
- [SQLAlchemy Docs](https://docs.sqlalchemy.org/)
- [TailwindCSS Docs](https://tailwindcss.com/)
- [Arquitetura do Projeto](docs/architecture/)

## 💬 Comunicação

- **Issues**: Para bugs e sugestões
- **Discussions**: Para perguntas e ideias
- **Pull Requests**: Para contribuições de código

## 🎉 Reconhecimento

Todos os contribuidores serão reconhecidos no projeto. Obrigado por ajudar a tornar o EuAjudo melhor!

---

**Dúvidas?** Abra uma issue ou discussion. Estamos aqui para ajudar! 🤝
