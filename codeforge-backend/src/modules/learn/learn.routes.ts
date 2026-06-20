import { Router } from 'express';
import { LearnController } from './learn.controller';
import { authenticate, optionalAuth } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuth, LearnController.getAllLessons);
router.get('/progress', authenticate, LearnController.getProgress); 
router.get('/:slug', LearnController.getLessonBySlug);
router.post('/:slug/complete', authenticate, LearnController.completeLesson);

export default router;
