import {
  CreateProductInput,
  CreatePriceInput,
  CreateCustomerInput,
  CreateSubscriptionInput,
  ProductResponse,
  PriceResponse,
  CustomerResponse,
  SubscriptionResponse,
  PaymentData,
  WebhookEvent,
  GatewayConfig,
} from './types'

/**
 * Interface comum para todos os gateways de pagamento
 * Todos os gateways devem implementar esta interface
 */
export interface PaymentGatewayInterface {
  /**
   * Configuração do gateway
   */
  config: GatewayConfig

  /**
   * Criar um produto no gateway
   */
  createProduct(input: CreateProductInput): Promise<ProductResponse>

  /**
   * Atualizar um produto no gateway
   */
  updateProduct(productId: string, input: Partial<CreateProductInput>): Promise<ProductResponse>

  /**
   * Criar um preço no gateway
   */
  createPrice(input: CreatePriceInput): Promise<PriceResponse>

  /**
   * Atualizar um preço no gateway (se suportado)
   */
  updatePrice(priceId: string, input: Partial<CreatePriceInput>): Promise<PriceResponse>

  /**
   * Buscar ou criar um cliente no gateway
   */
  getOrCreateCustomer(input: CreateCustomerInput): Promise<CustomerResponse>

  /**
   * Atualizar um cliente no gateway
   */
  updateCustomer(customerId: string, input: Partial<CreateCustomerInput>): Promise<CustomerResponse>

  /**
   * Criar uma assinatura no gateway
   */
  createSubscription(input: CreateSubscriptionInput): Promise<SubscriptionResponse>

  /**
   * Buscar uma assinatura no gateway
   */
  getSubscription(subscriptionId: string): Promise<SubscriptionResponse>

  /**
   * Atualizar uma assinatura no gateway
   */
  updateSubscription(subscriptionId: string, input: Partial<CreateSubscriptionInput>): Promise<SubscriptionResponse>

  /**
   * Cancelar uma assinatura no gateway
   */
  cancelSubscription(subscriptionId: string, cancelAtPeriodEnd?: boolean): Promise<SubscriptionResponse>

  /**
   * Retomar uma assinatura cancelada no gateway
   */
  resumeSubscription(subscriptionId: string): Promise<SubscriptionResponse>

  /**
   * Buscar pagamentos de uma assinatura
   */
  getSubscriptionPayments(subscriptionId: string): Promise<PaymentData[]>

  /**
   * Validar assinatura de webhook
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string): boolean

  /**
   * Parsear evento de webhook
   */
  parseWebhookEvent(payload: any, headers: Record<string, string>): WebhookEvent

  /**
   * Processar evento de webhook
   */
  processWebhookEvent(event: WebhookEvent): Promise<void>
}







