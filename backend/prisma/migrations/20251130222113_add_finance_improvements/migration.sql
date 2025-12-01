-- CreateEnum
CREATE TYPE "ExitType" AS ENUM ('ALUGUEL', 'ENERGIA', 'AGUA', 'INTERNET', 'OUTROS');

-- AlterEnum
ALTER TYPE "EntryType" ADD VALUE 'CONTRIBUICAO';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "contributionId" TEXT,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "exitType" "ExitType",
ADD COLUMN     "exitTypeOther" TEXT;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
