import { randomBytes, createHash } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { hash, verify } from '@node-rs/argon2';
import { pool } from './db.js';
import { env } from './config.js';
import { ApiError } from './errors.js';

const COOKIE_NAME = 'baleshha_session';
const SESSION_DAYS = 30;
export type UserSession = { id: string; username: string; displayName: string };
export type AuthedRequest = Request & { user: UserSession };

export async function hashPassword(password: string): Promise<string> {
  return hash(password, { algorithm: 2, memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 });
}
export async function verifyPassword(hashString: string, password: string): Promise<boolean> {
  try { return await verify(hashString,password); } catch { return false; }
}
export function tokenDigest(token: string) { return createHash('sha256').update(token).digest('hex'); }
export async function newSession(res: Response, userId: string) {
  const token = randomBytes(32).toString('base64url');
  await pool.query(`INSERT INTO auth_sessions(token_hash,user_id,expires_at)
    VALUES ($1,$2,now() + interval '30 days')`,[tokenDigest(token),userId]);
  res.cookie(COOKIE_NAME,token,{
    httpOnly:true, secure:env.COOKIE_SECURE === 'true', sameSite:'lax', path:'/',
    maxAge:SESSION_DAYS * 24 * 60 * 60 * 1000
  });
}
export function clearSessionCookie(res:Response) {
  res.clearCookie(COOKIE_NAME,{httpOnly:true,secure:env.COOKIE_SECURE === 'true',sameSite:'lax',path:'/'});
}
export async function currentUser(req: Request): Promise<UserSession|null> {
  const token = req.cookies?.[COOKIE_NAME] as string|undefined;
  if (!token || token.length !== 43) return null;
  const result = await pool.query<{id:string;username:string;display_name:string}>(`
    SELECT u.id,u.username,u.display_name FROM auth_sessions s
    JOIN app_users u ON u.id=s.user_id
    WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now()`,[tokenDigest(token)]);
  const row=result.rows[0];
  return row ? {id:row.id,username:row.username,displayName:row.display_name} : null;
}
export async function optionalAuth(req:Request,res:Response,next:NextFunction) {
  try { (req as Request & {user?:UserSession}).user=await currentUser(req) ?? undefined; next(); }
  catch(e) { next(e); }
}
export function requireAuth(req:Request,_res:Response,next:NextFunction) {
  const user=(req as Request & {user?:UserSession}).user;
  if(!user) return next(new ApiError(401,'LOGIN_REQUIRED','Please sign in first'));
  next();
}
export async function revokeSession(req:Request) {
  const token = req.cookies?.[COOKIE_NAME] as string|undefined;
  if(token) await pool.query('DELETE FROM auth_sessions WHERE token_hash=$1',[tokenDigest(token)]);
}
