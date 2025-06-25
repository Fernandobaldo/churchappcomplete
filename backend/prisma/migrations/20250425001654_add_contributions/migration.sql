/*
  Warnings:

  - You are about to drop the column `memberId` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Permission` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `Permission` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Permission` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Permission" DROP CONSTRAINT "Permission_memberId_fkey";

-- AlterTable
ALTER TABLE "Permission" DROP COLUMN "memberId",
DROP COLUMN "type",
ADD COLUMN     "code" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "_MemberToPermission" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MemberToPermission_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_MemberToPermission_B_index" ON "_MemberToPermission"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- AddForeignKey
ALTER TABLE "_MemberToPermission" ADD CONSTRAINT "_MemberToPermission_A_fkey" FOREIGN KEY ("A") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MemberToPermission" ADD CONSTRAINT "_MemberToPermission_B_fkey" FOREIGN KEY ("B") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
