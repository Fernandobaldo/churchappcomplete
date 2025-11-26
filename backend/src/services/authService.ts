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
    
    // NOVO MODELO: Sempre valida como User primeiro
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        Member: {
          include: {
            Permission: true,
            Branch: {
              include: {
                Church: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
        console.log(`[AUTH DEBUG] ❌ User NÃO encontrado para: ${email}`)
      }
      return null
    }

    if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
      console.log(`[AUTH DEBUG] ✅ User encontrado: ${user.email} (ID: ${user.id})`)
      console.log(`[AUTH DEBUG] User.Member existe: ${!!user.Member}`)
      if (user.Member) {
        console.log(`[AUTH DEBUG] User.Member.id: ${user.Member.id}`)
      }
    }

    // Debug adicional: Se o Member não foi carregado, tenta buscar manualmente
    if (!user.Member && (process.env.NODE_ENV === 'test' || process.env.VITEST)) {
      console.log(`[AUTH DEBUG] ⚠️ Member não foi carregado no include, buscando manualmente...`)
      const memberCheck = await prisma.member.findFirst({
        where: { userId: user.id },
        include: {
          Permission: true,
          Branch: {
            include: {
              Church: true,
            },
          },
        },
      })
      if (memberCheck) {
        console.log(`[AUTH DEBUG] ✅ Member encontrado manualmente! userId=${user.id}, memberId=${memberCheck.id}, role=${memberCheck.role}`)
        // Atualiza o user com o Member encontrado
        (user as any).Member = memberCheck
      } else {
        // Tenta buscar por email também
        const memberByEmail = await prisma.member.findUnique({
          where: { email: user.email },
          include: {
            Permission: true,
            Branch: {
              include: {
                Church: true,
              },
            },
          },
        })
        if (memberByEmail) {
          console.log(`[AUTH DEBUG] ✅ Member encontrado por email! email=${user.email}, memberId=${memberByEmail.id}, userId=${memberByEmail.userId}`)
          if (memberByEmail.userId !== user.id) {
            console.log(`[AUTH DEBUG] ⚠️ ATENÇÃO: Member.userId (${memberByEmail.userId}) não corresponde ao User.id (${user.id})!`)
          }
          (user as any).Member = memberByEmail
        } else {
          console.log(`[AUTH DEBUG] ❌ Member NÃO encontrado no banco para userId=${user.id} ou email=${user.email}`)
        }
      }
    }

    // Valida senha do User
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
      console.log(`[AUTH DEBUG] 🔑 Senha do user corresponde: ${passwordMatch}`)
    }

    if (!passwordMatch) {
      return null
    }

    // Se User tem Member associado, retorna dados do Member
    if (user.Member) {
      if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
        console.log(`[AUTH DEBUG] ✅ Member associado encontrado: ${user.Member.id} (Role: ${user.Member.role})`)
        console.log(`[AUTH DEBUG] Member tem Branch: ${!!user.Member.Branch}, tem Permission: ${!!user.Member.Permission}`)
        console.log(`[AUTH DEBUG] Member Branch ID: ${user.Member.Branch?.id}, Church ID: ${user.Member.Branch?.Church?.id}`)
      }
      return {
        type: 'member' as const,
        user,
        member: user.Member,
      }
    }

    // Se não tem Member, retorna apenas User
    if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
      console.log(`[AUTH DEBUG] ⚠️ User sem Member associado (user.Member é ${user.Member})`)
      // Verifica se há Member no banco com esse userId
      const memberCheck = await prisma.member.findFirst({
        where: { userId: user.id },
      })
      if (memberCheck) {
        console.log(`[AUTH DEBUG] ⚠️ ATENÇÃO: Member existe no banco com userId=${user.id}, mas não foi carregado no include!`)
      }
    }
    return {
      type: 'user' as const,
      user,
      member: null,
    }
  }

  async login(email: string, password: string) {
    const result = await this.validateCredentials(email, password)
    if (!result) throw new Error('Credenciais inválidas')

    const { type, user, member } = result

    if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
      console.log(`[AUTH LOGIN] Type: ${type}, Member existe: ${!!member}, Member ID: ${member?.id}`)
    }

    // Monta payload do token
    const tokenPayload: any = {
      sub: user.id,
      email: user.email,
      name: user.name,
      type: type,
    }

    // Se tem Member, adiciona contexto da igreja
    if (member) {
      // member vem de user.Member que já tem as relações carregadas
      tokenPayload.memberId = member.id
      tokenPayload.role = member.role
      tokenPayload.branchId = member.branchId
      tokenPayload.churchId = member.Branch?.Church?.id || null
      tokenPayload.permissions = member.Permission?.map(p => p.type) || []
      
      if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
        console.log(`[AUTH LOGIN] ✅ Member encontrado: ID=${member.id}, Role=${member.role}, Branch=${member.branchId}`)
      }
    } else {
      // Quando não há Member, omite campos de Member do payload (não inclui)
      // Isso indica que o onboarding não foi completado
      tokenPayload.permissions = [] // Sempre array vazio, nunca undefined
      
      if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
        console.log(`[AUTH LOGIN] ⚠️ User sem Member associado`)
      }
    }

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' })

    // Monta resposta
    const responseUser: any = {
      id: user.id,
      name: user.name,
      email: user.email,
    }

    if (member) {
      // Garante que memberId está sempre presente quando há member
      responseUser.memberId = member.id
      responseUser.role = member.role
      responseUser.branchId = member.branchId
      responseUser.churchId = member.Branch?.Church?.id || null
      // Permissions deve ser array de objetos { type: string } ou array vazio
      responseUser.permissions = member.Permission?.map(p => ({ type: p.type })) || []
      
      if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
        console.log(`[AUTH LOGIN] ✅ ResponseUser com Member: memberId=${responseUser.memberId}, role=${responseUser.role}`)
      }
    } else {
      // Garante que sempre retorna array vazio para User sem Member
      responseUser.permissions = []
      
      if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
        console.log(`[AUTH LOGIN] ⚠️ ResponseUser sem Member`)
      }
    }

    return {
      token,
      type,
      user: responseUser,
    }
  }
}
