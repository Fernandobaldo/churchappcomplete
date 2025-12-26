-- AlterTable
-- Adiciona createdAt e updatedAt com valores padrão para registros existentes
ALTER TABLE "Member" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Member" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;







