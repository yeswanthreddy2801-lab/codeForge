import { prisma } from '../../config/database';
import { z } from 'zod';
import { CreateContestSchema, UpdateContestSchema } from './contests.schema';

export class ContestsService {
  private static getStatus(startTime: Date, endTime: Date): 'UPCOMING' | 'LIVE' | 'FINISHED' {
    const now = new Date();
    if (now < startTime) return 'UPCOMING';
    if (now >= startTime && now <= endTime) return 'LIVE';
    return 'FINISHED';
  }

  static async getContests(query: any, userId?: string) {
    const statusFilter = query.status as string; 
    
    let where: any = { isPublished: true };
    const now = new Date();

    if (statusFilter === 'upcoming') {
      where.startTime = { gt: now };
    } else if (statusFilter === 'live') {
      where.startTime = { lte: now };
      where.endTime = { gte: now };
    } else if (statusFilter === 'finished') {
      where.endTime = { lt: now };
    }

    const contests = await prisma.contest.findMany({
      where,
      include: {
        _count: {
          select: { problems: true, entries: true }
        }
      },
      orderBy: { startTime: 'desc' }
    });

    let results = contests.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      startTime: c.startTime,
      endTime: c.endTime,
      difficulty: c.difficulty,
      prizes: c.prizes,
      status: this.getStatus(c.startTime, c.endTime),
      participantCount: c._count.entries,
      problemCount: c._count.problems,
    }));

    if (userId) {
      const userEntries = await prisma.contestEntry.findMany({
        where: { userId, contestId: { in: contests.map(c => c.id) } },
        select: { contestId: true }
      });
      const registeredIds = new Set(userEntries.map(e => e.contestId));
      results = results.map(r => ({ ...r, isRegistered: registeredIds.has(r.id) }));
    }

    return results;
  }

  static async getContestById(id: number, userId?: string) {
    const contest = await prisma.contest.findUnique({
      where: { id },
      include: {
        problems: {
          orderBy: { order: 'asc' },
          include: {
            problem: { select: { id: true, title: true, difficulty: true } }
          }
        },
        _count: { select: { entries: true } }
      }
    });

    if (!contest) throw { statusCode: 404, message: 'Contest not found' };

    const status = this.getStatus(contest.startTime, contest.endTime);
    let isRegistered = false;
    let userScore = null;

    if (userId) {
      const entry = await prisma.contestEntry.findUnique({
        where: { userId_contestId: { userId, contestId: id } }
      });
      if (entry) {
        isRegistered = true;
        userScore = entry.score;
      }
    }

    return {
      id: contest.id,
      title: contest.title,
      description: contest.description,
      startTime: contest.startTime,
      endTime: contest.endTime,
      difficulty: contest.difficulty,
      prizes: contest.prizes,
      status,
      participantCount: contest._count.entries,
      problems: contest.problems.map(cp => ({
        id: cp.problem.id,
        title: cp.problem.title,
        difficulty: cp.problem.difficulty,
        points: cp.points,
        order: cp.order
      })),
      isRegistered,
      userScore: (status === 'LIVE' || status === 'FINISHED') ? userScore : null
    };
  }

  static async registerForContest(id: number, userId: string) {
    const contest = await prisma.contest.findUnique({ where: { id } });
    if (!contest) throw { statusCode: 404, message: 'Contest not found' };

    const status = this.getStatus(contest.startTime, contest.endTime);
    if (status === 'FINISHED') {
      throw { statusCode: 400, message: 'Contest has already finished' };
    }

    const existingEntry = await prisma.contestEntry.findUnique({
      where: { userId_contestId: { userId, contestId: id } }
    });

    if (!existingEntry) {
      await prisma.contestEntry.create({
        data: { userId, contestId: id }
      });
    }

    return { registered: true };
  }

  static async getRankings(id: number, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      prisma.contestEntry.findMany({
        where: { contestId: id },
        include: { user: { select: { id: true, username: true, fullName: true, avatarUrl: true } } },
        orderBy: [
          { score: 'desc' },
          { joinedAt: 'asc' } 
        ],
        skip,
        take: limit
      }),
      prisma.contestEntry.count({ where: { contestId: id } })
    ]);

    const data = entries.map((e, i) => ({
      rank: skip + i + 1,
      userId: e.userId,
      username: e.user.username,
      fullName: e.user.fullName,
      avatarUrl: e.user.avatarUrl,
      score: e.score
    }));

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async createContest(data: z.infer<typeof CreateContestSchema>) {
    const { problemIds, ...contestData } = data;
    const contest = await prisma.contest.create({
      data: {
        ...contestData,
        problems: {
          create: problemIds.map(p => ({
            problemId: p.id,
            points: p.points,
            order: p.order
          }))
        }
      }
    });
    return contest;
  }

  static async updateContest(id: number, data: z.infer<typeof UpdateContestSchema>) {
    const { problemIds, ...contestData } = data;
    
    const contest = await prisma.contest.update({
      where: { id },
      data: contestData
    });

    if (problemIds) {
      await prisma.contestProblem.deleteMany({ where: { contestId: id } });
      await prisma.contestProblem.createMany({
        data: problemIds.map(p => ({
          contestId: id,
          problemId: p.id,
          points: p.points,
          order: p.order
        }))
      });
    }

    return contest;
  }
}
