import Stripe from 'stripe'
import {
  PaymentGatewayInterface,
} from './PaymentGatewayInterface'
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
  SubscriptionStatus,
  PaymentStatus,
} from './types'
import { env } from '../../env'

/**
 * Implementação do gateway Stripe
 */
export class StripeGateway implements PaymentGatewayInterface {
  private stripe: Stripe
  public config: GatewayConfig

  constructor(config: GatewayConfig) {
    this.config = config
    
    if (!config.secretKey) {
      throw new Error('STRIPE_SECRET_KEY é obrigatório')
    }

    this.stripe = new Stripe(config.secretKey, {
      apiVersion: '2025-12-15.clover',
    })
  }

  /**
   * Criar um produto no Stripe
   */
  async createProduct(input: CreateProductInput): Promise<ProductResponse> {
    const product = await this.stripe.products.create({
      name: input.name,
      description: input.description,
      active: true,
    })

    return {
      id: product.id,
      name: product.name || input.name,
      description: product.description || input.description,
      active: product.active,
      metadata: product.metadata,
    }
  }

  /**
   * Atualizar um produto no Stripe
   */
  async updateProduct(productId: string, input: Partial<CreateProductInput>): Promise<ProductResponse> {
    const product = await this.stripe.products.update(productId, {
      name: input.name,
      description: input.description,
    })

    return {
      id: product.id,
      name: product.name || input.name || '',
      description: product.description || input.description,
      active: product.active,
      metadata: product.metadata,
    }
  }

  /**
   * Criar um preço no Stripe
   */
  async createPrice(input: CreatePriceInput): Promise<PriceResponse> {
    const price = await this.stripe.prices.create({
      product: input.productId,
      unit_amount: input.amount, // Stripe usa centavos
      currency: input.currency.toLowerCase(),
      recurring: {
        interval: input.interval as Stripe.Price.Recurring.Interval,
        interval_count: input.intervalCount || 1,
        trial_period_days: input.trialPeriodDays,
      },
    })

    return {
      id: price.id,
      productId: price.product as string,
      amount: price.unit_amount || 0,
      currency: price.currency.toUpperCase(),
      interval: input.interval,
      intervalCount: price.recurring?.interval_count || 1,
      active: price.active,
      metadata: price.metadata,
    }
  }

  /**
   * Atualizar um preço no Stripe (Stripe não permite atualizar preços, então retorna o preço existente)
   */
  async updatePrice(priceId: string, input: Partial<CreatePriceInput>): Promise<PriceResponse> {
    // Stripe não permite atualizar preços existentes
    // Retornar o preço atual
    const price = await this.stripe.prices.retrieve(priceId)

    return {
      id: price.id,
      productId: price.product as string,
      amount: price.unit_amount || 0,
      currency: price.currency.toUpperCase(),
      interval: (price.recurring?.interval || 'month') as any,
      intervalCount: price.recurring?.interval_count || 1,
      active: price.active,
      metadata: price.metadata,
    }
  }

  /**
   * Buscar ou criar um cliente no Stripe
   */
  async getOrCreateCustomer(input: CreateCustomerInput): Promise<CustomerResponse> {
    // Tentar buscar cliente por email
    const existingCustomers = await this.stripe.customers.list({
      email: input.email,
      limit: 1,
    })

    let customer: Stripe.Customer

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
    } else {
      // Criar novo cliente
      customer = await this.stripe.customers.create({
        email: input.email,
        name: input.name,
        phone: input.phone,
        metadata: {
          document: input.document || '',
        },
        address: input.address ? {
          line1: input.address.street,
          line2: input.address.complement,
          city: input.address.city,
          state: input.address.state,
          postal_code: input.address.zipCode,
          country: input.address.country || 'BR',
        } : undefined,
      })
    }

