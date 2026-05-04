import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Remove legacy built-in agents if any exist
  await prisma.agent.deleteMany({ where: { isBuiltIn: true } });
  console.log('Cleaned up legacy built-in agents');

  // Ensure default user context exists
  await prisma.userContext.upsert({
    where: { userId: 'default' },
    update: {},
    create: {
      userId: 'default',
      aiProfile: '新用户，尚无画像。',
      keyTopics: JSON.stringify([]),
      sensitivities: JSON.stringify([]),
      stylePrefs: JSON.stringify({}),
    },
  });
  console.log('Ensured default user context');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
