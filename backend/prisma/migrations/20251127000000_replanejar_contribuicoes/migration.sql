-- CreateEnum (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentMethodType') THEN
        CREATE TYPE "PaymentMethodType" AS ENUM ('PIX', 'CONTA_BR', 'IBAN');
    END IF;
END $$;

-- CreateTable (if not exists)
CREATE TABLE IF NOT EXISTS "ContributionPaymentMethod" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContributionPaymentMethod_pkey" PRIMARY KEY ("id")
);

-- Migrate existing data: copy value to goal, date to endDate
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Contribution' AND column_name = 'goal') THEN
        ALTER TABLE "Contribution" ADD COLUMN "goal" DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Contribution' AND column_name = 'endDate') THEN
        ALTER TABLE "Contribution" ADD COLUMN "endDate" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Contribution' AND column_name = 'isActive') THEN
        ALTER TABLE "Contribution" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
    END IF;
END $$;

-- Copy existing data
UPDATE "Contribution" SET "goal" = "value" WHERE "value" IS NOT NULL;
UPDATE "Contribution" SET "endDate" = "date" WHERE "date" IS NOT NULL;

-- Migrate existing payment data to ContributionPaymentMethod if exists
-- For contributions with bankName, create CONTA_BR payment method
INSERT INTO "ContributionPaymentMethod" ("id", "contributionId", "type", "data", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    "id",
    'CONTA_BR',
    jsonb_build_object(
        'banco', COALESCE("bankName", ''),
        'agencia', COALESCE("agency", ''),
        'conta', COALESCE("accountName", ''),
        'tipo', 'CORRENTE'
    ),
    NOW(),
    NOW()
FROM "Contribution"
WHERE "bankName" IS NOT NULL OR "agency" IS NOT NULL OR "accountName" IS NOT NULL;

-- For contributions with qrCodeUrl, create PIX payment method
INSERT INTO "ContributionPaymentMethod" ("id", "contributionId", "type", "data", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    "id",
    'PIX',
    jsonb_build_object(
        'chave', COALESCE("qrCodeUrl", ''),
        'qrCodeUrl', COALESCE("qrCodeUrl", '')
    ),
    NOW(),
    NOW()
FROM "Contribution"
WHERE "qrCodeUrl" IS NOT NULL;

-- For contributions with paymentLink, create PIX payment method with link
INSERT INTO "ContributionPaymentMethod" ("id", "contributionId", "type", "data", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    "id",
    'PIX',
    jsonb_build_object(
        'paymentLink', COALESCE("paymentLink", '')
    ),
    NOW(),
    NOW()
FROM "Contribution"
WHERE "paymentLink" IS NOT NULL AND "qrCodeUrl" IS NULL;

-- Drop old columns (if they exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Contribution' AND column_name = 'value') THEN
        ALTER TABLE "Contribution" DROP COLUMN "value";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Contribution' AND column_name = 'date') THEN
        ALTER TABLE "Contribution" DROP COLUMN "date";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Contribution' AND column_name = 'type') THEN
        ALTER TABLE "Contribution" DROP COLUMN "type";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Contribution' AND column_name = 'bankName') THEN
        ALTER TABLE "Contribution" DROP COLUMN "bankName";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Contribution' AND column_name = 'agency') THEN
        ALTER TABLE "Contribution" DROP COLUMN "agency";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Contribution' AND column_name = 'accountName') THEN
        ALTER TABLE "Contribution" DROP COLUMN "accountName";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Contribution' AND column_name = 'qrCodeUrl') THEN
        ALTER TABLE "Contribution" DROP COLUMN "qrCodeUrl";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Contribution' AND column_name = 'paymentLink') THEN
        ALTER TABLE "Contribution" DROP COLUMN "paymentLink";
    END IF;
END $$;

-- DropEnum (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContributionType') THEN
        DROP TYPE "ContributionType";
    END IF;
END $$;

-- AddForeignKey (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ContributionPaymentMethod_contributionId_fkey'
    ) THEN
        ALTER TABLE "ContributionPaymentMethod" 
        ADD CONSTRAINT "ContributionPaymentMethod_contributionId_fkey" 
        FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateIndex (if not exists)
CREATE INDEX IF NOT EXISTS "ContributionPaymentMethod_contributionId_idx" ON "ContributionPaymentMethod"("contributionId");

