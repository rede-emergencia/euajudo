import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração Playwright para testes E2E do EuAjudo
 * Framework robusto para validar fluxos críticos
 */
export default defineConfig({
  testDir: './tests',
  
  // Timeout configurações
  timeout: 60 * 1000, // 60s por teste
  expect: {
    timeout: 10 * 1000, // 10s para assertions
  },

  // Executar testes em paralelo
  fullyParallel: false, // Sequencial para evitar conflitos de dados
  workers: 1, // Um worker por vez
  
  // Retry em caso de falha
  retries: process.env.CI ? 2 : 1,
  
  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list']
  ],

  use: {
    // Base URL
    baseURL: 'http://localhost:3000',
    
    // Configurações de trace para debug
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Navegação
    navigationTimeout: 30 * 1000,
    actionTimeout: 15 * 1000,
  },

  // Projetos de teste (browsers)
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },
    // Descomente para testar em mais browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Web Server - inicia frontend e backend automaticamente
  webServer: [
    {
      command: 'cd ../backend && source venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000',
      port: 8000,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd ../frontend && npm run dev',
      port: 3000,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
