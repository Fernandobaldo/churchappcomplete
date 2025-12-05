import { PaymentGatewayInterface } from './PaymentGatewayInterface'
import { MercadoPagoGateway } from './MercadoPagoGateway'
import { GatewayProvider, GatewayConfig } from './types'
import { env } from '../../env'

/**
 * Factory para instanciar gateways de pagamento dinamicamente
 */
export class PaymentGatewayFactory {
  /**
   * Cria uma instância do gateway baseado no provider
   */
  static createGateway(config: GatewayConfig): PaymentGatewayInterface {
    switch (config.provider) {
      case 'mercadopago':
        return new MercadoPagoGateway(config)
      
      case 'asaas':
        // TODO: Implementar quando necessário
        throw new Error('Gateway Asaas ainda não implementado')
      
      case 'pagseguro':
        // TODO: Implementar quando necessário
        throw new Error('Gateway PagSeguro ainda não implementado')
      
      case 'stripe':
        // TODO: Implementar quando necessário
        throw new Error('Gateway Stripe ainda não implementado')
      
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
      accessToken: env.MERCADOPAGO_ACCESS_TOKEN,
      publicKey: env.MERCADOPAGO_PUBLIC_KEY,
      webhookSecret: env.MERCADOPAGO_WEBHOOK_SECRET,
      environment: env.MERCADOPAGO_ENVIRONMENT,
    }

    return this.createGateway(config)
  }
}

