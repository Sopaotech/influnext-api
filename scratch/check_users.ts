import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.user.count();
  const users = await prisma.user.findMany({ select: { email: true, role: true } });
  console.log(`\n📊 STATUS DO BANCO DE DADOS:`);
  console.log(`-----------------------------`);
  console.log(`Total de usuários: ${count}`);
  console.log(`Usuários cadastrados:`, users);
  console.log(`-----------------------------\n`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
