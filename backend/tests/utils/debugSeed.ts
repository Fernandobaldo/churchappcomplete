import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

import { prisma } from '../../src/lib/prisma'
import bcrypt from 'bcryptjs'

export async function debugSeed() {
  console.log('\n=== DEBUG SEED ===')
  
  // Verificar User
  const user = await prisma.user.findUnique({
    where: { email: 'user@example.com' },
  })
  
  if (user) {
    console.log('✅ User encontrado:', {
      id: user.id,
      email: user.email,
      name: user.name,
      hasPassword: !!user.password,
      passwordLength: user.password?.length,
    })
    
    // Testar senha
    const passwordMatch = await bcrypt.compare('password123', user.password)
    console.log('🔑 Senha "password123" corresponde:', passwordMatch)
  } else {
    console.log('❌ User NÃO encontrado')
  }
  
  // Verificar Member
  const member = await prisma.member.findUnique({
    where: { email: 'member@example.com' },
    include: { Permission: true },
  })
  
  if (member) {
    console.log('✅ Member encontrado:', {
      id: member.id,
      email: member.email,
      name: member.name,
      role: member.role,
      hasPassword: !!member.password,
      passwordLength: member.password?.length,
      permissionsCount: member.Permission?.length || 0,
    })
    
    // Testar senha
    const passwordMatch = await bcrypt.compare('password123', member.password)
    console.log('🔑 Senha "password123" corresponde:', passwordMatch)
  } else {
    console.log('❌ Member NÃO encontrado')
  }
  
  // Verificar Plan
  const plan = await prisma.plan.findFirst({
    where: { name: 'Free Plan' },
  })
  
  if (plan) {
    console.log('✅ Plan encontrado:', {
      id: plan.id,
      name: plan.name,
      maxMembers: plan.maxMembers,
      maxBranches: plan.maxBranches,
    })
  } else {
    console.log('❌ Plan NÃO encontrado')
  }
  
  console.log('=== FIM DEBUG ===\n')
}

