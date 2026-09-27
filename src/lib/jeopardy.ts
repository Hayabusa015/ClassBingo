import { supabase } from './supabase';

export interface JeopardyClue {
  value: number;
  clue: string;
  answer: string;
  dailyDouble: boolean;
}

export interface JeopardyCategory {
  title: string;
  clues: JeopardyClue[];
}

export interface JeopardyBoard {
  title: string;
  categories: JeopardyCategory[];
  final: { category: string; clue: string; answer: string };
}

export type JeopardyStatus =
  | 'lobby'
  | 'board'
  | 'clue_reveal'
  | 'buzzer_open'
  | 'holding'
  | 'daily_double_wager'
  | 'daily_double_clue'
  | 'final_wager'
  | 'final_reveal'
  | 'ended';

export interface JeopardySessionRow {
  id: string;
  code: string;
  title: string;
  status: JeopardyStatus;
  current_cat_idx: number | null;
  current_clue_idx: number | null;
  current_round: number;
  disqualified_player_ids: string[];
  active_player_id: string | null;
  current_wager: number | null;
  answered_keys: string[];
  final_category: string | null;
  created_at: string;
  updated_at: string;
}

export interface JeopardyPlayerRow {
  id: string;
  session_id: string;
  name: string;
  score: number;
  joined_at: string;
}

export interface JeopardyBuzzRow {
  id: number;
  session_id: string;
  cat_idx: number;
  clue_idx: number;
  round: number;
  player_id: string;
  created_at: string;
}

export interface JeopardyFinalAnswerRow {
  session_id: string;
  player_id: string;
  correct: boolean | null;
  revealed: boolean;
  revealed_wager: number | null;
  revealed_answer: string | null;
  created_at: string;
}

// ===================== Board authoring (local, no backend) =====================

export interface SavedJeopardyBoard {
  id: `jeopardy:${string}`;
  board: JeopardyBoard;
  createdAt: string;
  updatedAt: string;
}

const BOARD_LIBRARY_KEY = 'classbingo:jeopardyboards:v1';
const CLUE_VALUES = [200, 400, 600, 800, 1000];

export function emptyClue(value: number): JeopardyClue {
  return { value, clue: '', answer: '', dailyDouble: false };
}

export function emptyCategory(): JeopardyCategory {
  return { title: '', clues: CLUE_VALUES.map(emptyClue) };
}

export function emptyBoard(): JeopardyBoard {
  return {
    title: '',
    categories: Array.from({ length: 6 }, emptyCategory),
    final: { category: '', clue: '', answer: '' },
  };
}

/** Human-readable problems with a board, or an empty array if it's ready to host. */
export function boardErrors(board: JeopardyBoard): string[] {
  const errors: string[] = [];
  if (!board.title.trim()) errors.push('Give the board a title — students see this while they wait to join.');
  if (board.categories.length < 1) errors.push('Add at least one category.');
  if (board.categories.length > 6) errors.push('Use at most 6 categories.');

  const dailyDoubleCount = board.categories.reduce(
    (sum, cat) => sum + cat.clues.filter((c) => c.dailyDouble).length,
    0,
  );

  board.categories.forEach((cat, catIdx) => {
    const label = cat.title.trim() || `Category ${catIdx + 1}`;
    if (!cat.title.trim()) errors.push(`Category ${catIdx + 1} needs a title.`);
    cat.clues.forEach((clue) => {
      if (!clue.clue.trim()) errors.push(`${label} — $${clue.value}: add a clue.`);
      if (!clue.answer.trim()) errors.push(`${label} — $${clue.value}: add an answer.`);
    });
  });

  if (dailyDoubleCount < 1) errors.push('Pick one square to be the Daily Double.');
  if (dailyDoubleCount > 1) errors.push('Only one square can be the Daily Double.');

  if (!board.final.category.trim()) errors.push('Final Jeopardy needs a category.');
  if (!board.final.clue.trim()) errors.push('Final Jeopardy needs a clue.');
  if (!board.final.answer.trim()) errors.push('Final Jeopardy needs an answer.');

  return errors;
}

export function readBoardLibrary(): SavedJeopardyBoard[] {
  try {
    const raw = localStorage.getItem(BOARD_LIBRARY_KEY);
    return raw ? (JSON.parse(raw) as SavedJeopardyBoard[]) : [];
  } catch {
    return [];
  }
}

function writeBoardLibrary(boards: SavedJeopardyBoard[]): void {
  localStorage.setItem(BOARD_LIBRARY_KEY, JSON.stringify(boards));
}

