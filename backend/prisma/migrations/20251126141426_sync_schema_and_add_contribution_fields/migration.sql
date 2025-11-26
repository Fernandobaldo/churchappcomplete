-- Migration para sincronizar schema e adicionar campos de contribuição
-- Esta migration resolve o drift e adiciona os novos campos

-- 1. Garantir que isActive existe na tabela Church (se não existir, adiciona)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Church' AND column_name = 'isActive'
    ) THEN
        ALTER TABLE "Church" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
    END IF;
END $$;

-- 2. Remover pastorName da tabela Branch se ainda existir (sincronização)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Branch' AND column_name = 'pastorName'
    ) THEN
        ALTER TABLE "Branch" DROP COLUMN "pastorName";
    END IF;
END $$;

-- 3. Adicionar novos campos na tabela Contribution
ALTER TABLE "Contribution" 
ADD COLUMN IF NOT EXISTS "goal" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "raised" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN IF NOT EXISTS "bankName" TEXT,
ADD COLUMN IF NOT EXISTS "agency" TEXT,
ADD COLUMN IF NOT EXISTS "accountName" TEXT,
ADD COLUMN IF NOT EXISTS "qrCodeUrl" TEXT,
ADD COLUMN IF NOT EXISTS "paymentLink" TEXT;

