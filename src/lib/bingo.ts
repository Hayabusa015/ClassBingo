import type { BingoItem } from '../data/types';
import type { CardCell, CardGrid } from './cards';

export type WinPattern = 'line' | 'corners' | 'x' | 'blackout';

export const WIN_PATTERNS: { id: WinPattern; label: string }[] = [
  { id: 'line', label: 'Line (row, column, or diagonal)' },
  { id: 'corners', label: 'Four corners' },
  { id: 'x', label: 'X (both diagonals)' },
  { id: 'blackout', label: 'Blackout (every square)' },
];

export interface WinResult {
  win: boolean;
  winningCells: Array<{ row: number; col: number }>;
  /** Items still needed to complete the closest pattern (or the whole card for blackout). */
  missing: BingoItem[];
}

type Coord = [number, number];

function cellCovered(cell: CardCell, calledIds: ReadonlySet<string>): boolean {
  return cell.isFree || (cell.item !== null && calledIds.has(cell.item.id));
}

function getCells(grid: CardGrid, coords: Coord[]): CardCell[] {
  return coords.map(([r, c]) => grid[r][c]);
}

function missingFromCells(cells: CardCell[], calledIds: ReadonlySet<string>): BingoItem[] {
  return cells.filter((c) => !cellCovered(c, calledIds)).map((c) => c.item as BingoItem);
}

function dedupeById(items: BingoItem[]): BingoItem[] {
  const seen = new Map<string, BingoItem>();
  for (const item of items) seen.set(item.id, item);
  return [...seen.values()];
}

function toCoordObjs(coords: Coord[]): Array<{ row: number; col: number }> {
  return coords.map(([row, col]) => ({ row, col }));
}

function allLines(n: number): Coord[][] {
  const lines: Coord[][] = [];
  for (let r = 0; r < n; r++) lines.push(Array.from({ length: n }, (_, c): Coord => [r, c]));
  for (let c = 0; c < n; c++) lines.push(Array.from({ length: n }, (_, r): Coord => [r, c]));
  lines.push(Array.from({ length: n }, (_, i): Coord => [i, i]));
  lines.push(Array.from({ length: n }, (_, i): Coord => [i, n - 1 - i]));
  return lines;
}

export function checkWin(grid: CardGrid, calledIds: ReadonlySet<string>, pattern: WinPattern): WinResult {
  const n = grid.length;

  if (pattern === 'blackout') {
    const allCoords: Coord[] = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) allCoords.push([r, c]);
    const missing = missingFromCells(getCells(grid, allCoords), calledIds);
    return { win: missing.length === 0, winningCells: missing.length === 0 ? toCoordObjs(allCoords) : [], missing };
  }

  if (pattern === 'x') {
    const main: Coord[] = Array.from({ length: n }, (_, i): Coord => [i, i]);
    const anti: Coord[] = Array.from({ length: n }, (_, i): Coord => [i, n - 1 - i]);
    const combined = [...main, ...anti];
    const missing = dedupeById(missingFromCells(getCells(grid, combined), calledIds));
    return { win: missing.length === 0, winningCells: missing.length === 0 ? toCoordObjs(combined) : [], missing };
  }

  if (pattern === 'corners') {
    const coords: Coord[] = [
      [0, 0],
      [0, n - 1],
      [n - 1, 0],
      [n - 1, n - 1],
    ];
    const missing = missingFromCells(getCells(grid, coords), calledIds);
    return { win: missing.length === 0, winningCells: missing.length === 0 ? toCoordObjs(coords) : [], missing };
  }

  // 'line': any row, column, or diagonal fully covered.
  let best: { missing: BingoItem[]; coords: Coord[] } | null = null;
  for (const line of allLines(n)) {
    const missing = missingFromCells(getCells(grid, line), calledIds);
    if (missing.length === 0) {
      return { win: true, winningCells: toCoordObjs(line), missing: [] };
    }
    if (!best || missing.length < best.missing.length) best = { missing, coords: line };
  }
  return { win: false, winningCells: [], missing: best?.missing ?? [] };
}
