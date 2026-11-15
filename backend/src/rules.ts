import { z } from 'zod';
import { ApiError } from './errors.js';

export const HELP_TYPES = ['call_friend','pit','two_answers','rest','trap'] as const;
export const helpTypeSchema = z.enum(HELP_TYPES);
export type HelpType = z.infer<typeof helpTypeSchema>;
export type TeamNumber = 1 | 2;
export const points = [200, 400, 600] as const;

export const matchInput = z.object({
  categoryIds: z.array(z.string().uuid()).refine(a => [4,6,8].includes(a.length), 'Choose 4, 6, or 8 categories')
    .refine(a => new Set(a).size === a.length, 'Duplicate category'),
  teamNames: z.tuple([z.string().trim().min(1).max(80), z.string().trim().min(1).max(80)]),
  teamHelps: z.tuple([
    z.array(helpTypeSchema).length(3).refine(a => new Set(a).size === 3, 'Three different helps required'),
    z.array(helpTypeSchema).length(3).refine(a => new Set(a).size === 3, 'Three different helps required'),
  ]),
});

export function scoreDeltas(pointsForQuestion: number, awardedTeam: TeamNumber | null,
  help?: {type: HelpType; team: TeamNumber}): { team: TeamNumber; delta: number; reason: 'question'|'pit_penalty'|'trap_penalty' }[] {
  if (![200,400,600].includes(pointsForQuestion)) throw new ApiError(422,'INVALID_POINTS','Invalid question value');
  if (help?.type === 'trap') {
    const opponent = help.team === 1 ? 2 : 1;
    if (awardedTeam === help.team) throw new ApiError(422,'TRAP_AWARD_INVALID','Trap hands the question to the opponent');
    if (awardedTeam === null) return [{team:opponent,delta:-pointsForQuestion,reason:'trap_penalty'}];
    return [{team:opponent,delta:pointsForQuestion,reason:'question'}];
  }
  if (awardedTeam === null) return [];
  const updates: {team: TeamNumber;delta:number;reason:'question'|'pit_penalty'|'trap_penalty'}[] = [
    {team:awardedTeam,delta:pointsForQuestion,reason:'question'}
  ];
  if (help?.type === 'pit' && awardedTeam === help.team) {
    updates.push({team:help.team === 1 ? 2 : 1,delta:-pointsForQuestion,reason:'pit_penalty'});
  }
  return updates;
}
export function winningTeam(a: number, b: number): TeamNumber | null { return a === b ? null : a > b ? 1 : 2; }
export function availableGames(remaining: Record<200|400|600,number>): number {
  return Math.min(...points.map(p => Math.floor(remaining[p]/2)));
}
