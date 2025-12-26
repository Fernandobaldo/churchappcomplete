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
   * O PreApproval Plan será criado apenas quando o cliente fizer checkout
   * Aqui apenas retornamos um ID de referência interna baseado nos dados do plano
   */
  async createPrice(input: CreatePriceInput): Promise<PriceResponse> {
    // Mercado Pago não tem conceito de "preço" separado
    // O PreApproval Plan será criado apenas quando o cliente fizer checkout
    // Retornamos um ID baseado nos dados do plano para referência interna
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
        email: input.email,
      } as any)

      if (searchResponse.results && searchResponse.results.length > 0) {
        const existingCustomer = searchResponse.results[0]
        
        // Se o cliente existe mas não tem país definido, atualizar
        if (!existingCustomer.default_address?.country_id) {
          try {
            await this.customer.update({
              id: existingCustomer.id?.toString() || '',
              body: {
                default_address: {
                  country_id: 'BR',
                },
              },
            } as any)
            console.log('✅ [MERCADOPAGO] Cliente existente atualizado com país BR')
          } catch (error: any) {
            console.warn('⚠️ [MERCADOPAGO] Não foi possível atualizar país do cliente existente:', error.message)
          }
        }
        
        return {
          id: existingCustomer.id?.toString() || '',
          email: existingCustomer.email || input.email,
          name: input.name,
          phone: input.phone,
        }
      }

      // Criar novo cliente
      // Separar nome em first_name e last_name
      const nameParts = input.name.trim().split(/\s+/)
      const firstName = nameParts[0] || input.name
      const lastName = nameParts.slice(1).join(' ') || firstName // Se não tiver sobrenome, usa o primeiro nome

      const customerData: any = {
        email: input.email,
        first_name: firstName,
        last_name: lastName, // Garantir que nunca seja vazio
        // Adicionar país Brasil para evitar erro "Cannot operate between different countries"
        default_address: {
          country_id: 'BR',
        },
      }

      // Validar e formatar telefone apenas se fornecido e válido
      if (input.phone && input.phone.length >= 10) {
        // Remover caracteres não numéricos
        const cleanPhone = input.phone.replace(/\D/g, '')
        
        if (cleanPhone.length >= 10) {
          // DDD geralmente tem 2 dígitos, número tem pelo menos 8
          const areaCode = cleanPhone.substring(0, 2)
          const number = cleanPhone.substring(2)
          
          if (areaCode.length === 2 && number.length >= 8) {
            customerData.phone = {
              area_code: areaCode,
              number: number,
            }
          }
        }
      }

      // Adicionar documento apenas se fornecido e válido
      if (input.document) {
        const cleanDocument = input.document.replace(/\D/g, '')
        if (cleanDocument.length === 11 || cleanDocument.length === 14) {
          customerData.identification = {
            type: cleanDocument.length === 11 ? 'CPF' : 'CNPJ',
            number: cleanDocument,
          }
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
      console.error('❌ Erro detalhado ao criar/buscar cliente no MercadoPago:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        input: {
          email: input.email,
          name: input.name,
          hasPhone: !!input.phone,
          hasDocument: !!input.document,
        },
      })
      throw new Error(`Erro ao criar/buscar cliente no MercadoPago: ${error.message || 'Erro desconhecido'}`)
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
        ...updateData,
      } as any)

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
   * O PreApproval Plan é criado aqui, no momento do checkout, com os dados do cliente
   */
  async createSubscription(input: CreateSubscriptionInput): Promise<SubscriptionResponse> {
    try {
      // Determinar amount e interval
      let amount: number
      let interval: BillingInterval
      
      if (input.planData) {
        // Usar dados do plano diretamente (fluxo correto)
        amount = input.planData.amount * 100 // Converter para centavos
        interval = input.planData.interval
      } else if (input.priceId) {
        // Fallback: tentar extrair do priceId (compatibilidade)
        const priceParts = input.priceId.split('_')
        amount = parseFloat(priceParts[priceParts.length - 2]) || 0
        interval = priceParts[priceParts.length - 1] as BillingInterval
      } else {
        throw new Error('planData ou priceId é obrigatório para criar assinatura')
      }

      // Converter intervalo para formato MercadoPago
      const frequency = this.convertIntervalToFrequency(interval)
      const frequencyType = interval === 'month' ? 'months' : interval === 'year' ? 'months' : 'days'

      // Validar e obter back_url
      let backUrl = process.env.MERCADOPAGO_BACK_URL || process.env.FRONTEND_URL
      
      // Tratar strings vazias como undefined
      if (backUrl && backUrl.trim() === '') {
        backUrl = undefined
      }
      
      // Se não tiver URL configurada, usar uma padrão válida
      if (!backUrl) {
        backUrl = 'http://localhost:3000/subscription/success'
      } else {
        // Garantir que a URL termina com /subscription/success se não tiver path específico
        if (!backUrl.includes('/subscription/success') && !backUrl.includes('/subscription')) {
          backUrl = `${backUrl.replace(/\/$/, '')}/subscription/success`
        }
      }

      // Validar se é uma URL válida
      let isValidUrl = false
      let finalBackUrl: string | undefined = undefined
      try {
        const url = new URL(backUrl)
        isValidUrl = true
        
        // Mercado Pago NÃO aceita localhost, mesmo em sandbox
        // Se for localhost, substituir por uma URL pública padrão
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
          console.warn('⚠️ [MERCADOPAGO] URL é localhost. Mercado Pago não aceita localhost, usando URL pública padrão.')
          
          // Tentar usar uma URL pública padrão (pode ser configurada via env)
          const publicBackUrl = process.env.MERCADOPAGO_PUBLIC_BACK_URL || 
                                process.env.FRONTEND_PUBLIC_URL || 
                                'https://conectachurch.com/subscription/success'
          
          try {
            const publicUrl = new URL(publicBackUrl)
            if (publicUrl.hostname !== 'localhost' && publicUrl.hostname !== '127.0.0.1') {
              finalBackUrl = publicBackUrl
              console.log('✅ [MERCADOPAGO] Substituindo localhost por URL pública:', finalBackUrl)
            } else {
              throw new Error('URL pública também é localhost')
            }
          } catch (error) {
            throw new Error(
              'Mercado Pago exige back_url com URL pública (não aceita localhost). ' +
              'Configure MERCADOPAGO_PUBLIC_BACK_URL ou FRONTEND_PUBLIC_URL no .env com uma URL pública válida (ex: https://seu-dominio.com/subscription/success)'
            )
          }
        } else {
          finalBackUrl = backUrl
        }
        
        // Log para debug
        console.log('🔍 [MERCADOPAGO] back_url validada:', finalBackUrl)
      } catch (error: any) {
        // Se for erro de URL inválida, lançar
        if (error.message && error.message.includes('Mercado Pago exige')) {
          throw error
        }
        // Se não for válida, lançar erro
        console.error('❌ MERCADOPAGO_BACK_URL inválida:', backUrl)
        throw new Error(
          'URL de retorno (back_url) inválida. Configure MERCADOPAGO_BACK_URL ou FRONTEND_URL no .env com uma URL válida (ex: https://seu-dominio.com/subscription/success)'
        )
      }

      // Verificar se o Mercado Pago aceita localhost (pode não aceitar em produção)
      if (finalBackUrl && finalBackUrl.includes('localhost') && process.env.MERCADOPAGO_ENVIRONMENT === 'production') {
        console.warn('⚠️ ATENÇÃO: Usando localhost em produção. O Mercado Pago rejeitará.')
      }

      // Criar PreApproval Plan no Mercado Pago com os dados do cliente
      const preApprovalData: any = {
        reason: `Assinatura - Plano ${input.planId || 'N/A'}`,
        payer_email: input.customerEmail, // Email do cliente (obrigatório no Mercado Pago)
        auto_recurring: {
          frequency: frequency,
          frequency_type: frequencyType,
          transaction_amount: amount / 100, // MercadoPago usa valores em reais
          currency_id: input.planData?.currency || 'BRL',
        },
        status: 'pending',
        // Adicionar país Brasil no payer para evitar erro "Cannot operate between different countries"
        payer: {
          email: input.customerEmail,
        },
      }

      // Adicionar back_url (obrigatório no Mercado Pago)
      if (finalBackUrl) {
        // Garantir que a URL não tenha espaços ou caracteres inválidos
        finalBackUrl = finalBackUrl.trim()
        preApprovalData.back_url = finalBackUrl
        
        // Log do payload antes de enviar (sem dados sensíveis)
        console.log('🔍 [MERCADOPAGO] Criando PreApproval com back_url:', {
          reason: preApprovalData.reason,
          payer_email: preApprovalData.payer_email,
          back_url: preApprovalData.back_url,
          amount: preApprovalData.auto_recurring.transaction_amount,
        })
      } else {
        throw new Error(
          'back_url é obrigatório no Mercado Pago. Configure MERCADOPAGO_BACK_URL, FRONTEND_URL ou MERCADOPAGO_PUBLIC_BACK_URL no .env com uma URL pública válida.'
        )
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
        metadata: (preApproval as any).metadata as Record<string, any>,
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
        external_reference: subscriptionId,
      } as any)

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

