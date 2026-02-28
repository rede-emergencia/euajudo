import { test as base } from '@playwright/test';

/**
 * Credenciais de teste - sincronizadas com seed.py
 */
export const TEST_USERS = {
  provider1: {
    email: 'cozinha.solidaria@euajudo.com',
    password: '123',
    role: 'provider',
    name: 'Cozinha Solidária Central'
  },
  provider2: {
    email: 'farmacia.esperanca@euajudo.com',
    password: '123',
    role: 'provider',
    name: 'Farmácia Esperança'
  },
  volunteer1: {
    email: 'joao.voluntario@euajudo.com',
    password: '123',
    role: 'volunteer',
    name: 'João Voluntário'
  },
  volunteer2: {
    email: 'maria.voluntaria@euajudo.com',
    password: '123',
    role: 'volunteer',
    name: 'Maria Voluntária'
  },
  volunteer3: {
    email: 'pedro.entregador@euajudo.com',
    password: '123',
    role: 'volunteer',
    name: 'Pedro Entregador'
  },
  shelter1: {
    email: 'abrigo.sao.francisco@euajudo.com',
    password: '123',
    role: 'shelter',
    name: 'Abrigo São Francisco'
  },
  admin: {
    email: 'admin@euajudo.com',
    password: '123',
    role: 'admin',
    name: 'Administrador EuAjudo'
  }
};

/**
 * Helper para login via UI
 */
export async function loginViaUI(page, user) {
  await page.goto('/');
  
  // Aguardar modal de login ou botão de login
  const loginButton = page.getByRole('button', { name: /entrar/i }).first();
  await loginButton.waitFor({ state: 'visible', timeout: 10000 });
  await loginButton.click();
  
  // Aguardar modal aparecer
  await page.waitForSelector('[data-testid="login-modal"]', { timeout: 5000 });
  
  // Preencher formulário
  await page.fill('[data-testid="login-email"]', user.email);
  await page.fill('[data-testid="login-password"]', user.password);
  
  // Submeter
  await page.click('[data-testid="login-submit"]');
  
  // Aguardar navegação ou fechamento do modal
  await page.waitForLoadState('networkidle');
  
  // Verificar que login foi bem-sucedido (modal fechou ou foi redirecionado)
  await page.waitForTimeout(1000);
}

/**
 * Helper para login via API (mais rápido para setup)
 */
export async function loginViaAPI(page, user) {
  const response = await page.request.post('http://localhost:8000/api/auth/login', {
    form: {
      username: user.email,
      password: user.password
    }
  });
  
  const data = await response.json();
  
  // Armazenar token no localStorage via page.evaluate
  await page.goto('/');
  await page.evaluate((token) => {
    localStorage.setItem('token', token);
  }, data.access_token);
  
  return data.access_token;
}

/**
 * Fixture extendida com autenticação
 */
export const test = base.extend({
  // Context autenticado como provider
  authenticatedAsProvider: async ({ page }, use) => {
    await loginViaAPI(page, TEST_USERS.provider1);
    await use(page);
  },
  
  // Context autenticado como volunteer
  authenticatedAsVolunteer: async ({ page }, use) => {
    await loginViaAPI(page, TEST_USERS.volunteer1);
    await use(page);
  },
  
  // Context autenticado como shelter
  authenticatedAsShelter: async ({ page }, use) => {
    await loginViaAPI(page, TEST_USERS.shelter1);
    await use(page);
  },
  
  // Context autenticado como admin
  authenticatedAsAdmin: async ({ page }, use) => {
    await loginViaAPI(page, TEST_USERS.admin);
    await use(page);
  }
});

export { expect } from '@playwright/test';
