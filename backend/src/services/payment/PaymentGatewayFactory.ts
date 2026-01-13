import { PaymentGatewayInterface } from './PaymentGatewayInterface'
import { GatewayProvider, GatewayConfig } from './types'
import { env } from '../../env'
import { StripeGateway } from './StripeGateway'

/**
 * Factory para instanciar gateways de pagamento dinamicamente
 */
export class PaymentGatewayFactory {
  /**
   * Cria uma instância do gateway baseado no provider
   */
  static createGateway(config: GatewayConfig): PaymentGatewayInterface {
    switch (config.provider) {
      case 'asaas':
        // TODO: Implementar quando necessário
        throw new Error('Gateway Asaas ainda não implementado')
      
      case 'pagseguro':
        // TODO: Implementar quando necessário
        throw new Error('Gateway PagSeguro ainda não implementado')
      
      case 'stripe':
        return new StripeGateway({
          provider: 'stripe',
          secretKey: config.secretKey || env.STRIPE_SECRET_KEY,
          publicKey: config.publicKey || env.STRIPE_PUBLIC_KEY,
          webhookSecret: config.webhookSecret || env.STRIPE_WEBHOOK_SECRET,
        })
      
      default:
        throw new Error(`Gateway não suportado: ${config.provider}`)
    }
  }

  /**
   * Cria gateway a partir de variáveis de ambiente
   * Usa o módulo env.ts centralizado
   */
  static createFromEnv(): PaymentGatewayInterface {
    const provider = env.PAYMENT_GATEWAY as GatewayProvider

    const config: GatewayConfig = {
      provider,
      secretKey: env.STRIPE_SECRET_KEY,
      publicKey: env.STRIPE_PUBLIC_KEY,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    }

    return this.createGateway(config)
  }
}
