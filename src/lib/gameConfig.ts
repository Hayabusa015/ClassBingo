import type { GameSettings } from './cards';
import type { WinPattern } from './bingo';
import type { DeckId } from '../data/types';
import type { SavedPlayset } from './playsets';

/** 'both' shows name+symbol/formula together; 'challenge' shows only the side not on student cards. */
export type CallStyle = 'both' | 'challenge';

export type Theme = 'violet' | 'dark' | 'light' | 'contrast';
export const THEME_ORDER: Theme[] = ['violet', 'dark', 'light', 'contrast'];
export const THEME_LABEL: Record<Theme, string> = {
  violet: 'Violet',
  dark: 'Dark',
  light: 'Light',
  contrast: 'High contrast',
};

export type View = 'home' | 'setup' | 'caller' | 'cardgen' | 'memory-setup' | 'memory-play';

export type GameMode = 'bingo' | 'memory';
export const GAME_MODES: GameMode[] = ['bingo', 'memory'];
export const GAME_MODE_LABEL: Record<GameMode, string> = { bingo: 'Bingo', memory: 'Memory' };

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
