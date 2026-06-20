import { Router } from 'express';
import multer from 'multer';
import { UsersController } from './users.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
      cb(null, true);
    } else {
      cb(new Error('Only jpg, png, and webp are allowed'));
    }
  }
});

router.get('/me/submissions', authenticate, UsersController.getMySubmissions);
router.get('/me/stats', authenticate, UsersController.getMyStats);
router.get('/me/achievements', authenticate, UsersController.getMyAchievements);
router.patch('/me', authenticate, UsersController.updateProfile);
router.post('/me/avatar', authenticate, upload.single('image'), UsersController.uploadAvatar);
router.get('/:username', UsersController.getProfile);

export default router;
