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
    const encryptedToken = 'st:v1:test:encrypted-fixture';
    const legacyToken = 'legacy-plaintext-fixture';

    await integrationPrisma.socialPlatform.create({
      data: {
        influencerId: profile.id,
        platformName: 'INSTAGRAM',
        platformId: 'integration-instagram-token',
        accessToken: encryptedToken,
      },
    });
    await integrationPrisma.socialPlatform.create({
      data: {
        influencerId: profile.id,
        platformName: 'TIKTOK',
        platformId: 'integration-tiktok-token',
        accessToken: legacyToken,
      },
    });

    const platforms = await integrationPrisma.socialPlatform.findMany({
      where: { influencerId: profile.id },
      orderBy: { platformName: 'asc' },
      select: { platformName: true, accessToken: true },
    });

    expect(platforms).toEqual([
      { platformName: 'INSTAGRAM', accessToken: encryptedToken },
      { platformName: 'TIKTOK', accessToken: legacyToken },
    ]);
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
});
