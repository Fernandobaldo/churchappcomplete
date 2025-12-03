-- AlterTable
ALTER TABLE "Church" ADD COLUMN     "address" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "socialMedia" JSONB,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "positionId" TEXT;

-- CreateTable
CREATE TABLE "ChurchPosition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChurchPosition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChurchPosition_churchId_idx" ON "ChurchPosition"("churchId");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "ChurchPosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChurchPosition" ADD CONSTRAINT "ChurchPosition_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;
