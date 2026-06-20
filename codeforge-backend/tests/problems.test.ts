import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';

describe('Problems Module', () => {
  it('should return a paginated list of problems', async () => {
    const res = await request(app).get('/api/v1/problems');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });

  it('should return 404 for a non-existent problem', async () => {
    const res = await request(app).get('/api/v1/problems/999999');
    expect(res.status).toBe(404);
  });
});
