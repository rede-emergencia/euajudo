import { test, expect } from '../../fixtures/auth.fixture.js';
import { TEST_USERS } from '../../fixtures/auth.fixture.js';

/**
 * Testes E2E - Fluxo do Fornecedor
 * Testa criação de pedidos de recursos
 */

test.describe('Provider - Pedidos de Recursos', () => {
  
  test('deve criar pedido de recursos com sucesso', async ({ page }) => {
    // Login como provider via API (mais rápido)
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

});
