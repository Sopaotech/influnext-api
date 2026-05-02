import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAdmin() {
  const admin = await prisma.user.findUnique({
    where: { email: 'alexsandrojunior144@gmail.com' }
  });
  if (admin) {
    console.log(`✅ ADMIN ENCONTRADO: ${admin.email} (Role: ${admin.role})`);
  } else {
    console.log('❌ ADMIN NÃO ENCONTRADO NO BANCO DE DADOS');
  }
}

checkAdmin().finally(() => prisma.$disconnect());
