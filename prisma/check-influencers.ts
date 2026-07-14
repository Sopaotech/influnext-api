import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const profiles = await prisma.influencerProfile.findMany({
    select: {
      id: true,
      handle: true,
      niche: true,
      city: true,
      state: true,
      influScore: true,
    }
  });
  console.log('📊 Perfis de Influenciadores no DB:', JSON.stringify(profiles, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
