-- AlterTable
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Plan_code_key" ON "Plan"("code") WHERE "code" IS NOT NULL;

-- Update existing Free plan to have code 'FREE'
UPDATE "Plan" SET "code" = 'FREE' WHERE LOWER("name") = 'free' AND "code" IS NULL;

