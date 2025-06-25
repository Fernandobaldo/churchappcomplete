/*
  Warnings:

  - You are about to drop the column `author` on the `Devotional` table. All the data in the column will be lost.
  - Added the required column `authorId` to the `Devotional` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Devotional` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Devotional" DROP CONSTRAINT "Devotional_branchId_fkey";

-- AlterTable
ALTER TABLE "Devotional" DROP COLUMN "author",
ADD COLUMN     "authorId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "content" DROP NOT NULL,
ALTER COLUMN "branchId" DROP NOT NULL,
ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "DevotionalLike" (
    "id" TEXT NOT NULL,
    "devotionalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DevotionalLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DevotionalLike_devotionalId_userId_key" ON "DevotionalLike"("devotionalId", "userId");

-- AddForeignKey
ALTER TABLE "Devotional" ADD CONSTRAINT "Devotional_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devotional" ADD CONSTRAINT "Devotional_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevotionalLike" ADD CONSTRAINT "DevotionalLike_devotionalId_fkey" FOREIGN KEY ("devotionalId") REFERENCES "Devotional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevotionalLike" ADD CONSTRAINT "DevotionalLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
