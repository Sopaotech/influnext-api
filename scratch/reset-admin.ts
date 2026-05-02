import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetAdmin() {
  const email = 'alexsandrojunior144@gmail.com';
  const password = 'Juninho1440@';
  
  console.log('🚀 Iniciando reset da conta Mestre...');

  try {
    // 1. Deletar se existir
    await prisma.user.deleteMany({
      where: { email }
    });
    console.log('🗑️  Contas antigas removidas.');

    // 2. Criar nova
    const hashedPassword = await bcrypt.hash(password, 12);
    
    await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role: 'ADMIN',
      }
    });

    console.log('🚀 CONTA MESTRE RECONSTRUÍDA COM SUCESSO');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Senha: ${password}`);

  } catch (error) {
    console.error('❌ Erro ao resetar admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdmin();
