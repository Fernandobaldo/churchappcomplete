/*
  Warnings:

  - Added the required column `pastorName` to the `Branch` table without a default value. This is not possible if the table is not empty.
  - Made the column `startDate` on table `Event` required. This step will fail if there are existing NULL values in that column.
  - Made the column `endDate` on table `Event` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "pastorName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "startDate" SET NOT NULL,
ALTER COLUMN "endDate" SET NOT NULL;