    return {
      id: customer.id,
      email: customer.email || input.email,
      name: customer.name || input.name,
      phone: customer.phone || input.phone,
      metadata: customer.metadata,
    }
  }

  /**
   * Atualizar um cliente no Stripe
   */
  async updateCustomer(customerId: string, input: Partial<CreateCustomerInput>): Promise<CustomerResponse> {
    const customer = await this.stripe.customers.update(customerId, {
      email: input.email,
      name: input.name,
      phone: input.phone,
      metadata: input.document ? { document: input.document } : undefined,
      address: input.address ? {
        line1: input.address.street,
        line2: input.address.complement,
        city: input.address.city,
        state: input.address.state,
        postal_code: input.address.zipCode,
        country: input.address.country || 'BR',
      } : undefined,
    })

    return {
      id: customer.id,
      email: customer.email || '',
      name: customer.name || '',
      phone: customer.phone || input.phone,
      metadata: customer.metadata,
    }
  }

  /**
   * Criar uma assinatura no Stripe
   */
  async createSubscription(input: CreateSubscriptionInput): Promise<SubscriptionResponse> {
    // Se temos priceId, usar diretamente
    if (input.priceId) {
      const subscription = await this.stripe.subscriptions.create({
        customer: input.customerId,
        items: [{ price: input.priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        trial_end: input.trialEnd ? Math.floor(input.trialEnd.getTime() / 1000) : undefined,
        metadata: input.metadata || {},
      })

      const invoice = subscription.latest_invoice as Stripe.Invoice | string
      let paymentIntent: Stripe.PaymentIntent | null = null
      
      if (typeof invoice === 'object' && invoice) {
        const expandedInvoice = invoice as Stripe.Invoice & { payment_intent?: Stripe.PaymentIntent | string }
        if (expandedInvoice.payment_intent) {
          if (typeof expandedInvoice.payment_intent === 'string') {
            paymentIntent = await this.stripe.paymentIntents.retrieve(expandedInvoice.payment_intent)
          } else {
            paymentIntent = expandedInvoice.payment_intent
          }
        }
      }

      const sub: any = subscription

      return {
        id: sub.id,
        customerId: typeof sub.customer === 'string' ? sub.customer : (sub.customer as any)?.id || sub.customer,
        status: this.mapSubscriptionStatus(sub.status),
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : undefined,
        clientSecret: paymentIntent?.client_secret || undefined,
        metadata: sub.metadata || {},
      }
    }

    // Se não temos priceId, criar produto e preço primeiro
    if (!input.planData) {
      throw new Error('priceId ou planData é obrigatório')
    }

    // Criar produto
    const product = await this.createProduct({
      name: `Plano ${input.planId || 'Custom'}`,
      description: `Assinatura ${input.planData.interval}`,
    })

    // Criar preço
    const price = await this.createPrice({
      productId: product.id,
      amount: Math.round(input.planData.amount * 100), // Converter para centavos
      currency: input.planData.currency || 'BRL',
      interval: input.planData.interval,
    })

    // Criar assinatura com o preço criado
    const subscription = await this.stripe.subscriptions.create({
      customer: input.customerId,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      trial_end: input.trialEnd ? Math.floor(input.trialEnd.getTime() / 1000) : undefined,
      metadata: input.metadata || {},
    })

    const invoice = subscription.latest_invoice as Stripe.Invoice | string
    let paymentIntent: Stripe.PaymentIntent | null = null
    
    if (typeof invoice === 'object' && invoice) {
      const expandedInvoice = invoice as Stripe.Invoice & { payment_intent?: Stripe.PaymentIntent | string }
      if (expandedInvoice.payment_intent) {
        if (typeof expandedInvoice.payment_intent === 'string') {
          paymentIntent = await this.stripe.paymentIntents.retrieve(expandedInvoice.payment_intent)
        } else {
          paymentIntent = expandedInvoice.payment_intent
        }
      }
    }

      const sub: any = subscription

      return {
        id: sub.id,
        customerId: typeof sub.customer === 'string' ? sub.customer : (sub.customer as any)?.id || sub.customer,
        status: this.mapSubscriptionStatus(sub.status),
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : undefined,
        clientSecret: paymentIntent?.client_secret || undefined,
        metadata: sub.metadata || {},
      }
  }

  /**
   * Buscar uma assinatura no Stripe
   */
  async getSubscription(subscriptionId: string): Promise<SubscriptionResponse> {
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId) as any as Stripe.Subscription

    return {
      id: subscription.id,
      customerId: typeof subscription.customer === 'string' ? subscription.customer : (subscription.customer as any).id,
      status: this.mapSubscriptionStatus(subscription.status),
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
      metadata: subscription.metadata || {},
    }
  }

  /**
   * Atualizar uma assinatura no Stripe
   */
  async updateSubscription(subscriptionId: string, input: Partial<CreateSubscriptionInput>): Promise<SubscriptionResponse> {
    const updateData: Stripe.SubscriptionUpdateParams = {}

    if (input.priceId) {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId)
      updateData.items = [{
        id: subscription.items.data[0].id,
        price: input.priceId,
      }]
    }

    if (input.trialEnd) {
      updateData.trial_end = Math.floor(input.trialEnd.getTime() / 1000)
    }

    if (input.metadata) {
      updateData.metadata = input.metadata
    }

    const subscription = await this.stripe.subscriptions.update(subscriptionId, updateData) as any as Stripe.Subscription

    return {
      id: subscription.id,
      customerId: typeof subscription.customer === 'string' ? subscription.customer : (subscription.customer as any).id,
      status: this.mapSubscriptionStatus(subscription.status),
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
      metadata: subscription.metadata || {},
    }
  }

  /**
   * Cancelar uma assinatura no Stripe
   */
  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = false): Promise<SubscriptionResponse> {
    let subscription: any

    if (cancelAtPeriodEnd) {
      subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      })
    } else {
      subscription = await this.stripe.subscriptions.cancel(subscriptionId)
    }

    return {
      id: subscription.id,
      customerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id || subscription.customer,
      status: this.mapSubscriptionStatus(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
      metadata: subscription.metadata || {},
    }
  }

  /**
   * Retomar uma assinatura cancelada no Stripe
   */
  async resumeSubscription(subscriptionId: string): Promise<SubscriptionResponse> {
    const subscription = await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    }) as any

    return {
      id: subscription.id,
      customerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id || subscription.customer,
      status: this.mapSubscriptionStatus(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
      metadata: subscription.metadata || {},
    }
  }

  /**
   * Buscar pagamentos de uma assinatura
   */
  async getSubscriptionPayments(subscriptionId: string): Promise<PaymentData[]> {
    const invoices = await this.stripe.invoices.list({
      subscription: subscriptionId,
      limit: 100,
    })

    return invoices.data.map((invoice: any) => {
      const subscriptionId = typeof invoice.subscription === 'string' 
        ? invoice.subscription 
        : invoice.subscription?.id || ''
      
      return {
        id: invoice.id,
        subscriptionId,
        amount: invoice.amount_paid / 100, // Converter de centavos para reais
        currency: invoice.currency.toUpperCase(),
        status: this.mapPaymentStatus(invoice.status || 'pending'),
        paidAt: invoice.status === 'paid' && invoice.status_transitions?.paid_at
          ? new Date(invoice.status_transitions.paid_at * 1000)
          : undefined,
        metadata: invoice.metadata || {},
      }
    })
  }

  /**
   * Validar assinatura de webhook do Stripe
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string): boolean {
    if (!this.config.webhookSecret) {
      console.warn('⚠️ STRIPE_WEBHOOK_SECRET não configurado, não é possível validar webhook')
      return false
    }

    try {
      this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.config.webhookSecret
      )
      return true
    } catch (error) {
      console.error('Erro ao validar assinatura do webhook:', error)
      return false
    }
  }

  /**
   * Parsear evento de webhook do Stripe
   */
  parseWebhookEvent(payload: any, headers: Record<string, string>): WebhookEvent {
    // Se payload já é um evento do Stripe
    if (payload.id && payload.type) {
      return {
        id: payload.id,
        type: payload.type,
        data: payload.data,
        timestamp: new Date(payload.created * 1000),
      }
    }

    // Se é um objeto genérico, tentar extrair informações
    return {
      id: payload.id || `evt_${Date.now()}`,
      type: payload.type || 'unknown',
      data: payload.data || payload,
      timestamp: new Date(),
    }
  }

  /**
   * Processar evento de webhook (delegado para WebhookProcessor)
   */
  async processWebhookEvent(event: WebhookEvent): Promise<void> {
    // A implementação real está no WebhookProcessor
    // Este método existe apenas para satisfazer a interface
  }

  /**
   * Mapear status de assinatura do Stripe para nosso formato
   */
  private mapSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      active: 'active',
      trialing: 'trialing',
      past_due: 'past_due',
      canceled: 'canceled',
      unpaid: 'unpaid',
      incomplete: 'pending',
      incomplete_expired: 'canceled',
      paused: 'past_due',
    }

    return statusMap[status] || 'pending'
  }

  /**
   * Mapear status de pagamento do Stripe para nosso formato
   */
  private mapPaymentStatus(status: string | null): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      draft: 'pending',
      open: 'pending',
      paid: 'approved',
      uncollectible: 'rejected',
      void: 'cancelled',
    }

    return statusMap[status || ''] || 'pending'
  }
}

