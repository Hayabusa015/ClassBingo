import type { GameSettings } from './cards';
import type { WinPattern } from './bingo';
import type { DeckId } from '../data/types';
import type { SavedPlayset } from './playsets';

/** 'both' shows name+symbol/formula together; 'challenge' shows only the side not on student cards. */
export type CallStyle = 'both' | 'challenge';

export type Theme = 'arcade' | 'dark' | 'light' | 'contrast';
export const THEME_ORDER: Theme[] = ['arcade', 'dark', 'light', 'contrast'];
export function normalizeTheme(value: unknown): Theme {
  return THEME_ORDER.includes(value as Theme) ? value as Theme : 'arcade';
}
export const THEME_LABEL: Record<Theme, string> = {
  arcade: 'Arcade',
  dark: 'Dark',
  light: 'Light',
  contrast: 'High contrast',
};

export type View =
  | 'landing'
  | 'privacy'
  | 'terms'
  | 'home'
  | 'setup'
  | 'caller'
  | 'cardgen'
  | 'memory-setup'
  | 'memory-play'
  | 'jeopardy-home'
  | 'jeopardy-builder'
  | 'jeopardy-host'
  | 'glitch-setup'
  | 'glitch-host';

export type GameMode = 'bingo' | 'memory' | 'jeopardy' | 'glitch';
export const GAME_MODES: GameMode[] = ['bingo', 'memory', 'jeopardy', 'glitch'];
export const GAME_MODE_LABEL: Record<GameMode, string> = {
  bingo: 'Bingo',
  memory: 'Memory',
  jeopardy: 'Jeopardy',
  glitch: 'GLITCH',
};
export const GAME_MODE_TAGLINE: Record<GameMode, string> = {
  bingo: 'Call items live and watch the boards fill up.',
  memory: 'Flip, match, and race the clock — solo or head-to-head.',
  jeopardy: 'Build a board, then host it live — students join from their own device.',
  glitch: 'Repair the machine. Find the glitch. Trust no one.',
};

/** Sidebar nav targets: every game mode, plus the marketing landing page. */
export type NavTarget = 'landing' | GameMode;

export interface SessionState {
  view: View;
  deckId: DeckId;
  settings: GameSettings;
  callStyle: CallStyle;
  winPattern: WinPattern;
  customPlayset?: SavedPlayset;
}

export const SESSION_KEY = 'session';
export const callerProgressKey = (settings: GameSettings, deckId: DeckId): string =>
  `caller:${deckId}:${settings.filterId}:${settings.gridSize}:${settings.freeCenter}:${settings.gameCode}${settings.selectedItemIds === undefined ? '' : `:items:${JSON.stringify([...new Set(settings.selectedItemIds)].sort())}`}`;
