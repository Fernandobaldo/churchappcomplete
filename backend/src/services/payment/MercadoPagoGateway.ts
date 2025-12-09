import { MercadoPagoConfig, Preference, PreApproval, Payment, Customer } from 'mercadopago'
import { PaymentGatewayInterface } from './PaymentGatewayInterface'
import {
  GatewayConfig,
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
  SubscriptionStatus,
  PaymentStatus,
  BillingInterval,
} from './types'

/**
 * Implementação do gateway MercadoPago
 * 
 * Nota: MercadoPago usa PreApproval para assinaturas recorrentes
 * e Preference para pagamentos únicos
 */
export class MercadoPagoGateway implements PaymentGatewayInterface {
  config: GatewayConfig
  private client: MercadoPagoConfig
  private preference: Preference
  private preApproval: PreApproval
  private payment: Payment
  private customer: Customer

  constructor(config: GatewayConfig) {
    if (!config.accessToken) {
      throw new Error('MercadoPago accessToken é obrigatório')
    }

    this.config = config
    this.client = new MercadoPagoConfig({
      accessToken: config.accessToken,
      options: {
        timeout: 5000,
        idempotencyKey: 'abc',
      },
    })

    this.preference = new Preference(this.client)
    this.preApproval = new PreApproval(this.client)
    this.payment = new Payment(this.client)
    this.customer = new Customer(this.client)
  }

  /**
   * MercadoPago não tem um conceito de "produto" separado
   * Usamos o título da preferência/preapproval como produto
   */
  async createProduct(input: CreateProductInput): Promise<ProductResponse> {
    // MercadoPago não tem API de produtos separada
    // Retornamos um ID fictício baseado no nome
    return {
      id: `prod_${input.name.toLowerCase().replace(/\s+/g, '_')}`,
      name: input.name,
      description: input.description,
      active: true,
    }
  }

  async updateProduct(productId: string, input: Partial<CreateProductInput>): Promise<ProductResponse> {
    // MercadoPago não suporta atualização de produtos
    return {
      id: productId,
      name: input.name || '',
      description: input.description,
      active: true,
    }
  }

  /**
   * MercadoPago não tem um conceito de "preço" separado
   * O preço é definido diretamente na preferência/preapproval
   */
  async createPrice(input: CreatePriceInput): Promise<PriceResponse> {
    // Retornamos um ID fictício
    const priceId = `price_${input.productId}_${input.amount}_${input.interval}`
    
    return {
      id: priceId,
      productId: input.productId,
      amount: input.amount,
      currency: input.currency,
      interval: input.interval,
      intervalCount: input.intervalCount || 1,
      active: true,
    }
  }

  async updatePrice(priceId: string, input: Partial<CreatePriceInput>): Promise<PriceResponse> {
    // MercadoPago não suporta atualização de preços
    // Retornamos os dados atualizados
    return {
      id: priceId,
      productId: input.productId || '',
      amount: input.amount || 0,
      currency: input.currency || 'BRL',
      interval: input.interval || 'month',
      intervalCount: input.intervalCount || 1,
      active: true,
    }
  }

  /**
   * Buscar ou criar um cliente no MercadoPago
   */
  async getOrCreateCustomer(input: CreateCustomerInput): Promise<CustomerResponse> {
    try {
      // Tentar buscar por email
      const searchResponse = await this.customer.search({
        qs: {
          email: input.email,
        },
      })

      if (searchResponse.results && searchResponse.results.length > 0) {
        const customer = searchResponse.results[0]
        return {
          id: customer.id?.toString() || '',
          email: customer.email || input.email,
          name: input.name,
          phone: input.phone,
        }
      }

      // Criar novo cliente
      const customerData: any = {
        email: input.email,
        first_name: input.name.split(' ')[0] || input.name,
        last_name: input.name.split(' ').slice(1).join(' ') || '',
      }

      if (input.phone) {
        customerData.phone = {
          area_code: input.phone.substring(0, 2),
          number: input.phone.substring(2),
        }
      }

      if (input.document) {
        customerData.identification = {
          type: input.document.length === 11 ? 'CPF' : 'CNPJ',
          number: input.document,
        }
      }

      const customer = await this.customer.create({ body: customerData })

      return {
        id: customer.id?.toString() || '',
        email: customer.email || input.email,
        name: input.name,
        phone: input.phone,
      }
    } catch (error: any) {
      throw new Error(`Erro ao criar/buscar cliente no MercadoPago: ${error.message}`)
    }
  }

