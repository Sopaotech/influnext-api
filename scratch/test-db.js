const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.tynoocwkqemxvycxclik:Fb4rQ13UzEvhtrye@aws-1-sa-east-1.pooler.supabase.com:6543/postgres"
    }
  }
});

async function main() {
  console.log('🔄 Tentando conectar ao Supabase (Porta 5432)...');
  try {
    const userCount = await prisma.user.count();
    console.log('✅ CONEXÃO SUCESSO!');
    console.log(`📊 Total de usuários no banco: ${userCount}`);
  } catch (e) {
    console.error('❌ ERRO DE CONEXÃO:');
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
