import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.problem.update({
    where: { id: 1 },
    data: {
      testCases: [
        { input: "4\n2 7 11 15\n9", expectedOutput: "[0, 1]" },
        { input: "3\n3 2 4\n6", expectedOutput: "[1, 2]" },
        { input: "2\n3 3\n6", expectedOutput: "[0, 1]" }
      ]
    }
  });
  console.log("Successfully updated Two Sum test cases!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
