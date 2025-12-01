-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('OFERTA', 'DIZIMO');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "entryType" "EntryType",
ADD COLUMN     "isTithePayerMember" BOOLEAN,
ADD COLUMN     "tithePayerMemberId" TEXT,
ADD COLUMN     "tithePayerName" TEXT;
