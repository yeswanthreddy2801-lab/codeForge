import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { generalLimiter } from './middleware/rateLimit.middleware';
import { errorHandler } from './middleware/errorHandler.middleware';

import './shared/types'; // Import global types

const app = express();

// Middleware Chain
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(compression());
app.use(cookieParser());

// Apply general rate limiting
app.use('/api/', generalLimiter);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Module routes will be mounted here under /api/v1/
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import problemsRoutes from './modules/problems/problems.routes';
import submissionsRoutes from './modules/submissions/submissions.routes';
import leaderboardRoutes from './modules/leaderboard/leaderboard.routes';
import contestsRoutes from './modules/contests/contests.routes';
import learnRoutes from './modules/learn/learn.routes';
import aiRoutes from './modules/ai/ai.routes';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/problems', problemsRoutes);
app.use('/api/v1/submissions', submissionsRoutes);
app.use('/api/v1/leaderboard', leaderboardRoutes);
app.use('/api/v1/contests', contestsRoutes);
app.use('/api/v1/learn', learnRoutes);
app.use('/api/v1/ai', aiRoutes);
// app.use('/api/v1/etc', etcRoutes);
// app.use('/api/v1/etc', etcRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: { code: 404, message: 'Route not found' } });
});

// Global error handler
app.use(errorHandler);

// Server startup logic
if (require.main === module) {
  app.listen(env.PORT, () => {
    console.log(`🚀 CodeForge Backend running on http://localhost:${env.PORT}`);
  });
}

export default app;
