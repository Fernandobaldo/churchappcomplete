/**
 * Tipos compartilhados para todos os gateways de pagamento
 */

export type GatewayProvider = 'mercadopago' | 'asaas' | 'pagseguro' | 'stripe'

export type BillingInterval = 'month' | 'year' | 'week' | 'day'

export type PlanSyncStatus = 'pending' | 'synced' | 'error'

export type PaymentStatus = 
  | 'pending'
  | 'approved'
  | 'authorized'
  | 'in_process'
  | 'in_mediation'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'charged_back'

export type SubscriptionStatus = 
  | 'pending'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'trialing'

/**
 * Dados para criar um produto no gateway
 */
export interface CreateProductInput {
  name: string
  description?: string
}

/**
 * Dados para criar um preço no gateway
 */
export interface CreatePriceInput {
  productId: string
  amount: number // em centavos ou menor unidade da moeda
  currency: string // 'BRL', 'USD', etc.
  interval: BillingInterval
  intervalCount?: number // padrão 1
  trialPeriodDays?: number
}

/**
 * Dados para criar um cliente no gateway
 */
export interface CreateCustomerInput {
  email: string
  name: string
  phone?: string
  document?: string // CPF/CNPJ
  address?: {
    street?: string
    number?: string
    complement?: string
    neighborhood?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
}

/**
 * Dados para criar uma assinatura no gateway
 */
export interface CreateSubscriptionInput {
  customerId: string
  customerEmail?: string // Email do cliente (necessário para Mercado Pago)
  priceId?: string // ID do preço (compatibilidade com Stripe)
  planId?: string // ID do plano (para referência)
  planData?: { // Dados do plano (usado quando não há priceId pré-criado)
    amount: number // Valor em reais (não centavos)
    interval: BillingInterval
    currency?: string
  }
  paymentMethodId?: string
  trialEnd?: Date
  metadata?: Record<string, string>
}

/**
 * Resposta ao criar um produto
 */
export interface ProductResponse {
  id: string
  name: string
  description?: string
  active: boolean
  metadata?: Record<string, any>
}

/**
 * Resposta ao criar um preço
 */
export interface PriceResponse {
  id: string
  productId: string
  amount: number
  currency: string
  interval: BillingInterval
  intervalCount: number
  active: boolean
  metadata?: Record<string, any>
}

/**
 * Resposta ao criar um cliente
 */
export interface CustomerResponse {
  id: string
  email: string
  name: string
  phone?: string
  metadata?: Record<string, any>
}

/**
 * Resposta ao criar uma assinatura
 */
export interface SubscriptionResponse {
  id: string
  customerId: string
  status: SubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  trialEnd?: Date
  checkoutUrl?: string // URL para o usuário completar o pagamento
  clientSecret?: string // Para integrações com frontend (Stripe)
  metadata?: Record<string, any>
}

/**
 * Dados de um pagamento
 */
export interface PaymentData {
  id: string
  subscriptionId: string
  amount: number
  currency: string
  status: PaymentStatus
  paidAt?: Date
  metadata?: Record<string, any>
}

/**
 * Dados de um webhook
 */
export interface WebhookEvent {
  id: string
  type: string
  data: any
  timestamp: Date
}

/**
 * Configuração de um gateway
 */
export interface GatewayConfig {
  provider: GatewayProvider
  accessToken?: string
  publicKey?: string
  secretKey?: string
  webhookSecret?: string
  environment?: 'sandbox' | 'production'
}



