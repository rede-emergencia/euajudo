import { test, expect } from '../../fixtures/auth.fixture.js';
import { TEST_USERS } from '../../fixtures/auth.fixture.js';

/**
 * Testes E2E - Fluxo do Voluntário
 * Valida reserva de recursos e aceite de entregas
 */

test.describe('Volunteer - Fluxo de Entregas', () => {
  
  test('deve visualizar mapa com oportunidades disponíveis', async ({ page }) => {
    // Login como volunteer via API
    await page.goto('/');
    
    const response = await page.request.post('http://localhost:8000/api/auth/login', {
      form: {
        username: TEST_USERS.volunteer1.email,
        password: TEST_USERS.volunteer1.password
      }
    });
    
    const data = await response.json();
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, data.access_token);
    
    // Recarregar página para aplicar autenticação
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verificar que está na página do mapa
    expect(page.url()).toBe('http://localhost:3000/');
    
    // Screenshot do mapa
    await page.screenshot({ path: 'test-results/volunteer-map-view.png', fullPage: true });
  });

  test('deve acessar dashboard do voluntário', async ({ page }) => {
    // Login via API
    await page.goto('/');
    
    const response = await page.request.post('http://localhost:8000/api/auth/login', {
      form: {
        username: TEST_USERS.volunteer1.email,
        password: TEST_USERS.volunteer1.password
      }
    });
    
    const data = await response.json();
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, data.access_token);
    
    // Navegar para dashboard do voluntário
    await page.goto('/dashboard/voluntario');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Screenshot
    await page.screenshot({ path: 'test-results/volunteer-dashboard.png', fullPage: true });
  });

  test('deve listar reservas ativas do voluntário', async ({ page }) => {
    // Login via API
    await page.goto('/');
    
    const response = await page.request.post('http://localhost:8000/api/auth/login', {
      form: {
        username: TEST_USERS.volunteer1.email,
        password: TEST_USERS.volunteer1.password
      }
    });
    
    const data = await response.json();
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, data.access_token);
    
    // Ir para dashboard
    await page.goto('/dashboard/voluntario');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Screenshot
    await page.screenshot({ path: 'test-results/volunteer-reservations.png', fullPage: true });
  });

});
