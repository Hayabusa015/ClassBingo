import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DECK_ORDER, getDeck } from '../data/decks';
import { CURRICULUM_DECKS } from '../data/curriculum';
import { elementsDeck } from '../data/elements';
import {
  generateCard,
  generateDrawOrder,
  getFilteredItems,
  settingsSignature,
  type GameSettings,
} from '../lib/cards';
import { callerProgressKey } from '../lib/gameConfig';
import { checkWin } from '../lib/bingo';
import {
  mergeLibrary,
  newPlayset,
  parseItemLines,
  playsetToDeck,
  readLibrary,
  validateLibrary,
  writeLibrary,
} from '../lib/playsets';

const settings: GameSettings = {
  deckId: 'elements',
  filterId: 'all',
  gridSize: 5,
  freeCenter: true,
  cardFace: 'symbol',
  gameCode: '2026',
};
const customItems = () =>
  parseItemLines(Array.from({ length: 30 }, (_, i) => `Term ${i + 1} | Clue ${i + 1}`).join('\n')).items;

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('curriculum library', () => {
  it('contains 22 complete playsets, with 30 unique answer/clue pairs in every new one', () => {
    expect(DECK_ORDER).toHaveLength(22);
    for (const deck of CURRICULUM_DECKS) {
      expect(deck.items).toHaveLength(30);
      expect(new Set(deck.items.map((item) => item.name.toLowerCase())).size).toBe(30);
      expect(deck.items.every((item) => item.name && item.clue)).toBe(true);
      const card = generateCard(deck, { ...settings, deckId: deck.id, cardFace: 'name' }, 1);
      expect(card.flat().filter((cell) => cell.item)).toHaveLength(24);
    }
  });
});

describe('individual item selection', () => {
  const ids = elementsDeck.items.slice(0, 30).map((item) => item.id);
  it('uses exactly the selected pool for both draws and every generated card', () => {
    const selected = { ...settings, selectedItemIds: ids };
    expect(
      generateDrawOrder(elementsDeck, selected)
        .map((item) => item.id)
        .sort(),
    ).toEqual([...ids].sort());
    for (let n = 1; n <= 10; n++) {
      const cells = generateCard(elementsDeck, selected, n)
        .flat()
        .filter((cell) => cell.item);
      expect(cells.every((cell) => ids.includes(cell.item!.id))).toBe(true);
      expect(new Set(cells.map((cell) => cell.item!.id)).size).toBe(24);
    }
  });
  it('treats an empty selection as empty and prevents impossible cards', () => {
    expect(getFilteredItems(elementsDeck, 'all', [])).toEqual([]);
    expect(() => generateCard(elementsDeck, { ...settings, selectedItemIds: [] }, 1)).toThrow(
      'Not enough items',
    );
  });
  it('checks a saved selected card against the exact items on that printed board', () => {
    const saved = newPlayset('My elements', 'Science', elementsDeck.items.slice(0, 30), 'elements');
    const deck = playsetToDeck(saved);
    const game = { ...settings, deckId: deck.id, selectedItemIds: ids.slice(0, 25) };
    const printed = generateCard(deck, game, 7);
    const called = new Set(printed[0].map((cell) => cell.item!.id));
    const restored = generateCard(playsetToDeck(JSON.parse(JSON.stringify(saved))), game, 7);
    expect(checkWin(restored, called, 'line').win).toBe(true);
    called.delete(printed[0][0].item!.id);
    expect(checkWin(restored, called, 'line').win).toBe(false);
  });
  it('normalizes selection order and isolates progress between different selections', () => {
    const a = { ...settings, selectedItemIds: ids };
    const reversed = { ...settings, selectedItemIds: [...ids].reverse() };
    const b = { ...settings, selectedItemIds: ids.slice(1) };
    expect(generateCard(elementsDeck, a, 1)).toEqual(generateCard(elementsDeck, reversed, 1));
    expect(callerProgressKey(a, 'elements')).toBe(callerProgressKey(reversed, 'elements'));
    expect(callerProgressKey(a, 'elements')).not.toBe(callerProgressKey(b, 'elements'));
    expect(settingsSignature(settings)).toBe('elements|all|5|true|symbol');
    expect(callerProgressKey(settings, 'elements')).toBe('caller:elements:all:5:true:2026');
  });
});

