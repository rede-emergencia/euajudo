# 🔧 Troubleshooting - Testes E2E

Guia de resolução de problemas comuns.

## 🚨 Problemas Comuns

### 1. "Cannot find module '@playwright/test'"

**Causa:** Dependências não instaladas.

**Solução:**
```bash
cd e2e
npm install
```

---

### 2. "browserType.launch: Executable doesn't exist"

**Causa:** Browsers do Playwright não instalados.

**Solução:**
```bash
cd e2e
npm run install:browsers
```

---

### 3. "Timeout waiting for http://localhost:8000"

**Causa:** Backend não está rodando.

**Solução:**
```bash
# Em outro terminal
cd backend
source venv/bin/activate  # ou venv\Scripts\activate no Windows
uvicorn app.main:app --reload --port 8000
```

**Alternativa:** Desabilitar auto-start no `playwright.config.js`:
```javascript
webServer: [
  {
    // ...
    reuseExistingServer: true,  // Sempre reusar servidor existente
  }
]
```

---

### 4. "Timeout waiting for http://localhost:3000"

**Causa:** Frontend não está rodando.

**Solução:**
```bash
# Em outro terminal
cd frontend
npm run dev
```

---

### 5. "Test timeout of 60000ms exceeded"

**Causa:** Teste muito lento ou elemento não encontrado.

**Soluções:**

**A) Aumentar timeout do teste:**
```javascript
test('meu teste', async ({ page }) => {
  test.setTimeout(120000); // 2 minutos
  // ...
});
```

**B) Aguardar elemento específico:**
```javascript
await page.waitForSelector('[data-testid="elemento"]', { timeout: 15000 });
```

**C) Aguardar network idle:**
```javascript
await page.waitForLoadState('networkidle');
```

---

### 6. "Element not found: [data-testid='login-modal']"

**Causa:** data-testid não foi adicionado ou nome incorreto.

**Soluções:**

**A) Verificar que data-testid existe no componente:**
```jsx
// LoginModal.jsx deve ter:
<div data-testid="login-modal">
```

**B) Usar seletor alternativo temporariamente:**
```javascript
// Em vez de:
await page.locator('[data-testid="login-modal"]')

// Use:
await page.locator('text=Entrar no JFood')
```

**C) Debug com screenshot:**
```javascript
await page.screenshot({ path: 'debug.png', fullPage: true });
```

---

### 7. "Incorrect email or password"

**Causa:** Credenciais não existem no banco de dados.

**Solução:**

**A) Popular banco de dados:**
```bash
cd backend
python init_db.py
```

**B) Verificar credenciais em `fixtures/auth.fixture.js` correspondem ao `backend/init_db.py`

---

### 8. "Navigation timeout of 30000ms exceeded"

**Causa:** Página demora muito para carregar.

**Soluções:**

**A) Aumentar timeout de navegação:**
```javascript
await page.goto('/dashboard', { timeout: 60000 });
```

**B) Aguardar estratégia diferente:**
```javascript
await page.goto('/dashboard', { 
  waitUntil: 'domcontentloaded'  // Não aguardar tudo carregar
});
```

---

### 9. "Port 8000 is already in use"

**Causa:** Outra instância do backend rodando.

**Solução:**
```bash
# Encontrar e matar processo
lsof -ti:8000 | xargs kill -9

# Ou no Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

---

### 10. Testes passam localmente mas falham na CI

**Causas comuns:**
- Timing diferente
- Viewport diferente
- Dados de teste inconsistentes

**Soluções:**

**A) Usar waitFor em vez de timeout fixo:**
```javascript
// ❌ Não fazer
await page.waitForTimeout(2000);

// ✅ Fazer
await page.waitForSelector('[data-testid="elemento"]');
```

**B) Garantir dados de teste:**
```javascript
test.beforeEach(async ({ page }) => {
  // Setup via API
  await setupTestData();
});
```

---

## 🐛 Debug Avançado

### Modo UI (Recomendado)

```bash
npm run test:ui
```

Permite:
- Ver execução em tempo real
- Time travel debugging
- Inspecionar DOM
- Ver network requests

### Modo Debug

```bash
npm run test:debug
```

Abre DevTools automaticamente.

### Screenshot Manual

```javascript
test('debug test', async ({ page }) => {
  await page.goto('/');
  
  // Antes de ação problemática
  await page.screenshot({ path: 'antes.png' });
  
  // Ação
  await page.click('button');
  
  // Depois
  await page.screenshot({ path: 'depois.png' });
});
```

### Logs do Console

```javascript
test('ver console', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
  // Seu teste...
});
```

### Pausar Execução

```javascript
test('pausar', async ({ page }) => {
  await page.goto('/');
  
  await page.pause();  // Pausa aqui - inspecione manualmente
  
  // Continue o teste...
});
```

---

## 📊 Performance

### Testes muito lentos

**Causas:**
- Login via UI em todos os testes
- Muitos sleeps fixos
- Carregamento de dados desnecessário

**Soluções:**

**A) Login via API:**
```javascript
// ❌ Lento (3-5s)
await loginViaUI(page, user);

// ✅ Rápido (500ms)
await loginViaAPI(page, user);
```

**B) Remover sleeps:**
```javascript
// ❌ Lento e não confiável
await page.waitForTimeout(5000);

// ✅ Rápido e confiável
await page.waitForLoadState('networkidle');
```

**C) Executar em paralelo:**
```javascript
// playwright.config.js
fullyParallel: true,
workers: 4,
```

---

## 🔍 Diagnóstico Sistemático

### Checklist de Debug

1. **[ ]** Backend está rodando? (`http://localhost:8000/health`)
2. **[ ]** Frontend está rodando? (`http://localhost:3000`)
3. **[ ]** Banco de dados populado? (`cd backend && python init_db.py`)
4. **[ ]** Dependências instaladas? (`cd e2e && npm install`)
5. **[ ]** Browsers instalados? (`cd e2e && npm run install:browsers`)
6. **[ ]** data-testid existem nos componentes?
7. **[ ]** Credenciais corretas em `fixtures/auth.fixture.js`?
8. **[ ]** Timeouts adequados?

### Executar um teste isolado

```bash
# Executar apenas um arquivo
npx playwright test tests/auth/login.test.js

# Executar apenas um teste específico
npx playwright test tests/auth/login.test.js -g "deve fazer login como Provider"
```

### Ver trace completo

```bash
# Executar com trace
npx playwright test --trace on

# Ver trace
npx playwright show-trace test-results/.../trace.zip
```

---

## 🆘 Ainda com problemas?

1. **Verifique logs** em `test-results/`
2. **Execute em modo debug** (`npm run test:debug`)
3. **Tire screenshots** em pontos críticos
4. **Abra issue** com:
   - Comando executado
   - Erro completo
   - Screenshots
   - Versões (Node, Playwright, etc.)

---

## 📞 Contato

Para problemas persistentes:
- Abra issue no GitHub
- Inclua logs completos
- Descreva passos para reproduzir
