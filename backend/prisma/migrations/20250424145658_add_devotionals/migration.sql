/*
  Warnings:

  - You are about to drop the column `published` on the `Devotional` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Devotional` table. All the data in the column will be lost.
  - Added the required column `author` to the `Devotional` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `Devotional` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passage` to the `Devotional` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Devotional" DROP COLUMN "published",
DROP COLUMN "updatedAt",
ADD COLUMN     "author" TEXT NOT NULL,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "passage" TEXT NOT NULL;
