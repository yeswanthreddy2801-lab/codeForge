import { prisma } from '../../config/database';
import { redisClient } from '../../config/redis';
import { z } from 'zod';
import { UpdateProfileSchema } from './users.schema';
import cloudinary from '../../config/cloudinary';
import { Readable } from 'stream';

export class UsersService {
  static async getProfile(username: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        fullName: true,
        bio: true,
        location: true,
        avatarUrl: true,
        createdAt: true,
      }
    });

    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    const stats = await this.getUserStats(user.id);
    const achievements = await this.getUserAchievements(user.id, stats);

    return {
      username: user.username,
      fullName: user.fullName,
      bio: user.bio,
      location: user.location,
      avatarUrl: user.avatarUrl,
      joinedDate: user.createdAt,
      ...stats,
      achievements,
    };
  }

  static async updateProfile(userId: string, data: z.infer<typeof UpdateProfileSchema>) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        username: true,
        fullName: true,
        bio: true,
        location: true,
        avatarUrl: true,
      }
    });
    return user;
  }

  static async uploadAvatar(userId: string, file: Express.Multer.File) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'codeforge/avatars', public_id: userId, overwrite: true },
        async (error, result) => {
          if (error) return reject({ statusCode: 500, message: 'Failed to upload image' });
          if (result) {
            const avatarUrl = result.secure_url;
            await prisma.user.update({
              where: { id: userId },
              data: { avatarUrl },
            });
            resolve(avatarUrl);
          }
        }
      );
      
      const readable = new Readable();
      readable._read = () => {};
      readable.push(file.buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }

  static async getUserSubmissions(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.submission.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { problem: { select: { id: true, title: true, difficulty: true } } }
      }),
      prisma.submission.count({ where: { userId } })
    ]);
    return { data, total, page, limit };
  }

  static async getUserStats(userId: string) {
    const cacheKey = `user:stats:${userId}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const submissions = await prisma.submission.findMany({
      where: { userId },
      select: { verdict: true, problemId: true, createdAt: true, runtime: true },
      orderBy: { createdAt: 'asc' }
    });

    const totalSubmissions = submissions.length;
    const acceptedSubmissions = submissions.filter(s => s.verdict === 'ACCEPTED');
    
    // Problems solved
    const solvedProblemIds = new Set(acceptedSubmissions.map(s => s.problemId));
    const problemsSolved = solvedProblemIds.size;
    
    // Accuracy
    const accuracy = totalSubmissions > 0 ? Math.round((acceptedSubmissions.length / totalSubmissions) * 100) : 0;

    // Difficulty breakdown
    const solvedProblemsDetails = await prisma.problem.findMany({
      where: { id: { in: Array.from(solvedProblemIds) } },
      select: { difficulty: true }
    });
    
    const difficultyBreakdown = { easy: 0, medium: 0, hard: 0 };
    solvedProblemsDetails.forEach(p => {
      if (p.difficulty === 'EASY') difficultyBreakdown.easy++;
      else if (p.difficulty === 'MEDIUM') difficultyBreakdown.medium++;
      else if (p.difficulty === 'HARD') difficultyBreakdown.hard++;
    });

    // Score calculation
    let streak = this.calculateStreak(acceptedSubmissions.map(s => s.createdAt));
    const score = (difficultyBreakdown.easy * 10) + (difficultyBreakdown.medium * 25) + (difficultyBreakdown.hard * 50) + (accuracy * 2) + (streak * 5);

    // Recent submissions
    const recentSubmissions = submissions.slice(-5).reverse();

    // Weekly activity
    const weeklyActivity = Array(7).fill(0);
    const now = new Date();
    now.setUTCHours(0,0,0,0);
    submissions.forEach(s => {
      const d = new Date(s.createdAt);
      d.setUTCHours(0,0,0,0);
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        weeklyActivity[6 - diffDays]++; 
      }
    });

    // rank placeholder
    const rank = null;

    const stats = {
      rank, problemsSolved, totalSubmissions, accuracy, streak, score,
      recentSubmissions, difficultyBreakdown, weeklyActivity
    };

    await redisClient.setex(cacheKey, 3600, JSON.stringify(stats)); // 1 hour TTL
    return stats;
  }

  static async getUserAchievements(userId: string, stats?: any) {
    if (!stats) {
      stats = await this.getUserStats(userId);
    }
    
    const submissions = await prisma.submission.findMany({
      where: { userId },
      select: { runtime: true, verdict: true }
    });

    const hasFastSubmission = submissions.some(s => s.verdict === 'ACCEPTED' && s.runtime && s.runtime < 100);

    const achievements = [
      { id: 'first_solve', title: 'First Solve', earned: stats.totalSubmissions >= 1 },
      { id: 'ten_solve', title: '10 Problems Solved', earned: stats.problemsSolved >= 10 },
      { id: 'fifty_solve', title: '50 Problems Solved', earned: stats.problemsSolved >= 50 },
      { id: 'hundred_solve', title: '100 Problems Solved', earned: stats.problemsSolved >= 100 },
      { id: 'streak_7', title: '7 Day Streak', earned: stats.streak >= 7 },
      { id: 'streak_30', title: '30 Day Streak', earned: stats.streak >= 30 },
      { id: 'accuracy_90', title: 'High Accuracy (90%+)', earned: stats.accuracy >= 90 && stats.totalSubmissions >= 20 },
      { id: 'speed_demon', title: 'Speed Demon (<100ms)', earned: hasFastSubmission },
    ];

    return achievements;
  }

  private static calculateStreak(dates: Date[]): number {
    if (dates.length === 0) return 0;
    
    const uniqueDays = new Set(dates.map(d => {
      const date = new Date(d);
      date.setUTCHours(0,0,0,0);
      return date.getTime();
    }));

    const sortedDays = Array.from(uniqueDays).sort((a, b) => b - a);
    
    let streak = 0;
    const now = new Date();
    now.setUTCHours(0,0,0,0);
    const todayTime = now.getTime();
    
    let expectedTime = todayTime;
    
    if (sortedDays[0] !== todayTime) {
      const yesterdayTime = todayTime - 24 * 60 * 60 * 1000;
      if (sortedDays[0] === yesterdayTime) {
        expectedTime = yesterdayTime;
      } else {
        return 0;
      }
    }

    for (let time of sortedDays) {
      if (time === expectedTime) {
        streak++;
        expectedTime -= 24 * 60 * 60 * 1000;
      } else {
        break;
      }
    }

    return streak;
  }
}
