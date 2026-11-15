import { createApp } from './app.js';
import { env } from './config.js';
import { pool } from './db.js';

const app=createApp();
const server=app.listen(env.PORT,()=>console.info(`Baleshha API listening on :${env.PORT}`));
const stop=()=>{
  console.info('Stopping API');
  server.close(()=>pool.end().then(()=>process.exit(0)));
};
process.once('SIGTERM',stop);
process.once('SIGINT',stop);
