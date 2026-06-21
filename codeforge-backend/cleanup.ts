import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up dummy problems...');

  // Delete problems that start with "Problem "
  const result = await prisma.problem.deleteMany({
    where: {
      title: {
        startsWith: 'Problem '
      }
    }
  });

  console.log(`Deleted ${result.count} dummy problems!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
