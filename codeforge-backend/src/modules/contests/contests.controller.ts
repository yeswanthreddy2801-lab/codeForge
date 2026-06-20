import { Request, Response, NextFunction } from 'express';
import { ContestsService } from './contests.service';
import { CreateContestSchema, UpdateContestSchema } from './contests.schema';
import { success, paginated } from '../../shared/utils/response.util';

export class ContestsController {
  static async getContests(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const result = await ContestsService.getContests(req.query, userId);
      return success(res, result, 'Contests retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getContestById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw { statusCode: 400, message: 'Invalid contest ID' };
      const userId = req.user?.id;
      const result = await ContestsService.getContestById(id, userId);
      return success(res, result, 'Contest retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async registerForContest(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw { statusCode: 400, message: 'Invalid contest ID' };
      const userId = req.user!.id;
      const result = await ContestsService.registerForContest(id, userId);
      return success(res, result, 'Registered for contest');
    } catch (error) {
      next(error);
    }
  }

  static async getRankings(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw { statusCode: 400, message: 'Invalid contest ID' };
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const { data, total } = await ContestsService.getRankings(id, page, limit);
      return paginated(res, data, total, page, limit, 'Rankings retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async createContest(req: Request, res: Response, next: NextFunction) {
    try {
      const data = CreateContestSchema.parse(req.body);
      const result = await ContestsService.createContest(data);
      return success(res, result, 'Contest created', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateContest(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw { statusCode: 400, message: 'Invalid contest ID' };
      const data = UpdateContestSchema.parse(req.body);
      const result = await ContestsService.updateContest(id, data);
      return success(res, result, 'Contest updated');
    } catch (error) {
      next(error);
    }
  }
}
