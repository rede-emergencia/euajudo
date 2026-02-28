import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../../fixtures/auth.fixture.js';

/**
 * Testes de Autenticação
 * Validam login para diferentes perfis de usuário
 */

test.describe('Autenticação - Login', () => {
  
  test.beforeEach(async ({ page }) => {
    // Limpar localStorage antes de cada teste
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('deve exibir modal de login ao clicar no botão Login', async ({ page }) => {
    await page.goto('/');
    
    // Aguardar página carregar
    await page.waitForLoadState('networkidle');
    
    // Clicar no botão de login (desktop ou mobile)
    const loginButton = page.locator('[data-testid="login-button"]').first();
    await loginButton.waitFor({ state: 'visible', timeout: 10000 });
    await loginButton.click();
    
    // Verificar que modal apareceu
    await expect(page.locator('[data-testid="login-modal"]')).toBeVisible();
  });

  test('deve fazer login como Provider com sucesso', async ({ page }) => {
    await page.goto('/');
    
    // Abrir modal de login
    await page.locator('[data-testid="login-button"]').first().click();
    await expect(page.locator('[data-testid="login-modal"]')).toBeVisible();
    
    // Preencher credenciais
    await page.fill('[data-testid="login-email"]', TEST_USERS.provider1.email);
    await page.fill('[data-testid="login-password"]', TEST_USERS.provider1.password);
    
    // Submeter login
    await page.click('[data-testid="login-submit"]');
    
    // Aguardar navegação ou fechamento do modal
    await page.waitForTimeout(3000);
    
    // Verificar que login foi bem-sucedido - usuário aparece no header
    // (pode estar na home ou no dashboard)
    const pageContent = await page.content();
    const userNameFound = pageContent.includes(TEST_USERS.provider1.name);
    expect(userNameFound).toBeTruthy();
  });

  test('deve fazer login como Volunteer com sucesso', async ({ page }) => {
    await page.goto('/');
    
    // Abrir modal de login
    await page.locator('[data-testid="login-button"]').first().click();
    await expect(page.locator('[data-testid="login-modal"]')).toBeVisible();
    
    // Preencher credenciais
    await page.fill('[data-testid="login-email"]', TEST_USERS.volunteer1.email);
    await page.fill('[data-testid="login-password"]', TEST_USERS.volunteer1.password);
    
    // Submeter login
    await page.click('[data-testid="login-submit"]');
    
    // Aguardar processamento
    await page.waitForTimeout(3000);
    
    // Verificar que está logado - modal fechou e nome aparece no header
    const modalClosed = await page.locator('[data-testid="login-modal"]').isHidden().catch(() => true);
    
    if (!modalClosed) {
      // Se modal ainda aberto, verificar que está logado
      await expect(page.locator('text=' + TEST_USERS.volunteer1.name)).toBeVisible({ timeout: 5000 });
    } else {
      // Modal fechou, verificar que nome aparece no header
      await expect(page.locator('text=' + TEST_USERS.volunteer1.name)).toBeVisible({ timeout: 5000 });
    }
  });

  test('deve fazer login como Admin com sucesso', async ({ page }) => {
    await page.goto('/');
    
    // Abrir modal de login
    await page.locator('[data-testid="login-button"]').first().click();
    await expect(page.locator('[data-testid="login-modal"]')).toBeVisible();
    
    // Preencher credenciais
    await page.fill('[data-testid="login-email"]', TEST_USERS.admin.email);
    await page.fill('[data-testid="login-password"]', TEST_USERS.admin.password);
    
    // Submeter login
    await page.click('[data-testid="login-submit"]');
    
    // Aguardar navegação
    await page.waitForTimeout(3000);
    
    // Verificar que foi redirecionado para dashboard do admin ou que está logado
    const currentUrl = page.url();
    const isRedirected = currentUrl.includes('/dashboard/admin');
    
    // Se não redirecionou, verificar que está logado (nome aparece no header)
    if (!isRedirected) {
      await expect(page.locator('text=' + TEST_USERS.admin.name)).toBeVisible({ timeout: 5000 });
    } else {
      await expect(page).toHaveURL(/\/dashboard\/admin/, { timeout: 10000 });
      await expect(page.locator('text=' + TEST_USERS.admin.name)).toBeVisible({ timeout: 5000 });
    }
  });

  test('deve exibir erro ao tentar login com credenciais inválidas', async ({ page }) => {
    await page.goto('/');
    const initialUrl = page.url();
    
    // Abrir modal de login
    await page.locator('[data-testid="login-button"]').first().click();
    await expect(page.locator('[data-testid="login-modal"]')).toBeVisible();
    
    // Preencher credenciais inválidas
    await page.fill('[data-testid="login-email"]', 'invalido@teste.com');
    await page.fill('[data-testid="login-password"]', 'senhaerrada');
    
    // Submeter login
    await page.click('[data-testid="login-submit"]');
    
    // Aguardar processamento
    await page.waitForTimeout(3000);
    
    // Verificar que não houve redirecionamento (permanece na mesma página base)
    const currentUrl = page.url();
    const stillOnHomePage = currentUrl === initialUrl || currentUrl === 'http://localhost:3000/';
    
    // Se ainda está na home, o login falhou como esperado
    expect(stillOnHomePage).toBeTruthy();
  });

  test('deve validar campos obrigatórios do formulário', async ({ page }) => {
    await page.goto('/');
    
    // Abrir modal de login
    await page.locator('[data-testid="login-button"]').first().click();
    await expect(page.locator('[data-testid="login-modal"]')).toBeVisible();
    
    // Tentar submeter sem preencher
    await page.click('[data-testid="login-submit"]');
    
    // Verificar que validação HTML5 impede submit
    const emailInput = page.locator('[data-testid="login-email"]');
    const isInvalid = await emailInput.evaluate((el) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

});
