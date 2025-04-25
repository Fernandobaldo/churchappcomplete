-- CreateEnum
CREATE TYPE "ContributionType" AS ENUM ('OFERTA', 'DIZIMO', 'OUTRO');

-- CreateTable
CREATE TABLE "Contribution" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "value" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "ContributionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "branchId" TEXT NOT NULL,

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
