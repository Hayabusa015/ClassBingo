import type { DeckConfig } from '../data/types';
import { eligibleMemoryItems, pairLabel } from './memory';
import { createRng, shuffle } from './rng';
import { supabase } from './supabase';

export type GlitchMode = 'hunt' | 'outbreak';
export type GlitchPhase = 'lobby' | 'repair' | 'intermission' | 'alert' | 'vote' | 'reveal' | 'ended';
export type GlitchWinner = 'players' | 'glitches' | 'healthy' | 'infected';
export type GlitchLevelId = 0 | 1 | 2 | 3;
export type GlitchDirection = 'clue-to-term' | 'term-to-clue';

export interface GlitchLevelSettings {
  id: GlitchLevelId;
  name: string;
  bestFor: string;
  pips: number;
  hiddenRoles: boolean;
  repairSeconds: number;
  questionSeconds: number;
  choices: number;
  directions: GlitchDirection | 'mixed';
  tagMatchedDistractors: boolean;
  discussionSeconds?: number;
  voteSeconds?: number;
  revealRoleOnEject?: boolean;
  scanCost: number;
  canFrameNeighbor: boolean;
  outbreakAllowed: boolean;
  defaultRounds: number;
  goalFactor: number;
}

export const GLITCH_LEVELS: Record<GlitchLevelId, GlitchLevelSettings> = {
  0: {
    id: 0,
    name: 'Practice',
    bestFor: 'First day / warm-up',
    pips: 1,
    hiddenRoles: false,
    repairSeconds: 90,
    questionSeconds: 30,
    choices: 3,
    directions: 'clue-to-term',
    tagMatchedDistractors: false,
    scanCost: 2,
    canFrameNeighbor: false,
    outbreakAllowed: false,
    defaultRounds: 4,
    goalFactor: 0.75,
  },
  1: {
    id: 1,
    name: 'Rookie',
    bestFor: 'First real game',
    pips: 2,
    hiddenRoles: true,
    repairSeconds: 90,
    questionSeconds: 30,
    choices: 3,
    directions: 'clue-to-term',
    tagMatchedDistractors: false,
    discussionSeconds: 90,
    voteSeconds: 30,
    revealRoleOnEject: true,
    scanCost: 3,
    canFrameNeighbor: false,
    outbreakAllowed: false,
    defaultRounds: 5,
    goalFactor: 0.85,
  },
  2: {
    id: 2,
    name: 'Pro',
    bestFor: 'Regular review',
    pips: 3,
    hiddenRoles: true,
    repairSeconds: 75,
    questionSeconds: 20,
    choices: 4,
    directions: 'mixed',
    tagMatchedDistractors: false,
    discussionSeconds: 75,
    voteSeconds: 30,
    revealRoleOnEject: true,
    scanCost: 2,
    canFrameNeighbor: false,
    outbreakAllowed: true,
    defaultRounds: 5,
    goalFactor: 0.8,
  },
  3: {
    id: 3,
    name: 'Legend',
    bestFor: 'Test prep / challenge day',
    pips: 4,
    hiddenRoles: true,
    repairSeconds: 60,
    questionSeconds: 15,
    choices: 4,
    directions: 'mixed',
    tagMatchedDistractors: true,
    discussionSeconds: 60,
    voteSeconds: 25,
    revealRoleOnEject: false,
    scanCost: 2,
    canFrameNeighbor: true,
    outbreakAllowed: true,
    defaultRounds: 6,
    goalFactor: 0.8,
  },
};
export const GLITCH_LEVEL_ORDER: GlitchLevelId[] = [0, 1, 2, 3];

export const ROUND_NAMES = ['Boot Sequence', 'Memory Check', 'Core Scan', 'Firewall', 'System Restore', 'Final Patch'];
export function roundName(round: number): string {
  return ROUND_NAMES[round - 1] ?? `Round ${round}`;
}

export const EMBLEM_SHAPES = ['●', '▲', '■', '◆', '★', '⬢'] as const;
export const EMBLEM_COLOR_COUNT = 8;
export function emblemShape(emblem: number): string {
  return EMBLEM_SHAPES[emblem % EMBLEM_SHAPES.length];
}
export function emblemColorIndex(emblem: number): number {
  return Math.floor(emblem / EMBLEM_SHAPES.length) % EMBLEM_COLOR_COUNT;
}

