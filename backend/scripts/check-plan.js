// scripts/check-plan.js
// Script para verificar se o plano gratuito existe no banco
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

// Carrega variáveis de ambiente
dotenv.config()
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: '.env.test' })
}

const prisma = new PrismaClient()

async function checkPlan() {
  try {
    const databaseUrl = process.env.DATABASE_URL?.replace(/^["']|["']$/g, '') || process.env.DATABASE_URL
    
    if (!databaseUrl) {
      console.error('❌ DATABASE_URL não encontrada!')
      console.error('   Configure a DATABASE_URL no arquivo .env ou .env.test')
      process.exit(1)
    }

    // Extrai o nome do banco da URL
    const dbName = databaseUrl.split('/').pop()?.split('?')[0] || 'desconhecido'
    
    console.log('🔍 Verificando plano gratuito no banco...')
    console.log(`📊 Banco: ${dbName}`)
    console.log(`🔗 URL: ${databaseUrl.substring(0, 50)}...`)
    console.log('')

    // Verifica se consegue conectar
    await prisma.$connect()
    console.log('✅ Conectado ao banco de dados')
    console.log('')

    // Busca todos os planos
    const allPlans = await prisma.plan.findMany()
    console.log(`📋 Total de planos encontrados: ${allPlans.length}`)
    
    if (allPlans.length > 0) {
      console.log('📋 Planos existentes:')
      allPlans.forEach(plan => {
        console.log(`   - ${plan.name} (ID: ${plan.id}, Preço: R$ ${plan.price})`)
      })
    }
    console.log('')

    // Busca especificamente o plano gratuito
    const freePlan = await prisma.plan.findFirst({
      where: {
        OR: [
          { name: 'free' },
          { name: 'Free' },
          { name: 'Free Plan' },
        ],
      },
    })

    if (freePlan) {
      console.log('✅ Plano gratuito encontrado!')
      console.log(`   Nome: ${freePlan.name}`)
      console.log(`   ID: ${freePlan.id}`)
      console.log(`   Preço: R$ ${freePlan.price}`)
      console.log(`   Max Membros: ${freePlan.maxMembers || 'ilimitado'}`)
      console.log(`   Max Filiais: ${freePlan.maxBranches || 'ilimitado'}`)
    } else {
      console.log('❌ Plano gratuito NÃO encontrado!')
      console.log('')
      console.log('💡 Solução:')
      console.log('   Execute o seed para criar o plano:')
      console.log('   npm run seed:test  (para banco de teste)')
      console.log('   npm run seed       (para banco de desenvolvimento)')
    }

    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ Erro ao verificar plano:', error.message)
    if (error.message.includes('does not exist')) {
      console.error('')
      console.error('💡 O banco pode não ter o schema aplicado.')
      console.error('   Execute: npm run setup-test-db')
    }
    await prisma.$disconnect()
    process.exit(1)
  }
}

checkPlan()

