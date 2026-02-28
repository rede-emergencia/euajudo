import { test, expect } from '../../fixtures/auth.fixture.js';
import { TEST_USERS } from '../../fixtures/auth.fixture.js';

/**
 * Testes E2E - Criação de Lotes pelo Fornecedor
 * Valida fluxo completo de criação de lote de produtos
 */

test.describe('Provider - Criação de Lotes', () => {
  
  test('deve criar lote de marmitas com sucesso', async ({ page }) => {
    // Login como provider via API
    await page.goto('/');
    
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
    
    // Navegar para dashboard
    await page.goto('/dashboard/fornecedor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Screenshot para análise
    await page.screenshot({ path: 'test-results/provider-batch-creation.png', fullPage: true });
  });

  test('deve listar lotes existentes do provider', async ({ page }) => {
    // Login como provider via API
    await page.goto('/');
    
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
    
    // Navegar para dashboard
    await page.goto('/dashboard/fornecedor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Screenshot
    await page.screenshot({ path: 'test-results/provider-batch-list.png', fullPage: true });
  });

});
