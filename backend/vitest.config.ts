import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['./tests/setupTestEnv.ts'],
    // Garante que os testes rodem sequencialmente para evitar problemas de isolamento
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Usa um único processo para todos os testes
      },
    },
    // Timeout maior para testes de integração
    testTimeout: 10000,
  },
})
