/*
  Warnings:

  - Made the column `billingInterval` on table `Plan` required. This step will fail if there are existing NULL values in that column.
  - Made the column `syncStatus` on table `Plan` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `Subscription` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cancelAtPeriodEnd` on table `Subscription` required. This step will fail if there are existing NULL values in that column.
  - Made the column `processed` on table `WebhookEvent` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


-- Adicionar valores ao enum apenas se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PLAN_SYNCED_TO_GATEWAY' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AuditAction')) THEN
    ALTER TYPE "AuditAction" ADD VALUE 'PLAN_SYNCED_TO_GATEWAY';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PLAN_SYNC_ERROR' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AuditAction')) THEN
    ALTER TYPE "AuditAction" ADD VALUE 'PLAN_SYNC_ERROR';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SUBSCRIPTION_CREATED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AuditAction')) THEN
    ALTER TYPE "AuditAction" ADD VALUE 'SUBSCRIPTION_CREATED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SUBSCRIPTION_UPDATED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AuditAction')) THEN
    ALTER TYPE "AuditAction" ADD VALUE 'SUBSCRIPTION_UPDATED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SUBSCRIPTION_CANCELED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AuditAction')) THEN
    ALTER TYPE "AuditAction" ADD VALUE 'SUBSCRIPTION_CANCELED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SUBSCRIPTION_RESUMED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AuditAction')) THEN
    ALTER TYPE "AuditAction" ADD VALUE 'SUBSCRIPTION_RESUMED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PAYMENT_RECEIVED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AuditAction')) THEN
    ALTER TYPE "AuditAction" ADD VALUE 'PAYMENT_RECEIVED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PAYMENT_FAILED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AuditAction')) THEN
    ALTER TYPE "AuditAction" ADD VALUE 'PAYMENT_FAILED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'WEBHOOK_RECEIVED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AuditAction')) THEN
    ALTER TYPE "AuditAction" ADD VALUE 'WEBHOOK_RECEIVED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'WEBHOOK_PROCESSED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AuditAction')) THEN
    ALTER TYPE "AuditAction" ADD VALUE 'WEBHOOK_PROCESSED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'WEBHOOK_ERROR' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AuditAction')) THEN
    ALTER TYPE "AuditAction" ADD VALUE 'WEBHOOK_ERROR';
  END IF;
END $$;

-- DropForeignKey (apenas se PaymentHistory existir)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'PaymentHistory'
  ) THEN
    ALTER TABLE "PaymentHistory" DROP CONSTRAINT IF EXISTS "PaymentHistory_subscriptionId_fkey";
  END IF;
END $$;

-- DropIndex (apenas se existir)
DROP INDEX IF EXISTS "Plan_gatewayProvider_gatewayProductId_idx";

-- AlterTable
ALTER TABLE "Branch" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Church" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Member" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable Plan: SET NOT NULL apenas se colunas existirem
DO $$ 
BEGIN
  -- billingInterval
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Plan' 
    AND column_name = 'billingInterval'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE "Plan" ALTER COLUMN "billingInterval" SET NOT NULL;
  END IF;
  
  -- syncStatus
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Plan' 
    AND column_name = 'syncStatus'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE "Plan" ALTER COLUMN "syncStatus" SET NOT NULL;
  END IF;
END $$;

-- AlterTable Subscription: SET NOT NULL apenas se colunas existirem
DO $$ 
BEGIN
  -- status
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Subscription' 
    AND column_name = 'status'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE "Subscription" ALTER COLUMN "status" SET NOT NULL;
  END IF;
  
  -- cancelAtPeriodEnd
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Subscription' 
    AND column_name = 'cancelAtPeriodEnd'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE "Subscription" ALTER COLUMN "cancelAtPeriodEnd" SET NOT NULL;
  END IF;
END $$;

-- AlterTable Transaction
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "date" TIMESTAMP(3);
ALTER TABLE "Transaction" ALTER COLUMN "title" DROP NOT NULL;

-- AlterTable WebhookEvent: SET NOT NULL apenas se coluna existir
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'WebhookEvent' 
    AND column_name = 'processed'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE "WebhookEvent" ALTER COLUMN "processed" SET NOT NULL;
  END IF;
END $$;

-- AddForeignKey (apenas se PaymentHistory existir)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'PaymentHistory'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'PaymentHistory_subscriptionId_fkey'
      AND table_name = 'PaymentHistory'
      AND table_schema = 'public'
    ) THEN
      ALTER TABLE "PaymentHistory" ADD CONSTRAINT "PaymentHistory_subscriptionId_fkey" 
        FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;