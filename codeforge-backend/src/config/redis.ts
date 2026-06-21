import Redis from 'ioredis-mock';
import { env } from './env';

export const redisClient = new Redis();

redisClient.on('error', (err: any) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Redis Mock Client Connected'));
