import Redis from 'ioredis';
import { env } from './env';

export const redisClient = new Redis(env.REDIS_URL);

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));
