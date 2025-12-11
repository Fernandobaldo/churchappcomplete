// prisma/seed.ts
import { PrismaClient, AdminRole } from '@prisma/client'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'

// Carrega variáveis de ambiente do arquivo .env
// Se não existir, tenta .env.test
dotenv.config()
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: '.env.test' })
}

const prisma = new PrismaClient({
  log: ['error', 'warn'],
})

async function main() {
  try {
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

    // ==================== ADMIN USERS ====================
    // Senhas padrão (devem ser alteradas no primeiro login)
    const DEFAULT_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123456'
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10)

    // SUPERADMIN
    const superAdminEmail = process.env.SUPERADMIN_EMAIL || 'superadmin@churchapp.com'
    const existingSuperAdmin = await prisma.adminUser.findUnique({
      where: { email: superAdminEmail },
    })

    if (!existingSuperAdmin) {
      await prisma.adminUser.create({
        data: {
          name: 'Super Admin',
          email: superAdminEmail,
          passwordHash,
          adminRole: AdminRole.SUPERADMIN,
          isActive: true,
        },
      })
      console.log(`✅ Super Admin criado: ${superAdminEmail} (senha padrão: ${DEFAULT_PASSWORD})`)
    } else {
      console.log(`ℹ️ Super Admin já existe: ${superAdminEmail}`)
    }

    // SUPPORT
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@churchapp.com'
    const existingSupport = await prisma.adminUser.findUnique({
      where: { email: supportEmail },
    })

    if (!existingSupport) {
      await prisma.adminUser.create({
        data: {
          name: 'Support Admin',
          email: supportEmail,
          passwordHash,
          adminRole: AdminRole.SUPPORT,
          isActive: true,
        },
      })
      console.log(`✅ Support Admin criado: ${supportEmail} (senha padrão: ${DEFAULT_PASSWORD})`)
    } else {
      console.log(`ℹ️ Support Admin já existe: ${supportEmail}`)
    }

    // FINANCE
    const financeEmail = process.env.FINANCE_EMAIL || 'finance@churchapp.com'
    const existingFinance = await prisma.adminUser.findUnique({
      where: { email: financeEmail },
    })

    if (!existingFinance) {
      await prisma.adminUser.create({
        data: {
          name: 'Finance Admin',
          email: financeEmail,
          passwordHash,
          adminRole: AdminRole.FINANCE,
          isActive: true,
        },
      })
      console.log(`✅ Finance Admin criado: ${financeEmail} (senha padrão: ${DEFAULT_PASSWORD})`)
    } else {
      console.log(`ℹ️ Finance Admin já existe: ${financeEmail}`)
    }
  } catch (error: any) {
    console.error('❌ Erro durante seed:', error)
    throw error
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
    console.log('✅ Seed concluído com sucesso!')
  })
  .catch(async (e) => {
    console.error('❌ Erro ao executar seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
