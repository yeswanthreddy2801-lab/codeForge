import { prisma } from '../../config/database';
import { redisClient } from '../../config/redis';
import { JudgeService } from './judge.service';
import { z } from 'zod';
import { SubmitCodeSchema, RunCodeSchema } from './submissions.schema';
import { env } from '../../config/env';

export class SubmissionsService {
  static async submitCode(userId: string, data: z.infer<typeof SubmitCodeSchema>) {
    const problem = await prisma.problem.findUnique({
      where: { id: data.problemId },
      select: { id: true, testCases: true }
    });

    if (!problem) {
      throw { statusCode: 404, message: 'Problem not found' };
    }

    const testCases = problem.testCases as any[];

    const submission = await prisma.submission.create({
      data: {
        userId,
        problemId: data.problemId,
        language: data.language,
        code: data.code,
        verdict: 'PENDING',
      }
    });

    try {
      const judgeResult = await JudgeService.runCode({
        code: data.code,
        language: data.language,
        testCases,
        timeLimit: env.MAX_EXECUTION_TIME_MS,
        memoryLimit: env.MAX_MEMORY_MB,
      });

      const updatedSubmission = await prisma.submission.update({
        where: { id: submission.id },
        data: {
          verdict: judgeResult.verdict,
          runtime: judgeResult.runtime,
          memory: judgeResult.memory,
          stdout: judgeResult.stdout,
          stderr: judgeResult.stderr,
        }
      });

      if (judgeResult.verdict === 'ACCEPTED') {
        await prisma.problem.update({
          where: { id: problem.id },
          data: {
            acceptedCount: { increment: 1 },
            totalAttempts: { increment: 1 }
          }
        });
        
        const keys = await redisClient.keys('leaderboard:*');
        if (keys.length > 0) await redisClient.del(...keys);
      } else {
        await prisma.problem.update({
          where: { id: problem.id },
          data: {
            totalAttempts: { increment: 1 }
          }
        });
      }

      await redisClient.del(`user:stats:${userId}`);
      
      await redisClient.del(`problems:detail:${problem.id}`);
      const listKeys = await redisClient.keys('problems:list:*');
      if (listKeys.length > 0) await redisClient.del(...listKeys);

      return updatedSubmission;
    } catch (error) {
      await prisma.submission.update({
        where: { id: submission.id },
        data: { verdict: 'RUNTIME_ERROR' }
      });
      throw error;
    }
  }

  static async runCode(userId: string, data: z.infer<typeof RunCodeSchema>) {
    const problem = await prisma.problem.findUnique({
      where: { id: data.problemId },
      select: { testCases: true }
    });

    if (!problem) {
      throw { statusCode: 404, message: 'Problem not found' };
    }

    let testCasesToRun: any[] = [];

    if (data.customInput) {
      testCasesToRun = [{ input: data.customInput, expectedOutput: '' }]; 
    } else {
      const allTestCases = problem.testCases as any[];
      testCasesToRun = allTestCases.slice(0, 3); 
    }

    const judgeResult = await JudgeService.runCode({
      code: data.code,
      language: data.language,
      testCases: testCasesToRun,
      timeLimit: env.MAX_EXECUTION_TIME_MS,
      memoryLimit: env.MAX_MEMORY_MB,
    });

    return judgeResult;
  }

  static async getSubmissionById(id: string, userId: string) {
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { problem: { select: { title: true, difficulty: true } } }
    });

    if (!submission) {
      throw { statusCode: 404, message: 'Submission not found' };
    }

    if (submission.userId !== userId) {
      throw { statusCode: 403, message: 'Access denied' };
    }

    return submission;
  }

  static async getSubmissionsByProblem(problemId: number, userId: string) {
    const submissions = await prisma.submission.findMany({
      where: { problemId, userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        verdict: true,
        language: true,
        runtime: true,
        memory: true,
        createdAt: true,
      }
    });

    return submissions;
  }
}
