import type { DeckConfig, DeckId } from './types';
import { elementsDeck } from './elements';
import { ionsDeck } from './polyatomicIons';
import { mineralsDeck } from './minerals';
import { rocksDeck } from './rocks';
import { CURRICULUM_DECKS } from './curriculum';

export const DECKS: Record<DeckId, DeckConfig> = {
  elements: { ...elementsDeck, subject: 'Science', grades: '7–12' },
  ions: { ...ionsDeck, subject: 'Science', grades: '9–12' },
  minerals: { ...mineralsDeck, subject: 'Science', grades: '6–10' },
  rocks: { ...rocksDeck, subject: 'Science', grades: '6–10' },
  ...Object.fromEntries(CURRICULUM_DECKS.map((deck) => [deck.id, deck])),
};

export const DECK_ORDER: DeckId[] = [
  'elements',
  'ions',
  'minerals',
  'rocks',
  ...CURRICULUM_DECKS.map((deck) => deck.id),
];

export function getDeck(id: DeckId): DeckConfig {
  const deck = findDeck(id);
  if (!deck) throw new Error(`Playset not found: ${id}`);
  return deck;
}

export function findDeck(id: DeckId): DeckConfig | undefined {
  return Object.hasOwn(DECKS, id) ? DECKS[id] : undefined;
}

export type { DeckId, DeckConfig } from './types';
export type { BingoItem, DeckFilter, CardFaceField, CardFaceOption } from './types';
