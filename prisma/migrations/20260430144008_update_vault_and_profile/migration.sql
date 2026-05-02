-- AlterTable
ALTER TABLE "InfluencerProfile" ADD COLUMN "profileImageUrl" TEXT;

-- CreateTable
CREATE TABLE "TrendReference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "influencerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "thumbnail" TEXT,
    "niche" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "TrendReference_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "InfluencerProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "influencerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledDate" DATETIME,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "fromAI" BOOLEAN NOT NULL DEFAULT false,
    "proofUrl" TEXT,
    "performanceMultiplier" REAL,
    CONSTRAINT "Task_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "InfluencerProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("id", "influencerId", "isDone", "scheduledDate", "title") SELECT "id", "influencerId", "isDone", "scheduledDate", "title" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_influencerId_scheduledDate_idx" ON "Task"("influencerId", "scheduledDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
