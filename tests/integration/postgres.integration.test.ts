import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import {
  clearIntegrationDatabase,
  disconnectIntegrationPrisma,
  integrationPrisma,
} from '../helpers/postgres-integration';

function fakeEmail(): string {
  return `integration-${randomUUID()}@example.test`;
}

function fakeHandle(): string {
  return `integration_${randomUUID().replace(/-/g, '')}`;
}

async function createUser() {
  return integrationPrisma.user.create({
    data: {
      email: fakeEmail(),
      passwordHash: 'integration-test-hash',
      role: 'INFLUENCER',
    },
  });
}

async function createInfluencerProfile() {
  const user = await createUser();
  return integrationPrisma.influencerProfile.create({
    data: {
      userId: user.id,
      handle: fakeHandle(),
    },
  });
}

async function createCompanyProfile() {
  const user = await integrationPrisma.user.create({
    data: {
      email: fakeEmail(),
      passwordHash: 'integration-test-hash',
      role: 'COMPANY',
    },
  });

  return integrationPrisma.companyProfile.create({
    data: {
      userId: user.id,
      companyName: 'Integration Test Company',
      taxId: `integration-tax-${randomUUID()}`,
    },
  });
}

async function createContractFixture() {
  const company = await createCompanyProfile();
  const influencer = await createInfluencerProfile();
  const contract = await integrationPrisma.contract.create({
    data: {
      companyId: company.id,
      influencerId: influencer.id,
      title: 'Integration Test Contract',
      budget: 125.5,
    },
  });

  return { company, influencer, contract };
}

beforeEach(async () => {
  await clearIntegrationDatabase();
});

afterAll(async () => {
  await clearIntegrationDatabase();
  await disconnectIntegrationPrisma();
});

