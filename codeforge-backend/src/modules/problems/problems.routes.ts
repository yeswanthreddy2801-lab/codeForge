import { Router } from 'express';
import { ProblemsController } from './problems.controller';
import { optionalAuth, authenticate, requireRole } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuth, ProblemsController.getProblems);
router.get('/:id', optionalAuth, ProblemsController.getProblemById);
router.post('/', authenticate, requireRole('ADMIN'), ProblemsController.createProblem);
router.patch('/:id', authenticate, requireRole('ADMIN'), ProblemsController.updateProblem);
router.delete('/:id', authenticate, requireRole('ADMIN'), ProblemsController.deleteProblem);

export default router;
