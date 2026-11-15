import type { Request, Response, NextFunction, Router as RouterType } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { pool, transaction } from './db.js';
import { ApiError, requireValue } from './errors.js';
import { currentUser, newSession, hashPassword, verifyPassword, revokeSession,
  clearSessionCookie, requireAuth, type UserSession } from './auth.js';
import { availableGames, HELP_TYPES, helpTypeSchema, matchInput,
  points, scoreDeltas, winningTeam, type HelpType, type TeamNumber } from './rules.js';
import type { PoolClient } from 'pg';

const uuid = z.string().uuid();
const teamNo = z.union([z.literal(1),z.literal(2)]);
const authRegister = z.object({
  displayName: z.string().trim().min(1).max(100),
  username: z.string().trim().regex(/^[A-Za-z0-9_.-]{3,50}$/),
  password: z.string().min(10).max(128),
});
const authLogin = z.object({
  username: z.string().trim().min(3).max(50),
  password: z.string().min(1),
});
const confirmBody = z.object({confirm: z.literal(true)});
const resultBody = z.object({awardedTeam: teamNo.nullable()});
const helpBody = z.object({questionId: uuid, teamNumber: teamNo, helpType: helpTypeSchema});
const adjustBody = z.object({delta: z.union([z.literal(200),z.literal(-200)])});

type Wrapped = (req:Request,res:Response,next:NextFunction)=>Promise<unknown>;
const wrap = (fn:Wrapped) => (req:Request,res:Response,next:NextFunction) => {
  Promise.resolve(fn(req,res,next)).catch(next);
};
const userOf = (req: Request): UserSession => {
  const user = (req as Request & {user?:UserSession}).user;
  requireValue(user,401,'LOGIN_REQUIRED','Please sign in first');
  return user;
};

interface MatchRow {
  id:string; user_id:string; status:'setup'|'active'|'finished'|'abandoned';
  current_turn:TeamNumber; category_count:number;
}
async function lockMatch(client:PoolClient,id:string,userId:string,allowFinished=false):Promise<MatchRow> {
  const out=await client.query<MatchRow>(
    'SELECT id,user_id,status,current_turn,category_count FROM matches WHERE id=$1 AND user_id=$2 FOR UPDATE',
    [id,userId]);
  requireValue(out.rows[0],404,'MATCH_NOT_FOUND','Match not found');
  if(!allowFinished) requireValue(out.rows[0].status==='active',409,'MATCH_NOT_ACTIVE','Match is not active');
  return out.rows[0];
}
async function loadBoard(matchId:string,userId:string){
  const match=await pool.query(
    `SELECT m.id,m.status,m.category_count,m.current_turn,m.winner_team,m.started_at,m.ended_at,g.slug AS game
     FROM matches m JOIN games g ON g.id=m.game_id WHERE m.id=$1 AND m.user_id=$2`,[matchId,userId]);
  requireValue(match.rows[0],404,'MATCH_NOT_FOUND','Match not found');
  const [categories,teams,helps,cells]=await Promise.all([
    pool.query(`SELECT c.id,c.slug,c.title_ar,c.image_path,mc.selection_order
      FROM match_categories mc JOIN categories c ON c.id=mc.category_id
      WHERE mc.match_id=$1 ORDER BY mc.selection_order`,[matchId]),
    pool.query(`SELECT team_number,team_name,score FROM match_teams WHERE match_id=$1 ORDER BY team_number`,[matchId]),
    pool.query(`SELECT team_number,help_type,status,used_at FROM match_helps
      WHERE match_id=$1 ORDER BY team_number,help_type`,[matchId]),
    pool.query(`SELECT mq.question_id,mq.category_id,mq.status,q.points,mq.awarded_team
      FROM match_questions mq JOIN questions q ON q.id=mq.question_id
      WHERE mq.match_id=$1 ORDER BY mq.category_id,q.points,mq.question_id`,[matchId]),
  ]);
  // Do not send question_text or answer_text until the proper question/reveal step.
  return {match:match.rows[0],categories:categories.rows,teams:teams.rows,
    helps:helps.rows,questions:cells.rows};
}
async function scoreChanges(client:PoolClient,matchId:string,questionId:string,
  changes:ReturnType<typeof scoreDeltas>){
  for(const e of changes){
    await client.query('UPDATE match_teams SET score=score+$3 WHERE match_id=$1 AND team_number=$2',
      [matchId,e.team,e.delta]);
    await client.query(`INSERT INTO score_events(match_id,question_id,team_number,delta,reason)
      VALUES($1,$2,$3,$4,$5)`,[matchId,questionId,e.team,e.delta,e.reason]);
  }
}

