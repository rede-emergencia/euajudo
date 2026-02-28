# 🧪 Framework de Testes E2E - EuAjudo

Framework robusto de testes end-to-end usando **Playwright** para validar fluxos críticos da plataforma EuAjudo.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Estrutura](#estrutura)
- [Setup](#setup)
- [Executando Testes](#executando-testes)
- [Escrevendo Novos Testes](#escrevendo-novos-testes)
- [Boas Práticas](#boas-práticas)

## 🎯 Visão Geral

Este framework testa os **fluxos críticos** da plataforma:

### ✅ Autenticação
- Login de Provider, Volunteer, Shelter e Admin
- Validação de credenciais
- Redirecionamento baseado em perfil

### ✅ Fluxo Provider (Fornecedor)
- Criação de pedidos de recursos
- Criação de lotes de produtos
- Marcação de lotes como prontos

### ✅ Fluxo Volunteer (Voluntário)
- Visualização do mapa de oportunidades
- Reserva de recursos
- Aceite de entregas
- Confirmação de entregas

### ✅ Fluxo Shelter (Abrigo)
- Visualização de entregas pendentes
- Confirmação de recebimento

## 📁 Estrutura

```
e2e/
├── fixtures/
│   └── auth.fixture.js         # Fixtures de autenticação reutilizáveis
├── helpers/
│   ├── selectors.js            # Seletores centralizados
│   └── api.helpers.js          # Helpers para interagir com API
├── tests/
│   ├── auth/
│   │   └── login.test.js       # Testes de autenticação
│   ├── provider/
│   │   ├── resource-request.test.js
│   │   └── batch-creation.test.js
│   ├── volunteer/
│   │   └── delivery-flow.test.js
│   └── shelter/
│       └── receive-deliveries.test.js
├── playwright.config.js        # Configuração do Playwright
├── package.json
└── README.md
```

## 🚀 Setup

### 1. Instalar dependências

```bash
cd e2e
npm install
```

### 2. Instalar browsers do Playwright

```bash
npm run install:browsers
```

### 3. Verificar que backend e frontend estão rodando

O framework automaticamente inicia backend e frontend, mas você também pode iniciá-los manualmente:

```bash
# Backend (em um terminal)
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Frontend (em outro terminal)
cd frontend
npm run dev
```

## 🧪 Executando Testes

### Executar todos os testes

```bash
npm test
```

### Executar com interface visual (headed mode)

```bash
npm run test:headed
```

### Executar com Playwright UI (recomendado para debug)

```bash
npm run test:ui
```

### Executar testes específicos

```bash
# Apenas autenticação
npm run test:auth

# Apenas testes de provider
npm run test:provider

# Apenas testes de volunteer
npm run test:volunteer

# Apenas testes de shelter
npm run test:shelter
```

### Debug de um teste específico

```bash
npm run test:debug
```

### Ver relatório de testes

```bash
npm run report
```

## 📝 Escrevendo Novos Testes

### 1. Usar fixtures para autenticação

```javascript
import { test, expect } from '../../fixtures/auth.fixture.js';
import { TEST_USERS } from '../../fixtures/auth.fixture.js';

test('meu novo teste', async ({ page }) => {
  // Login via API (mais rápido)
  const response = await page.request.post('http://localhost:8000/api/auth/login', {
    form: {
      username: TEST_USERS.provider1.email,
      password: TEST_USERS.provider1.password
    }
  });
  
  const data = await response.json();
  await page.evaluate((token) => {
    localStorage.setItem('token', token);
  }, data.access_token);
  
  // Navegar para página
  await page.goto('/dashboard/fornecedor');
  
  // Seus testes aqui...
});
```

### 2. Usar seletores centralizados

```javascript
import { SELECTORS } from '../../helpers/selectors.js';

// Usar seletores do helper
await page.click(SELECTORS.provider.createBatchButton);
```

### 3. Adicionar data-testid nos componentes

Sempre que possível, adicione `data-testid` nos componentes React para seletores estáveis:

```jsx
<button data-testid="create-batch-button" onClick={handleCreate}>
  Criar Lote
</button>
```

### 4. Reutilizar helpers de API

```javascript
import { createBatchViaAPI, markBatchReadyViaAPI } from '../../helpers/api.helpers.js';

// Criar batch via API para setup rápido
const batch = await createBatchViaAPI(token, {
  product_type: 'meal',
  quantity: 50,
  description: 'Marmitas vegetarianas'
});
```

## 🎯 Boas Práticas

### ✅ DO

- **Use data-testid** sempre que possível para seletores estáveis
- **Login via API** para setup rápido (exceto quando testar o próprio login)
- **Reutilize fixtures** e helpers
- **Screenshots** em pontos críticos para debug
- **Assertions específicas** (evite assertions genéricas)
- **Aguarde elementos** com timeout adequado
- **Organize testes** por fluxo de usuário

### ❌ DON'T

- Não use seletores frágeis como classes CSS ou IDs gerados
- Não coloque sleeps fixos (use `waitFor` apropriado)
- Não teste múltiplos fluxos em um único teste
- Não deixe testes dependentes de ordem de execução
- Não ignore falhas intermitentes

## 🔧 Configuração Avançada

### Executar em múltiplos browsers

Edite `playwright.config.js` e descomente os projetos Firefox/WebKit:

```javascript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
]
```

### Aumentar timeout para testes lentos

```javascript
test('teste lento', async ({ page }) => {
  test.setTimeout(120000); // 2 minutos
  
  // seu teste...
});
```

### Executar testes em paralelo

Edite `playwright.config.js`:

```javascript
fullyParallel: true,
workers: 4, // Número de workers paralelos
```

## 📊 Relatórios

Os testes geram 3 tipos de relatórios:

1. **HTML Report** - `test-results/html-report/`
2. **JUnit XML** - `test-results/junit.xml`
3. **Screenshots/Videos** - `test-results/` (apenas em falhas)

Abrir relatório HTML:

```bash
npm run report
```

## 🐛 Troubleshooting

### Testes falhando por timeout

- Verifique se backend e frontend estão rodando
- Aumente timeout nas configurações
- Use `page.waitForLoadState('networkidle')` após navegações

### Modal não encontrado

- Verifique se data-testid foi adicionado no componente
- Use debug mode: `npm run test:debug`
- Tire screenshot: `await page.screenshot({ path: 'debug.png' })`

### Credenciais inválidas

- Verifique se o banco de dados foi populado com `make seed`
- Confirme que as credenciais em `fixtures/auth.fixture.js` correspondem ao `init_db.py`

## 📚 Recursos

- [Playwright Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging](https://playwright.dev/docs/debug)

## 🤝 Contribuindo

1. Escreva testes para novos fluxos críticos
2. Adicione data-testid em novos componentes
3. Atualize este README com novas seções
4. Mantenha testes rápidos e confiáveis

---

**Desenvolvido com ❤️ para garantir qualidade na plataforma EuAjudo**
