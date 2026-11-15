import 'dotenv/config';
import { z } from 'zod';

const configSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:5173'),
  COOKIE_SECURE: z.enum(['true', 'false']).default('false'),
});

export const env = configSchema.parse(process.env);
export const isProduction = env.NODE_ENV === 'production';
if (isProduction && env.COOKIE_SECURE !== 'true') {
  throw new Error('Production requires COOKIE_SECURE=true and HTTPS.');
}
