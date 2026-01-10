/**
 * E2E Test: Login Flow - Web (Playwright)
 * 
 * Browser automation test for login functionality.
 * 
 * This test requires:
 * - Backend running on port 3333 (can be test database)
 * - Web app running on port 3000 (started automatically by Playwright)
 */

import { test, expect } from '@playwright/test'

test.describe('Login Flow - E2E (Playwright)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')
  })

  test('deve fazer login com credenciais válidas e redirecionar', async ({ page }) => {
    // Given - Login page is loaded
    await expect(page).toHaveURL(/.*\/login/)
    
    // When - Fill login form and submit
    await page.fill('[data-testid="login-email-input"]', 'test@example.com')
    await page.fill('[data-testid="login-password-input"]', 'password123')
    await page.click('[data-testid="login-submit-button"]')

    // Then - Should redirect to dashboard or onboarding
    // Wait for navigation (either dashboard if onboarding complete, or onboarding start)
    await page.waitForURL(/\/(app\/dashboard|onboarding\/start)/, { timeout: 5000 })
    
    // Verify we're not on login page anymore
    await expect(page).not.toHaveURL(/.*\/login/)
  })

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    // Given - Login page is loaded
    
    // When - Fill form with invalid credentials and submit
    await page.fill('[data-testid="login-email-input"]', 'invalid@example.com')
    await page.fill('[data-testid="login-password-input"]', 'wrongpassword')
    await page.click('[data-testid="login-submit-button"]')

    // Then - Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 5000 })
    // Should still be on login page
    await expect(page).toHaveURL(/.*\/login/)
  })

  test('deve validar campos obrigatórios', async ({ page }) => {
    // Given - Login page is loaded
    
    // When - Try to submit without filling fields
    await page.click('[data-testid="login-submit-button"]')

    // Then - Should show validation error
    // Note: Depending on HTML5 validation or custom validation
    // This may vary - adjust based on actual implementation
    const emailInput = page.locator('[data-testid="login-email-input"]')
    const passwordInput = page.locator('[data-testid="login-password-input"]')
    
    // Check if fields are marked as invalid or error message appears
    const isEmailInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
    const isPasswordInvalid = await passwordInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
    
    expect(isEmailInvalid || isPasswordInvalid).toBeTruthy()
  })
})