describe('PostgreSQL integration constraints', () => {
  it('enforces the User.email unique constraint', async () => {
    const email = fakeEmail();
    const user = {
      email,
      passwordHash: 'integration-test-hash',
      role: 'INFLUENCER',
    };

    await integrationPrisma.user.create({ data: user });

    await expect(integrationPrisma.user.create({ data: user })).rejects.toMatchObject<Partial<Prisma.PrismaClientKnownRequestError>>({
      code: 'P2002',
    });
  });

  it('enforces the InfluencerProfile.handle unique constraint', async () => {
    const firstUser = await createUser();
    const secondUser = await createUser();
    const handle = fakeHandle();

    await integrationPrisma.influencerProfile.create({
      data: { userId: firstUser.id, handle },
    });

    await expect(integrationPrisma.influencerProfile.create({
      data: { userId: secondUser.id, handle },
    })).rejects.toMatchObject<Partial<Prisma.PrismaClientKnownRequestError>>({
      code: 'P2002',
    });
  });

  it('enforces one SocialPlatform per influencer and platform name', async () => {
    const profile = await createInfluencerProfile();

    await integrationPrisma.socialPlatform.create({
      data: {
        influencerId: profile.id,
        platformName: 'INSTAGRAM',
        platformId: 'integration-instagram-1',
        accessToken: 'st:v1:test:encrypted-fixture',
      },
    });

    await expect(integrationPrisma.socialPlatform.create({
      data: {
        influencerId: profile.id,
        platformName: 'INSTAGRAM',
        platformId: 'integration-instagram-2',
        accessToken: 'st:v1:test:another-encrypted-fixture',
      },
    })).rejects.toMatchObject<Partial<Prisma.PrismaClientKnownRequestError>>({
      code: 'P2002',
    });
  });

  it('enforces the User to InfluencerProfile foreign key', async () => {
    await expect(integrationPrisma.influencerProfile.create({
      data: {
        userId: randomUUID(),
        handle: fakeHandle(),
      },
    })).rejects.toMatchObject<Partial<Prisma.PrismaClientKnownRequestError>>({
      code: 'P2003',
    });
  });

  it('persists encrypted-envelope and legacy plaintext social tokens as strings', async () => {
    const profile = await createInfluencerProfile();
    const encryptedAccessToken = 'st:v1:test:encrypted-access-fixture';
    const encryptedRefreshToken = 'st:v1:test:encrypted-refresh-fixture';
    const legacyAccessToken = 'legacy-plaintext-access-fixture';
    const legacyRefreshToken = 'legacy-plaintext-refresh-fixture';

    await integrationPrisma.socialPlatform.create({
      data: {
        influencerId: profile.id,
        platformName: 'INSTAGRAM',
        platformId: 'integration-instagram-token',
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
      },
    });
    await integrationPrisma.socialPlatform.create({
      data: {
        influencerId: profile.id,
        platformName: 'TIKTOK',
        platformId: 'integration-tiktok-token',
        accessToken: legacyAccessToken,
        refreshToken: legacyRefreshToken,
      },
    });

    const platforms = await integrationPrisma.socialPlatform.findMany({
      where: { influencerId: profile.id },
      orderBy: { platformName: 'asc' },
      select: { platformName: true, accessToken: true, refreshToken: true },
    });

    expect(platforms).toEqual([
      {
        platformName: 'INSTAGRAM',
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
      },
      {
        platformName: 'TIKTOK',
        accessToken: legacyAccessToken,
        refreshToken: legacyRefreshToken,
      },
    ]);

    const safeProjection = await integrationPrisma.socialPlatform.findUniqueOrThrow({
      where: {
        influencerId_platformName: {
          influencerId: profile.id,
          platformName: 'INSTAGRAM',
        },
      },
      select: { id: true, platformName: true, platformId: true, isActive: true },
    });

    expect(safeProjection).not.toHaveProperty('accessToken');
    expect(safeProjection).not.toHaveProperty('refreshToken');
  });

  it('persists JSON fields as PostgreSQL JSONB', async () => {
    const user = await createUser();
    const payload = { source: 'integration-test', nested: { enabled: true } };

    const profile = await integrationPrisma.influencerProfile.create({
      data: {
        userId: user.id,
        handle: fakeHandle(),
        aiInterview: payload,
        insights: payload,
      },
      select: { aiInterview: true, insights: true },
    });

    expect(profile.aiInterview).toEqual(payload);
    expect(profile.insights).toEqual(payload);
  });

  it('persists and returns DateTime values consistently', async () => {
    const profile = await createInfluencerProfile();
    const expiresAt = new Date('2026-03-04T05:06:07.890Z');

    const platform = await integrationPrisma.socialPlatform.create({
      data: {
        influencerId: profile.id,
        platformName: 'YOUTUBE',
        platformId: 'integration-youtube-expiry',
        accessToken: 'st:v1:test:date-fixture',
        expiresAt,
      },
      select: { expiresAt: true },
    });

    expect(platform.expiresAt?.getTime()).toBe(expiresAt.getTime());
  });

  it('resolves Task ownership through User and InfluencerProfile relations', async () => {
    const influencer = await createInfluencerProfile();
    const task = await integrationPrisma.task.create({
      data: {
        influencerId: influencer.id,
        title: 'Integration ownership task',
      },
    });

    const ownedTask = await integrationPrisma.task.findFirst({
      where: { id: task.id, influencer: { userId: influencer.userId } },
      select: { influencerId: true, influencer: { select: { userId: true } } },
    });
    const foreignTask = await integrationPrisma.task.findFirst({
      where: { id: task.id, influencer: { userId: randomUUID() } },
    });

    expect(ownedTask).toEqual({
      influencerId: influencer.id,
      influencer: { userId: influencer.userId },
    });
    expect(foreignTask).toBeNull();
  });

  it('resolves Contract ownership through CompanyProfile and User relations', async () => {
    const { company, contract } = await createContractFixture();

    const ownedContract = await integrationPrisma.contract.findFirst({
      where: { id: contract.id, company: { userId: company.userId } },
      select: { companyId: true, company: { select: { userId: true } } },
    });
    const foreignContract = await integrationPrisma.contract.findFirst({
      where: { id: contract.id, company: { userId: randomUUID() } },
    });

    expect(ownedContract).toEqual({
      companyId: company.id,
      company: { userId: company.userId },
    });
    expect(foreignContract).toBeNull();
  });

  it('resolves Contract ownership through InfluencerProfile and User relations', async () => {
    const { influencer, contract } = await createContractFixture();

    const ownedContract = await integrationPrisma.contract.findFirst({
      where: { id: contract.id, influencer: { userId: influencer.userId } },
      select: { influencerId: true, influencer: { select: { userId: true } } },
    });
    const foreignContract = await integrationPrisma.contract.findFirst({
      where: { id: contract.id, influencer: { userId: randomUUID() } },
    });

    expect(ownedContract).toEqual({
      influencerId: influencer.id,
      influencer: { userId: influencer.userId },
    });
    expect(foreignContract).toBeNull();
  });

  it('persists the basic Contract lifecycle, Float values, deliverables, and JSONB terms', async () => {
    const company = await createCompanyProfile();
    const influencer = await createInfluencerProfile();
    const deadline = new Date('2026-04-05T06:07:08.900Z');
    const legalTerms = {
      version: 1,
      clauses: [
        { code: 'usage', durationDays: 30 },
        { code: 'exclusivity', enabled: false },
      ],
      metadata: { source: 'integration-test', reviewed: true },
    };

    const contract = await integrationPrisma.contract.create({
      data: {
        companyId: company.id,
        influencerId: influencer.id,
        title: 'Lifecycle persistence contract',
        budget: 250.75,
        platformFee: 25.08,
        netAmount: 225.67,
        legalTerms,
        deliverables: {
          create: {
            type: 'POST',
            deadline,
          },
        },
      },
      include: { company: true, influencer: true, deliverables: true },
    });

    expect(contract.escrowStatus).toBe('DRAFT');
    expect(contract.budget).toBeCloseTo(250.75);
    expect(contract.platformFee).toBeCloseTo(25.08);
    expect(contract.netAmount).toBeCloseTo(225.67);
    expect(contract.createdAt).toBeInstanceOf(Date);
    expect(contract.company.id).toBe(company.id);
    expect(contract.influencer.id).toBe(influencer.id);
    expect(contract.legalTerms).toEqual(legalTerms);
    expect(contract.deliverables).toHaveLength(1);
    expect(contract.deliverables[0]).toMatchObject({ type: 'POST', status: 'PENDING' });
    expect(contract.deliverables[0].deadline.getTime()).toBe(deadline.getTime());
  });

  it('persists payment identifiers and enforces the unique identifiers defined by the schema', async () => {
    const company = await createCompanyProfile();
    const influencer = await createInfluencerProfile();
    const releaseTxId = `release-${randomUUID()}`;
    const idempotencyKey = `idempotency-${randomUUID()}`;

    const contract = await integrationPrisma.contract.create({
      data: {
        companyId: company.id,
        influencerId: influencer.id,
        title: 'Payment identifier contract',
        budget: 99.99,
        externalTxId: `external-${randomUUID()}`,
        releaseTxId,
        idempotencyKey,
        mpPaymentId: `mp-payment-${randomUUID()}`,
        mpPreferenceId: `mp-preference-${randomUUID()}`,
      },
      select: {
        externalTxId: true,
        releaseTxId: true,
        idempotencyKey: true,
        mpPaymentId: true,
        mpPreferenceId: true,
      },
    });

    expect(contract).toEqual({
      externalTxId: expect.stringMatching(/^external-/),
      releaseTxId,
      idempotencyKey,
      mpPaymentId: expect.stringMatching(/^mp-payment-/),
      mpPreferenceId: expect.stringMatching(/^mp-preference-/),
    });

    await expect(integrationPrisma.contract.create({
      data: {
        companyId: company.id,
        influencerId: influencer.id,
        title: 'Duplicate release identifier',
        budget: 1,
        releaseTxId,
        idempotencyKey: `idempotency-${randomUUID()}`,
      },
    })).rejects.toMatchObject<Partial<Prisma.PrismaClientKnownRequestError>>({ code: 'P2002' });

    await expect(integrationPrisma.contract.create({
      data: {
        companyId: company.id,
        influencerId: influencer.id,
        title: 'Duplicate idempotency identifier',
        budget: 1,
        releaseTxId: `release-${randomUUID()}`,
        idempotencyKey,
      },
    })).rejects.toMatchObject<Partial<Prisma.PrismaClientKnownRequestError>>({ code: 'P2002' });
  });

  it('removes data from representative tables during integration cleanup', async () => {
    const { influencer } = await createContractFixture();
    await integrationPrisma.task.create({
      data: { influencerId: influencer.id, title: 'Cleanup verification task' },
    });
    await integrationPrisma.socialPlatform.create({
      data: {
        influencerId: influencer.id,
        platformName: 'INSTAGRAM',
        platformId: 'cleanup-platform',
        accessToken: 'st:v1:test:cleanup-fixture',
      },
    });

    await clearIntegrationDatabase();

    const [users, influencers, companies, contracts, tasks, platforms] = await Promise.all([
      integrationPrisma.user.count(),
      integrationPrisma.influencerProfile.count(),
      integrationPrisma.companyProfile.count(),
      integrationPrisma.contract.count(),
      integrationPrisma.task.count(),
      integrationPrisma.socialPlatform.count(),
    ]);

    expect([users, influencers, companies, contracts, tasks, platforms]).toEqual([0, 0, 0, 0, 0, 0]);
  });
});
