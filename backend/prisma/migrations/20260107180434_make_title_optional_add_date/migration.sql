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


ALTER TYPE "AuditAction" ADD VALUE 'PLAN_SYNCED_TO_GATEWAY';
ALTER TYPE "AuditAction" ADD VALUE 'PLAN_SYNC_ERROR';
ALTER TYPE "AuditAction" ADD VALUE 'SUBSCRIPTION_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'SUBSCRIPTION_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'SUBSCRIPTION_CANCELED';
ALTER TYPE "AuditAction" ADD VALUE 'SUBSCRIPTION_RESUMED';
ALTER TYPE "AuditAction" ADD VALUE 'PAYMENT_RECEIVED';
ALTER TYPE "AuditAction" ADD VALUE 'PAYMENT_FAILED';
ALTER TYPE "AuditAction" ADD VALUE 'WEBHOOK_RECEIVED';
ALTER TYPE "AuditAction" ADD VALUE 'WEBHOOK_PROCESSED';
ALTER TYPE "AuditAction" ADD VALUE 'WEBHOOK_ERROR';

-- DropForeignKey
ALTER TABLE "PaymentHistory" DROP CONSTRAINT "PaymentHistory_subscriptionId_fkey";

-- DropIndex
DROP INDEX "Plan_gatewayProvider_gatewayProductId_idx";

-- AlterTable
ALTER TABLE "Branch" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Church" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Member" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Plan" ALTER COLUMN "billingInterval" SET NOT NULL,
ALTER COLUMN "syncStatus" SET NOT NULL;

-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "cancelAtPeriodEnd" SET NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "date" TIMESTAMP(3),
ALTER COLUMN "title" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WebhookEvent" ALTER COLUMN "processed" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "PaymentHistory" ADD CONSTRAINT "PaymentHistory_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
