-- Backfill only the newly introduced operational sync state. This migration
-- never reads, modifies, or exposes social tokens or metric values.
WITH "latestInstagramSnapshot" AS (
    SELECT "influencerId", MAX("capturedAt") AS "capturedAt"
    FROM "MetricSnapshot"
    WHERE "provider" = 'INSTAGRAM'
    GROUP BY "influencerId"
)
UPDATE "SocialPlatform" AS "platform"
SET
    "lastSyncStatus" = CASE
        WHEN NOT "platform"."isActive" THEN 'DISABLED'::"SocialSyncStatus"
        WHEN "platform"."platformName" = 'INSTAGRAM' AND "snapshot"."capturedAt" IS NOT NULL THEN 'SYNCED'::"SocialSyncStatus"
        ELSE 'NEVER_SYNCED'::"SocialSyncStatus"
    END,
    "lastSyncAttemptAt" = CASE
        WHEN "platform"."platformName" = 'INSTAGRAM' THEN "snapshot"."capturedAt"
        ELSE NULL
    END,
    "lastSyncSuccessAt" = CASE
        WHEN "platform"."platformName" = 'INSTAGRAM' THEN "snapshot"."capturedAt"
        ELSE NULL
    END,
    "lastSyncFailureAt" = NULL,
    "lastSyncErrorCode" = NULL,
    "syncFailureCount" = 0,
    "nextSyncRetryAt" = NULL,
    "syncLeaseExpiresAt" = NULL
FROM "latestInstagramSnapshot" AS "snapshot"
WHERE "snapshot"."influencerId" = "platform"."influencerId";

-- The UPDATE above covers Instagram profiles with a prior snapshot. Apply the
-- deterministic default state to profiles without one, including all inactive
-- integrations, without changing credentials or historical snapshots.
UPDATE "SocialPlatform" AS "platform"
SET
    "lastSyncStatus" = CASE
        WHEN NOT "platform"."isActive" THEN 'DISABLED'::"SocialSyncStatus"
        ELSE 'NEVER_SYNCED'::"SocialSyncStatus"
    END,
    "lastSyncAttemptAt" = NULL,
    "lastSyncSuccessAt" = NULL,
    "lastSyncFailureAt" = NULL,
    "lastSyncErrorCode" = NULL,
    "syncFailureCount" = 0,
    "nextSyncRetryAt" = NULL,
    "syncLeaseExpiresAt" = NULL
WHERE NOT EXISTS (
    SELECT 1
    FROM "MetricSnapshot" AS "snapshot"
    WHERE "snapshot"."provider" = 'INSTAGRAM'
      AND "snapshot"."influencerId" = "platform"."influencerId"
);
