import { describe, it, expect } from 'vitest';
import { elementsDeck } from '../data/elements';
import { vocabularyDeck } from '../data/vocabulary';
import {
  eligibleMemoryItems,
  pairLabel,
  bestPairCount,
  gridDimensions,
  buildMemoryTiles,
  MEMORY_PAIR_COUNTS,
  type MemorySettings,
} from '../lib/memory';

const baseSettings: MemorySettings = {
  deckId: 'elements',
  filterId: 'common',
  pairCount: 8,
  gameCode: '1234',
};

describe('eligibleMemoryItems', () => {
  it('returns every "common" element, since symbols are always unique', () => {
    const items = eligibleMemoryItems(elementsDeck, 'common');
    const all = elementsDeck.items.filter((i) => i.tags.includes('common'));
    expect(items).toHaveLength(all.length);
    expect(items.every((item) => Boolean(pairLabel(item)))).toBe(true);
  });

  it('excludes items whose back-tile label is shared with another item', () => {
    const deck = vocabularyDeck('curriculum:test', 'Test', 'Test', 'Test', '', [
      { id: 'a', name: 'Alpha', clue: 'Same clue', tags: [] },
      { id: 'b', name: 'Beta', clue: 'Same clue', tags: [] },
      { id: 'c', name: 'Gamma', clue: 'Unique clue', tags: [] },
      { id: 'd', name: 'Delta', clue: 'Another unique clue', tags: [] },
    ]);
    const items = eligibleMemoryItems(deck, 'all');
    expect(items.map((i) => i.id).sort()).toEqual(['c', 'd']);
  });

  it('excludes items with no symbol, formula, or clue at all', () => {
    const deck = vocabularyDeck('curriculum:test2', 'Test', 'Test', 'Test', '', [
      { id: 'a', name: 'Alpha', clue: 'Has a clue', tags: [] },
      { id: 'b', name: 'Beta', tags: [] },
    ]);
    expect(eligibleMemoryItems(deck, 'all').map((i) => i.id)).toEqual(['a']);
  });
});

describe('pairLabel', () => {
  it('prefers symbol, then formula, then clue', () => {
    expect(pairLabel({ id: '1', name: 'x', symbol: 'Sy', formula: 'Fo', clue: 'Cl', tags: [] })).toBe('Sy');
    expect(pairLabel({ id: '2', name: 'x', formula: 'Fo', clue: 'Cl', tags: [] })).toBe('Fo');
    expect(pairLabel({ id: '3', name: 'x', clue: 'Cl', tags: [] })).toBe('Cl');
    expect(pairLabel({ id: '4', name: 'x', tags: [] })).toBeUndefined();
  });
});

describe('bestPairCount', () => {
  it('returns the largest supported count', () => {
    expect(bestPairCount(10)).toBe(8);
    expect(bestPairCount(24)).toBe(24);
    expect(bestPairCount(100)).toBe(24);
  });

  it('returns null when there are too few items for even the smallest board', () => {
    expect(bestPairCount(5)).toBeNull();
  });

  it('every supported count is one of MEMORY_PAIR_COUNTS', () => {
    for (const n of [6, 7, 8, 17, 30]) {
      const result = bestPairCount(n);
      if (result !== null) expect(MEMORY_PAIR_COUNTS).toContain(result);
    }
  });
});

describe('gridDimensions', () => {
  it('produces a grid with enough cells for every tile', () => {
    for (const tileCount of [12, 16, 24, 36, 48]) {
      const { cols, rows } = gridDimensions(tileCount);
      expect(cols * rows).toBeGreaterThanOrEqual(tileCount);
    }
  });
});

describe('buildMemoryTiles', () => {
  it('returns two tiles per pair, each item appearing exactly twice', () => {
    const tiles = buildMemoryTiles(elementsDeck, baseSettings);
    expect(tiles).toHaveLength(baseSettings.pairCount * 2);
    const counts = new Map<string, number>();
    for (const tile of tiles) counts.set(tile.itemId, (counts.get(tile.itemId) ?? 0) + 1);
    expect([...counts.values()].every((count) => count === 2)).toBe(true);
  });

  it('gives each pair one front tile and one back tile with matching itemId', () => {
    const tiles = buildMemoryTiles(elementsDeck, baseSettings);
    const byItem = new Map<string, typeof tiles>();
    for (const tile of tiles) byItem.set(tile.itemId, [...(byItem.get(tile.itemId) ?? []), tile]);
    for (const pair of byItem.values()) {
      expect(pair).toHaveLength(2);
      expect(new Set(pair.map((t) => t.side))).toEqual(new Set(['front', 'back']));
    }
  });

  it('is deterministic for the same game code and settings', () => {
    const a = buildMemoryTiles(elementsDeck, baseSettings);
    const b = buildMemoryTiles(elementsDeck, baseSettings);
    expect(a.map((t) => t.tileId)).toEqual(b.map((t) => t.tileId));
  });

  it('reshuffles when the game code changes', () => {
    const a = buildMemoryTiles(elementsDeck, baseSettings);
    const b = buildMemoryTiles(elementsDeck, { ...baseSettings, gameCode: '9999' });
    expect(a.map((t) => t.tileId)).not.toEqual(b.map((t) => t.tileId));
  });

  it('throws when there are not enough pairable items for the requested pair count', () => {
    expect(() => buildMemoryTiles(elementsDeck, { ...baseSettings, pairCount: 24, filterId: 'first-36' })).not.toThrow();
    expect(() =>
      buildMemoryTiles(elementsDeck, { ...baseSettings, pairCount: 24, selectedItemIds: ['el-1', 'el-2'] }),
    ).toThrow(/Not enough uniquely pairable items/);
  });
});