/** Glitches assigned when a hunt-mode game starts, capped so Players always outnumber them. */
export function glitchCount(level: GlitchLevelId, activeCount: number): number {
  if (level === 0) return 0;
  let raw: number;
  if (level === 1) raw = 1;
  else if (level === 2) raw = activeCount < 10 ? 1 : Math.floor(activeCount / 8);
  else raw = activeCount < 8 ? 1 : Math.floor(activeCount / 7);
  const cap = Math.max(1, Math.floor((activeCount - 1) / 3));
  return Math.max(1, Math.min(raw, cap));
}

/** Mirrors glitch_start_game's SQL so the setup screen can preview it live. */
export function computeMeterGoal(
  settings: Pick<GlitchLevelSettings, 'repairSeconds' | 'goalFactor'>,
  honestCount: number,
  totalRounds: number,
): number {
  const questionsPerRound = settings.repairSeconds / 10;
  const expected = honestCount * totalRounds * questionsPerRound * 0.7;
  return Math.max(10, Math.ceil(expected * settings.goalFactor));
}

/** Rough total playtime for the level-card estimate; a host-transition buffer per round is baked in. */
export function estimatedMinutes(settings: GlitchLevelSettings, totalRounds: number): number {
  const perRound = settings.repairSeconds + (settings.discussionSeconds ?? 0) + (settings.voteSeconds ?? 0) + 15;
  return Math.max(1, Math.round((perRound * totalRounds) / 60));
}

export interface VoteTallyEntry {
  targetId: string | null;
  count: number;
}
export interface VoteTallyResult {
  ejectedId: string | null;
  tally: VoteTallyEntry[];
}
/** A plurality ejects; a tie at the top or Skip >= the leader means nobody is ejected. */
export function tallyVotes(votes: Array<{ targetId: string | null }>): VoteTallyResult {
  const counts = new Map<string | null, number>();
  for (const v of votes) counts.set(v.targetId, (counts.get(v.targetId) ?? 0) + 1);
  const tally = [...counts.entries()]
    .map(([targetId, count]) => ({ targetId, count }))
    .sort((a, b) => b.count - a.count);
  const targetEntries = tally.filter((e) => e.targetId !== null);
  if (targetEntries.length === 0) return { ejectedId: null, tally };
  const skipCount = counts.get(null) ?? 0;
  const top = targetEntries[0];
  const tiedAtTop = targetEntries.filter((e) => e.count === top.count).length > 1;
  if (tiedAtTop || skipCount >= top.count) return { ejectedId: null, tally };
  return { ejectedId: top.targetId, tally };
}

// ===================== Question generation (deterministic, pure) =====================

export interface GlitchQuestion {
  id: string;
  direction: GlitchDirection;
  prompt: string;
  choices: string[];
  answer: number;
  itemId: string;
  itemName: string;
  pairLabel: string;
}

export function glitchQuestionCount(
  deck: DeckConfig,
  filterId: string,
  selectedItemIds: string[] | undefined,
  level: GlitchLevelId,
): number {
  const settings = GLITCH_LEVELS[level];
  const items = eligibleMemoryItems(deck, filterId, selectedItemIds);
  const directionCount = settings.directions === 'mixed' ? 2 : 1;
  return Math.min(200, items.length * directionCount);
}

/** Builds a deterministic question bank from a playset, the same way Memory seeds its tile shuffle from a game code. */
export function buildGlitchQuestions(
  deck: DeckConfig,
  filterId: string,
  selectedItemIds: string[] | undefined,
  level: GlitchLevelId,
  seed: string,
): GlitchQuestion[] {
  const settings = GLITCH_LEVELS[level];
  const items = eligibleMemoryItems(deck, filterId, selectedItemIds);
  if (items.length < 8) {
    throw new Error(
      `Not enough uniquely pairable items (${items.length}) to host GLITCH. Pick a broader filter — you need at least 8.`,
    );
  }
  const rng = createRng(seed);
  const directions: GlitchDirection[] = settings.directions === 'mixed' ? ['clue-to-term', 'term-to-clue'] : [settings.directions];

  const questions: GlitchQuestion[] = [];
  for (const item of items) {
    const label = pairLabel(item);
    if (!label) continue;
    for (const direction of directions) {
      const prompt = direction === 'clue-to-term' ? `Which term matches: "${label}"?` : `Which matches ${item.name}?`;
      const correctText = direction === 'clue-to-term' ? item.name : label;

      const pool = items.filter((other) => other.id !== item.id);
      const scored = pool.map((other) => ({
        text: direction === 'clue-to-term' ? other.name : (pairLabel(other) ?? other.name),
        shared: settings.tagMatchedDistractors && other.tags.some((tag) => item.tags.includes(tag)),
      }));
      const shuffled = shuffle(scored, rng);
      const ordered = settings.tagMatchedDistractors
        ? [...shuffled.filter((s) => s.shared), ...shuffled.filter((s) => !s.shared)]
        : shuffled;
      const distractors = ordered.slice(0, settings.choices - 1).map((s) => s.text);
      const choices = shuffle([correctText, ...distractors], rng);

      questions.push({
        id: `${item.id}:${direction}`,
        direction,
        prompt,
        choices,
        answer: choices.indexOf(correctText),
        itemId: item.id,
        itemName: item.name,
        pairLabel: label,
      });
    }
  }
  return shuffle(questions, rng).slice(0, 200);
}

