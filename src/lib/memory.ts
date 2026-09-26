import type { BingoItem, DeckConfig, DeckId } from '../data/types';
import { createRng, shuffle } from './rng';
import { getFilteredItems } from './cards';

export type MemoryPairCount = 6 | 8 | 12 | 18 | 24;
export const MEMORY_PAIR_COUNTS: MemoryPairCount[] = [6, 8, 12, 18, 24];

export interface MemorySettings {
  deckId: DeckId;
  filterId: string;
  /** Omitted means the whole filter; an empty array means no selected items. */
  selectedItemIds?: string[];
  pairCount: MemoryPairCount;
  gameCode: string;
}

export interface MemoryTile {
  tileId: string;
  itemId: string;
  side: 'front' | 'back';
  label: string;
}

/**
 * The label shown on an item's "back" tile: its symbol or formula when it has
 * one (always unique, e.g. periodic-table symbols), otherwise its clue.
 */
export function pairLabel(item: BingoItem): string | undefined {
  return item.symbol || item.formula || item.clue?.trim() || undefined;
}

/**
 * Items that can be paired for Memory: they need a back-tile label, and that
 * label must be unique within the pool — two items with an identical clue
 * (e.g. two elements both "Nonmetal, period 3") would give students no way
 * to tell which name tile matches which back tile, so both are excluded.
 */
export function eligibleMemoryItems(
  deck: DeckConfig,
  filterId: string,
  selectedItemIds?: string[],
): BingoItem[] {
  const items = getFilteredItems(deck, filterId, selectedItemIds);
  const labelCounts = new Map<string, number>();
  for (const item of items) {
    const label = pairLabel(item);
    if (label) labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1);
  }
  return items.filter((item) => {
    const label = pairLabel(item);
    return label !== undefined && labelCounts.get(label) === 1;
  });
}

/** Largest pair count from MEMORY_PAIR_COUNTS that a given item pool supports, or null if too few. */
export function bestPairCount(availableItems: number): MemoryPairCount | null {
  const fitting = MEMORY_PAIR_COUNTS.filter((count) => count <= availableItems);
  return fitting.length ? fitting[fitting.length - 1] : null;
}

/** A near-square, landscape-friendly grid for a given tile count. */
export function gridDimensions(tileCount: number): { cols: number; rows: number } {
  const cols = Math.max(1, Math.ceil(Math.sqrt(tileCount * 1.5)));
  const rows = Math.ceil(tileCount / cols);
  return { cols, rows };
}

/** A stable string identifying every setting that changes which tiles appear. */
export function memorySettingsSignature(settings: MemorySettings): string {
  const base = [settings.deckId, settings.filterId, settings.pairCount].join('|');
  return settings.selectedItemIds === undefined
    ? base
    : `${base}|items:${JSON.stringify([...new Set(settings.selectedItemIds)].sort())}`;
}

/**
 * Deterministically builds and shuffles the tile set for a memory game, the
 * same way generateCard makes bingo cards reproducible from a game code.
 */
export function buildMemoryTiles(deck: DeckConfig, settings: MemorySettings): MemoryTile[] {
  const items = eligibleMemoryItems(deck, settings.filterId, settings.selectedItemIds);
  if (items.length < settings.pairCount) {
    throw new Error(
      `Not enough uniquely pairable items (${items.length}) for ${settings.pairCount} pairs. Pick fewer pairs or a broader filter.`,
    );
  }
  const seed = `${settings.gameCode}|memory|${memorySettingsSignature(settings)}`;
  const rng = createRng(seed);
  const picked = shuffle(items, rng).slice(0, settings.pairCount);
  const tiles: MemoryTile[] = picked.flatMap((item) => [
    { tileId: `${item.id}:front`, itemId: item.id, side: 'front' as const, label: item.name },
    { tileId: `${item.id}:back`, itemId: item.id, side: 'back' as const, label: pairLabel(item) ?? '' },
  ]);
  return shuffle(tiles, rng);
}
