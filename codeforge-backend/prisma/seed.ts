import { PrismaClient } from '@prisma/client';
import process from 'process';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@codeforge.com' },
    update: {},
    create: {
      email: 'admin@codeforge.com',
      username: 'admin',
      fullName: 'System Admin',
      role: 'ADMIN',
      isVerified: true,
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: 'user1@example.com' },
    update: {},
    create: {
      email: 'user1@example.com',
      username: 'coder_one',
      fullName: 'Alice Smith',
      role: 'USER',
      isVerified: true,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'user2@example.com' },
    update: {},
    create: {
      email: 'user2@example.com',
      username: 'coder_two',
      fullName: 'Bob Jones',
      role: 'USER',
      isVerified: true,
    },
  });

  const difficulties = ['EASY', 'MEDIUM', 'HARD'] as const;
  const categories = ['Arrays', 'Strings', 'Dynamic Programming', 'Graphs', 'Math'];

  for (let i = 1; i <= 30; i++) {
    const diffIndex = Math.floor((i - 1) / 10);
    const diff = difficulties[diffIndex];

    await prisma.problem.upsert({
      where: { slug: `problem-${i}` },
      update: {},
      create: {
        title: `Problem ${i}: Algorithm Challenge`,
        slug: `problem-${i}`,
        statement: `This is the problem statement for Problem ${i}. Write a function to solve it.`,
        difficulty: diff,
        category: categories[i % categories.length],
        tags: [categories[i % categories.length], 'Algorithms'],
        constraints: ['1 <= N <= 10^5'],
        examples: [
          { input: '1 2', output: '3', explanation: '1 + 2 = 3' }
        ],
        testCases: [
          { input: '1 2', expectedOutput: '3' },
          { input: '5 5', expectedOutput: '10' },
          { input: '-1 1', expectedOutput: '0' }
        ],
        starterCode: {
          cpp: 'int solve(int a, int b) {\n  return a + b;\n}',
          java: 'class Solution {\n  public int solve(int a, int b) {\n    return a + b;\n  }\n}',
          python: 'def solve(a, b):\n    return a + b',
          mylang: 'def solve(a, b) {\n    return a + b\n}'
        },
        isPublished: true,
      }
    });
  }

  const lessonTitles = [
    'Introduction to MyLang', 'Variables and Data Types', 'Basic Operators',
    'Control Flow: If/Else', 'Loops: For and While', 'Functions',
    'Arrays and Lists', 'Strings Manipulation', 'Dictionaries and Maps',
    'Error Handling', 'Advanced MyLang Concepts'
  ];

  for (let i = 0; i < 11; i++) {
    const slug = lessonTitles[i].toLowerCase().replace(/ /g, '-').replace(/:/g, '');
    await prisma.lesson.upsert({
      where: { id: slug },
      update: {},
      create: {
        id: slug,
        title: lessonTitles[i],
        content: `Welcome to ${lessonTitles[i]}. In this lesson, we will cover the basics of MyLang.`,
        order: i + 1,
        estimatedMinutes: 10 + (i % 5) * 5,
      }
    });
  }

  const now = new Date();

  const past1Start = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
  const past1End = new Date(past1Start.getTime() + 2 * 60 * 60 * 1000);

  const past2Start = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const past2End = new Date(past2Start.getTime() + 2 * 60 * 60 * 1000);

  const liveStart = new Date(now.getTime() - 1 * 60 * 60 * 1000);
  const liveEnd = new Date(liveStart.getTime() + 3 * 60 * 60 * 1000);

  const future1Start = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const future1End = new Date(future1Start.getTime() + 2 * 60 * 60 * 1000);

  const future2Start = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
  const future2End = new Date(future2Start.getTime() + 2 * 60 * 60 * 1000);

  const contestSchedules = [
    { title: 'Weekly Contest 1 (Past)', start: past1Start, end: past1End },
    { title: 'Weekly Contest 2 (Past)', start: past2Start, end: past2End },
    { title: 'Weekly Contest 3 (Live)', start: liveStart, end: liveEnd },
    { title: 'Weekly Contest 4 (Upcoming)', start: future1Start, end: future1End },
    { title: 'Weekly Contest 5 (Upcoming)', start: future2Start, end: future2End }
  ];

  for (let i = 0; i < 5; i++) {
    const c = contestSchedules[i];

    // Check if contest already exists by title
    const existing = await prisma.contest.findFirst({ where: { title: c.title } });

    if (!existing) {
      await prisma.contest.create({
        data: {
          title: c.title,
          description: `This is ${c.title}. Compete to win prizes!`,
          startTime: c.start,
          endTime: c.end,
          difficulty: 'MEDIUM',
          prizes: ['1st Place: $100', '2nd Place: $50', '3rd Place: $25'],
          isPublished: true,
        }
      });
    }
  }

  console.log('Seeding finished successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
