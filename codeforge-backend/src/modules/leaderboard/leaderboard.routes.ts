import { Router } from 'express';
import { LeaderboardController } from './leaderboard.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', LeaderboardController.getLeaderboard);
router.get('/me', authenticate, LeaderboardController.getMe);

export default router;
