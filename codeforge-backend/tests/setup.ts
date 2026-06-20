import { prisma } from '../src/config/database';
import { redisClient } from '../src/config/redis';

jest.mock('../src/config/cloudinary', () => ({
  cloudinary: {
    uploader: {
      upload_stream: jest.fn((options, callback) => {
        const stream = require('stream');
        const pass = new stream.PassThrough();
        pass.on('data', () => {});
        pass.on('end', () => {
          callback(null, { secure_url: 'https://res.cloudinary.com/mock-avatar.png' });
        });
        return pass;
      })
    }
  }
}));

jest.mock('../src/shared/utils/email.util', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'def solve(a, b) {\n return a + b\n}' } }]
        })
      }
    }
  }));
});

jest.mock('../src/modules/submissions/judge.service', () => ({
  JudgeService: {
    runCode: jest.fn().mockResolvedValue({
      verdict: 'ACCEPTED',
      runtime: 15,
      memory: 2048,
    })
  }
}));

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
  redisClient.quit();
});
