import { Request, Response, NextFunction } from 'express';
import { AiService } from './ai.service';
import { z } from 'zod';
import { success } from '../../shared/utils/response.util';

const TranslateSchema = z.object({
  englishContent: z.string().min(1).max(500),
});

export class AiController {
  static async translate(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { englishContent } = TranslateSchema.parse(req.body);
      const result = await AiService.translate(userId, englishContent);
      return success(res, result, 'Translation completed', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await AiService.getHistory(userId);
      return success(res, result, 'History retrieved');
    } catch (error) {
      next(error);
    }
  }
}
