import { Router } from 'express';
import { ContestsController } from './contests.controller';
import { optionalAuth, authenticate, requireRole } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuth, ContestsController.getContests);
router.get('/:id', optionalAuth, ContestsController.getContestById);
router.post('/:id/register', authenticate, ContestsController.registerForContest);
router.get('/:id/rankings', ContestsController.getRankings);

router.post('/', authenticate, requireRole('ADMIN'), ContestsController.createContest);
router.patch('/:id', authenticate, requireRole('ADMIN'), ContestsController.updateContest);

export default router;
