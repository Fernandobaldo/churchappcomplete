-- Criar enum para status de assinatura
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubscriptionStatus') THEN
    CREATE TYPE "SubscriptionStatus" AS ENUM (
      'pending',        -- Aguardando pagamento inicial
      'active',         -- Ativa e em dia
      'past_due',       -- Pagamento atrasado
      'canceled',       -- Cancelada (fim do período)
      'unpaid',         -- Não pago (após tentativas)
      'trialing'        -- Período de teste
    );
  END IF;
END $$;

-- Adicionar campos ao Plan (apenas se a tabela existir)
DO $$ 
BEGIN
  -- Verifica se a tabela Plan existe antes de tentar modificá-la
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'Plan'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Plan' 
      AND column_name = 'gatewayProvider'
    ) THEN
      ALTER TABLE "Plan" ADD COLUMN "gatewayProvider" TEXT;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Plan' 
      AND column_name = 'gatewayProductId'
    ) THEN
      ALTER TABLE "Plan" ADD COLUMN "gatewayProductId" TEXT;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Plan' 
      AND column_name = 'gatewayPriceId'
    ) THEN
      ALTER TABLE "Plan" ADD COLUMN "gatewayPriceId" TEXT;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Plan' 
      AND column_name = 'billingInterval'
    ) THEN
      ALTER TABLE "Plan" ADD COLUMN "billingInterval" TEXT DEFAULT 'month';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Plan' 
      AND column_name = 'syncStatus'
    ) THEN
      ALTER TABLE "Plan" ADD COLUMN "syncStatus" TEXT DEFAULT 'pending';
    END IF;
  END IF;
END $$;

-- Atualizar Subscription (apenas se a tabela existir)
DO $$ 
BEGIN
  -- Verifica se a tabela Subscription existe antes de tentar modificá-la
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'Subscription'
  ) THEN
    -- Remover coluna status antiga se existir (vamos recriar com enum)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Subscription' 
      AND column_name = 'status'
      AND data_type != 'USER-DEFINED'
    ) THEN
      ALTER TABLE "Subscription" DROP COLUMN "status";
    END IF;
    
    -- Adicionar status com enum
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Subscription' 
      AND column_name = 'status'
    ) THEN
      ALTER TABLE "Subscription" ADD COLUMN "status" "SubscriptionStatus" DEFAULT 'pending';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Subscription' 
      AND column_name = 'gatewayProvider'
    ) THEN
      ALTER TABLE "Subscription" ADD COLUMN "gatewayProvider" TEXT;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Subscription' 
      AND column_name = 'gatewaySubscriptionId'
    ) THEN
      ALTER TABLE "Subscription" ADD COLUMN "gatewaySubscriptionId" TEXT;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Subscription' 
      AND column_name = 'gatewayCustomerId'
    ) THEN
      ALTER TABLE "Subscription" ADD COLUMN "gatewayCustomerId" TEXT;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Subscription' 
      AND column_name = 'paymentMethodId'
    ) THEN
      ALTER TABLE "Subscription" ADD COLUMN "paymentMethodId" TEXT;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Subscription' 
      AND column_name = 'currentPeriodStart'
    ) THEN
      ALTER TABLE "Subscription" ADD COLUMN "currentPeriodStart" TIMESTAMP(3);
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Subscription' 
      AND column_name = 'currentPeriodEnd'
    ) THEN
      ALTER TABLE "Subscription" ADD COLUMN "currentPeriodEnd" TIMESTAMP(3);
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Subscription' 
      AND column_name = 'cancelAtPeriodEnd'
    ) THEN
      ALTER TABLE "Subscription" ADD COLUMN "cancelAtPeriodEnd" BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Subscription' 
      AND column_name = 'canceledAt'
    ) THEN
      ALTER TABLE "Subscription" ADD COLUMN "canceledAt" TIMESTAMP(3);
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Subscription' 
      AND column_name = 'trialEnd'
    ) THEN
      ALTER TABLE "Subscription" ADD COLUMN "trialEnd" TIMESTAMP(3);
    END IF;
  END IF;
END $$;

-- Criar tabela PaymentHistory com FK e NUMERIC (apenas se Subscription existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'Subscription'
  ) THEN
    CREATE TABLE IF NOT EXISTS "PaymentHistory" (
        "id" TEXT NOT NULL,
        "subscriptionId" TEXT NOT NULL,
        "amount" NUMERIC(10,2) NOT NULL,
        "currency" TEXT NOT NULL DEFAULT 'BRL',
        "status" TEXT NOT NULL,
        "gatewayPaymentId" TEXT,
        "gatewayProvider" TEXT,
        "paidAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT "PaymentHistory_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "PaymentHistory_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") 
            REFERENCES "Subscription"("id") ON DELETE CASCADE
    );
  END IF;
END $$;

-- Criar tabela WebhookEvent para idempotência
CREATE TABLE IF NOT EXISTS "WebhookEvent" (
    "id" TEXT NOT NULL,
    "gatewayProvider" TEXT NOT NULL,
    "gatewayEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "processed" BOOLEAN DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WebhookEvent_gatewayProvider_gatewayEventId_key" UNIQUE ("gatewayProvider", "gatewayEventId")
);

-- Índices
DO $$
BEGIN
  -- Índices para PaymentHistory (apenas se a tabela existir)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'PaymentHistory'
  ) THEN
    CREATE INDEX IF NOT EXISTS "PaymentHistory_subscriptionId_idx" ON "PaymentHistory"("subscriptionId");
    CREATE INDEX IF NOT EXISTS "PaymentHistory_gatewayPaymentId_idx" ON "PaymentHistory"("gatewayPaymentId");
    CREATE INDEX IF NOT EXISTS "PaymentHistory_status_idx" ON "PaymentHistory"("status");
  END IF;
  
  -- Índice para Plan (apenas se a tabela existir)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'Plan'
  ) THEN
    CREATE INDEX IF NOT EXISTS "Plan_gatewayProvider_gatewayProductId_idx" ON "Plan"("gatewayProvider", "gatewayProductId");
  END IF;
  
  -- Índices para Subscription (apenas se a tabela existir)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'Subscription'
  ) THEN
    CREATE INDEX IF NOT EXISTS "Subscription_gatewaySubscriptionId_idx" ON "Subscription"("gatewaySubscriptionId");
    CREATE INDEX IF NOT EXISTS "Subscription_gatewayCustomerId_idx" ON "Subscription"("gatewayCustomerId");
    CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status");
  END IF;
END $$;

-- Índices para WebhookEvent (sempre criado, não depende de outras tabelas)
CREATE INDEX IF NOT EXISTS "WebhookEvent_gatewayProvider_idx" ON "WebhookEvent"("gatewayProvider");
CREATE INDEX IF NOT EXISTS "WebhookEvent_gatewayEventId_idx" ON "WebhookEvent"("gatewayEventId");
CREATE INDEX IF NOT EXISTS "WebhookEvent_processed_idx" ON "WebhookEvent"("processed");