// ===================== Rows =====================

export interface GlitchSessionRow {
  id: string;
  code: string;
  title: string;
  mode: GlitchMode;
  level: GlitchLevelId;
  phase: GlitchPhase;
  round: number;
  total_rounds: number;
  phase_ends_at: string | null;
  paused_remaining_ms: number | null;
  locked: boolean;
  meter: number;
  meter_goal: number;
  last_result: { round: number; meterGained: number } | null;
  winner: GlitchWinner | null;
  created_at: string;
  updated_at: string;
}

export interface GlitchPlayerRow {
  id: string;
  session_id: string;
  name: string;
  status: 'active' | 'ghost';
  sector: number | null;
  emblem: number;
  joined_at: string;
}

// ===================== Session credentials (survive a tab refresh) =====================

export interface GlitchHostCredentials {
  sessionId: string;
  code: string;
  hostSecret: string;
  level: GlitchLevelId;
  mode: GlitchMode;
}
const HOST_SESSION_KEY = 'classbingo:glitch-host-session';
export function saveGlitchHostSession(cred: GlitchHostCredentials): void {
  sessionStorage.setItem(HOST_SESSION_KEY, JSON.stringify(cred));
}
export function loadGlitchHostSession(): GlitchHostCredentials | null {
  try {
    const raw = sessionStorage.getItem(HOST_SESSION_KEY);
    return raw ? (JSON.parse(raw) as GlitchHostCredentials) : null;
  } catch {
    return null;
  }
}
export function clearGlitchHostSession(): void {
  sessionStorage.removeItem(HOST_SESSION_KEY);
}

export interface GlitchPlayerCredentials {
  sessionId: string;
  playerId: string;
  playerSecret: string;
  name: string;
  code: string;
}
const PLAYER_SESSION_KEY = 'classbingo:glitch-player-session';
export function saveGlitchPlayerSession(cred: GlitchPlayerCredentials): void {
  sessionStorage.setItem(PLAYER_SESSION_KEY, JSON.stringify(cred));
}
export function loadGlitchPlayerSession(): GlitchPlayerCredentials | null {
  try {
    const raw = sessionStorage.getItem(PLAYER_SESSION_KEY);
    return raw ? (JSON.parse(raw) as GlitchPlayerCredentials) : null;
  } catch {
    return null;
  }
}
export function clearGlitchPlayerSession(): void {
  sessionStorage.removeItem(PLAYER_SESSION_KEY);
}

// ===================== Supabase RPC calls =====================

async function call<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export async function createGlitchSession(
  title: string,
  mode: GlitchMode,
  level: GlitchLevelId,
  totalRounds: number,
  settings: GlitchLevelSettings,
  questions: GlitchQuestion[],
): Promise<GlitchHostCredentials> {
  const rows = await call<{ session_id: string; code: string; host_secret: string }[]>('glitch_create_session', {
    p_title: title,
    p_mode: mode,
    p_level: level,
    p_total_rounds: totalRounds,
    p_settings: settings,
    p_questions: questions,
  });
  const row = rows[0];
  return { sessionId: row.session_id, code: row.code, hostSecret: row.host_secret, level, mode };
}

