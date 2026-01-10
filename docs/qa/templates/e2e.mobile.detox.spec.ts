/**
 * Template: E2E Test - Mobile (Detox)
 * 
 * Padrão Obrigatório: Mínimo de 5 cenários críticos não sobrepostos
 * + 1 por novo fluxo crítico
 * 
 * Estrutura:
 * - Given/When/Then (comentários)
 * - Device automation real
 * - App deve estar buildado para testes
 * 
 * Localização: mobile/e2e/[flow].spec.ts (quando configurado)
 * 
 * ⚠️ STATUS: NÃO CONFIGURADO NO PROJETO
 * 
 * Para configurar Detox:
 * 1. Instalar: npm install -D detox
 * 2. Configurar detox.config.js
 * 3. Build app para testes: detox build
 * 4. Executar: detox test
 * 
 * Referência: mobile/e2e/README.md (planejamento)
 * 
 * Este template é um placeholder até Detox ser configurado.
 */

// TODO: Configurar Detox antes de usar este template
// import { device, expect, element, by, waitFor } from 'detox'

describe('E2E: [Flow Name] - Mobile (Detox)', () => {
  beforeAll(async () => {
    // Setup: Launch app
    // await device.launchApp()
  })

  beforeEach(async () => {
    // Reset app state antes de cada teste
    // await device.reloadReactNative()
  })

  // ============================================================================
  // CENÁRIO 1: FLUXO PRINCIPAL HAPPY PATH - Inclui negativo
  // ============================================================================
  // TODO: Implementar quando Detox estiver configurado
  it('deve completar [fluxo principal] com sucesso', async () => {
    // Given - Estado inicial
    // await expect(element(by.id('login-screen'))).toBeVisible()

    // When - Execução do fluxo completo
    // Passo 1: Login
    // await element(by.id('email-input')).typeText('user@example.com')
    // await element(by.id('password-input')).typeText('password123')
    // await element(by.id('login-button')).tap()

    // Passo 2: Aguardar navegação
    // await waitFor(element(by.id('dashboard-screen')))
    //   .toBeVisible()
    //   .withTimeout(5000)

    // Passo 3: Ações no fluxo
    // await element(by.id('action-button')).tap()
    // await element(by.id('field-input')).typeText('Test Value')
    // await element(by.id('submit-button')).tap()

    // Then - Verificações finais
    // await expect(element(by.id('success-message'))).toBeVisible()
  })

  // Negativo incluído no cenário 1: Campo obrigatório
  it('deve mostrar erro se campo obrigatório não preenchido', async () => {
    // Given - Tela com formulário
    // await expect(element(by.id('form-screen'))).toBeVisible()

    // When - Tentar submeter sem preencher campo obrigatório
    // await element(by.id('submit-button')).tap()

    // Then - Deve mostrar erro
    // await expect(element(by.text('Campo obrigatório'))).toBeVisible()
  })

  // ============================================================================
  // CENÁRIO 2: RESUMO/RETRY DE FLUXO - Inclui negativo
  // ============================================================================
  // TODO: Implementar quando Detox estiver configurado
  it('deve resumir [fluxo] se [estado PENDING/interrompido]', async () => {
    // Given - Estado PENDING
    // Quando app retoma após fechar, deve mostrar dados salvos

    // When - Retomar fluxo
    // await element(by.id('resume-button')).tap()

    // Then - Deve preencher dados e continuar
    // await expect(element(by.id('field-input'))).toHaveText('Valor Existente')
  })

  // Negativo: Bloqueio de duplicação
  it('deve bloquear [ação duplicada] se [condição] já existe', async () => {
    // Given - Estado que já possui entidade
    // When - Tentar criar duplicata
    // Then - Deve bloquear
  })

  // ============================================================================
  // CENÁRIO 3: IDEMPOTÊNCIA
  // ============================================================================
  // TODO: Implementar quando Detox estiver configurado
  it('deve ser idempotente: duplo submit não cria duplicatas', async () => {
    // Given - Formulário preenchido
    // When - Submeter múltiplas vezes
    // Then - Deve criar apenas uma entidade
  })

  // ============================================================================
  // CENÁRIO 4: VALIDAÇÃO DE REGRA DE NEGÓCIO
  // ============================================================================
  // TODO: Implementar quando Detox estiver configurado
  it('deve validar [regra de negócio] e mostrar erro apropriado', async () => {
    // Given - Estado que viola regra
    // When - Tentar ação
    // Then - Deve mostrar erro
  })

  // ============================================================================
  // CENÁRIO 5: TRATAMENTO DE ERRO CRÍTICO
  // ============================================================================
  // TODO: Implementar quando Detox estiver configurado
  it('deve fazer logout e reset em caso de 401 (token inválido)', async () => {
    // Given - Usuário autenticado
    // When - Token expira
    // Then - Deve fazer logout e redirecionar
  })
})

/**
 * ⚠️ CONFIGURAÇÃO NECESSÁRIA ANTES DE USAR:
 * 
 * 1. Instalar Detox:
 *    npm install -D detox
 * 
 * 2. Criar detox.config.js na raiz do mobile/
 *    Exemplo:
 *    module.exports = {
 *      testRunner: 'jest',
 *      runnerConfig: 'e2e/config.json',
 *      apps: {
 *        'ios.debug': {
 *          type: 'ios.app',
 *          binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/ChurchApp.app',
 *          build: 'xcodebuild -workspace ios/ChurchApp.xcworkspace -scheme ChurchApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
 *        },
 *        'android.debug': {
 *          type: 'android.apk',
 *          binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
 *          build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
 *        },
 *      },
 *      devices: {
 *        simulator: {
 *          type: 'ios.simulator',
 *          device: { type: 'iPhone 13' },
 *        },
 *        emulator: {
 *          type: 'android.emulator',
 *          device: { avdName: 'Pixel_3a_API_30_x86' },
 *        },
 *      },
 *      configurations: {
 *        'ios.sim.debug': {
 *          device: 'simulator',
 *          app: 'ios.debug',
 *        },
 *        'android.emu.debug': {
 *          device: 'emulator',
 *          app: 'android.debug',
 *        },
 *      },
 *    }
 * 
 * 3. Criar e2e/config.json:
 *    {
 *      "setupFilesAfterEnv": ["./init.js"],
 *      "testEnvironment": "node",
 *      "testMatch": ["**/*.spec.ts"],
 *      "testTimeout": 120000
 *    }
 * 
 * 4. Criar e2e/init.js:
 *    // Configurações iniciais do Detox
 * 
 * 5. Build app para testes:
 *    detox build --configuration ios.sim.debug
 *    # ou
 *    detox build --configuration android.emu.debug
 * 
 * 6. Executar testes:
 *    detox test --configuration ios.sim.debug
 *    # ou
 *    detox test --configuration android.emu.debug
 * 
 * Referências:
 * - https://github.com/wix/Detox
 * - mobile/e2e/README.md (planejamento)
 * 
 * CHECKLIST ANTES DE USAR:
 * 
 * ✅ Configuração:
 * [ ] Detox instalado
 * [ ] detox.config.js configurado
 * [ ] e2e/config.json criado
 * [ ] e2e/init.js criado
 * [ ] App buildado para testes
 * 
 * ✅ Estrutura:
 * [ ] Arquivo está em mobile/e2e/
 * [ ] Nome segue padrão: [flow].spec.ts
 * [ ] Usa Detox API corretamente
 * 
 * ✅ Conteúdo:
 * [ ] Mínimo 5 cenários críticos implementados
 * [ ] Padrão Given/When/Then em todos os testes
 * [ ] Usa testIDs estáveis
 */

