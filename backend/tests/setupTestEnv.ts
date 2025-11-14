// tests/setupTestEnv.ts
import dotenv from 'dotenv'
import { execSync } from 'child_process'

// Carrega o ambiente correto
dotenv.config({ path: '.env.test' })

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.warn('[TEST] ⚠️  DATABASE_URL não encontrada no .env.test')
  console.warn('[TEST] ⚠️  Os testes podem falhar. Configure a DATABASE_URL no arquivo .env.test')
} else {
  console.log('[TEST] Ambiente de testes carregado')
}

// Sincroniza o schema com o banco de teste apenas uma vez
// Usa uma flag global para evitar múltiplas execuções
const globalForSetup = globalThis as unknown as {
  testDbInitialized?: boolean;
};

if (!globalForSetup.testDbInitialized) {
  try {
    if (databaseUrl) {
      console.log('[TEST] Sincronizando banco de dados de teste com o schema (primeira vez)...')
      // Remove aspas se houver
      const cleanDatabaseUrl = databaseUrl.replace(/^["']|["']$/g, '')
      
      // Usa db push para sincronizar o schema (mais confiável para testes)
      // IMPORTANTE: Isso limpa o banco, então deve ser feito apenas uma vez
      execSync('npx prisma db push --force-reset --skip-generate --schema=prisma/schema.prisma --accept-data-loss', {
        stdio: 'pipe',
        env: { ...process.env, DATABASE_URL: cleanDatabaseUrl },
      })
      console.log('[TEST] ✅ Banco de dados sincronizado com sucesso')
      globalForSetup.testDbInitialized = true
    } else {
      console.warn('[TEST] ⚠️  Pulando sincronização do banco (DATABASE_URL não configurada)')
    }
  } catch (err: any) {
    console.error('[TEST] ❌ Erro ao sincronizar banco:', err.message || err)
    // Não mata todos os testes, apenas avisa
    console.warn('[TEST] ⚠️  Continuando com os testes mesmo com erro na sincronização...')
  }
} else {
  console.log('[TEST] ⚠️  Banco já foi sincronizado, pulando...')
}