  async updateCustomer(customerId: string, input: Partial<CreateCustomerInput>): Promise<CustomerResponse> {
    try {
      const updateData: any = {}

      if (input.email) updateData.email = input.email
      if (input.name) {
        updateData.first_name = input.name.split(' ')[0] || input.name
        updateData.last_name = input.name.split(' ').slice(1).join(' ') || ''
      }
      if (input.phone) {
        updateData.phone = {
          area_code: input.phone.substring(0, 2),
          number: input.phone.substring(2),
        }
      }

      const customer = await this.customer.update({
        id: customerId,
        body: updateData,
      })

      return {
        id: customer.id?.toString() || '',
        email: customer.email || input.email || '',
        name: input.name || '',
        phone: input.phone,
      }
    } catch (error: any) {
      throw new Error(`Erro ao atualizar cliente no MercadoPago: ${error.message}`)
    }
  }

  /**
   * Criar uma assinatura recorrente usando PreApproval
   */
  async createSubscription(input: CreateSubscriptionInput): Promise<SubscriptionResponse> {
    try {
      // Buscar informações do preço (que contém amount, interval, etc.)
      // Por enquanto, assumimos que o priceId contém essas informações
      const priceParts = input.priceId.split('_')
      const amount = parseFloat(priceParts[priceParts.length - 2]) || 0
      const interval = priceParts[priceParts.length - 1] as BillingInterval

      // Converter intervalo para formato MercadoPago
      const frequency = this.convertIntervalToFrequency(interval)
      const frequencyType = interval === 'month' ? 'months' : interval === 'year' ? 'months' : 'days'

      const preApprovalData: any = {
        reason: 'Assinatura de plano',
        auto_recurring: {
          frequency: frequency,
          frequency_type: frequencyType,
          transaction_amount: amount / 100, // MercadoPago usa valores em reais
          currency_id: 'BRL',
        },
        back_url: process.env.MERCADOPAGO_BACK_URL || 'http://localhost:5173/subscription/success',
        status: 'pending',
      }

      if (input.trialEnd) {
        const now = new Date()
        const trialDays = Math.ceil((input.trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        if (trialDays > 0) {
          preApprovalData.auto_recurring.free_trial = {
            frequency: 1,
            frequency_type: 'days',
          }
        }
      }

      if (input.metadata) {
        preApprovalData.metadata = input.metadata
      }

      const preApproval = await this.preApproval.create({ body: preApprovalData })

      // Calcular datas do período
      const now = new Date()
      const periodEnd = new Date(now)
      
      if (interval === 'month') {
        periodEnd.setMonth(periodEnd.getMonth() + 1)
      } else if (interval === 'year') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1)
      } else {
        periodEnd.setDate(periodEnd.getDate() + 1)
      }

      return {
        id: preApproval.id?.toString() || '',
        customerId: input.customerId,
        status: this.mapMercadoPagoStatusToSubscriptionStatus(preApproval.status || 'pending'),
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        trialEnd: input.trialEnd,
        checkoutUrl: preApproval.init_point || undefined,
        metadata: input.metadata,
      }
    } catch (error: any) {
      throw new Error(`Erro ao criar assinatura no MercadoPago: ${error.message}`)
    }
  }

  async getSubscription(subscriptionId: string): Promise<SubscriptionResponse> {
    try {
      const preApproval = await this.preApproval.get({ id: subscriptionId })

      const now = new Date()
      const periodEnd = new Date(now)
      if (preApproval.auto_recurring?.frequency_type === 'months') {
        periodEnd.setMonth(periodEnd.getMonth() + (preApproval.auto_recurring.frequency || 1))
      }

      return {
        id: preApproval.id?.toString() || '',
        customerId: preApproval.payer_id?.toString() || '',
        status: this.mapMercadoPagoStatusToSubscriptionStatus(preApproval.status || 'pending'),
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: preApproval.status === 'cancelled',
        metadata: preApproval.metadata as Record<string, any>,
      }
    } catch (error: any) {
      throw new Error(`Erro ao buscar assinatura no MercadoPago: ${error.message}`)
    }
  }

