import type { DeckConfig, DeckId } from './types';
import { elementsDeck } from './elements';
import { ionsDeck } from './polyatomicIons';
import { mineralsDeck } from './minerals';
import { rocksDeck } from './rocks';

export const DECKS: Record<DeckId, DeckConfig> = {
  elements: elementsDeck,
  ions: ionsDeck,
  minerals: mineralsDeck,
  rocks: rocksDeck,
};

export const DECK_ORDER: DeckId[] = ['elements', 'ions', 'minerals', 'rocks'];

export function getDeck(id: DeckId): DeckConfig {
  return DECKS[id];
}

export type { DeckId, DeckConfig } from './types';
export type { BingoItem, DeckFilter, CardFaceField, CardFaceOption } from './types';
