/**
 * Template: E2E Test - Web-Admin (Playwright)
 * 
 * Padrão Obrigatório: Mínimo de 5 cenários críticos não sobrepostos
 * + 1 por novo fluxo crítico
 * 
 * Estrutura:
 * - Given/When/Then (comentários)
 * - Browser automation real
 * - Backend deve estar rodando
 * 
 * Localização: web-admin/src/__tests__/e2e/[flow].spec.ts
 * Exemplo: web-admin/src/__tests__/e2e/admin-login-flow.spec.ts
 * 
 * Pré-requisitos:
 * - Backend rodando (npm run dev no web-admin)
 * - Playwright instalado (@playwright/test)
 * - Executar: npm run test:admin:e2e
 */

import { test, expect } from '@playwright/test'

test.describe('E2E: [Flow Name]', () => {
  // Setup antes de todos os testes
  test.beforeAll(async () => {
    // Opcional: Setup global se necessário
    // Exemplo: Criar usuário de teste no backend
  })

  // Limpeza após todos os testes
  test.afterAll(async () => {
    // Opcional: Limpeza global se necessário
    // Exemplo: Deletar dados de teste
  })

  // ============================================================================
  // CENÁRIO 1: FLUXO PRINCIPAL HAPPY PATH - Inclui negativo
  // ============================================================================
  test('deve completar [fluxo principal] com sucesso', async ({ page }) => {
    // Given - Estado inicial do sistema
    await page.goto('/login')
    await expect(page).toHaveURL(/.*login/)

    // When - Execução do fluxo completo
    // Passo 1: Login
    await page.fill('[name="email"]', 'admin@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Passo 2: Aguardar redirecionamento
    await page.waitForURL(/.*dashboard/)

    // Passo 3: Ações no dashboard/fluxo
    await page.click('[data-testid="action-button"]')
    await page.fill('[name="field"]', 'Test Value')
    await page.click('button[type="submit"]')

    // Then - Verificações finais
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('text=Operação realizada com sucesso')).toBeVisible()
  })

  // Negativo incluído no cenário 1: Campo obrigatório
  test('deve mostrar erro se campo obrigatório não preenchido', async ({ page }) => {
    // Given - Estado inicial
    await page.goto('/[page-with-form]')
    // Usuário já autenticado (ou fazer login antes)

    // When - Tentar submeter sem preencher campo obrigatório
    await page.click('button[type="submit"]')

    // Then - Deve mostrar erro de validação
    await expect(page.locator('text=Campo obrigatório')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
  })

  // ============================================================================
  // CENÁRIO 2: RESUMO/RETRY DE FLUXO - Inclui negativo
  // ============================================================================
  test('deve resumir [fluxo] se [estado PENDING/interrompido]', async ({ page }) => {
    // Given - Estado PENDING/interrompido
    // Exemplo: Onboarding abandonado, dados parcialmente preenchidos
    await page.goto('/onboarding')
    // Simular que já existe progresso parcial no backend

    // When - Retomar fluxo
    await page.waitForSelector('[data-testid="resume-button"]')
    await page.click('[data-testid="resume-button"]')

    // Then - Deve preencher dados existentes e continuar
    await expect(page.locator('[name="churchName"]')).toHaveValue('Igreja Existente')
    await expect(page).toHaveURL(/.*onboarding\/step-2/) // Continuar de onde parou
  })

  // Negativo incluído no cenário 2: Bloqueio de duplicação
  test('deve bloquear [ação duplicada] se [condição] já existe', async ({ page }) => {
    // Given - Estado que já possui [entidade]
    await page.goto('/[page]')
    // Usuário já possui igreja, por exemplo

    // When - Tentar criar duplicata
    await page.click('[data-testid="create-button"]')

    // Then - Deve bloquear e mostrar mensagem
    await expect(page.locator('text=Usuário já possui uma igreja')).toBeVisible()
    await expect(page.locator('[data-testid="create-button"]')).toBeDisabled()
  })

  // ============================================================================
  // CENÁRIO 3: IDEMPOTÊNCIA - Inclui negativo
  // ============================================================================
  test('deve ser idempotente: duplo submit não cria duplicatas', async ({ page }) => {
    // Given - Formulário preenchido
    await page.goto('/[form-page]')
    await page.fill('[name="field1"]', 'Value 1')
    await page.fill('[name="field2"]', 'Value 2')

    // When - Submeter múltiplas vezes rapidamente
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()
    await submitButton.click() // Segunda submissão rápida

    // Then - Deve criar apenas uma entidade
    await expect(page.locator('text=Criado com sucesso')).toBeVisible({ timeout: 5000 })
    
    // Verificar que não há duplicatas (contar elementos na lista, etc.)
    const items = await page.locator('[data-testid="list-item"]').count()
    expect(items).toBe(1)
  })

  // ============================================================================
  // CENÁRIO 4: VALIDAÇÃO DE REGRA DE NEGÓCIO
  // ============================================================================
  test('deve validar [regra de negócio] e mostrar erro apropriado', async ({ page }) => {
    // Given - Estado que viola regra de negócio
    // Exemplos:
    // - Expired invite (end-of-day)
    // - MaxMembers do plano excedido
    // - MaxBranches do plano excedido
    await page.goto('/[page-with-validation]')

    // When - Tentar ação que viola regra
    await page.fill('[name="members"]', '1000') // Exceder limite do plano
    await page.click('button[type="submit"]')

    // Then - Deve mostrar erro de regra de negócio
    await expect(page.locator('text=Limite de membros do plano excedido')).toBeVisible()
    await expect(page.locator('[data-testid="error-422"]')).toBeVisible()
  })

  // ============================================================================
  // CENÁRIO 5: TRATAMENTO DE ERRO CRÍTICO
  // ============================================================================
  test('deve fazer logout e reset em caso de 401 (token inválido)', async ({ page }) => {
    // Given - Usuário autenticado
    await page.goto('/login')
    await page.fill('[name="email"]', 'user@example.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL(/.*dashboard/)

    // When - Token expira ou se torna inválido
    // Simular expiração: fazer requisição que retorna 401
    // Ou: manipular cookie/token diretamente se possível
    await page.evaluate(() => {
      // Simular token inválido (se aplicável)
      localStorage.removeItem('token')
    })
    
    // Tentar ação que requer autenticação
    await page.reload()
    // Ou fazer ação que dispara requisição autenticada

    // Then - Deve fazer logout e redirecionar para login
    await expect(page).toHaveURL(/.*login/)
    await expect(page.locator('text=Faça login novamente')).toBeVisible()
    
    // Verificar que não pode acessar telas protegidas
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/.*login/) // Redirecionado de volta
  })

  // ============================================================================
  // CENÁRIOS ADICIONAIS - Para novos fluxos críticos
  // ============================================================================

  // Exemplo: Fluxo de convite
  // test('deve permitir cadastro via invite link válido', async ({ page }) => {
  //   // Given - Invite link válido
  //   await page.goto('/register?invite=valid-invite-code')
  //
  //   // When - Preencher formulário e registrar
  //   await page.fill('[name="name"]', 'Novo Usuário')
  //   await page.fill('[name="email"]', 'newuser@example.com')
  //   await page.fill('[name="password"]', 'password123')
  //   await page.click('button[type="submit"]')
  //
  //   // Then - Deve registrar e redirecionar
  //   await expect(page).toHaveURL(/.*onboarding/)
  // })
})

/**
 * CHECKLIST ANTES DE COMMITAR:
 * 
 * ✅ Estrutura:
 * [ ] Arquivo está em web-admin/src/__tests__/e2e/
 * [ ] Nome segue padrão: [flow].spec.ts (Playwright usa .spec.ts)
 * [ ] Usa Playwright test API corretamente
 * 
 * ✅ Conteúdo:
 * [ ] Mínimo 5 cenários críticos implementados
 * [ ] Inclui negativos em cenários relevantes
 * [ ] Padrão Given/When/Then em todos os testes
 * [ ] Usa seletores estáveis (data-testid preferencialmente)
 * 
 * ✅ Nomenclatura:
 * [ ] Nomes seguem padrão: "deve [comportamento esperado]"
 * [ ] Cenários negativos claramente identificados
 * 
 * ✅ Validações:
 * [ ] Valida URLs após navegação
 * [ ] Valida elementos visíveis/enabled
 * [ ] Valida mensagens de sucesso/erro
 * [ ] Valida idempotência quando aplicável
 * [ ] Valida tratamento de erros críticos
 * 
 * ✅ Execução:
 * [ ] Backend está rodando ao executar testes
 * [ ] Testes podem ser executados independentemente
 * [ ] Timeouts adequados para operações assíncronas
 * 
 * ✅ Seletores:
 * [ ] Usa data-testid quando possível
 * [ ] Seletores são estáveis (não dependem de texto/estilo)
 * [ ] Aguarda elementos antes de interagir
 */