  async updateSubscription(subscriptionId: string, input: Partial<CreateSubscriptionInput>): Promise<SubscriptionResponse> {
    try {
      const updateData: any = {}

      if (input.priceId) {
        const priceParts = input.priceId.split('_')
        const amount = parseFloat(priceParts[priceParts.length - 2]) || 0
        updateData.auto_recurring = {
          transaction_amount: amount / 100,
        }
      }

      if (input.metadata) {
        updateData.metadata = input.metadata
      }

      const preApproval = await this.preApproval.update({
        id: subscriptionId,
        body: updateData,
      })

      return this.getSubscription(subscriptionId)
    } catch (error: any) {
      throw new Error(`Erro ao atualizar assinatura no MercadoPago: ${error.message}`)
    }
  }

  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = false): Promise<SubscriptionResponse> {
    try {
      await this.preApproval.update({
        id: subscriptionId,
        body: {
          status: 'cancelled',
        },
      })

      return this.getSubscription(subscriptionId)
    } catch (error: any) {
      throw new Error(`Erro ao cancelar assinatura no MercadoPago: ${error.message}`)
    }
  }

  async resumeSubscription(subscriptionId: string): Promise<SubscriptionResponse> {
    try {
      await this.preApproval.update({
        id: subscriptionId,
        body: {
          status: 'authorized',
        },
      })

      return this.getSubscription(subscriptionId)
    } catch (error: any) {
      throw new Error(`Erro ao retomar assinatura no MercadoPago: ${error.message}`)
    }
  }

  async getSubscriptionPayments(subscriptionId: string): Promise<PaymentData[]> {
    try {
      // Buscar pagamentos relacionados à assinatura
      const searchResponse = await this.payment.search({
        qs: {
          external_reference: subscriptionId,
        },
      })

      if (!searchResponse.results) {
        return []
      }

      return searchResponse.results.map((payment) => ({
        id: payment.id?.toString() || '',
        subscriptionId,
        amount: (payment.transaction_amount || 0) * 100, // Converter para centavos
        currency: payment.currency_id || 'BRL',
        status: this.mapMercadoPagoPaymentStatusToPaymentStatus(payment.status || 'pending'),
        paidAt: payment.date_approved ? new Date(payment.date_approved) : undefined,
        metadata: {
          payment_method_id: payment.payment_method_id,
          payment_type_id: payment.payment_type_id,
        },
      }))
    } catch (error: any) {
      throw new Error(`Erro ao buscar pagamentos no MercadoPago: ${error.message}`)
    }
  }

  verifyWebhookSignature(payload: string | Buffer, signature: string): boolean {
    // MercadoPago usa x-signature e x-request-id nos headers
    // A validação real deve ser feita verificando o x-signature
    // Por enquanto, retornamos true se houver signature
    return !!signature
  }

  parseWebhookEvent(payload: any, headers: Record<string, string>): WebhookEvent {
    const eventId = payload.id || payload.data?.id || headers['x-request-id'] || ''
    const eventType = payload.type || payload.action || 'unknown'

    return {
      id: eventId,
      type: eventType,
      data: payload,
      timestamp: new Date(),
    }
  }

  async processWebhookEvent(event: WebhookEvent): Promise<void> {
    // Este método será implementado no webhookProcessor
    // Aqui apenas validamos o evento
    if (!event.id || !event.type) {
      throw new Error('Evento de webhook inválido')
    }
  }

  /**
   * Métodos auxiliares privados
   */
  private convertIntervalToFrequency(interval: BillingInterval): number {
    switch (interval) {
      case 'month':
        return 1
      case 'year':
        return 12
      case 'week':
        return 1
      case 'day':
        return 1
      default:
        return 1
    }
  }

  private mapMercadoPagoStatusToSubscriptionStatus(status: string): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      pending: 'pending',
      authorized: 'active',
      paused: 'past_due',
      cancelled: 'canceled',
      unpaid: 'unpaid',
    }

    return statusMap[status.toLowerCase()] || 'pending'
  }

  private mapMercadoPagoPaymentStatusToPaymentStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      pending: 'pending',
      approved: 'approved',
      authorized: 'authorized',
      in_process: 'in_process',
      in_mediation: 'in_mediation',
      rejected: 'rejected',
      cancelled: 'cancelled',
      refunded: 'refunded',
      charged_back: 'charged_back',
    }

    return statusMap[status.toLowerCase()] || 'pending'
  }
}

