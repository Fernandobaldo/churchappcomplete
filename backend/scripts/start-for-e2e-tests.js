// scripts/start-for-e2e-tests.js
// Script para iniciar o backend em modo de teste (usando .env.test)
// Isso garante que os testes E2E do frontend usem o banco de teste

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Força o uso do .env.test para testes E2E
console.log('[E2E Backend] 🧪 Iniciando backend em modo de teste E2E...')
console.log('[E2E Backend] 📁 Carregando variáveis de ambiente de .env.test...')

// Carrega .env.test
const envTestPath = join(__dirname, '../.env.test')
const envTest = dotenv.config({ path: envTestPath })

if (envTest.error) {
  console.error('[E2E Backend] ❌ Erro ao carregar .env.test:', envTest.error.message)
  console.error('[E2E Backend] ❌ Certifique-se de que o arquivo backend/.env.test existe')
  process.exit(1)
}

// Verifica se DATABASE_URL está configurada
if (!process.env.DATABASE_URL) {
  console.error('[E2E Backend] ❌ DATABASE_URL não encontrada no .env.test')
  console.error('[E2E Backend] ❌ Configure a DATABASE_URL no arquivo backend/.env.test')
  process.exit(1)
}

// Verifica se está usando banco de teste
const dbUrl = process.env.DATABASE_URL
const isTestDb = dbUrl.includes('churchapp_test') || dbUrl.includes('_test')

if (!isTestDb) {
  console.warn('[E2E Backend] ⚠️ ATENÇÃO: DATABASE_URL não parece ser um banco de teste!')
  console.warn('[E2E Backend] ⚠️ URL:', dbUrl.substring(0, 50) + '...')
  console.warn('[E2E Backend] ⚠️ Certifique-se de que está usando o banco de teste')
}

console.log('[E2E Backend] ✅ Variáveis de ambiente carregadas do .env.test')
console.log('[E2E Backend] ✅ DATABASE_URL configurada:', isTestDb ? 'BANCO DE TESTE ✅' : 'OUTRO ⚠️')
console.log('[E2E Backend] 🚀 Iniciando servidor...')
console.log('')

// Marca como ambiente de teste E2E
process.env.NODE_ENV = 'test'
process.env.E2E_TEST = 'true'

// Importa e inicia o servidor
import('../src/server.js').catch((error) => {
  console.error('[E2E Backend] ❌ Erro ao iniciar servidor:', error)
  process.exit(1)
})