describe('custom playsets', () => {
  it('accepts plain answers, pipe-separated clues, and spreadsheet rows', () => {
    const result = parseItemLines('One\nTwo | Second clue\nThree\tThird clue\n');
    expect(result.errors).toEqual([]);
    expect(result.items.map((item) => item.name)).toEqual(['One', 'Two', 'Three']);
    expect(result.items[2].clue).toBe('Third clue');
  });
  it('reports duplicate answers and malformed rows instead of silently dropping them', () => {
    expect(parseItemLines('DNA\ndna').errors).toHaveLength(1);
    expect(parseItemLines('| no answer').errors).toHaveLength(1);
    expect(parseItemLines('x'.repeat(81)).errors).toHaveLength(1);
  });
  it('round-trips a saved playset and regenerates the same cards', () => {
    const saved = newPlayset('Biology review', 'Science', customItems());
    writeLibrary([saved]);
    const loaded = readLibrary().playsets[0];
    expect(loaded).toEqual(saved);
    const deck = playsetToDeck(saved);
    const game = { ...settings, deckId: saved.id, cardFace: 'name' as const };
    expect(generateCard(deck, game, 3)).toEqual(generateCard(playsetToDeck(loaded), game, 3));
    expect(deck.challengeHiddenField('name')).toBe('headline');
    expect(deck.supportsChallenge).toBe(true);
  });
  it('preserves the periodic-table presentation for a saved element selection', () => {
    const saved = newPlayset('Selected elements', 'Science', elementsDeck.items.slice(0, 30), 'elements');
    const deck = playsetToDeck(saved);
    expect(deck.presentation).toBe('elements');
    expect(deck.callHeadline(deck.items[0])).toBe('H');
    expect(deck.squareText(deck.items[0], 'symbol')).toBe('H');
    expect(deck.defaultFilterId).toBe('all');
  });
  it('disables clue challenges when some answers do not have clues', () => {
    const items = customItems();
    delete items[0].clue;
    expect(playsetToDeck(newPlayset('Words', 'English', items)).supportsChallenge).toBe(false);
  });
  it('rejects malformed imports and unsafe source identifiers', () => {
    expect(() => validateLibrary([{}])).toThrow();
    const saved = newPlayset('Words', 'English', customItems());
    expect(() => validateLibrary([{ ...saved, sourceDeckId: '__proto__' }])).toThrow();
    expect(() =>
      validateLibrary([{ ...saved, items: [saved.items[0], ...saved.items.slice(0, 10)] }]),
    ).toThrow();
    expect(() => getDeck('curriculum:missing')).toThrow();
  });
  it('does not overwrite unreadable storage and reports write failures', () => {
    localStorage.setItem('classbingo:playsets:v1', '{bad');
    expect(readLibrary().error).toBeTruthy();
    expect(localStorage.getItem('classbingo:playsets:v1')).toBe('{bad');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota');
    });
    expect(() => writeLibrary([newPlayset('Words', 'English', customItems())])).toThrow('could not save');
  });
  it('deduplicates identical imports and preserves existing content on ID conflicts', () => {
    const saved = newPlayset('Words', 'English', customItems());
    expect(mergeLibrary([saved], [saved])).toHaveLength(1);
    const merged = mergeLibrary([saved], [{ ...saved, title: 'Changed' }]);
    expect(merged).toHaveLength(2);
    expect(merged[0]).toEqual(saved);
    expect(merged[1].id).not.toBe(saved.id);
  });
});
