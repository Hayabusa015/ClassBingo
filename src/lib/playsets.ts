import type { BingoItem, DeckConfig, DeckId } from '../data/types';
import { DECKS } from '../data/decks';
import { vocabularyDeck } from '../data/vocabulary';

export interface SavedPlayset {
  id: `custom:${string}`;
  title: string;
  subject: string;
  grades: string;
  sourceDeckId?: DeckId;
  items: BingoItem[];
}
const LIBRARY_KEY = 'classbingo:playsets:v1';

export function parseItemLines(text: string): { items: BingoItem[]; errors: string[] } {
  const items: BingoItem[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  const lines = text.split(/\r?\n/);
  for (const [index, raw] of lines.entries()) {
    if (!raw.trim()) continue;
    const parts = raw.split(/[|\t]/);
    const name = parts[0].trim();
    const clue = parts.slice(1).join(' | ').trim();
    const key = name.toLocaleLowerCase();
    if (!name || name.length > 80) {
      errors.push(`Line ${index + 1}: use an answer between 1 and 80 characters.`);
      continue;
    }
    if (clue.length > 300) {
      errors.push(`Line ${index + 1}: shorten the clue to 300 characters.`);
      continue;
    }
    if (seen.has(key)) {
      errors.push(`Line ${index + 1}: “${name}” is repeated. Each answer must be unique.`);
      continue;
    }
    seen.add(key);
    items.push({ id: `item-${items.length + 1}`, name, clue: clue || undefined, tags: [] });
  }
  if (items.length > 300) errors.push('Use no more than 300 items in one playset.');
  return { items, errors };
}

export function newPlayset(
  title: string,
  subject: string,
  items: BingoItem[],
  sourceDeckId?: DeckId,
): SavedPlayset {
  return {
    id: `custom:${crypto.randomUUID()}`,
    title: title.trim(),
    subject,
    grades: 'Custom',
    items,
    sourceDeckId,
  };
}

export function playsetToDeck(saved: SavedPlayset): DeckConfig {
  const source = saved.sourceDeckId ? DECKS[saved.sourceDeckId] : undefined;
  const generic = vocabularyDeck(
    saved.id,
    saved.title,
    saved.subject,
    saved.grades,
    'Your saved playset. Select items, call the game, or print cards.',
    saved.items,
  );
  if (!source) return generic;
  return {
    ...source,
    ...generic,
    presentation:
      source.presentation ??
      (['elements', 'ions', 'minerals', 'rocks'].includes(source.id)
        ? (source.id as 'elements' | 'ions' | 'minerals' | 'rocks')
        : undefined),
    cardFaceOptions: source.cardFaceOptions,
    defaultCardFaceId: source.defaultCardFaceId,
    callHeadline: source.callHeadline,
    callSubline: source.callSubline,
    squareText: source.squareText,
    challengeHiddenField: source.challengeHiddenField,
    supportsChallenge: source.supportsChallenge,
  };
}

function isItem(value: unknown): value is BingoItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<BingoItem>;
  return (
    typeof item.id === 'string' &&
    item.id.length > 0 &&
    item.id.length <= 150 &&
    typeof item.name === 'string' &&
    item.name.trim().length > 0 &&
    item.name.length <= 80 &&
    (item.clue === undefined || (typeof item.clue === 'string' && item.clue.length <= 300)) &&
    (item.symbol === undefined || typeof item.symbol === 'string') &&
    (item.formula === undefined || typeof item.formula === 'string') &&
    (item.charge === undefined || typeof item.charge === 'string') &&
    Array.isArray(item.tags) &&
    item.tags.every((tag) => typeof tag === 'string') &&
    (item.meta === undefined ||
      (item.meta !== null &&
        typeof item.meta === 'object' &&
        Object.values(item.meta).every((v) => typeof v === 'string' || typeof v === 'number')))
  );
}

export function validateLibrary(value: unknown): SavedPlayset[] {
  if (!Array.isArray(value) || value.length > 100)
    throw new Error('This library must contain no more than 100 playsets.');
  const ids = new Set<string>();
  for (const entry of value) {
    if (
      !entry ||
      typeof entry !== 'object' ||
      typeof entry.id !== 'string' ||
      !entry.id.startsWith('custom:') ||
      entry.id.length > 100 ||
      ids.has(entry.id) ||
      typeof entry.title !== 'string' ||
      !entry.title.trim() ||
      entry.title.length > 80 ||
      typeof entry.subject !== 'string' ||
      !entry.subject.trim() ||
      entry.subject.length > 50 ||
      typeof entry.grades !== 'string' ||
      entry.grades.length > 40 ||
      (entry.sourceDeckId !== undefined &&
        (typeof entry.sourceDeckId !== 'string' || !Object.hasOwn(DECKS, entry.sourceDeckId))) ||
      !Array.isArray(entry.items) ||
      entry.items.length < 8 ||
      entry.items.length > 300 ||
      !entry.items.every(isItem) ||
      new Set(entry.items.map((item: BingoItem) => item.id)).size !== entry.items.length ||
      new Set(entry.items.map((item: BingoItem) => item.name.trim().toLowerCase())).size !==
        entry.items.length
    ) {
      throw new Error(
        'This file contains an invalid playset. Import an unmodified ClassBingo library export.',
      );
    }
    ids.add(entry.id);
  }
  return value as SavedPlayset[];
}

export function readLibrary(): { playsets: SavedPlayset[]; error: string | null } {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    return { playsets: raw ? validateLibrary(JSON.parse(raw)) : [], error: null };
  } catch {
    return {
      playsets: [],
      error:
        'Your saved library could not be read. Existing stored data has not been changed. Import a known good library backup to restore it before saving new playsets.',
    };
  }
}

export function writeLibrary(playsets: SavedPlayset[]): void {
  validateLibrary(playsets);
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(playsets));
  } catch {
    throw new Error(
      'Your browser could not save this playset. Storage may be full or blocked. Export your library and free some space, then try again.',
    );
  }
}

/** Immutable IDs prevent an imported revision from changing an existing game. */
export function mergeLibrary(existing: SavedPlayset[], imported: SavedPlayset[]): SavedPlayset[] {
  const next = [...existing];
  for (const entry of imported) {
    const match = next.find((saved) => saved.id === entry.id);
    if (match && JSON.stringify(match) === JSON.stringify(entry)) continue;
    next.push(match ? { ...entry, id: `custom:${crypto.randomUUID()}` } : entry);
  }
  return validateLibrary(next);
}
