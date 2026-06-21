import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../config/redis';

const createRedisStore = (prefix: string) => {
  if (typeof redisClient.call !== 'function') {
    return undefined; // Fallback to MemoryStore for mock redis
  }
  return new RedisStore({
    prefix,
    sendCommand: (...args: string[]) => redisClient.call(args[0], ...args.slice(1)) as any,
  });
};

export const generalLimiter = rateLimit({
  store: createRedisStore('rl:general:'),
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, error: { code: 429, message: 'Too many requests, please try again later.' } }
});

export const authLimiter = rateLimit({
  store: createRedisStore('rl:auth:'),
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: { code: 429, message: 'Too many authentication attempts.' } }
});

export const submissionLimiter = rateLimit({
  store: createRedisStore('rl:submission:'),
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  keyGenerator: (req) => req.user?.id || req.ip || '',
  message: { success: false, error: { code: 429, message: 'Submission limit reached.' } }
});

export const etcLimiter = rateLimit({
  store: createRedisStore('rl:etc:'),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 per hour
  keyGenerator: (req) => req.user?.id || req.ip || '',
  message: { success: false, error: { code: 429, message: 'English-to-Code limit reached.' } }
});
