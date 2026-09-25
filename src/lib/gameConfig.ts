import type { GameSettings } from './cards';
import type { WinPattern } from './bingo';
import type { DeckId } from '../data/types';

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

export type View = 'home' | 'setup' | 'caller' | 'cardgen';

export interface SessionState {
  view: View;
  deckId: DeckId;
  settings: GameSettings;
  callStyle: CallStyle;
  winPattern: WinPattern;
}

export const SESSION_KEY = 'session';
export const callerProgressKey = (settings: GameSettings, deckId: DeckId): string =>
  `caller:${deckId}:${settings.filterId}:${settings.gridSize}:${settings.freeCenter}:${settings.gameCode}`;
