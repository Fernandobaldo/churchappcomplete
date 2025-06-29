-- DropForeignKey
ALTER TABLE "Branch" DROP CONSTRAINT "Branch_churchId_fkey";

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;
