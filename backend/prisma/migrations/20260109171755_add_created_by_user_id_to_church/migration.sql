-- AlterTable
ALTER TABLE "Church" ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Church_createdByUserId_idx" ON "Church"("createdByUserId");

-- AddForeignKey
ALTER TABLE "Church" ADD CONSTRAINT "Church_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

