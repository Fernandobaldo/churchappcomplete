// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

// Carrega variáveis de ambiente do arquivo .env
// Se não existir, tenta .env.test
dotenv.config()
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: '.env.test' })
}

const prisma = new PrismaClient()

async function main() {
  // Verifica se já existe algum plano gratuito (tenta diferentes variações)
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
    console.log('✅ Plano Free criado com sucesso.')
  } else {
    console.log(`ℹ️ Plano Free já existe (nome: "${existingPlan.name}").`)
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e)
    prisma.$disconnect()
    process.exit(1)
  })
