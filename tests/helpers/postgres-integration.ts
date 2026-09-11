import { PrismaClient } from '@prisma/client';

function requireSafeIntegrationDatabaseUrl(name: 'INTEGRATION_DATABASE_URL' | 'INTEGRATION_DIRECT_URL'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error('INTEGRATION_DATABASE_URL is required for PostgreSQL integration tests.');
  }

  const url = new URL(value);
  const databaseName = url.pathname.replace(/^\//, '');
  const isLocalHost = ['127.0.0.1', 'localhost', '::1'].includes(url.hostname);
  const isPostgres = url.protocol === 'postgresql:';
  const isExpectedPort = (url.port || '5432') === '5433';
  const isTestDatabase = /test/i.test(databaseName);

  if (!isPostgres || !isLocalHost || !isExpectedPort || !isTestDatabase) {
    throw new Error('Integration tests require a local PostgreSQL test database on port 5433.');
  }

  return value;
}

export const integrationPrisma = new PrismaClient({
  datasources: {
    db: {
      url: requireSafeIntegrationDatabaseUrl('INTEGRATION_DATABASE_URL'),
    },
  },
});

const integrationCleanupPrisma = new PrismaClient({
  datasources: {
    db: {
      url: requireSafeIntegrationDatabaseUrl('INTEGRATION_DIRECT_URL'),
    },
  },
});

export async function clearIntegrationDatabase(): Promise<void> {
  requireSafeIntegrationDatabaseUrl('INTEGRATION_DATABASE_URL');
  requireSafeIntegrationDatabaseUrl('INTEGRATION_DIRECT_URL');

  const tables = await integrationCleanupPrisma.$queryRawUnsafe<Array<{ tablename: string }>>(
    `SELECT tablename
     FROM pg_tables
     WHERE schemaname = 'public'
       AND tablename <> '_prisma_migrations'
     ORDER BY tablename`,
  );

  if (tables.length === 0) {
    return;
  }

  const quotedTables = tables.map(({ tablename }) => {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(tablename)) {
      throw new Error('Unexpected table name in integration database cleanup.');
    }

    return `"${tablename}"`;
  });

  await integrationCleanupPrisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${quotedTables.join(', ')} RESTART IDENTITY CASCADE`,
  );
}

export async function disconnectIntegrationPrisma(): Promise<void> {
  await integrationPrisma.$disconnect();
  await integrationCleanupPrisma.$disconnect();
}