export function saveBoard(board: JeopardyBoard, existingId?: string): SavedJeopardyBoard {
  const boards = readBoardLibrary();
  const now = new Date().toISOString();
  if (existingId) {
    const idx = boards.findIndex((b) => b.id === existingId);
    if (idx >= 0) {
      const updated: SavedJeopardyBoard = { ...boards[idx], board, updatedAt: now };
      boards[idx] = updated;
      writeBoardLibrary(boards);
      return updated;
    }
  }
  const saved: SavedJeopardyBoard = { id: `jeopardy:${crypto.randomUUID()}`, board, createdAt: now, updatedAt: now };
  writeBoardLibrary([...boards, saved]);
  return saved;
}

export function deleteBoard(id: string): void {
  writeBoardLibrary(readBoardLibrary().filter((b) => b.id !== id));
}

// ===================== Session credentials (survive a tab refresh) =====================

export interface HostCredentials {
  sessionId: string;
  code: string;
  hostSecret: string;
  board: JeopardyBoard;
}
const HOST_SESSION_KEY = 'classbingo:jeopardy-host-session';

export function saveHostSession(cred: HostCredentials): void {
  sessionStorage.setItem(HOST_SESSION_KEY, JSON.stringify(cred));
}
export function loadHostSession(): HostCredentials | null {
  try {
    const raw = sessionStorage.getItem(HOST_SESSION_KEY);
    return raw ? (JSON.parse(raw) as HostCredentials) : null;
  } catch {
    return null;
  }
}
export function clearHostSession(): void {
  sessionStorage.removeItem(HOST_SESSION_KEY);
}

export interface PlayerCredentials {
  sessionId: string;
  playerId: string;
  playerSecret: string;
  name: string;
  code: string;
}
const PLAYER_SESSION_KEY = 'classbingo:jeopardy-player-session';

export function savePlayerSession(cred: PlayerCredentials): void {
  sessionStorage.setItem(PLAYER_SESSION_KEY, JSON.stringify(cred));
}
export function loadPlayerSession(): PlayerCredentials | null {
  try {
    const raw = sessionStorage.getItem(PLAYER_SESSION_KEY);
    return raw ? (JSON.parse(raw) as PlayerCredentials) : null;
  } catch {
    return null;
  }
}
export function clearPlayerSession(): void {
  sessionStorage.removeItem(PLAYER_SESSION_KEY);
}

// ===================== Supabase RPC calls =====================

async function call<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export async function createSession(board: JeopardyBoard): Promise<HostCredentials> {
  const rows = await call<{ session_id: string; code: string; host_secret: string }[]>(
    'jeopardy_create_session',
    { p_title: board.title, p_board: board },
  );
  const row = rows[0];
  return { sessionId: row.session_id, code: row.code, hostSecret: row.host_secret, board };
}

