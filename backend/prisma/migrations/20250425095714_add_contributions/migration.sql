/*
  Warnings:

  - You are about to drop the column `code` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the `_MemberToPermission` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `memberId` to the `Permission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Permission` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_MemberToPermission" DROP CONSTRAINT "_MemberToPermission_A_fkey";

-- DropForeignKey
ALTER TABLE "_MemberToPermission" DROP CONSTRAINT "_MemberToPermission_B_fkey";

-- DropIndex
DROP INDEX "Permission_code_key";

-- AlterTable
ALTER TABLE "Permission" DROP COLUMN "code",
ADD COLUMN     "memberId" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL;

-- DropTable
DROP TABLE "_MemberToPermission";

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
