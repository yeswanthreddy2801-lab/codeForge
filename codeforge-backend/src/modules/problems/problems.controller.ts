import { Request, Response, NextFunction } from 'express';
import { ProblemsService } from './problems.service';
import { CreateProblemSchema, UpdateProblemSchema } from './problems.schema';
import { success } from '../../shared/utils/response.util';

export class ProblemsController {
  static async getProblems(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const result = await ProblemsService.getProblems(req.query, userId);
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

  static async getProblemById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw { statusCode: 400, message: 'Invalid problem ID' };
      const userId = req.user?.id;
      const problem = await ProblemsService.getProblemById(id, userId);
      return success(res, problem, 'Problem retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async createProblem(req: Request, res: Response, next: NextFunction) {
    try {
      const data = CreateProblemSchema.parse(req.body);
      const problem = await ProblemsService.createProblem(data);
      return success(res, problem, 'Problem created', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateProblem(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw { statusCode: 400, message: 'Invalid problem ID' };
      const data = UpdateProblemSchema.parse(req.body);
      const problem = await ProblemsService.updateProblem(id, data);
      return success(res, problem, 'Problem updated');
    } catch (error) {
      next(error);
    }
  }

  static async deleteProblem(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw { statusCode: 400, message: 'Invalid problem ID' };
      await ProblemsService.deleteProblem(id);
      return success(res, null, 'Problem deleted');
    } catch (error) {
      next(error);
    }
  }
}
