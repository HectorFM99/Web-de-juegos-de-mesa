-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'USER';
ALTER TABLE "users" ADD COLUMN     "banned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN     "bannedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN     "bannedReason" TEXT;
