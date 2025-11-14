/*
  Warnings:

  - Added the required column `pastorName` to the `Branch` table without a default value. This is not possible if the table is not empty.
  - Made the column `startDate` on table `Event` required. This step will fail if there are existing NULL values in that column.
  - Made the column `endDate` on table `Event` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable: Adiciona pastorName com valor padrão primeiro
ALTER TABLE "Branch" ADD COLUMN "pastorName" TEXT;
UPDATE "Branch" SET "pastorName" = 'Pastor' WHERE "pastorName" IS NULL;
ALTER TABLE "Branch" ALTER COLUMN "pastorName" SET NOT NULL;

-- AlterTable: Atualiza Event para garantir que não há NULLs
UPDATE "Event" SET "startDate" = "createdAt" WHERE "startDate" IS NULL;
UPDATE "Event" SET "endDate" = "startDate" WHERE "endDate" IS NULL;
ALTER TABLE "Event" ALTER COLUMN "startDate" SET NOT NULL,
ALTER COLUMN "endDate" SET NOT NULL;