export async function joinGlitchSession(code: string, name: string): Promise<GlitchPlayerCredentials & { title: string }> {
  const rows = await call<{ player_id: string; player_secret: string; session_id: string; title: string }[]>('glitch_join', {
    p_code: code.trim().toUpperCase(),
    p_name: name,
  });
  const row = rows[0];
  return {
    sessionId: row.session_id,
    playerId: row.player_id,
    playerSecret: row.player_secret,
    name: name.trim(),
    code: code.trim().toUpperCase(),
    title: row.title,
  };
}

export const startGlitchGame = (sessionId: string, hostSecret: string) =>
  call<void>('glitch_start_game', { p_session_id: sessionId, p_host_secret: hostSecret });

export const advanceGlitch = (sessionId: string, hostSecret: string, expectedPhase: GlitchPhase, expectedRound: number) =>
  call<void>('glitch_advance', {
    p_session_id: sessionId,
    p_host_secret: hostSecret,
    p_expected_phase: expectedPhase,
    p_expected_round: expectedRound,
  });

export const addGlitchTime = (sessionId: string, hostSecret: string, seconds: number) =>
  call<void>('glitch_add_time', { p_session_id: sessionId, p_host_secret: hostSecret, p_seconds: seconds });

export const pauseGlitch = (sessionId: string, hostSecret: string, paused: boolean) =>
  call<void>('glitch_pause', { p_session_id: sessionId, p_host_secret: hostSecret, p_paused: paused });

export const setGlitchLocked = (sessionId: string, hostSecret: string, locked: boolean) =>
  call<void>('glitch_set_locked', { p_session_id: sessionId, p_host_secret: hostSecret, p_locked: locked });

export const kickGlitchPlayer = (sessionId: string, hostSecret: string, playerId: string) =>
  call<void>('glitch_kick_player', { p_session_id: sessionId, p_host_secret: hostSecret, p_player_id: playerId });

export const endGlitchSession = (sessionId: string, hostSecret: string) =>
  call<void>('glitch_end_session', { p_session_id: sessionId, p_host_secret: hostSecret });

export interface GlitchNextQuestion {
  questionId: string;
  prompt: string;
  choices: string[];
  removed: number[];
  expiresAt: string;
}
export const nextGlitchQuestion = (sessionId: string, playerId: string, playerSecret: string) =>
  call<GlitchNextQuestion>('glitch_next_question', {
    p_session_id: sessionId,
    p_player_id: playerId,
    p_player_secret: playerSecret,
  });

export interface GlitchAnswerResult {
  correct: boolean;
  correctIndex: number;
  charges: number;
  itemName: string;
  pairLabel: string;
}
export const submitGlitchAnswer = (
  sessionId: string,
  playerId: string,
  playerSecret: string,
  questionId: string,
  choice: number,
) =>
  call<GlitchAnswerResult>('glitch_submit_answer', {
    p_session_id: sessionId,
    p_player_id: playerId,
    p_player_secret: playerSecret,
    p_question_id: questionId,
    p_choice: choice,
  });

export async function glitchServerNow(): Promise<Date> {
  const iso = await call<string>('glitch_now', {});
  return new Date(iso);
}

// ===================== Reads + realtime =====================

export async function fetchGlitchSession(sessionId: string): Promise<GlitchSessionRow> {
  const { data, error } = await supabase.from('glitch_sessions').select('*').eq('id', sessionId).single();
  if (error) throw new Error(error.message);
  return data as GlitchSessionRow;
}

export async function fetchGlitchPlayers(sessionId: string): Promise<GlitchPlayerRow[]> {
  const { data, error } = await supabase.from('glitch_players').select('*').eq('session_id', sessionId).order('joined_at');
  if (error) throw new Error(error.message);
  return data as GlitchPlayerRow[];
}

interface GlitchSubscriptionHandlers {
  onSession?: (row: GlitchSessionRow) => void;
  onPlayersChanged?: () => void;
}

/** Subscribes to everything about one GLITCH session. Returns an unsubscribe function. */
export function subscribeToGlitchSession(sessionId: string, handlers: GlitchSubscriptionHandlers): () => void {
  const channel = supabase
    .channel(`glitch-session-${sessionId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'glitch_sessions', filter: `id=eq.${sessionId}` },
      (payload) => handlers.onSession?.(payload.new as GlitchSessionRow),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'glitch_players', filter: `session_id=eq.${sessionId}` },
      () => handlers.onPlayersChanged?.(),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
