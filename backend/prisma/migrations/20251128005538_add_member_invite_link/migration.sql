-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'MEMBER_REGISTRATION_ATTEMPT';
ALTER TYPE "AuditAction" ADD VALUE 'INVITE_LINK_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'INVITE_LINK_DEACTIVATED';

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "inviteLinkId" TEXT;

-- CreateTable
CREATE TABLE "MemberInviteLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "maxUses" INTEGER,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberInviteLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberInviteLink_token_key" ON "MemberInviteLink"("token");

-- CreateIndex
CREATE INDEX "MemberInviteLink_token_idx" ON "MemberInviteLink"("token");

-- CreateIndex
CREATE INDEX "MemberInviteLink_branchId_idx" ON "MemberInviteLink"("branchId");

-- CreateIndex
CREATE INDEX "MemberInviteLink_isActive_idx" ON "MemberInviteLink"("isActive");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_inviteLinkId_fkey" FOREIGN KEY ("inviteLinkId") REFERENCES "MemberInviteLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberInviteLink" ADD CONSTRAINT "MemberInviteLink_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
