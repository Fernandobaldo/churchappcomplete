import { test, expect } from '@playwright/test'

test.describe('Admin Login Flow - E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login')
  })

  test('deve fazer login e redirecionar para dashboard', async ({ page }) => {
    // Mock da API de login
    await page.route('**/admin/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-token',
          admin: {
            id: '1',
            name: 'Admin Test',
            email: 'admin@test.com',
            adminRole: 'SUPERADMIN',
            isActive: true,
          },
        }),
      })
    })

    // Preenche formulário
    await page.fill('[data-testid="admin-login-email"]', 'admin@test.com')
    await page.fill('[data-testid="admin-login-password"]', 'password123')
    await page.click('[data-testid="admin-login-submit"]')

    // Verifica redirecionamento
    await expect(page).toHaveURL(/.*\/admin\/dashboard/)
  })

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    // Mock da API de login com erro
    await page.route('**/admin/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Credenciais inválidas',
        }),
      })
    })

    // Preenche formulário
    await page.fill('[data-testid="admin-login-email"]', 'wrong@test.com')
    await page.fill('[data-testid="admin-login-password"]', 'wrong')
    await page.click('[data-testid="admin-login-submit"]')

    // Verifica mensagem de erro
    await expect(page.locator('text=Credenciais inválidas')).toBeVisible()
  })
})