export async function joinSession(
  code: string,
  name: string,
): Promise<PlayerCredentials & { title: string }> {
  const rows = await call<{ player_id: string; player_secret: string; session_id: string; title: string }[]>(
    'jeopardy_join',
    { p_code: code.trim().toUpperCase(), p_name: name },
  );
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

export const startBoard = (sessionId: string, hostSecret: string) =>
  call<void>('jeopardy_start_board', { p_session_id: sessionId, p_host_secret: hostSecret });

export const selectClue = (sessionId: string, hostSecret: string, catIdx: number, clueIdx: number) =>
  call<void>('jeopardy_select_clue', {
    p_session_id: sessionId,
    p_host_secret: hostSecret,
    p_cat_idx: catIdx,
    p_clue_idx: clueIdx,
  });

export const returnToBoard = (sessionId: string, hostSecret: string) =>
  call<void>('jeopardy_return_to_board', { p_session_id: sessionId, p_host_secret: hostSecret });

export const assignDailyDouble = (sessionId: string, hostSecret: string, playerId: string) =>
  call<void>('jeopardy_assign_daily_double', {
    p_session_id: sessionId,
    p_host_secret: hostSecret,
    p_player_id: playerId,
  });

export const submitDailyDoubleWager = (
  sessionId: string,
  playerId: string,
  playerSecret: string,
  wager: number,
) =>
  call<void>('jeopardy_submit_daily_double_wager', {
    p_session_id: sessionId,
    p_player_id: playerId,
    p_player_secret: playerSecret,
    p_wager: wager,
  });

export const openBuzzer = (sessionId: string, hostSecret: string) =>
  call<void>('jeopardy_open_buzzer', { p_session_id: sessionId, p_host_secret: hostSecret });

export const buzz = (sessionId: string, playerId: string, playerSecret: string) =>
  call<void>('jeopardy_buzz', { p_session_id: sessionId, p_player_id: playerId, p_player_secret: playerSecret });

export const markAnswer = (sessionId: string, hostSecret: string, correct: boolean) =>
  call<void>('jeopardy_mark_answer', { p_session_id: sessionId, p_host_secret: hostSecret, p_correct: correct });

export const skipClue = (sessionId: string, hostSecret: string) =>
  call<void>('jeopardy_skip_clue', { p_session_id: sessionId, p_host_secret: hostSecret });

export const startFinal = (sessionId: string, hostSecret: string) =>
  call<void>('jeopardy_start_final', { p_session_id: sessionId, p_host_secret: hostSecret });

export const submitFinal = (
  sessionId: string,
  playerId: string,
  playerSecret: string,
  wager: number,
  answer: string,
) =>
  call<void>('jeopardy_submit_final', {
    p_session_id: sessionId,
    p_player_id: playerId,
    p_player_secret: playerSecret,
    p_wager: wager,
    p_answer: answer,
  });

export const revealFinal = (sessionId: string, hostSecret: string) =>
  call<void>('jeopardy_reveal_final', { p_session_id: sessionId, p_host_secret: hostSecret });

export interface HostFinalAnswer {
  player_id: string;
  player_name: string;
  wager: number | null;
  answer: string | null;
  correct: boolean | null;
  revealed: boolean;
}
export const hostFinalAnswers = (sessionId: string, hostSecret: string) =>
  call<HostFinalAnswer[]>('jeopardy_host_final_answers', { p_session_id: sessionId, p_host_secret: hostSecret });

export const gradeFinal = (sessionId: string, hostSecret: string, playerId: string, correct: boolean) =>
  call<void>('jeopardy_grade_final', {
    p_session_id: sessionId,
    p_host_secret: hostSecret,
    p_player_id: playerId,
    p_correct: correct,
  });

export const endSession = (sessionId: string, hostSecret: string) =>
  call<void>('jeopardy_end_session', { p_session_id: sessionId, p_host_secret: hostSecret });

// ===================== Reads + realtime =====================

export async function fetchSession(sessionId: string): Promise<JeopardySessionRow> {
  const { data, error } = await supabase.from('jeopardy_sessions').select('*').eq('id', sessionId).single();
  if (error) throw new Error(error.message);
  return data as JeopardySessionRow;
}

export async function fetchPlayers(sessionId: string): Promise<JeopardyPlayerRow[]> {
  const { data, error } = await supabase
    .from('jeopardy_players')
    .select('*')
    .eq('session_id', sessionId)
    .order('joined_at');
  if (error) throw new Error(error.message);
  return data as JeopardyPlayerRow[];
}

export async function fetchBuzzesForClue(
  sessionId: string,
  catIdx: number,
  clueIdx: number,
  round: number,
): Promise<JeopardyBuzzRow[]> {
  const { data, error } = await supabase
    .from('jeopardy_buzzes')
    .select('*')
    .eq('session_id', sessionId)
    .eq('cat_idx', catIdx)
    .eq('clue_idx', clueIdx)
    .eq('round', round)
    .order('created_at');
  if (error) throw new Error(error.message);
  return data as JeopardyBuzzRow[];
}

interface SessionSubscriptionHandlers {
  onSession?: (row: JeopardySessionRow) => void;
  onPlayersChanged?: () => void;
  onBuzz?: (row: JeopardyBuzzRow) => void;
  onFinalAnswersChanged?: () => void;
}

/** Subscribes to everything about one game session. Returns an unsubscribe function. */
export function subscribeToSession(sessionId: string, handlers: SessionSubscriptionHandlers): () => void {
  const channel = supabase
    .channel(`jeopardy-session-${sessionId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'jeopardy_sessions', filter: `id=eq.${sessionId}` },
      (payload) => handlers.onSession?.(payload.new as JeopardySessionRow),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'jeopardy_players', filter: `session_id=eq.${sessionId}` },
      () => handlers.onPlayersChanged?.(),
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'jeopardy_buzzes', filter: `session_id=eq.${sessionId}` },
      (payload) => handlers.onBuzz?.(payload.new as JeopardyBuzzRow),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'jeopardy_final_answers', filter: `session_id=eq.${sessionId}` },
      () => handlers.onFinalAnswersChanged?.(),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/** Matches the "catIdx-clueIdx" strings stored in answered_keys. */
export function clueKey(catIdx: number, clueIdx: number): string {
  return `${catIdx}-${clueIdx}`;
}
