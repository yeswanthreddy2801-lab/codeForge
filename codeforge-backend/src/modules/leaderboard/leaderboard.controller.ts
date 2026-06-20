import { Request, Response, NextFunction } from 'express';
import { LeaderboardService } from './leaderboard.service';
import { success } from '../../shared/utils/response.util';

export class LeaderboardController {
  static async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await LeaderboardService.getLeaderboard(req.query);
      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const period = (req.query.period as string) || 'all';
      const result = await LeaderboardService.getMe(userId, period);
      return success(res, result, 'User leaderboard position retrieved');
    } catch (error) {
      next(error);
    }
  }
}
