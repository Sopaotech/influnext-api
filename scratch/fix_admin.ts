import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'Alexsandrojunior144@gmail.com'.toLowerCase().trim();
  const newPassword = 'Juninho1440@';
  const passwordHash = await bcrypt.hash(newPassword, 12);

  console.log(`🔐 Tentando restaurar acesso para: ${email}...`);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: 'ADMIN',
      onboardingCompleted: true
    },
    create: {
      email,
      passwordHash,
      role: 'ADMIN',
      onboardingCompleted: true
    },
  });

  console.log('✅ SUCESSO! Acesso restaurado.');
  console.log(`📧 E-mail: ${user.email}`);
  console.log(`🔑 Senha: ${newPassword}`);
  console.log('---');
  console.log('Agora, faça o deploy e tente logar novamente.');
}

main()
  .catch(e => {
    console.error('❌ Erro ao restaurar admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
