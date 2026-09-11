-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "profileImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "accentColor" TEXT NOT NULL DEFAULT '#a855f7',
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'TRIAL',
    "subscriptionTier" TEXT NOT NULL DEFAULT 'FREE',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "featuredUntil" TIMESTAMP(3),
    "credits" INTEGER NOT NULL DEFAULT 0,
    "trialEndsAt" TIMESTAMP(3),
    "stripeCustomerId" TEXT,
    "stripeConnectAccountId" TEXT,
    "fcmToken" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "interval" TEXT NOT NULL,
    "externalId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "externalId" TEXT,
    "status" TEXT NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfluencerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "profileImageUrl" TEXT,
    "verifiedMetrics" BOOLEAN NOT NULL DEFAULT false,
    "niche" TEXT,
    "careerObjective" TEXT,
    "aiInterview" JSONB,
    "influScore" INTEGER NOT NULL DEFAULT 0,
    "scoreClass" TEXT NOT NULL DEFAULT 'BRONZE',
    "dailyMission" TEXT,
    "missionCompleted" BOOLEAN NOT NULL DEFAULT false,
    "lastMissionUpdate" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "city" TEXT,
    "state" TEXT,
    "bio" TEXT,
    "insights" JSONB,
    "topPosts" JSONB,
    "shippingAddress" TEXT,
    "poBox" TEXT,
    "shareAddress" BOOLEAN NOT NULL DEFAULT false,
    "pixKey" TEXT,
    "pixKeyType" TEXT,

    CONSTRAINT "InfluencerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrendReference" (
    "id" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "thumbnail" TEXT,
    "niche" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrendReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "segment" TEXT,
    "employeeCount" TEXT,
    "campaignBudget" TEXT,
    "salesGoal" TEXT,
    "averageTicket" TEXT,
    "instagramPositioning" TEXT,
    "logoUrl" TEXT,
    "bio" TEXT,

    CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingAnalysis" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "analysisType" TEXT NOT NULL,
    "inputs" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "planTier" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPlatform" (
    "id" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "platformName" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "username" TEXT,
    "profilePicture" TEXT,
    "followersCount" INTEGER NOT NULL DEFAULT 0,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SocialPlatform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricSnapshot" (
    "id" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "followers" INTEGER NOT NULL,
    "engagementRate" DOUBLE PRECISION NOT NULL,
    "reachLast30Days" INTEGER NOT NULL,
    "avgViews" INTEGER NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "integrityHash" TEXT NOT NULL,

    CONSTRAINT "MetricSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "briefing" TEXT,
    "aiScript" TEXT,
    "budget" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION,
    "netAmount" DOUBLE PRECISION,
    "successFeeRate" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "escrowStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "externalTxId" TEXT,
    "releaseTxId" TEXT,
    "idempotencyKey" TEXT,
    "mpPaymentId" TEXT,
    "mpPreferenceId" TEXT,
    "mpPixQrCode" TEXT,
    "mpPixQrCodeBase64" TEXT,
    "contractType" TEXT NOT NULL DEFAULT 'SPOT',
    "companySigned" BOOLEAN NOT NULL DEFAULT false,
    "influencerSigned" BOOLEAN NOT NULL DEFAULT false,
    "companyIp" TEXT,
    "influencerIp" TEXT,
    "signatureHash" TEXT,
    "signedAt" TIMESTAMP(3),
    "exclusivityDays" INTEGER DEFAULT 0,
    "usageRightsDays" INTEGER DEFAULT 30,
    "allowPaidMedia" BOOLEAN NOT NULL DEFAULT false,
    "legalTerms" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deliverable" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "proofUrl" TEXT,

    CONSTRAINT "Deliverable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "fromAI" BOOLEAN NOT NULL DEFAULT false,
    "proofUrl" TEXT,
    "performanceMultiplier" DOUBLE PRECISION,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateCard" (
    "id" TEXT NOT NULL,
    "influencerId" TEXT,
    "companyId" TEXT,
    "serviceName" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "description" TEXT,

    CONSTRAINT "RateCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminStrategy" (
    "id" TEXT NOT NULL,
    "strategyTitle" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "targetMetric" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminStrategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAnalysis" (
    "id" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "analysisText" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recebido" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "trackingCode" TEXT,
    "shippingCarrier" TEXT,
    "sentAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recebido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeConnectAccountId_key" ON "User"("stripeConnectAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_externalId_key" ON "Subscription"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "InfluencerProfile_userId_key" ON "InfluencerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InfluencerProfile_handle_key" ON "InfluencerProfile"("handle");

-- CreateIndex
CREATE INDEX "InfluencerProfile_niche_scoreClass_influScore_idx" ON "InfluencerProfile"("niche", "scoreClass", "influScore");

-- CreateIndex
CREATE INDEX "InfluencerProfile_city_state_idx" ON "InfluencerProfile"("city", "state");

-- CreateIndex
CREATE UNIQUE INDEX "Review_contractId_key" ON "Review"("contractId");

-- CreateIndex
CREATE INDEX "Review_influencerId_idx" ON "Review"("influencerId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyProfile_userId_key" ON "CompanyProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyProfile_taxId_key" ON "CompanyProfile"("taxId");

-- CreateIndex
CREATE INDEX "MarketingAnalysis_companyId_createdAt_idx" ON "MarketingAnalysis"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SocialPlatform_influencerId_platformName_key" ON "SocialPlatform"("influencerId", "platformName");

-- CreateIndex
CREATE INDEX "MetricSnapshot_influencerId_capturedAt_idx" ON "MetricSnapshot"("influencerId", "capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_releaseTxId_key" ON "Contract"("releaseTxId");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_idempotencyKey_key" ON "Contract"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Contract_companyId_escrowStatus_idx" ON "Contract"("companyId", "escrowStatus");

-- CreateIndex
CREATE INDEX "Contract_influencerId_escrowStatus_idx" ON "Contract"("influencerId", "escrowStatus");

-- CreateIndex
CREATE INDEX "Deliverable_contractId_status_idx" ON "Deliverable"("contractId", "status");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_type_idx" ON "Notification"("userId", "type");

-- CreateIndex
CREATE INDEX "Task_influencerId_scheduledDate_idx" ON "Task"("influencerId", "scheduledDate");

-- CreateIndex
CREATE INDEX "RateCard_influencerId_idx" ON "RateCard"("influencerId");

-- CreateIndex
CREATE INDEX "RateCard_companyId_idx" ON "RateCard"("companyId");

-- CreateIndex
CREATE INDEX "AIAnalysis_influencerId_generatedAt_idx" ON "AIAnalysis"("influencerId", "generatedAt");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerProfile" ADD CONSTRAINT "InfluencerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrendReference" ADD CONSTRAINT "TrendReference_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "InfluencerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "InfluencerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyProfile" ADD CONSTRAINT "CompanyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingAnalysis" ADD CONSTRAINT "MarketingAnalysis_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPlatform" ADD CONSTRAINT "SocialPlatform_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "InfluencerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricSnapshot" ADD CONSTRAINT "MetricSnapshot_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "InfluencerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "InfluencerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "InfluencerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateCard" ADD CONSTRAINT "RateCard_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "InfluencerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateCard" ADD CONSTRAINT "RateCard_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnalysis" ADD CONSTRAINT "AIAnalysis_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "InfluencerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recebido" ADD CONSTRAINT "Recebido_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recebido" ADD CONSTRAINT "Recebido_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "InfluencerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
