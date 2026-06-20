import { Request, Response, NextFunction } from 'express';
import { LearnService } from './learn.service';
import { success } from '../../shared/utils/response.util';

export class LearnController {
  static async getAllLessons(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const result = await LearnService.getAllLessons(userId);
      return success(res, result, 'Lessons retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getLessonBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const result = await LearnService.getLessonBySlug(slug);
      return success(res, result, 'Lesson content retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async completeLesson(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const userId = req.user!.id;
      const result = await LearnService.completeLesson(slug, userId);
      return success(res, result, 'Lesson marked as completed');
    } catch (error) {
      next(error);
    }
  }

  static async getProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await LearnService.getProgress(userId);
      return success(res, result, 'Learning progress retrieved');
    } catch (error) {
      next(error);
    }
  }
}
