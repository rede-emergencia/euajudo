import { test, expect } from '../../fixtures/auth.fixture.js';
import { TEST_USERS } from '../../fixtures/auth.fixture.js';

/**
 * Testes E2E - Fluxo do Abrigo
 * Valida recebimento de entregas e confirmações
 */

test.describe('Shelter - Recebimento de Entregas', () => {
  
  test('deve acessar dashboard do abrigo', async ({ page }) => {
    // Login como shelter via API
    await page.goto('/');
    
    const response = await page.request.post('http://localhost:8000/api/auth/login', {
      form: {
        username: TEST_USERS.shelter1.email,
        password: TEST_USERS.shelter1.password
      }
    });
    
    const data = await response.json();
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, data.access_token);
    
    // Navegar para dashboard do abrigo
    await page.goto('/dashboard/abrigo');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Screenshot
    await page.screenshot({ path: 'test-results/shelter-dashboard.png', fullPage: true });
  });

  test('deve visualizar entregas pendentes', async ({ page }) => {
    // Login via API
    await page.goto('/');
    
    const response = await page.request.post('http://localhost:8000/api/auth/login', {
      form: {
        username: TEST_USERS.shelter1.email,
        password: TEST_USERS.shelter1.password
      }
    });
    
    const data = await response.json();
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, data.access_token);
    
    // Ir para dashboard
    await page.goto('/dashboard/abrigo');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Screenshot
    await page.screenshot({ path: 'test-results/shelter-pending-deliveries.png', fullPage: true });
  });

});
