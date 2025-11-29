-- CreateTable
CREATE TABLE "ServiceSchedule" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "time" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "autoCreateEvents" BOOLEAN NOT NULL DEFAULT false,
    "autoCreateDaysAhead" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceSchedule_branchId_idx" ON "ServiceSchedule"("branchId");

-- CreateIndex
CREATE INDEX "ServiceSchedule_dayOfWeek_idx" ON "ServiceSchedule"("dayOfWeek");

-- AddForeignKey
ALTER TABLE "ServiceSchedule" ADD CONSTRAINT "ServiceSchedule_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
