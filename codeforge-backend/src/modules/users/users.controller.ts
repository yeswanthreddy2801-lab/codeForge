import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { UpdateProfileSchema } from './users.schema';
import { success, paginated } from '../../shared/utils/response.util';

export class UsersController {
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { username } = req.params;
      const profile = await UsersService.getProfile(username);
      return success(res, profile, 'Profile retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = UpdateProfileSchema.parse(req.body);
      const updatedUser = await UsersService.updateProfile(userId, data);
      return success(res, updatedUser, 'Profile updated');
    } catch (error) {
      next(error);
    }
  }

  static async uploadAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: { code: 400, message: 'No image provided' } });
      }
      const userId = req.user!.id;
      const avatarUrl = await UsersService.uploadAvatar(userId, req.file);
      return success(res, { avatarUrl }, 'Avatar uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getMySubmissions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const { data, total } = await UsersService.getUserSubmissions(userId, page, limit);
      return paginated(res, data, total, page, limit, 'Submissions retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getMyStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const stats = await UsersService.getUserStats(userId);
      return success(res, stats, 'Stats retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getMyAchievements(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const achievements = await UsersService.getUserAchievements(userId);
      return success(res, achievements, 'Achievements retrieved');
    } catch (error) {
      next(error);
    }
  }
}
