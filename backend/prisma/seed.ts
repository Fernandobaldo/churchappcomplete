// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const existingPlan = await prisma.plan.findFirst({
    where: { name: 'Free' },
  })

  if (!existingPlan) {
    await prisma.plan.create({
      data: {
        name: 'Free',
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
    console.log('ℹ️ Plano Free já existe.')
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e)
    prisma.$disconnect()
    process.exit(1)
  })
