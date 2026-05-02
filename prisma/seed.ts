import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed de Produção...');

  // 1. Admin Master
  const adminEmail = process.env.ADMIN_EMAIL || 'alexsandro@influnext.com.br';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Mudar123!';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
    },
  });
  console.log(`✅ Admin master configurado: ${admin.email}`);

  // 2. Nichos (Simulado via DB, caso tenhamos tabela. Como não há tabela 'Niche' no schema, pulamos)
  
  console.log('🚀 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
