import { prisma } from '../../config/database';
import { redisClient } from '../../config/redis';
import { UsersService } from '../users/users.service';

export class LeaderboardService {
  static async getLeaderboard(query: any) {
    const period = query.period || 'all'; // all, month, week
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const search = query.search || '';
    
    if (search) {
      const users = await prisma.user.findMany({
        where: { username: { contains: search, mode: 'insensitive' } },
        select: { id: true, username: true, fullName: true, avatarUrl: true, location: true }
      });
      
      const statsPromises = users.map(async u => {
        const stats = await this.computeUserScoreForPeriod(u.id, period);
        return { ...u, ...stats };
      });
      
      let results = await Promise.all(statsPromises);
      results.sort((a, b) => b.score - a.score);
      
      const total = results.length;
      const paginated = results.slice((page - 1) * limit, page * limit).map((r, i) => ({ ...r, rank: (page - 1) * limit + i + 1 }));
      return { data: paginated, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    const redisKey = `leaderboard:${period}`;
    const exists = await redisClient.exists(redisKey);

    if (!exists) {
      await this.rebuildLeaderboard(period);
    }

    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const [members, total] = await Promise.all([
      redisClient.zrevrange(redisKey, start, end, 'WITHSCORES'),
      redisClient.zcard(redisKey)
    ]);

    const results = [];
    for (let i = 0; i < members.length; i += 2) {
      const userId = members[i];
      const score = parseFloat(members[i + 1]);
      const rank = start + (i / 2) + 1;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true, fullName: true, avatarUrl: true, location: true }
      });

      const stats = await this.computeUserScoreForPeriod(userId, period);

      if (user) {
        results.push({
          rank,
          userId,
          username: user.username,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          location: user.location,
          score,
          problemsSolved: stats.problemsSolved,
          streak: stats.streak,
          accuracy: stats.accuracy
        });
      }
    }

    return { data: results, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getMe(userId: string, period: string = 'all') {
    const redisKey = `leaderboard:${period}`;
    const exists = await redisClient.exists(redisKey);

    if (!exists) {
      await this.rebuildLeaderboard(period);
    }

    const rankIndex = await redisClient.zrevrank(redisKey, userId);
    if (rankIndex === null) {
      return { rank: null, surrounding: [] };
    }

    const start = Math.max(0, rankIndex - 2);
    const end = rankIndex + 2;

    const members = await redisClient.zrevrange(redisKey, start, end, 'WITHSCORES');
    const surrounding = [];

    for (let i = 0; i < members.length; i += 2) {
      const uId = members[i];
      const score = parseFloat(members[i + 1]);
      const currentRank = start + (i / 2) + 1;

      const user = await prisma.user.findUnique({
        where: { id: uId },
        select: { username: true, fullName: true, avatarUrl: true }
      });

      if (user) {
        surrounding.push({
          rank: currentRank,
          userId: uId,
          username: user.username,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          score
        });
      }
    }

    return {
      rank: rankIndex + 1,
      surrounding
    };
  }

  private static async rebuildLeaderboard(period: string) {
    const redisKey = `leaderboard:${period}`;
    const users = await prisma.user.findMany({ select: { id: true } });
    
    const pipeline = redisClient.pipeline();
    pipeline.del(redisKey);

    for (const user of users) {
      const stats = await this.computeUserScoreForPeriod(user.id, period);
      if (stats.score > 0) {
        pipeline.zadd(redisKey, stats.score, user.id);
      }
    }

    pipeline.expire(redisKey, 300); // 5 min TTL
    await pipeline.exec();
  }

  private static async computeUserScoreForPeriod(userId: string, period: string) {
    const dateFilter: any = {};
    if (period === 'month') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter.gte = thirtyDaysAgo;
    } else if (period === 'week') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      dateFilter.gte = sevenDaysAgo;
    }

    const submissions = await prisma.submission.findMany({
      where: { 
        userId, 
        ...(period !== 'all' ? { createdAt: dateFilter } : {})
      },
      select: { verdict: true, problemId: true, createdAt: true }
    });

    const totalSubmissions = submissions.length;
    const acceptedSubmissions = submissions.filter(s => s.verdict === 'ACCEPTED');
    const solvedProblemIds = new Set(acceptedSubmissions.map(s => s.problemId));
    const problemsSolved = solvedProblemIds.size;

    const accuracy = totalSubmissions > 0 ? Math.round((acceptedSubmissions.length / totalSubmissions) * 100) : 0;

    const solvedProblemsDetails = await prisma.problem.findMany({
      where: { id: { in: Array.from(solvedProblemIds) } },
      select: { difficulty: true }
    });
    
    let easy = 0, medium = 0, hard = 0;
    solvedProblemsDetails.forEach(p => {
      if (p.difficulty === 'EASY') easy++;
      else if (p.difficulty === 'MEDIUM') medium++;
      else if (p.difficulty === 'HARD') hard++;
    });

    const globalStats = await UsersService.getUserStats(userId);
    const streak = globalStats.streak;

    const score = (easy * 10) + (medium * 25) + (hard * 50) + (accuracy * 2) + (streak * 5);

    return { problemsSolved, score, streak, accuracy };
  }
}
