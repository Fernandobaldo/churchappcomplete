/*
  Warnings:

  - A unique constraint covering the columns `[type,memberId]` on the table `Permission` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Permission_type_memberId_key" ON "Permission"("type", "memberId");
