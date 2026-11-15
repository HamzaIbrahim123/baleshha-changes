import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { ZodError } from 'zod';
import { env } from './config.js';
import { optionalAuth } from './auth.js';
import { ApiError } from './errors.js';
import { makeApiRouter } from './routes.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  if(env.NODE_ENV==='production') app.set('trust proxy',1);
  app.use(helmet());
  app.use(cors({origin:env.FRONTEND_ORIGIN,credentials:true}));
  app.use(express.json({limit:'64kb'}));
  app.use(cookieParser());
  // Same-site cookie plus origin checking mitigates cross-site request forgery.
  // In production reverse-proxy /api under the frontend's own HTTPS site.
  app.use((req,_res,next)=>{
    if(['POST','PUT','PATCH','DELETE'].includes(req.method)) {
      const origin=req.headers.origin;
      if(origin && origin!==env.FRONTEND_ORIGIN)
        return next(new ApiError(403,'ORIGIN_FORBIDDEN','Unexpected request origin'));
    }
    next();
  });
  app.use('/api',rateLimit({windowMs:60_000,limit:180,standardHeaders:'draft-7',legacyHeaders:false}));
  app.use('/api/auth',rateLimit({windowMs:15*60_000,limit:35,standardHeaders:'draft-7',legacyHeaders:false}));
  app.use('/api',optionalAuth,makeApiRouter());
  app.use((_req,_res,next)=>next(new ApiError(404,'NOT_FOUND','Route not found')));
  const onError: ErrorRequestHandler=(error:unknown,_req,res,_next)=>{
    if(error instanceof ZodError) return res.status(422).json({error:{code:'VALIDATION_ERROR',
      message:'Invalid request',fields:error.issues.map(i=>({path:i.path.join('.'),message:i.message}))}});
    if(error instanceof ApiError) return res.status(error.status).json({error:{code:error.code,message:error.message}});
    const pg=error as {code?:string}|null;
    if(pg?.code==='23505') return res.status(409).json({error:{code:'ALREADY_EXISTS',message:'A record with these details already exists'}});
    if(pg?.code==='23503') return res.status(409).json({error:{code:'REFERENCE_CONFLICT',message:'Related record unavailable'}});
    if(pg?.code==='42P01') return res.status(503).json({error:{code:'MIGRATION_REQUIRED',message:'Database schema is not installed yet'}});
    console.error('[Baleshha API] Unhandled request error:',error);
    return res.status(500).json({error:{code:'INTERNAL_ERROR',message:'Unexpected server error'}});
  };
  app.use(onError);
  return app;
}
