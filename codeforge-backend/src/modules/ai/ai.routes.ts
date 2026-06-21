import { Router } from 'express';
import { AiController } from './ai.controller';
import { authenticate } from '../../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 10, 
  message: { success: false, message: 'Too many translations requested, please try again later.' },
});

const router = Router();

router.post('/translate', aiRateLimiter, AiController.translate);
router.get('/history', authenticate, AiController.getHistory);

export default router;
