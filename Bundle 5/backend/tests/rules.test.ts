import test from 'node:test';
import assert from 'node:assert/strict';
import { matchInput, availableGames, scoreDeltas, winningTeam } from '../src/rules.ts';
const ids=['00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000004'];
test('4/6/8 categories and exactly three unique helps per team',()=>{
  const valid={categoryIds:ids,teamNames:['الفريق الأول','الفريق الثاني'],
    teamHelps:[['call_friend','pit','two_answers'],['call_friend','rest','trap']]};
  assert.equal(matchInput.safeParse(valid).success,true);
  assert.equal(matchInput.safeParse({...valid,categoryIds:ids.slice(0,3)}).success,false);
  assert.equal(matchInput.safeParse({...valid,categoryIds:[...ids.slice(0,3),ids[0]]}).success,false);
  assert.equal(matchInput.safeParse({...valid,teamHelps:[['pit','pit','trap'],['call_friend','rest','trap']]}).success,false);
});
test('remaining games counts full sets of 2 per tier, not sum of all questions',()=>{
  assert.equal(availableGames({200:40,400:40,600:40}),20);
  assert.equal(availableGames({200:6,400:4,600:2}),1);
  assert.equal(availableGames({200:5,400:0,600:8}),0);
});
test('ordinary correct answer, neither, pit and trap',()=>{
  assert.deepEqual(scoreDeltas(400,1),[{team:1,delta:400,reason:'question'}]);
  assert.deepEqual(scoreDeltas(200,null),[]);
  assert.deepEqual(scoreDeltas(600,1,{type:'pit',team:1}),
    [{team:1,delta:600,reason:'question'},{team:2,delta:-600,reason:'pit_penalty'}]);
  assert.deepEqual(scoreDeltas(200,null,{type:'trap',team:1}),
    [{team:2,delta:-200,reason:'trap_penalty'}]);
  assert.throws(()=>scoreDeltas(200,1,{type:'trap',team:1}));
});
test('winner shows only winning team; tie has no winner',()=>{
  assert.equal(winningTeam(1200,1000),1);
  assert.equal(winningTeam(1200,1400),2);
  assert.equal(winningTeam(1200,1200),null);
});
