-- AlterTable: Adiciona campo isActive ao Church (se a tabela existir)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'Church'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Church' 
      AND column_name = 'isActive'
    ) THEN
      ALTER TABLE "Church" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
    END IF;
  END IF;
END $$;

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM (
  'MEMBER_CREATED',
  'MEMBER_UPDATED',
  'MEMBER_DELETED',
  'MEMBER_ROLE_CHANGED',
  'MEMBER_PERMISSIONS_CHANGED',
  'BRANCH_CREATED',
  'BRANCH_UPDATED',
  'BRANCH_DELETED',
  'CHURCH_CREATED',
  'CHURCH_UPDATED',
  'CHURCH_DELETED',
  'PERMISSION_GRANTED',
  'PERMISSION_REVOKED',
  'LOGIN',
  'LOGOUT',
  'PLAN_LIMIT_EXCEEDED',
  'UNAUTHORIZED_ACCESS_ATTEMPT'
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "userRole" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

