import { prisma } from '../../config/database';
import { redisClient } from '../../config/redis';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { CreateProblemSchema, UpdateProblemSchema } from './problems.schema';

export class ProblemsService {
  static async getProblems(query: any, userId?: string) {
    const { search, difficulty, category, status, tags, page = '1', limit = '10' } = query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build cache key
    const cacheKey = `problems:list:${JSON.stringify({ search, difficulty, category, status, tags, page, limit, userId })}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const where: Prisma.ProblemWhereInput = { isPublished: true };

    if (search) {
      where.title = { contains: search as string, mode: 'insensitive' };
    }
    if (difficulty) {
      where.difficulty = difficulty as any;
    }
    if (category) {
      where.category = category as string;
    }
    if (tags) {
      const tagList = (tags as string).split(',');
      where.tags = { hasSome: tagList };
    }
    
    // Status filtering requires user submissions
    if (status && userId) {
      const userSubmissions = await prisma.submission.findMany({
        where: { userId, verdict: 'ACCEPTED' },
        select: { problemId: true }
      });
      const solvedIds = userSubmissions.map(s => s.problemId);
      if (status === 'solved') {
        where.id = { in: solvedIds };
      } else if (status === 'unsolved') {
        where.id = { notIn: solvedIds };
      }
    }

    const [data, total] = await Promise.all([
      prisma.problem.findMany({
        where,
        select: {
          id: true, title: true, slug: true, difficulty: true, category: true, tags: true,
          acceptedCount: true, totalAttempts: true, isPublished: true
        },
        skip,
        take: limitNum,
        orderBy: { id: 'asc' }
      }),
      prisma.problem.count({ where })
    ]);

    let results = data;
    if (userId) {
      const userSubmissions = await prisma.submission.findMany({
        where: { userId, problemId: { in: data.map(p => p.id) }, verdict: 'ACCEPTED' },
        select: { problemId: true }
      });
      const solvedSet = new Set(userSubmissions.map(s => s.problemId));
      results = data.map(p => ({ ...p, userSolved: solvedSet.has(p.id) })) as any;
    }

    const resultData = { data: results, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
    await redisClient.setex(cacheKey, 300, JSON.stringify(resultData)); // 5 min cache
    return resultData;
  }

  static async getProblemById(id: number, userId?: string) {
    const cacheKey = `problems:detail:${id}`;
    let problem: any;
    
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      problem = JSON.parse(cached);
    } else {
      problem = await prisma.problem.findUnique({
        where: { id },
        select: {
          id: true, title: true, slug: true, statement: true, difficulty: true, category: true,
          tags: true, constraints: true, examples: true, starterCode: true,
          acceptedCount: true, totalAttempts: true, isPublished: true
        }
      });
      if (!problem) throw { statusCode: 404, message: 'Problem not found' };
      
      problem.acceptanceRate = problem.totalAttempts > 0 
        ? Math.round((problem.acceptedCount / problem.totalAttempts) * 100) 
        : 0;
        
      await redisClient.setex(cacheKey, 600, JSON.stringify(problem)); // 10 min cache
    }

    if (userId) {
      const submission = await prisma.submission.findFirst({
        where: { userId, problemId: id, verdict: 'ACCEPTED' }
      });
      problem.userSolved = !!submission;
    }

    return problem;
  }

  static async createProblem(data: z.infer<typeof CreateProblemSchema>) {
    const problem = await prisma.problem.create({ data: data as Prisma.ProblemCreateInput });
    await this.invalidateCache();
    return problem;
  }

  static async updateProblem(id: number, data: z.infer<typeof UpdateProblemSchema>) {
    const problem = await prisma.problem.update({
      where: { id },
      data
    });
    await this.invalidateCache();
    return problem;
  }

  static async deleteProblem(id: number) {
    await prisma.problem.delete({ where: { id } });
    await this.invalidateCache();
  }

  private static async invalidateCache() {
    const keys = await redisClient.keys('problems:*');
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  }
}
