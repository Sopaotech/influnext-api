import express from 'express';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

const mockUserFindUnique = jest.fn();
const mockUserCreate = jest.fn();
const mockUserUpsert = jest.fn();
const mockInfluencerCreate = jest.fn();
const mockBcryptHash = jest.fn().mockResolvedValue('hashed-password');

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: mockUserFindUnique,
      create: mockUserCreate,
      upsert: mockUserUpsert,
    },
    influencerProfile: {
      create: mockInfluencerCreate,
    },
  },
}));

jest.mock('bcrypt', () => ({
  __esModule: true,
  default: {
    hash: mockBcryptHash,
    compare: jest.fn(),
  },
}));

jest.mock('../src/services/twoFactor.service', () => ({
  TwoFactorService: {
    generateSetup: jest.fn(),
    verify: jest.fn(),
  },
}));

import { signup } from '../src/controllers/auth.controller';
import { authenticate } from '../src/middlewares/auth.middleware';
import { developmentOrTestOnly } from '../src/middlewares/environment.middleware';
import { getJwtSecret } from '../src/lib/jwt-secret';
import { ensureAdminExists } from '../src/lib/admin-init';

function createResponse() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('STEP 1A — Identity & Administrative Security', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, NODE_ENV: 'test', JWT_SECRET: 'test-only-jwt-secret' };
    mockUserFindUnique.mockResolvedValue(null);
    mockUserCreate.mockImplementation(({ data }: any) => Promise.resolve({
      id: 'user-1',
      email: data.email,
      role: data.role,
      createdAt: new Date(),
    }));
    mockInfluencerCreate.mockResolvedValue({ id: 'profile-1' });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it.each(['INFLUENCER', 'COMPANY'] as const)('permite signup público com role %s', async (role) => {
    const req: any = {
      body: { email: `${role.toLowerCase()}@example.com`, password: 'secure-password', role },
    };
    const res = createResponse();

    await signup(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockUserCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ role }),
    }));
  });

  it('rejeita signup público com role ADMIN sem persistir usuário', async () => {
    const req: any = {
      body: { email: 'admin-attempt@example.com', password: 'secure-password', role: 'ADMIN' },
    };
    const res = createResponse();

    await signup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockUserCreate).not.toHaveBeenCalled();
  });

  it('falha explicitamente quando JWT_SECRET não está configurado', () => {
    delete process.env.JWT_SECRET;

    expect(() => getJwtSecret()).toThrow('JWT_SECRET is required');
  });

  it('não autentica nem chama next quando JWT_SECRET não está configurado', () => {
    delete process.env.JWT_SECRET;
    const req: any = { headers: { authorization: 'Bearer arbitrary-token' } };
    const res = createResponse();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });

  it('bloqueia bootstrap administrativo em produção antes de acessar o banco', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ADMIN_EMAIL = 'configured-admin@example.com';
    process.env.ADMIN_PASSWORD = 'configured-password';

    await expect(ensureAdminExists()).rejects.toThrow('disabled outside development and test');
    expect(mockUserUpsert).not.toHaveBeenCalled();
  });

  it('não possui chamada de bootstrap administrativo no startup', () => {
    const serverSource = fs.readFileSync(path.resolve(__dirname, '../src/server.ts'), 'utf8');

    expect(serverSource).not.toContain('ensureAdminExists');
    expect(serverSource).not.toContain("./lib/admin-init");
  });

  it('retorna 404 para mecanismo demo/seed em produção', async () => {
    process.env.NODE_ENV = 'production';
    const handler = jest.fn((_req, res) => res.status(204).end());
    const app = express();
    app.post('/seed-balance', developmentOrTestOnly, handler);

    const response = await request(app).post('/seed-balance');

    expect(response.status).toBe(404);
    expect(handler).not.toHaveBeenCalled();
  });

  it('permite mecanismo demo/seed em test', async () => {
    process.env.NODE_ENV = 'test';
    const handler = jest.fn((_req, res) => res.status(204).end());
    const app = express();
    app.post('/seed-balance', developmentOrTestOnly, handler);

    const response = await request(app).post('/seed-balance');

    expect(response.status).toBe(204);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
