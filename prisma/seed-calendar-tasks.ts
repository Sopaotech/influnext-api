import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seedando tarefas de teste para o calendário...');

  // Encontra todos os perfis de influenciadores no sistema
  const influencers = await prisma.influencerProfile.findMany();

  if (influencers.length === 0) {
    console.log('❌ Nenhum influenciador encontrado no banco de dados. Execute o seed das contas primeiro.');
    return;
  }

  // Deleta tarefas antigas para evitar duplicações no teste
  await prisma.task.deleteMany();
  console.log('🧹 Tarefas anteriores removidas.');

  const tasksData = [
    { day: 2, title: 'Definição da linha editorial de Junho', desc: 'Planejar os temas de posts, carrosséis e reels de acordo com a estratégia do Sócio.', isDone: true, fromAI: false },
    { day: 5, title: 'Reunião de Alinhamento com Marca de Tech', desc: 'Apresentação do Mídia Kit e fechamento de contrato de publipost.', isDone: true, fromAI: true },
    { day: 8, title: 'Gravar 3x Reels sobre Inteligência de Carreira', desc: 'Focar na frase chave: "Recebidos não pagam boletos". Demonstrar profissionalismo e escala.', isDone: false, fromAI: true },
    { day: 9, title: 'Postar Stories: Dia a Dia Espontâneo', desc: 'Postar bastidores sem pretensão comercial. Humanizar a marca gera engajamento e conexão real.', isDone: false, fromAI: true },
    { day: 12, title: 'Análise de métricas de engajamento do Instagram', desc: 'Verificar posts com melhor performance de alcance e ajustar próximos roteiros.', isDone: false, fromAI: false },
    { day: 15, title: 'Gravar roteiro de vídeo patrocinado', desc: 'Script sugerido pela IA aprovado pela marca parceira.', isDone: false, fromAI: true },
    { day: 18, title: 'Postar Stories: Bastidores de Mentoria', desc: 'Compartilhar espontaneamente os bastidores da sua rotina e preparação. Gestão orgânica de carreira.', isDone: false, fromAI: false },
    { day: 20, title: 'Disparo de Propostas Comerciais', desc: 'Enviar proposta comercial para 5 marcas alvo identificadas pelo painel de tendências.', isDone: false, fromAI: true },
    { day: 22, title: 'Análise de Tendências no Trends Vault', desc: 'Buscar áudios e tópicos em alta e planejar postagem rápida de oportunidade.', isDone: false, fromAI: true },
    { day: 25, title: 'Reunião mensal de fechamento de caixa', desc: 'Calcular a receita de publis do mês e planejar os investimentos de anúncios.', isDone: false, fromAI: false },
    { day: 28, title: 'Sessão de fotos profissionais em estúdio', desc: 'Atualizar banco de imagens para propostas de grandes patrocinadores.', isDone: false, fromAI: false }
  ];

  for (const influencer of influencers) {
    console.log(`👤 Criando tarefas para o influenciador: @${influencer.handle}...`);

    for (const item of tasksData) {
      const scheduledDate = new Date(2026, 5, item.day, 12, 0, 0); // Junho é mês 5 (0-indexed)

      await prisma.task.create({
        data: {
          influencerId: influencer.id,
          title: item.title,
          description: item.desc,
          scheduledDate: scheduledDate,
          isDone: item.isDone,
          fromAI: item.fromAI
        }
      });
    }
  }

  console.log('✅ Tarefas de calendário populadas com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
