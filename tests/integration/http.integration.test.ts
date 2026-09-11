import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { randomUUID } from 'node:crypto';

const mockStripeCheckoutCreate = jest.fn();
const mockMercadoPagoCreatePix = jest.fn();

jest.mock('../../src/lib/stripe', () => ({
  stripe: { checkout: { sessions: { create: mockStripeCheckoutCreate } } },
}));

jest.mock('../../src/services/mercadopago.service', () => ({
  MercadoPagoService: { createContractPix: mockMercadoPagoCreatePix },
}));

jest.mock('../../src/queues/notification.queue', () => ({
  addNotificationJob: jest.fn(),
}));

jest.mock('../../src/queues/post-analyzer.queue', () => ({
  addPostAnalysisJob: jest.fn(),
}));

jest.mock('../../src/services/calendar.service', () => ({
  CalendarService: { syncTaskToCalendar: jest.fn() },
}));

jest.mock('../../src/services/twoFactor.service', () => ({
  TwoFactorService: { verifyToken: jest.fn(), generateSecret: jest.fn() },
}));

import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { getJwtSecret } from '../../src/lib/jwt-secret';
import {
  clearIntegrationDatabase,
  disconnectIntegrationPrisma,
  integrationPrisma,
} from '../helpers/postgres-integration';

type TestUser = { id: string; email: string; role: 'INFLUENCER' | 'COMPANY' | 'ADMIN' };

function fakeEmail(prefix = 'http'): string {
  return `${prefix}-${randomUUID()}@example.test`;
}

function fakeHandle(): string {
  return `http_${randomUUID().replace(/-/g, '')}`;
}

function sessionHeader(user: TestUser): { Authorization: string } {
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, purpose: 'session' },
    getJwtSecret(),
    { algorithm: 'HS256', expiresIn: '1h' },
  );

  return { Authorization: `Bearer ${token}` };
}

async function createUser(role: TestUser['role'] = 'INFLUENCER'): Promise<TestUser> {
  const user = await integrationPrisma.user.create({
    data: {
      email: fakeEmail(),
      passwordHash: await bcrypt.hash('IntegrationPass123!', 4),
      role,
    },
    select: { id: true, email: true, role: true },
  });

  return user as TestUser;
}

async function createInfluencer() {
  const user = await createUser('INFLUENCER');
  const profile = await integrationPrisma.influencerProfile.create({
    data: { userId: user.id, handle: fakeHandle() },
  });

  return { user, profile };
}

async function createCompany() {
  const user = await createUser('COMPANY');
  const profile = await integrationPrisma.companyProfile.create({
    data: {
      userId: user.id,
      companyName: 'HTTP Integration Company',
      taxId: `http-tax-${randomUUID()}`,
    },
  });

  return { user, profile };
}

async function createContractFixture() {
  const company = await createCompany();
  const influencer = await createInfluencer();
  const contract = await integrationPrisma.contract.create({
    data: {
      companyId: company.profile.id,
      influencerId: influencer.profile.id,
      title: 'HTTP Integration Contract',
      budget: 100,
    },
  });

  return { company, influencer, contract };
}

beforeEach(async () => {
  await clearIntegrationDatabase();
  jest.clearAllMocks();
});

afterAll(async () => {
  await clearIntegrationDatabase();
  await prisma.$disconnect();
  await disconnectIntegrationPrisma();
});

