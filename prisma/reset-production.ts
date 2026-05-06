import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando RESET de Produção...');

  // 1. Limpar Métricas e Logs
  console.log('🧹 Limpando PageViews...');
  await prisma.pageView.deleteMany();

  // 2. Limpar Contratos e Entregas (Dados de Teste)
  console.log('🧹 Limpando Deliverables...');
  await prisma.deliverable.deleteMany();
  console.log('🧹 Limpando Contratos...');
  await prisma.contract.deleteMany();

  // 3. Limpar Suporte e Notificações
  console.log('🧹 Limpando Tickets de Suporte...');
  await prisma.supportTicket.deleteMany();
  console.log('🧹 Limpando Notificações...');
  await prisma.notification.deleteMany();

  // 4. Limpar Dados de IA
  console.log('🧹 Limpando Análises de IA e Estratégias...');
  await prisma.aIAnalysis.deleteMany();
  await prisma.adminStrategy.deleteMany();
  await prisma.trendReference.deleteMany();

  // 5. Limpar Tarefas e Snapshots de Métricas
  console.log('🧹 Limpando Tarefas e Snapshots...');
  await prisma.task.deleteMany();
  await prisma.metricSnapshot.deleteMany();

  // 6. Limpar Perfis
  console.log('🧹 Limpando Perfis de Influenciadores e Empresas...');
  await prisma.socialPlatform.deleteMany();
  await prisma.influencerProfile.deleteMany();
  await prisma.companyProfile.deleteMany();

  // 7. Limpar Usuários (Exceto o Administrador Alexsandro)
  console.log('👥 Limpando Usuários não-administradores...');
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      role: { not: 'ADMIN' }
    }
  });

  console.log(`✅ Reset concluído. ${deletedUsers.count} usuários removidos.`);
  console.log('✨ Sistema pronto para o lançamento nacional!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o reset:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
