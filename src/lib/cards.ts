import type { BingoItem, CardFaceField, DeckConfig, DeckId } from '../data/types';
import { createRng, shuffle } from './rng';

export type GridSize = 3 | 4 | 5;

export interface GameSettings {
  deckId: DeckId;
  filterId: string;
  gridSize: GridSize;
  /** Only applies when gridSize is odd; ignored otherwise. */
  freeCenter: boolean;
  cardFace: CardFaceField;
  gameCode: string;
}

export interface CardCell {
  item: BingoItem | null;
  isFree: boolean;
  text: string;
}

export type CardGrid = CardCell[][];

export function getFilteredItems(deck: DeckConfig, filterId: string): BingoItem[] {
  const filter = deck.filters.find((f) => f.id === filterId) ?? deck.filters[0];
  return deck.items.filter(filter.predicate);
}

/** Whether the grid has an active free center square. */
export function hasFreeCenter(settings: Pick<GameSettings, 'gridSize' | 'freeCenter'>): boolean {
  return settings.freeCenter && settings.gridSize % 2 === 1;
}

/** Number of distinct deck items a card needs (grid squares minus the free center). */
export function requiredItemCount(settings: Pick<GameSettings, 'gridSize' | 'freeCenter'>): number {
  const total = settings.gridSize * settings.gridSize;
  return hasFreeCenter(settings) ? total - 1 : total;
}

export function canGenerateCards(
  availableItemCount: number,
  settings: Pick<GameSettings, 'gridSize' | 'freeCenter'>,
): boolean {
  return availableItemCount >= requiredItemCount(settings);
}

/** A stable string identifying every setting that changes what a card looks like. */
export function settingsSignature(settings: GameSettings): string {
  return [settings.deckId, settings.filterId, settings.gridSize, settings.freeCenter, settings.cardFace].join('|');
}

/**
 * Deterministically generates card #cardNumber for the given settings.
 * The same (gameCode, settings, cardNumber) always yields the same card,
 * which is what makes the winner-check feature possible: a printed card
 * can be regenerated from just its number and the game code stamped on it.
 */
export function generateCard(deck: DeckConfig, settings: GameSettings, cardNumber: number): CardGrid {
  const items = getFilteredItems(deck, settings.filterId);
  const need = requiredItemCount(settings);
  if (items.length < need) {
    throw new Error(
      `Not enough items (${items.length}) for a ${settings.gridSize}x${settings.gridSize} card (needs ${need}). Pick a smaller grid or a broader filter.`,
    );
  }

  const seed = `${settings.gameCode}|${settingsSignature(settings)}|card:${cardNumber}`;
  const rng = createRng(seed);
  const picked = shuffle(items, rng).slice(0, need);

  const free = hasFreeCenter(settings);
  const centerIndex = Math.floor((settings.gridSize * settings.gridSize) / 2);

  const grid: CardGrid = [];
  let pickedIndex = 0;
  let flatIndex = 0;
  for (let row = 0; row < settings.gridSize; row++) {
    const rowCells: CardCell[] = [];
    for (let col = 0; col < settings.gridSize; col++) {
      if (free && flatIndex === centerIndex) {
        rowCells.push({ item: null, isFree: true, text: 'FREE' });
      } else {
        const item = picked[pickedIndex++];
        const mixedRoll = rng();
        rowCells.push({ item, isFree: false, text: deck.squareText(item, settings.cardFace, mixedRoll) });
      }
      flatIndex++;
    }
    grid.push(rowCells);
  }
  return grid;
}

/** Shuffled call order for the caller screen: every filtered item exactly once. */
export function generateDrawOrder(deck: DeckConfig, settings: GameSettings): BingoItem[] {
  const items = getFilteredItems(deck, settings.filterId);
  const seed = `${settings.gameCode}|${settingsSignature(settings)}|draw`;
  return shuffle(items, createRng(seed));
}