describe('PostgreSQL HTTP integration smoke tests', () => {
  it('rejects a public ADMIN signup attempt', async () => {
    const response = await request(app)
      .post('/v1/auth/signup')
      .send({ email: fakeEmail('admin-attempt'), password: 'IntegrationPass123!', role: 'ADMIN' })
      .expect(400);

    expect(response.body).not.toHaveProperty('user');
    expect(await integrationPrisma.user.count()).toBe(0);
  });

  it('registers an influencer through the public signup route', async () => {
    const influencerEmail = fakeEmail('signup-influencer');

    await request(app)
      .post('/v1/auth/signup')
      .send({ email: influencerEmail, password: 'IntegrationPass123!', role: 'INFLUENCER' })
      .expect(201);

    const influencer = await integrationPrisma.user.findUnique({
      where: { email: influencerEmail },
      include: { influencer: true },
    });

    expect(influencer).toMatchObject({ role: 'INFLUENCER', influencer: expect.any(Object) });
  });

  it('registers a company through the public signup route', async () => {
    const companyEmail = fakeEmail('signup-company');

    await request(app)
      .post('/v1/auth/signup')
      .send({ email: companyEmail, password: 'IntegrationPass123!', role: 'COMPANY' })
      .expect(201);

    await expect(integrationPrisma.user.findUnique({ where: { email: companyEmail } }))
      .resolves.toMatchObject({ role: 'COMPANY' });
  });

  it('returns an HttpOnly session cookie on login without a JWT in JSON', async () => {
    const user = await createUser();

    const response = await request(app)
      .post('/v1/auth/login')
      .send({ email: user.email, password: 'IntegrationPass123!' })
      .expect(200);

    const setCookie = response.headers['set-cookie'];
    const cookie = Array.isArray(setCookie) ? setCookie.join(';') : setCookie || '';
    expect(cookie).toContain('influnext_token=');
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Path=\//i);
    expect(response.body).not.toHaveProperty('token');
    expect(response.body).not.toHaveProperty('accessToken');
    expect(response.body).not.toHaveProperty('refreshToken');

    const sessionCookie = Array.isArray(setCookie) ? setCookie[0]?.split(';')[0] : setCookie?.split(';')[0];
    await request(app)
      .get('/v1/auth/me')
      .set('Cookie', sessionCookie || '')
      .expect(200);
  });

  it('rejects a protected route without a session', async () => {
    await request(app).get('/v1/auth/me').expect(401);
  });

  it('allows a task owner to update and complete its task while hiding it from another influencer', async () => {
    const owner = await createInfluencer();
    const other = await createInfluencer();
    const task = await integrationPrisma.task.create({
      data: { influencerId: owner.profile.id, title: 'Owner-only HTTP task' },
    });

    const toggled = await request(app)
      .patch(`/v1/tasks/${task.id}/toggle`)
      .set(sessionHeader(owner.user))
      .expect(200);
    expect(toggled.body).toMatchObject({ id: task.id, isDone: true });

    const completed = await request(app)
      .post(`/v1/tasks/${task.id}/complete`)
      .set(sessionHeader(owner.user))
      .send({ proofUrl: 'https://example.test/proof' })
      .expect(200);
    expect(completed.body).toMatchObject({ id: task.id, isDone: true, proofUrl: 'https://example.test/proof' });

    const hidden = await request(app)
      .post(`/v1/tasks/${task.id}/complete`)
      .set(sessionHeader(other.user))
      .send({ proofUrl: 'https://example.test/foreign-proof' })
      .expect(404);
    expect(hidden.body).toEqual({ error: 'Tarefa não encontrada.' });
  });

  it('returns a contract to participants and hides it from a non-participant', async () => {
    const { company, influencer, contract } = await createContractFixture();
    const otherCompany = await createCompany();

    const companyResponse = await request(app)
      .get(`/v1/contracts/${contract.id}`)
      .set(sessionHeader(company.user))
      .expect(200);
    expect(companyResponse.body).toMatchObject({ id: contract.id, companyId: company.profile.id });

    const companyUpdate = await request(app)
      .patch(`/v1/contracts/${contract.id}/script`)
      .set(sessionHeader(company.user))
      .send({ aiScript: 'Owner-only contract update' })
      .expect(200);
    expect(companyUpdate.body).toMatchObject({ contract: { id: contract.id, aiScript: 'Owner-only contract update' } });

    const influencerResponse = await request(app)
      .get(`/v1/contracts/${contract.id}`)
      .set(sessionHeader(influencer.user))
      .expect(200);
    expect(influencerResponse.body).toMatchObject({ id: contract.id, influencerId: influencer.profile.id });

    const hidden = await request(app)
      .get(`/v1/contracts/${contract.id}`)
      .set(sessionHeader(otherCompany.user))
      .expect(404);
    expect(hidden.body).toEqual({ error: 'Contrato não encontrado.' });

    await request(app)
      .patch(`/v1/contracts/${contract.id}/script`)
      .set(sessionHeader(otherCompany.user))
      .send({ aiScript: 'Foreign update attempt' })
      .expect(404);
  });

  it('blocks non-company and non-owner payment requests before Stripe or Mercado Pago can run', async () => {
    const { company, influencer, contract } = await createContractFixture();
    const otherCompany = await createCompany();

    await request(app)
      .post('/v1/payments/create-order')
      .set(sessionHeader(influencer.user))
      .send({ contractId: contract.id })
      .expect(403);

    await request(app)
      .post('/v1/payments/mercadopago/pix')
      .set(sessionHeader(otherCompany.user))
      .send({ contractId: contract.id })
      .expect(404);

    await request(app)
      .post('/v1/payments/create-order')
      .set(sessionHeader(otherCompany.user))
      .send({ contractId: contract.id })
      .expect(404);

    expect(mockMercadoPagoCreatePix).not.toHaveBeenCalled();
    expect(mockStripeCheckoutCreate).not.toHaveBeenCalled();
    expect(company.user.role).toBe('COMPANY');
  });
});
