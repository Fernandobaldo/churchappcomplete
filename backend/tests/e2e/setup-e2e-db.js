// tests/e2e/setup-e2e-db.js
// Script para garantir que o banco de teste está configurado antes de rodar testes E2E
import dotenv from 'dotenv'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Carrega o .env.test a partir do diretório backend
const backendDir = join(__dirname, '../..')
dotenv.config({ path: join(backendDir, '.env.test') })

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL não encontrada no .env.test')
  console.error('   Configure a DATABASE_URL no arquivo backend/.env.test')
  process.exit(1)
}

const cleanDatabaseUrl = databaseUrl.replace(/^["']|["']$/g, '')

console.log('🔧 Configurando banco de dados de teste para E2E...')
console.log(`📊 Database: ${cleanDatabaseUrl.split('@')[1] || 'N/A'}`)

try {
  console.log('📦 Aplicando schema do Prisma...')
  execSync(
    'npx prisma db push --force-reset --skip-generate --schema=prisma/schema.prisma --accept-data-loss',
    {
      stdio: 'inherit',
      cwd: backendDir,
      env: { ...process.env, DATABASE_URL: cleanDatabaseUrl },
    }
  )
  console.log('✅ Schema aplicado com sucesso!')

  // Cria o plano Free se não existir
  console.log('📦 Verificando plano Free...')
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: cleanDatabaseUrl,
        },
      },
    })

    const existingPlan = await prisma.plan.findFirst({
      where: {
        OR: [
          { name: 'free' },
          { name: 'Free' },
          { name: 'Free Plan' },
        ],
      },
    })

    if (!existingPlan) {
      await prisma.plan.create({
        data: {
          name: 'free',
          price: 0,
          features: [
            'Até 1 igreja',
            'Até 1 filial',
            'Até 20 membros',
            'Painel de controle limitado',
          ],
          maxBranches: 1,
          maxMembers: 20,
        },
      })
      console.log('✅ Plano Free criado')
    } else {
      console.log(`ℹ️ Plano Free já existe (nome: "${existingPlan.name}")`)
    }

    await prisma.$disconnect()
  } catch (seedError) {
    console.warn('⚠️ Erro ao criar plano Free (pode ser criado durante os testes):', seedError.message)
  }

  console.log('✅ Banco de dados de teste configurado com sucesso!')
} catch (error) {
  console.error('❌ Erro ao configurar banco de teste:', error.message)
  console.error('\n💡 Verifique:')
  console.error('   1. PostgreSQL está rodando?')
  console.error('   2. DATABASE_URL está correta no .env.test?')
  console.error('   3. O banco de teste existe?')
  console.error('\n   Para criar o banco:')
  console.error('   psql -U postgres -c "CREATE DATABASE churchapp_test;"')
  process.exit(1)
}

