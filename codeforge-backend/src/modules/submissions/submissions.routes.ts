import { Router } from 'express';
import { SubmissionsController } from './submissions.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { submissionLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();

router.post('/', submissionLimiter, SubmissionsController.submitCode);
router.post('/run', submissionLimiter, SubmissionsController.runCode);
router.get('/:id', authenticate, SubmissionsController.getSubmissionById);
router.get('/problem/:problemId', authenticate, SubmissionsController.getSubmissionsByProblem);

export default router;
