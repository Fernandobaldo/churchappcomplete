import { test, expect } from '@playwright/test'

test.describe('Admin Dashboard - E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock autenticação
    await page.addInitScript(() => {
      localStorage.setItem(
        'admin-auth-storage',
        JSON.stringify({
          state: {
            adminUser: {
              id: '1',
              name: 'Admin',
              email: 'admin@test.com',
              adminRole: 'SUPERADMIN',
              isActive: true,
            },
            token: 'mock-token',
            isAuthenticated: true,
          },
        })
      )
    })

    // Mock API de dashboard
    await page.route('**/admin/dashboard/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalUsers: 100,
          totalChurches: 50,
          totalMembers: 500,
          totalBranches: 75,
          newUsersLast30Days: 10,
          newChurchesLast30Days: 5,
        }),
      })
    })

    await page.goto('/admin/dashboard')
  })

  test('deve exibir estatísticas do dashboard', async ({ page }) => {
    await expect(page.locator('[data-testid="dashboard-stat-users"]')).toBeVisible()
    await expect(page.locator('[data-testid="dashboard-stat-churches"]')).toBeVisible()
    await expect(page.locator('[data-testid="dashboard-stat-members"]')).toBeVisible()
  })

  test('deve navegar para página de usuários', async ({ page }) => {
    await page.click('text=Usuários')
    await expect(page).toHaveURL(/.*\/admin\/users/)
  })
})

