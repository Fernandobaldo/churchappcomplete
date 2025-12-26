import { PaymentGatewayFactory } from './PaymentGatewayFactory'
import { PaymentGatewayInterface } from './PaymentGatewayInterface'

/**
 * Serviço principal de orquestração de pagamentos
 * Centraliza o acesso ao gateway configurado
 */
export class PaymentGatewayService {
  private static instance: PaymentGatewayInterface | null = null

  /**
   * Obtém a instância do gateway configurado
   */
  static getGateway(): PaymentGatewayInterface {
    if (!this.instance) {
      this.instance = PaymentGatewayFactory.createFromEnv()
    }
    return this.instance
  }

  /**
   * Cria uma nova instância do gateway (útil para testes)
   */
  static createGateway(config?: any): PaymentGatewayInterface {
    if (config) {
      return PaymentGatewayFactory.createGateway(config)
    }
    return PaymentGatewayFactory.createFromEnv()
  }

  /**
   * Reseta a instância (útil para testes)
   */
  static reset(): void {
    this.instance = null
  }
}





