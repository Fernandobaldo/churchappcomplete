// tests/setupTestEnv.ts
import dotenv from 'dotenv'
import { execSync } from 'child_process'

// Carrega o ambiente correto
dotenv.config({ path: '.env.test' })

console.log('[TEST] Ambiente de testes carregado:', process.env.DATABASE_URL)

// Aplica as migrations e reseta o banco
try {
  console.log('[TEST] Resetando banco de dados de teste...')
  execSync('npx prisma migrate reset --force --skip-seed --schema=prisma/schema.prisma', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
  })
} catch (err) {
  console.error('Erro ao resetar banco:', err)
  process.exit(1)
}
