import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const profile = await prisma.influencerProfile.findUnique({ where: { handle: 'influ_teste' }});
  if (!profile) { console.log('influ_teste not found'); return; }
  await prisma.rateCard.createMany({
    data: [
      { influencerId: profile.id, serviceName: '3x Stories + Link', price: 500, description: 'Divulgação em 3 stories com link.' },
      { influencerId: profile.id, serviceName: 'Reels Patrocinado', price: 1200, description: 'Vídeo criativo no feed e reels.' }
    ]
  });
  await prisma.metricSnapshot.create({
    data: { influencerId: profile.id, provider: 'INSTAGRAM', followers: 25000, engagementRate: 4.5, reachLast30Days: 80000, avgViews: 15000, integrityHash: '8f3a9e4b7c1d2e5f6a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f' }
  });
  await prisma.task.create({
    data: { influencerId: profile.id, title: 'Campanha Tech', scheduledDate: new Date(), isDone: true, fromAI: true, proofUrl: 'https://instagram.com/p/1234', performanceMultiplier: 1.5 }
  });
  console.log('Mock data added to influ_teste');
}
main().finally(() => prisma.$disconnect());
