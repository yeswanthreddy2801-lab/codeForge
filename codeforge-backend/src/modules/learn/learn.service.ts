import { prisma } from '../../config/database';
import { redisClient } from '../../config/redis';

export class LearnService {
  static async getAllLessons(userId?: string) {
    const lessons = await prisma.lesson.findMany({
      select: {
        id: true,
        title: true,
        order: true,
        estimatedMinutes: true,
      },
      orderBy: { order: 'asc' },
    });

    if (!userId) {
      return lessons.map(l => ({ ...l, completed: false }));
    }

    const progress = await prisma.lessonProgress.findMany({
      where: { userId, completed: true },
      select: { lessonId: true },
    });

    const completedIds = new Set(progress.map(p => p.lessonId));

    return lessons.map(l => ({
      ...l,
      completed: completedIds.has(l.id),
    }));
  }

  static async getLessonBySlug(slug: string) {
    const cacheKey = `lesson:${slug}`;
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: slug },
    });

    if (!lesson) {
      throw { statusCode: 404, message: 'Lesson not found' };
    }

    await redisClient.setex(cacheKey, 3600, JSON.stringify(lesson)); 

    return lesson;
  }

  static async completeLesson(slug: string, userId: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: slug },
    });

    if (!lesson) {
      throw { statusCode: 404, message: 'Lesson not found' };
    }

    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId, lessonId: slug },
      },
      update: {
        completed: true,
        completedAt: new Date(),
      },
      create: {
        userId,
        lessonId: slug,
        completed: true,
        completedAt: new Date(),
      },
    });

    const nextLesson = await prisma.lesson.findFirst({
      where: { order: { gt: lesson.order } },
      orderBy: { order: 'asc' },
      select: { id: true },
    });

    return {
      completed: true,
      nextLesson: nextLesson ? nextLesson.id : null,
    };
  }

  static async getProgress(userId: string) {
    const [totalLessons, completedProgress] = await Promise.all([
      prisma.lesson.count(),
      prisma.lessonProgress.findMany({
        where: { userId, completed: true },
        select: { lessonId: true },
      }),
    ]);

    const completedCount = completedProgress.length;
    const completedLessons = completedProgress.map(p => p.lessonId);
    const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    return {
      totalLessons,
      completedCount,
      completedLessons,
      percentage,
    };
  }
}
