# 🏗️ Arquitetura do Framework de Testes E2E

## Visão Geral

Este framework foi projetado com **escalabilidade**, **manutenibilidade** e **reutilização** em mente.

## Princípios Arquiteturais

### 1. **Separation of Concerns**

```
fixtures/    → Autenticação e setup reutilizável
helpers/     → Lógica auxiliar (seletores, API)
tests/       → Testes organizados por perfil de usuário
```

### 2. **DRY (Don't Repeat Yourself)**

- **Fixtures** evitam duplicação de código de autenticação
- **Helpers** centralizam seletores e chamadas de API
- **TEST_USERS** define credenciais em um único lugar

### 3. **Page Object Model (Simplificado)**

Em vez de criar Page Objects completos, usamos:
- **Seletores centralizados** em `helpers/selectors.js`
- **API helpers** para setup de dados
- **Fixtures** para comportamentos reutilizáveis

## Padrões de Design

### Fixture Pattern

```javascript
export const test = base.extend({
  authenticatedAsProvider: async ({ page }, use) => {
    await loginViaAPI(page, TEST_USERS.provider1);
    await use(page);
  }
});
```

**Benefícios:**
- Reutilização de código
- Setup/teardown automático
- Context isolado por teste

### Helper Pattern

```javascript
// helpers/api.helpers.js
export async function createBatchViaAPI(token, data) {
  // Lógica centralizada
}
```

**Benefícios:**
- Abstração de complexidade
- Facilita manutenção
- Permite mock/stub futuro

### Selector Pattern

```javascript
// helpers/selectors.js
export const SELECTORS = {
  auth: {
    loginButton: '[data-testid="login-button"]',
    // ...
  }
};
```

**Benefícios:**
- Seletores estáveis
- Fácil atualização quando UI muda
- Documentação implícita

## Estratégias de Teste

### 1. **Login via API vs UI**

**Via API (preferido para setup):**
```javascript
const token = await getAuthToken(email, password);
await page.evaluate((token) => {
  localStorage.setItem('token', token);
}, token);
```

**Via UI (quando testar login):**
```javascript
await page.fill('[data-testid="login-email"]', email);
await page.click('[data-testid="login-submit"]');
```

**Decisão:** Use API para setup rápido, UI apenas quando testar o próprio login.

### 2. **Data Setup**

**Opções:**
1. **Via API** - Rápido, confiável
2. **Via UI** - Testa fluxo completo
3. **Via banco de dados** - Mais rápido, mas acoplado

**Recomendação:** API para setup, UI para fluxo completo.

### 3. **Isolation vs Shared State**

- Cada teste deve ser **independente**
- Não depender de ordem de execução
- Limpar estado quando necessário

```javascript
test.beforeEach(async ({ page }) => {
  await page.evaluate(() => localStorage.clear());
});
```

## Organização de Testes

### Por Perfil de Usuário

```
tests/
├── auth/           # Autenticação
├── provider/       # Fluxos do fornecedor
├── volunteer/      # Fluxos do voluntário
└── shelter/        # Fluxos do abrigo
```

**Vantagens:**
- Fácil encontrar testes relacionados
- Permite executar testes por perfil
- Reflete organização do produto

## Seletores: data-testid Strategy

### Hierarquia de Seletores (ordem de preferência)

1. **data-testid** - Mais estável ✅
2. **role + name** - Semântico
3. **text content** - Pode mudar
4. **CSS classes** - Frágil ❌

### Convenção de Nomes

```
{component}-{element}-{action}

Exemplos:
- login-button
- login-email
- login-submit
- create-batch-button
- batch-list
```

## Performance

### Otimizações Implementadas

1. **Login via API** - 10x mais rápido que via UI
2. **Reuso de contexto** - Fixtures compartilham setup
3. **Parallel execution** - Configurável por necessidade
4. **Smart waiting** - `waitForLoadState`, não sleeps fixos

### Métricas Alvo

- Login via API: < 500ms
- Login via UI: < 3s
- Teste E2E completo: < 30s
- Suite completa: < 5min

## Extensibilidade

### Adicionando Novo Perfil

1. Adicionar usuário em `fixtures/auth.fixture.js`
2. Criar fixture específico se necessário
3. Criar pasta `tests/{perfil}/`
4. Adicionar npm script em `package.json`

### Adicionando Novo Fluxo

1. Criar arquivo de teste na pasta apropriada
2. Adicionar seletores em `helpers/selectors.js`
3. Adicionar helpers de API se necessário
4. Atualizar documentação

### Adicionando Helper de API

```javascript
// helpers/api.helpers.js
export async function novaFuncaoAPI(token, data) {
  const response = await fetch(`${API_BASE}/endpoint`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`Failed: ${response.statusText}`);
  }
  
  return response.json();
}
```

## Manutenção

### Quando UI Muda

1. Atualizar `data-testid` no componente React
2. Atualizar `helpers/selectors.js`
3. Rodar testes para validar
4. Atualizar screenshots de referência

### Quando API Muda

1. Atualizar `helpers/api.helpers.js`
2. Atualizar testes afetados
3. Validar compatibilidade

### Refactoring de Testes

- Mover código duplicado para helpers
- Criar fixtures para setup comum
- Consolidar assertions similares

## CI/CD Integration

### GitHub Actions (exemplo)

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v2
      - name: Install deps
        run: cd e2e && npm install
      - name: Run tests
        run: cd e2e && npm test
      - name: Upload report
        uses: actions/upload-artifact@v2
        with:
          name: test-results
          path: e2e/test-results/
```

## Debugging

### Estratégias

1. **Playwright UI Mode** - `npm run test:ui`
2. **Headed Mode** - `npm run test:headed`
3. **Debug Mode** - `npm run test:debug`
4. **Screenshots** - Automático em falhas
5. **Videos** - Automático em falhas
6. **Traces** - Replay completo da execução

### Exemplo de Debug

```javascript
test('debug exemplo', async ({ page }) => {
  // Pause para inspecionar
  await page.pause();
  
  // Screenshot manual
  await page.screenshot({ path: 'debug.png' });
  
  // Log do HTML
  const html = await page.content();
  console.log(html);
});
```

## Conclusão

Este framework foi construído para **escalar** com o projeto, mantendo **velocidade** e **confiabilidade**.

**Princípios chave:**
- ✅ Testes rápidos e confiáveis
- ✅ Fácil de manter e estender
- ✅ Boa experiência de debug
- ✅ Documentação clara
