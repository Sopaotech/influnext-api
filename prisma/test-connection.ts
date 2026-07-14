import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Conectando ao banco de dados Supabase...');
  
  try {
    // Testar conexão buscando o admin ou contando usuários
    const userCount = await prisma.user.count();
    console.log(`✅ Conexão estabelecida com sucesso!`);
    console.log(`📊 Estatísticas atuais da Base de Dados:`);
    console.log(`   - Total de Usuários cadastrados: ${userCount}`);
    
    // Listar planos configurados
    const plans = await prisma.plan.findMany();
    console.log(`   - Planos configurados (${plans.length}):`);
    plans.forEach(plan => {
      console.log(`     * ID: ${plan.id} | Nome: ${plan.name} | Preço: R$ ${plan.price}`);
    });

    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    if (admin) {
      console.log(`   - Administrador encontrado: ${admin.email}`);
    } else {
      console.log(`   - ⚠️ Nenhum usuário ADMIN encontrado. Considere rodar 'npm run seed'`);
    }

  } catch (error: any) {
    console.error('❌ Erro de conexão com o banco de dados:', error.message);
    console.error('Certifique-se de que a variável DATABASE_URL no seu arquivo .env está apontando para o Supabase correto.');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
