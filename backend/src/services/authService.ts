import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
// Importa prisma DEPOIS de garantir que o .env.test está carregado
// Isso garante que o Prisma Client seja criado com a DATABASE_URL correta
import dotenv from 'dotenv'

// Carrega .env.test se estiver em ambiente de teste
// IMPORTANTE: Deve ser carregado ANTES de importar o prisma
if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
  dotenv.config({ path: '.env.test' })
} else {
  dotenv.config()
}

// Importa prisma DEPOIS de carregar o .env
import { prisma } from '../lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'secret_dev_key'

export class AuthService {
  async validateCredentials(email: string, password: string) {
    // Debug em ambiente de teste
    if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
      console.log(`[AUTH DEBUG] Validando credenciais para: ${email}`)
      // Verifica qual banco está sendo usado
      const dbUrl = process.env.DATABASE_URL
      if (dbUrl) {
        console.log(`[AUTH DEBUG] DATABASE_URL: ${dbUrl.includes('churchapp_test') ? 'TESTE ✅' : 'OUTRO ⚠️'}`)
      }
    }
    
    // Verifica se o Prisma está conectado
    try {
      await prisma.$connect()
    } catch (error) {
      console.error('[AUTH DEBUG] Erro ao conectar Prisma:', error)
    }
    
    const member = await prisma.member.findUnique({
      where: { email },
      include: { Permission: true },
    })

    if (member) {
      if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
        console.log(`[AUTH DEBUG] ✅ Member encontrado: ${member.email} (ID: ${member.id})`)
      }
      const passwordMatch = await bcrypt.compare(password, member.password)
      if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
        console.log(`[AUTH DEBUG] 🔑 Senha do member corresponde: ${passwordMatch}`)
      }
      if (passwordMatch) {
        return { type: 'member', data: member }
      }
    } else {
      if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
        console.log(`[AUTH DEBUG] ❌ Member NÃO encontrado para: ${email}`)
        // Lista todos os members para debug
        const allMembers = await prisma.member.findMany({ select: { email: true } })
        console.log(`[AUTH DEBUG] Members no banco:`, allMembers.map(m => m.email))
      }
    }

    // Tenta validar como User (Admin SaaS)
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (user) {
      if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
        console.log(`[AUTH DEBUG] ✅ User encontrado: ${user.email} (ID: ${user.id})`)
      }
      const passwordMatch = await bcrypt.compare(password, user.password)
      if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
        console.log(`[AUTH DEBUG] 🔑 Senha do user corresponde: ${passwordMatch}`)
      }
      if (passwordMatch) {
        return { type: 'user', data: user }
      }
    } else {
      if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
        console.log(`[AUTH DEBUG] ❌ User NÃO encontrado para: ${email}`)
        // Lista todos os users para debug
        const allUsers = await prisma.user.findMany({ select: { email: true } })
        console.log(`[AUTH DEBUG] Users no banco:`, allUsers.map(u => u.email))
      }
    }

    if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
      console.log(`[AUTH DEBUG] ❌ Nenhuma credencial válida encontrada`)
    }
    return null
  }

 async login(email: string, password: string) {
   const result = await this.validateCredentials(email, password)
   if (!result) throw new Error('Credenciais inválidas')

   const { type, data } = result

   const token = jwt.sign(
     {
       sub: data.id,
       email: data.email,
       type,
       permissions: type === 'member' ? (data as any).Permission?.map((p: any) => p.type) || [] : [],
     },
     JWT_SECRET,
     { expiresIn: '7d' }
   )
 // Remove a senha do objeto retornado
  const { password: _, ...sanitizedUser } = data

  return { token, user: sanitizedUser, type }

 }
 }