-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPERADMIN', 'SUPPORT', 'FINANCE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'ADMIN_LOGIN';
ALTER TYPE "AuditAction" ADD VALUE 'ADMIN_LOGOUT';
ALTER TYPE "AuditAction" ADD VALUE 'USER_BLOCKED';
ALTER TYPE "AuditAction" ADD VALUE 'USER_UNBLOCKED';
ALTER TYPE "AuditAction" ADD VALUE 'CHURCH_SUSPENDED';
ALTER TYPE "AuditAction" ADD VALUE 'CHURCH_REACTIVATED';
ALTER TYPE "AuditAction" ADD VALUE 'PLAN_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'SUBSCRIPTION_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'IMPERSONATE_USER';
ALTER TYPE "AuditAction" ADD VALUE 'IMPERSONATE_CHURCH_OWNER';
ALTER TYPE "AuditAction" ADD VALUE 'PASSWORD_RESET_SENT';
ALTER TYPE "AuditAction" ADD VALUE 'ADMIN_CONFIG_UPDATED';

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "adminUserId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isBlocked" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "adminRole" "AdminRole" NOT NULL DEFAULT 'SUPPORT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AuditLog_adminUserId_idx" ON "AuditLog"("adminUserId");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