export function makeApiRouter():RouterType {
  const router=Router();

  router.get('/health',wrap(async (_req,res)=> {
    const ping=await pool.query('SELECT 1 AS ok');
    res.json({status:ping.rows[0]?.ok===1?'ok':'degraded',database:'reachable'});
  }));

  // --- Authentication: name + username + password only. Cookies contain an opaque session token. ---
  router.post('/auth/register',wrap(async (req,res)=>{
    const parsed=authRegister.parse(req.body);
    const username=parsed.username.toLowerCase();
    const digest=await hashPassword(parsed.password);
    const result=await pool.query<{id:string;username:string;display_name:string}>(
      `INSERT INTO app_users(display_name,username,password_hash)
       VALUES($1,$2,$3) RETURNING id,username,display_name`,
      [parsed.displayName,username,digest]);
    const user=result.rows[0]!;
    await newSession(res,user.id);
    res.status(201).json({user:{id:user.id,username:user.username,displayName:user.display_name}});
  }));
  router.post('/auth/login',wrap(async(req,res)=>{
    const credentials=authLogin.parse(req.body);
    const found=await pool.query<{id:string;username:string;display_name:string;password_hash:string}>(
      'SELECT id,username,display_name,password_hash FROM app_users WHERE lower(username)=lower($1)',
      [credentials.username]);
    const account=found.rows[0];
    if(!account||!(await verifyPassword(account.password_hash,credentials.password))) {
      throw new ApiError(401,'INVALID_CREDENTIALS','Incorrect username or password');
    }
    await newSession(res,account.id);
    res.json({user:{id:account.id,username:account.username,displayName:account.display_name}});
  }));
  router.get('/auth/me',wrap(async(req,res)=>res.json({user:await currentUser(req)})));
  router.post('/auth/logout',wrap(async(req,res)=>{
    await revokeSession(req);clearSessionCookie(res);res.status(204).end();
  }));

  // --- Public game library. Category remaining counts are account-specific after login. ---
  router.get('/games',wrap(async(_req,res)=>{
    const data=await pool.query(`SELECT slug,title_ar,description_ar,status
      FROM games WHERE status<>'hidden' ORDER BY sort_order,slug`);
    res.json({games:data.rows});
  }));
  router.get('/games/:slug/categories',wrap(async(req,res)=>{
    const slug=z.string().min(1).max(70).parse(req.params.slug);
    const who=await currentUser(req);
    const game=await pool.query('SELECT id,slug,title_ar,status FROM games WHERE slug=$1 AND status<>\'hidden\'',[slug]);
    requireValue(game.rows[0],404,'GAME_NOT_FOUND','Game not found');
    const data=await pool.query<{id:string;slug:string;title_ar:string;image_path:string|null;
      available_200:string;available_400:string;available_600:string}>(`
      SELECT c.id,c.slug,c.title_ar,c.image_path,
       count(q.id) FILTER(WHERE q.points=200 AND uq.question_id IS NULL)::text AS available_200,
       count(q.id) FILTER(WHERE q.points=400 AND uq.question_id IS NULL)::text AS available_400,
       count(q.id) FILTER(WHERE q.points=600 AND uq.question_id IS NULL)::text AS available_600
      FROM categories c
      LEFT JOIN questions q ON q.category_id=c.id AND q.enabled=true AND q.review_status='verified'
      LEFT JOIN used_questions uq ON uq.question_id=q.id AND uq.user_id=$2::uuid
      WHERE c.game_id=$1 AND c.enabled=true
      GROUP BY c.id,c.slug,c.title_ar,c.image_path,c.sort_order
      ORDER BY c.sort_order,c.title_ar`,[game.rows[0].id,who?.id??null]);
    res.json({game:game.rows[0],categories:data.rows.map(row=>{
      const available={200:Number(row.available_200),400:Number(row.available_400),600:Number(row.available_600)};
      return {id:row.id,slug:row.slug,titleAr:row.title_ar,imagePath:row.image_path,
        available,remainingGames:availableGames(available)};
    })});
  }));

  // --- Authenticated match lifecycle. No questions will be inserted by the API. ---
  router.get('/matches/current',requireAuth,wrap(async(req,res)=>{
    const user=userOf(req);
    const match=await pool.query(`SELECT m.id FROM matches m JOIN games g ON g.id=m.game_id
      WHERE m.user_id=$1 AND g.slug='seen-jeem' AND m.status IN ('setup','active')
      ORDER BY m.created_at DESC LIMIT 1`,[user.id]);
    if(!match.rows[0]) return res.json({match:null});
    return res.json(await loadBoard(match.rows[0].id,user.id));
  }));

  router.post('/matches',requireAuth,wrap(async(req,res)=>{
    const user=userOf(req);const input=matchInput.parse(req.body);
    const result=await transaction(async client=>{
      // Serialize attempts on the same account, including concurrent browsers.
      const owned=await client.query('SELECT id FROM app_users WHERE id=$1 FOR UPDATE',[user.id]);
      requireValue(owned.rowCount,401,'LOGIN_REQUIRED','Session has expired');
      const open=await client.query(`SELECT id FROM matches WHERE user_id=$1 AND status IN ('setup','active') LIMIT 1`,[user.id]);
      requireValue(!open.rows.length,409,'MATCH_ALREADY_ACTIVE',
        'Confirm abandoning the existing match before starting another');
      const g=await client.query<{id:string}>('SELECT id FROM games WHERE slug=$1 AND status=$2',
        ['seen-jeem','active']);
      requireValue(g.rows[0],409,'GAME_DISABLED','Game is not active');
      const valid=await client.query(`SELECT id FROM categories WHERE game_id=$1 AND enabled=true AND id=ANY($2::uuid[])`,
        [g.rows[0].id,input.categoryIds]);
      requireValue(valid.rowCount===input.categoryIds.length,422,'INVALID_CATEGORIES',
        'All selected categories must belong to this game and be available');

      // Reserve a complete set: 2x200, 2x400, 2x600 per category. No committed match if incomplete.
      const slots:{categoryId:string;questionId:string}[]=[];
      for(const categoryId of input.categoryIds){
        for(const level of points){
          const rows=await client.query<{id:string}>(`
            SELECT q.id FROM questions q
            WHERE q.category_id=$1 AND q.points=$2 AND q.enabled=true AND q.review_status='verified'
              AND NOT EXISTS (SELECT 1 FROM used_questions u WHERE u.user_id=$3 AND u.question_id=q.id)
            ORDER BY random() LIMIT 2 FOR UPDATE OF q SKIP LOCKED`,[categoryId,level,user.id]);
          requireValue(rows.rows.length===2,409,'QUESTION_BANK_NOT_READY',
            'Not enough verified unused questions yet. You can add questions later.');
          for(const q of rows.rows)slots.push({categoryId,questionId:q.id});
        }
      }
      const created=await client.query<{id:string}>(`
        INSERT INTO matches(user_id,game_id,category_count,status,current_turn,started_at)
        VALUES($1,$2,$3,'active',1,now()) RETURNING id`,
        [user.id,g.rows[0].id,input.categoryIds.length]);
      const id=created.rows[0]!.id;
      for(let i=0;i<input.categoryIds.length;i++){
        await client.query('INSERT INTO match_categories(match_id,category_id,selection_order) VALUES($1,$2,$3)',
          [id,input.categoryIds[i],i+1]);
      }
      for(let i=0;i<2;i++){
        const number=i+1;
        await client.query('INSERT INTO match_teams(match_id,team_number,team_name) VALUES($1,$2,$3)',
          [id,number,input.teamNames[i]]);
        for(const help of input.teamHelps[i]!) {
          await client.query(`INSERT INTO match_helps(match_id,team_number,help_type,status)
            VALUES($1,$2,$3,'available')`,[id,number,help]);
        }
      }
      for(const slot of slots)await client.query(`INSERT INTO match_questions(match_id,question_id,category_id)
        VALUES($1,$2,$3)`,[id,slot.questionId,slot.categoryId]);
      return {id,questionCount:slots.length};
    });
    res.status(201).json({matchId:result.id,questionCount:result.questionCount,turn:1});
  }));

  router.get('/matches/:id',requireAuth,wrap(async(req,res)=>{
    const user=userOf(req);const id=uuid.parse(req.params.id);
    res.json(await loadBoard(id,user.id));
  }));

  router.post('/matches/:id/abandon',requireAuth,wrap(async(req,res)=>{
    const user=userOf(req);const id=uuid.parse(req.params.id);
    confirmBody.parse(req.body);
    await transaction(async client=>{
      const m=await lockMatch(client,id,user.id);
      // Deleting the match deletes reserved slots; used_questions survives because shown questions
      // were added to the per-account set at display time.
      await client.query('DELETE FROM matches WHERE id=$1',[m.id]);
    });
    res.status(204).end();
  }));

  router.post('/matches/:id/questions/:questionId/open',requireAuth,wrap(async(req,res)=>{
    const user=userOf(req), id=uuid.parse(req.params.id), questionId=uuid.parse(req.params.questionId);
    const result=await transaction(async client=>{
      await lockMatch(client,id,user.id);
      const anyShown=await client.query<{question_id:string}>(`
        SELECT question_id FROM match_questions WHERE match_id=$1 AND status='shown'`,[id]);
      requireValue(!anyShown.rows.length||anyShown.rows[0]?.question_id===questionId,
        409,'QUESTION_IN_PROGRESS','Resolve the current question before opening another');
      const slot=await client.query<{status:string;question_text:string;points:number;revealed_at:Date|null}>(`
        SELECT mq.status,q.question_text,q.points,mq.revealed_at
        FROM match_questions mq JOIN questions q ON q.id=mq.question_id
        WHERE mq.match_id=$1 AND mq.question_id=$2 FOR UPDATE OF mq`,[id,questionId]);
      requireValue(slot.rows[0],404,'QUESTION_NOT_FOUND','Question not in this match');
      requireValue(slot.rows[0].status!=='resolved',409,'QUESTION_ALREADY_USED','Question already resolved');
      if(slot.rows[0].status==='reserved'){
        await client.query(`UPDATE match_questions SET status='shown',shown_at=now()
          WHERE match_id=$1 AND question_id=$2`,[id,questionId]);
        await client.query(`INSERT INTO used_questions(user_id,question_id)
          VALUES($1,$2) ON CONFLICT DO NOTHING`,[user.id,questionId]);
      }
      return {questionId,points:slot.rows[0].points,questionText:slot.rows[0].question_text,
        revealed:!!slot.rows[0].revealed_at};
    });
    res.json(result);
  }));

  router.post('/matches/:id/questions/:questionId/reveal',requireAuth,wrap(async(req,res)=>{
    const user=userOf(req),id=uuid.parse(req.params.id),questionId=uuid.parse(req.params.questionId);
    const answer=await transaction(async client=>{
      await lockMatch(client,id,user.id);
      const data=await client.query<{status:string;answer_text:string}>(`
        SELECT mq.status,q.answer_text FROM match_questions mq
        JOIN questions q ON q.id=mq.question_id WHERE mq.match_id=$1 AND mq.question_id=$2
        FOR UPDATE OF mq`,[id,questionId]);
      requireValue(data.rows[0],404,'QUESTION_NOT_FOUND','Question not in this match');
      requireValue(data.rows[0].status==='shown',409,'QUESTION_NOT_OPEN','Open the question first');
      await client.query(`UPDATE match_questions SET revealed_at=COALESCE(revealed_at,now())
        WHERE match_id=$1 AND question_id=$2`,[id,questionId]);
      return data.rows[0].answer_text;
    });
    res.json({questionId,answerText:answer});
  }));

  // --- Help buttons: select, then activate. The selected help is tied to a single question. ---
  router.post('/matches/:id/helps/select',requireAuth,wrap(async(req,res)=>{
    const user=userOf(req),id=uuid.parse(req.params.id),body=helpBody.parse(req.body);
    await transaction(async client=>{
      const m=await lockMatch(client,id,user.id);
      requireValue(m.current_turn===body.teamNumber,409,'NOT_TEAM_TURN','Only the active team can use a help');
      const q=await client.query<{status:string;revealed_at:Date|null}>(`
        SELECT status,revealed_at FROM match_questions WHERE match_id=$1 AND question_id=$2 FOR UPDATE`,
        [id,body.questionId]);
      requireValue(q.rows[0],404,'QUESTION_NOT_FOUND','Question not in match');
      const isPit=body.helpType==='pit';
      requireValue(isPit ? q.rows[0].status==='reserved':q.rows[0].status==='shown'&&!q.rows[0].revealed_at,
        409,'HELP_TIMING','Pit must be selected before the question, other helps after showing it and before revealing');
      const used=await client.query('SELECT 1 FROM match_help_uses WHERE match_id=$1 AND question_id=$2',
        [id,body.questionId]);
      requireValue(!used.rows.length,409,'HELP_ALREADY_USED','A help is already used for this question');
      await client.query(`UPDATE match_helps SET status='available' WHERE match_id=$1 AND team_number=$2
        AND status='selected'`,[id,body.teamNumber]);
      const selected=await client.query(`UPDATE match_helps SET status='selected'
        WHERE match_id=$1 AND team_number=$2 AND help_type=$3 AND status='available'
        RETURNING help_type`,[id,body.teamNumber,body.helpType]);
      requireValue(selected.rows.length,409,'HELP_UNAVAILABLE','Help was not chosen or has been used');
    });
    res.json({selected:body.helpType,questionId:body.questionId});
  }));

  router.post('/matches/:id/helps/use',requireAuth,wrap(async(req,res)=>{
    const user=userOf(req),id=uuid.parse(req.params.id),body=helpBody.parse(req.body);
    await transaction(async client=>{
      const m=await lockMatch(client,id,user.id);
      requireValue(m.current_turn===body.teamNumber,409,'NOT_TEAM_TURN','Only the active team can use its help');
      const q=await client.query<{status:string;revealed_at:Date|null}>(`
        SELECT status,revealed_at FROM match_questions WHERE match_id=$1 AND question_id=$2 FOR UPDATE`,
        [id,body.questionId]);
      requireValue(q.rows[0],404,'QUESTION_NOT_FOUND','Question not in match');
      const pit=body.helpType==='pit';
      requireValue(pit ? q.rows[0].status==='reserved':q.rows[0].status==='shown'&&!q.rows[0].revealed_at,
        409,'HELP_TIMING','Help cannot be activated at this point');
      const active=await client.query(`UPDATE match_helps SET status='used',used_at=now()
        WHERE match_id=$1 AND team_number=$2 AND help_type=$3 AND status='selected' RETURNING help_type`,
        [id,body.teamNumber,body.helpType]);
      requireValue(active.rows.length,409,'HELP_NOT_SELECTED','Select an unused help first');
      const used=await client.query(`INSERT INTO match_help_uses(match_id,question_id,team_number,help_type)
        VALUES($1,$2,$3,$4) ON CONFLICT(match_id,question_id) DO NOTHING RETURNING question_id`,
        [id,body.questionId,body.teamNumber,body.helpType]);
      requireValue(used.rows.length,409,'HELP_ALREADY_USED','This question already has a used help');
    });
    res.json({used:body.helpType,questionId:body.questionId});
  }));

  router.post('/matches/:id/questions/:questionId/resolve',requireAuth,wrap(async(req,res)=>{
    const user=userOf(req),id=uuid.parse(req.params.id),questionId=uuid.parse(req.params.questionId);
    const body=resultBody.parse(req.body);
    const result=await transaction(async client=>{
      const match=await lockMatch(client,id,user.id);
      const data=await client.query<{status:string;points:number;revealed_at:Date|null}>(`
        SELECT mq.status,q.points,mq.revealed_at FROM match_questions mq
        JOIN questions q ON q.id=mq.question_id
        WHERE mq.match_id=$1 AND mq.question_id=$2 FOR UPDATE OF mq`,[id,questionId]);
      requireValue(data.rows[0],404,'QUESTION_NOT_FOUND','Question not in match');
      requireValue(data.rows[0].status==='shown'&&data.rows[0].revealed_at,
        409,'QUESTION_NOT_REVEALED','Reveal the answer before awarding points');
      const helper=await client.query<{help_type:HelpType;team_number:TeamNumber}>(`
        SELECT help_type,team_number FROM match_help_uses WHERE match_id=$1 AND question_id=$2`,[id,questionId]);
      const active=helper.rows[0];
      const changes=scoreDeltas(data.rows[0].points,body.awardedTeam,
        active?{type:active.help_type,team:active.team_number}:undefined);
      await scoreChanges(client,id,questionId,changes);
      await client.query(`UPDATE match_questions SET status='resolved',resolved_at=now(),
        awarded_team=$3,awarded_points=$4 WHERE match_id=$1 AND question_id=$2`,
        [id,questionId,body.awardedTeam,body.awardedTeam===null?0:data.rows[0].points]);
      const next=match.current_turn===1?2:1;
      await client.query('UPDATE matches SET current_turn=$2 WHERE id=$1',[id,next]);
      return {questionId,awardedTeam:body.awardedTeam,changes,nextTurn:next};
    });
    res.json(result);
  }));

  router.post('/matches/:id/teams/:teamNumber/adjust',requireAuth,wrap(async(req,res)=>{
    const user=userOf(req),id=uuid.parse(req.params.id);
    const team=teamNo.parse(Number(req.params.teamNumber));const body=adjustBody.parse(req.body);
    const key=uuid.parse(req.header('Idempotency-Key'));
    const result=await transaction(async client=>{
      await lockMatch(client,id,user.id);
      const inserted=await client.query(`INSERT INTO score_events(match_id,team_number,delta,reason,idempotency_key)
        VALUES($1,$2,$3,'manual',$4) ON CONFLICT DO NOTHING RETURNING id`,
        [id,team,body.delta,key]);
      if(inserted.rows.length){await client.query(`UPDATE match_teams SET score=score+$3
        WHERE match_id=$1 AND team_number=$2`,[id,team,body.delta]);}
      const current=await client.query<{score:number}>(`SELECT score FROM match_teams
        WHERE match_id=$1 AND team_number=$2`,[id,team]);
      requireValue(current.rows[0],404,'TEAM_NOT_FOUND','Team not found');
      return {score:current.rows[0].score,alreadyApplied:!inserted.rows.length};
    });
    res.json({teamNumber:team,...result});
  }));

  router.post('/matches/:id/finish',requireAuth,wrap(async(req,res)=>{
    const user=userOf(req),id=uuid.parse(req.params.id);confirmBody.parse(req.body);
    const result=await transaction(async client=>{
      await lockMatch(client,id,user.id);
      const teams=await client.query<{team_number:TeamNumber;team_name:string;score:number}>(`
        SELECT team_number,team_name,score FROM match_teams WHERE match_id=$1 ORDER BY team_number`,[id]);
      requireValue(teams.rows.length===2,409,'TEAMS_NOT_READY','Two teams required');
      const first=teams.rows[0]!,second=teams.rows[1]!;
      const winner=winningTeam(first.score,second.score);
      await client.query(`UPDATE matches SET status='finished',winner_team=$2,ended_at=now()
        WHERE id=$1`,[id,winner]);
      return winner ? {result:'winner' as const,winner:{teamNumber:winner,
        name:teams.rows[winner-1]!.team_name,score:teams.rows[winner-1]!.score}}
        : {result:'tie' as const,score:first.score};
    });
    // Winner result deliberately returns only the winning team, matching approved UI.
    res.json(result);
  }));
  return router;
}
