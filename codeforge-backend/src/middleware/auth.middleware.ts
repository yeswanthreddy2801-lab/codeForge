import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { error } from '../shared/utils/response.util';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return error(res, 'Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];
    
    // Verify Supabase JWT securely via their API
    const { data: { user: supabaseUser }, error: verifyError } = await supabase.auth.getUser(token);
    
    if (verifyError || !supabaseUser) {
      console.error('Supabase token verification failed:', verifyError);
      return error(res, 'Invalid or expired token', 401);
    }

    const userId = supabaseUser.id;

    // Ensure user exists in our DB
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          email: supabaseUser.email || '',
          username: supabaseUser.user_metadata?.username || (supabaseUser.email?.split('@')[0] || 'user') + Math.floor(Math.random() * 10000),
          fullName: supabaseUser.user_metadata?.full_name || '',
          role: supabaseUser.user_metadata?.role || 'USER',
        }
      });
    }
    
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return error(res, 'Invalid or expired token', 401);
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user: supabaseUser } } = await supabase.auth.getUser(token);
      
      if (supabaseUser) {
        const userId = supabaseUser.id;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
          req.user = user;
        }
      }
    }
    next();
  } catch (err) {
    // Ignore errors for optional auth
    next();
  }
};
export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      return error(res, 'Insufficient permissions', 403);
    }
    next();
  };
};
