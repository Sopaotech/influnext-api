import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Carregar .env da raiz
dotenv.config({ path: path.join(__dirname, '../../.env') });

const prisma = new PrismaClient();

async function check() {
  console.log('🔍 [DIAGNÓSTICO] Verificando conexão com o banco...');
  
  try {
    // 1. Testar conexão básica
    await prisma.$connect();
    console.log('✅ Conexão com o banco estabelecida com sucesso.');

    // 2. Verificar Admin Master
    const adminEmail = 'alexsandrojunior144@gmail.com';
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (admin) {
      console.log(`✅ Admin encontrado: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Onboarding: ${admin.onboardingCompleted}`);
    } else {
      console.warn('⚠️  AVISO: Usuário administrador não encontrado no banco!');
      console.log('   Dica: Rode "npm run seed" ou use a Master Key no primeiro login.');
    }

    // 3. Verificar se há outros usuários
    const userCount = await prisma.user.count();
    console.log(`📊 Total de usuários no sistema: ${userCount}`);

  } catch (error) {
    console.error('❌ ERRO AO CONECTAR NO BANCO:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
