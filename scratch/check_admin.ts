import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      role: 'ADMIN',
    },
  });

  console.log('--- ADMIN USERS ---');
  if (users.length === 0) {
    console.log('No admin users found.');
  } else {
    users.forEach(user => {
      console.log(`ID: ${user.id} | Email: ${user.email} | Role: ${user.role}`);
    });
  }

  // List last 5 users
  const lastUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
  });

  console.log('\n--- LAST 5 USERS ---');
  lastUsers.forEach(user => {
    console.log(`ID: ${user.id} | Email: ${user.email} | Role: ${user.role}`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
