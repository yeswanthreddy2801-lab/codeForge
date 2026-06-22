import jwt from 'jsonwebtoken';
import { env } from './src/config/env';

const token = jwt.sign({ sub: '123' }, env.SUPABASE_JWT_SECRET);
try {
  jwt.verify(token, env.SUPABASE_JWT_SECRET);
  console.log("Plain string verification SUCCESS");
} catch (e) {
  console.error("Plain string verification FAILED:", e);
}

try {
  const secret = Buffer.from(env.SUPABASE_JWT_SECRET, 'base64');
  jwt.verify(token, secret);
  console.log("Base64 buffer verification SUCCESS");
} catch (e) {
  console.error("Base64 buffer verification FAILED:", e);
}

const token2 = jwt.sign({ sub: '123' }, Buffer.from(env.SUPABASE_JWT_SECRET, 'base64'));
try {
  const secret = Buffer.from(env.SUPABASE_JWT_SECRET, 'base64');
  jwt.verify(token2, secret);
  console.log("Base64 buffer signing & verification SUCCESS");
} catch (e) {
  console.error("Base64 buffer signing & verification FAILED:", e);
}
