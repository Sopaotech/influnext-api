import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Buscando usuários para remover...');

  // 1. Listar usuários com emails ou handles semelhantes a 'infunext' ou 'alexs' ou 'br'
  const users = await prisma.user.findMany({
    include: {
      influencer: true,
      company: true
    }
  });

  console.log(`📊 Total de usuários encontrados: ${users.length}`);

  // Identificar usuários que correspondem ao critério
  const targets = users.filter(u => {
    const emailMatch = u.email.toLowerCase().includes('infunext') || u.email.toLowerCase().includes('alexs');
    const handleMatch = u.influencer?.handle?.toLowerCase().includes('infunext') || false;
    // Não remover o admin oficial
    const isAdmin = u.email === 'alexsandro@influnext.com.br';
    
    return (emailMatch || handleMatch) && !isAdmin;
  });

  if (targets.length === 0) {
    console.log('⚠️ Nenhum usuário de teste correspondente encontrado.');
    return;
  }

  console.log(`🧹 Removendo ${targets.length} usuários correspondentes:`);
  for (const t of targets) {
    console.log(`- ID: ${t.id} | Email: ${t.email} | Handle: ${t.influencer?.handle || 'N/A'}`);
    
    // Deletar o usuário (cascade deletará o profile)
    await prisma.user.delete({
      where: { id: t.id }
    });
  }

  console.log('🎉 Limpeza concluída!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
