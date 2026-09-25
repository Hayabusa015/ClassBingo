import { describe, it, expect } from 'vitest';
import { checkWin } from '../lib/bingo';
import type { CardGrid } from '../lib/cards';
import type { BingoItem } from '../data/types';

function item(id: string): BingoItem {
  return { id, name: id, tags: [] };
}

/** Builds a 3x3 grid from a 2D array of ids, or null for a free space. */
function buildGrid(ids: (string | null)[][]): CardGrid {
  return ids.map((row) =>
    row.map((id) =>
      id === null
        ? { item: null, isFree: true, text: 'FREE' }
        : { item: item(id), isFree: false, text: id },
    ),
  );
}

describe('checkWin - line pattern', () => {
  it('detects a completed row', () => {
    const grid = buildGrid([
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
      ['g', 'h', 'i'],
    ]);
    const called = new Set(['a', 'b', 'c']);
    const result = checkWin(grid, called, 'line');
    expect(result.win).toBe(true);
    expect(result.winningCells).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ]);
  });

  it('detects a completed column', () => {
    const grid = buildGrid([
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
      ['g', 'h', 'i'],
    ]);
    const called = new Set(['a', 'd', 'g']);
    expect(checkWin(grid, called, 'line').win).toBe(true);
  });

  it('detects a completed diagonal', () => {
    const grid = buildGrid([
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
      ['g', 'h', 'i'],
    ]);
    const called = new Set(['a', 'e', 'i']);
    expect(checkWin(grid, called, 'line').win).toBe(true);
  });

  it('treats the free space as already covered', () => {
    const grid = buildGrid([
      ['a', 'b', 'c'],
      ['d', null, 'f'],
      ['g', 'h', 'i'],
    ]);
    const called = new Set(['a', 'i']);
    expect(checkWin(grid, called, 'line').win).toBe(true); // main diagonal a, FREE, i
  });

  it('reports not-win with missing items for the closest line', () => {
    const grid = buildGrid([
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
      ['g', 'h', 'i'],
    ]);
    const called = new Set(['a', 'b']); // one away from row 0
    const result = checkWin(grid, called, 'line');
    expect(result.win).toBe(false);
    expect(result.missing.map((i) => i.id)).toEqual(['c']);
  });

  it('reports no win with empty missing only when nothing is called and picks a minimal line', () => {
    const grid = buildGrid([
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
      ['g', 'h', 'i'],
    ]);
    const result = checkWin(grid, new Set(), 'line');
    expect(result.win).toBe(false);
    expect(result.missing.length).toBe(3);
  });
});

describe('checkWin - corners', () => {
  it('detects all four corners called', () => {
    const grid = buildGrid([
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
      ['g', 'h', 'i'],
    ]);
    const called = new Set(['a', 'c', 'g', 'i']);
    expect(checkWin(grid, called, 'corners').win).toBe(true);
  });

  it('is false when a corner is missing', () => {
    const grid = buildGrid([
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
      ['g', 'h', 'i'],
    ]);
    const called = new Set(['a', 'c', 'g']);
    const result = checkWin(grid, called, 'corners');
    expect(result.win).toBe(false);
    expect(result.missing.map((i) => i.id)).toEqual(['i']);
  });
});

describe('checkWin - x pattern', () => {
  it('requires both diagonals fully called', () => {
    const grid = buildGrid([
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
      ['g', 'h', 'i'],
    ]);
    const called = new Set(['a', 'e', 'i', 'c', 'g']);
    expect(checkWin(grid, called, 'x').win).toBe(true);
  });

  it('is false with only one diagonal', () => {
    const grid = buildGrid([
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
      ['g', 'h', 'i'],
    ]);
    const called = new Set(['a', 'e', 'i']);
    expect(checkWin(grid, called, 'x').win).toBe(false);
  });
});

describe('checkWin - blackout', () => {
  it('requires every square called', () => {
    const grid = buildGrid([
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
      ['g', 'h', 'i'],
    ]);
    const all = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']);
    expect(checkWin(grid, all, 'blackout').win).toBe(true);
  });

  it('is false if even one square is missing', () => {
    const grid = buildGrid([
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
      ['g', 'h', 'i'],
    ]);
    const almostAll = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    const result = checkWin(grid, almostAll, 'blackout');
    expect(result.win).toBe(false);
    expect(result.missing.map((i) => i.id)).toEqual(['i']);
  });
});
