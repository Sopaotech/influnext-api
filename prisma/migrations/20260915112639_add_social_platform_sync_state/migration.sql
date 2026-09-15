-- CreateEnum
CREATE TYPE "SocialSyncStatus" AS ENUM ('NEVER_SYNCED', 'SYNC_PENDING', 'SYNCING', 'SYNCED', 'PARTIAL', 'NO_RECENT_MEDIA', 'FAILED_RETRYABLE', 'FAILED_RECONNECT_REQUIRED', 'DISABLED');

-- AlterTable
ALTER TABLE "SocialPlatform" ADD COLUMN     "lastSyncAttemptAt" TIMESTAMP(3),
ADD COLUMN     "lastSyncErrorCode" TEXT,
ADD COLUMN     "lastSyncFailureAt" TIMESTAMP(3),
ADD COLUMN     "lastSyncStatus" "SocialSyncStatus" NOT NULL DEFAULT 'NEVER_SYNCED',
ADD COLUMN     "lastSyncSuccessAt" TIMESTAMP(3),
ADD COLUMN     "nextSyncRetryAt" TIMESTAMP(3),
ADD COLUMN     "syncFailureCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "syncLeaseExpiresAt" TIMESTAMP(3);
