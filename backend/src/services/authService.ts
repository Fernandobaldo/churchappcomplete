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
    // Verifica se o Prisma está conectado
    try {
      await prisma.$connect()
    } catch (error) {
      console.error('[AUTH] Erro ao conectar Prisma:', error)
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
      // Retorna um objeto especial para indicar que o usuário não existe
      return { userNotFound: true }
    }

    // Se o Member não foi carregado, tenta buscar manualmente
    if (!user.Member) {
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
          (user as any).Member = memberByEmail
        }
      }
    }

    // Valida senha do User
    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      // Retorna um objeto especial para indicar que a senha está incorreta
      return { invalidPassword: true }
    }

    // Se User tem Member associado, retorna dados do Member
    if (user.Member) {
      return {
        type: 'member' as const,
        user,
        member: user.Member,
      }
    }

    // Se não tem Member, retorna apenas User
    return {
      type: 'user' as const,
      user,
      member: null,
    }
  }

  async login(email: string, password: string) {
    const result = await this.validateCredentials(email, password)
    
    // Verifica se o usuário não foi encontrado
    if (result && 'userNotFound' in result && result.userNotFound) {
      throw new Error('Usuário não encontrado. Verifique se o email está correto ou crie uma conta.')
    }
    
    // Verifica se a senha está incorreta
    if (result && 'invalidPassword' in result && result.invalidPassword) {
      throw new Error('Senha incorreta. Verifique sua senha e tente novamente.')
    }
    
    // Se result não é um objeto válido com user, lança erro genérico
    if (!result || !('user' in result)) {
      throw new Error('Credenciais inválidas')
    }

    const { type, user, member } = result

    if (!user) {
      throw new Error('Usuário não encontrado')
    }

    // Monta payload do token
    const { getUserFullName } = await import('../utils/userUtils')
    const fullName = getUserFullName(user)
    const tokenPayload: any = {
      sub: user.id,
      email: user.email,
      name: fullName,
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
    } else {
      // Quando não há Member, omite campos de Member do payload (não inclui)
      // Isso indica que o onboarding não foi completado
      tokenPayload.permissions = [] // Sempre array vazio, nunca undefined
    }

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' })

    // Monta resposta
    const responseUser: any = {
      id: user.id,
      name: fullName,
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
    } else {
      // Garante que sempre retorna array vazio para User sem Member
      responseUser.permissions = []
    }

    return {
      token,
      type,
      user: responseUser,
    }
  }
}
