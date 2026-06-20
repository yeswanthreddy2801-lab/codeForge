import { Request, Response, NextFunction } from 'express';
import { SubmissionsService } from './submissions.service';
import { SubmitCodeSchema, RunCodeSchema } from './submissions.schema';
import { success } from '../../shared/utils/response.util';

export class SubmissionsController {
  static async submitCode(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = SubmitCodeSchema.parse(req.body);
      const result = await SubmissionsService.submitCode(userId, data);
      return success(res, result, 'Submission completed', 201);
    } catch (error) {
      next(error);
    }
  }

  static async runCode(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = RunCodeSchema.parse(req.body);
      const result = await SubmissionsService.runCode(userId, data);
      return success(res, result, 'Run completed');
    } catch (error) {
      next(error);
    }
  }

  static async getSubmissionById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const result = await SubmissionsService.getSubmissionById(id, userId);
      return success(res, result, 'Submission retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getSubmissionsByProblem(req: Request, res: Response, next: NextFunction) {
    try {
      const problemId = parseInt(req.params.problemId);
      if (isNaN(problemId)) throw { statusCode: 400, message: 'Invalid problem ID' };
      const userId = req.user!.id;
      const result = await SubmissionsService.getSubmissionsByProblem(problemId, userId);
      return success(res, result, 'Submissions retrieved');
    } catch (error) {
      next(error);
    }
  }
}
