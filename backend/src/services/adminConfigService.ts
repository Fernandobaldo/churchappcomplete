import { prisma } from '../lib/prisma'

/**
 * Serviço de Configurações Admin
 * Responsabilidade: Configurações globais do sistema (apenas SUPERADMIN)
 * 
 * Nota: Por enquanto, as configurações podem ser armazenadas em uma tabela SystemConfig
 * ou em um arquivo JSON. Para esta implementação inicial, vamos usar uma abordagem simples.
 */
export class AdminConfigService {
  async getSystemConfig() {
    // Por enquanto, retorna configurações padrão
    // Em produção, você pode criar uma tabela SystemConfig
    return {
      trialDuration: 30, // dias
      defaultPlan: 'free',
      defaultLanguage: 'pt-BR',
      emailTemplates: {
        welcome: 'Bem-vindo ao ChurchApp!',
        memberInvite: 'Você foi convidado para se juntar à nossa igreja.',
        passwordReset: 'Clique no link para redefinir sua senha.',
      },
      integrations: {
        payment: {
          provider: 'stripe',
          enabled: false,
        },
        email: {
          provider: 'sendgrid',
          enabled: true,
        },
      },
    }
  }

  async updateSystemConfig(config: any, adminUserId: string) {
    // Por enquanto, apenas registra a ação no log
    // Em produção, você deve salvar as configurações em uma tabela
    
    await prisma.auditLog.create({
      data: {
        action: 'ADMIN_CONFIG_UPDATED',
        entityType: 'SystemConfig',
        entityId: null,
        userId: adminUserId,
        userEmail: '',
        description: 'Configurações do sistema foram atualizadas',
        metadata: config,
        adminUserId,
      },
    })

    return { message: 'Configurações atualizadas (implementar persistência)' }
  }
}

