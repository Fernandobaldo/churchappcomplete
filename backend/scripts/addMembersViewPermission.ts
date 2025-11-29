/**
 * Script para adicionar a permissão members_view a todos os membros existentes
 * que não possuem essa permissão.
 * 
 * Execute com: npx tsx scripts/addMembersViewPermission.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addMembersViewPermission() {
  console.log('🔍 Buscando membros sem a permissão members_view...')

  // Busca todos os membros
  const allMembers = await prisma.member.findMany({
    include: {
      Permission: true,
    },
  })

  console.log(`📊 Total de membros encontrados: ${allMembers.length}`)

  // Filtra membros que não têm a permissão members_view
  const membersWithoutPermission = allMembers.filter(
    (member) => !member.Permission.some((p) => p.type === 'members_view')
  )

  console.log(`⚠️  Membros sem members_view: ${membersWithoutPermission.length}`)

  if (membersWithoutPermission.length === 0) {
    console.log('✅ Todos os membros já possuem a permissão members_view!')
    return
  }

  // Adiciona a permissão para cada membro
  let added = 0
  let errors = 0

  for (const member of membersWithoutPermission) {
    try {
      await prisma.permission.create({
        data: {
          memberId: member.id,
          type: 'members_view',
        },
      })
      added++
      console.log(`✅ Adicionada permissão members_view para: ${member.name} (${member.email})`)
    } catch (error: any) {
      // Se já existe (duplicado), ignora
      if (error.code === 'P2002') {
        console.log(`ℹ️  Permissão já existe para: ${member.name} (${member.email})`)
      } else {
        errors++
        console.error(`❌ Erro ao adicionar permissão para ${member.name}:`, error.message)
      }
    }
  }

  console.log('\n📊 Resumo:')
  console.log(`✅ Permissões adicionadas: ${added}`)
  if (errors > 0) {
    console.log(`❌ Erros: ${errors}`)
  }
  console.log('✅ Concluído!')
}

async function main() {
  try {
    await addMembersViewPermission()
  } catch (error) {
    console.error('❌ Erro ao executar script:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

