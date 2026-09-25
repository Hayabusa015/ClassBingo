import { describe, it, expect } from 'vitest';
import { elementsDeck } from '../data/elements';
import { rocksDeck } from '../data/rocks';
import {
  generateCard,
  generateDrawOrder,
  requiredItemCount,
  canGenerateCards,
  hasFreeCenter,
  getFilteredItems,
  type GameSettings,
} from '../lib/cards';

const baseSettings: GameSettings = {
  deckId: 'elements',
  filterId: 'common',
  gridSize: 5,
  freeCenter: true,
  cardFace: 'symbol',
  gameCode: '1234',
};

describe('requiredItemCount / hasFreeCenter', () => {
  it('5x5 with free center needs 24 items', () => {
    expect(requiredItemCount(baseSettings)).toBe(24);
    expect(hasFreeCenter(baseSettings)).toBe(true);
  });

  it('4x4 ignores freeCenter (even grid)', () => {
    const s = { ...baseSettings, gridSize: 4 as const };
    expect(hasFreeCenter(s)).toBe(false);
    expect(requiredItemCount(s)).toBe(16);
  });

  it('5x5 without free center needs 25 items', () => {
    const s = { ...baseSettings, freeCenter: false };
    expect(requiredItemCount(s)).toBe(25);
  });
});

describe('canGenerateCards', () => {
  it('is false when there are not enough items', () => {
    expect(canGenerateCards(10, baseSettings)).toBe(false);
  });

  it('is true when there are enough items', () => {
    expect(canGenerateCards(24, baseSettings)).toBe(true);
  });
});

describe('generateCard', () => {
  it('is deterministic for the same seed/settings/card number', () => {
    const a = generateCard(elementsDeck, baseSettings, 7);
    const b = generateCard(elementsDeck, baseSettings, 7);
    expect(a).toEqual(b);
  });

  it('produces a different card for a different card number', () => {
    const a = generateCard(elementsDeck, baseSettings, 1);
    const b = generateCard(elementsDeck, baseSettings, 2);
    expect(a).not.toEqual(b);
  });

  it('produces a different card for a different game code', () => {
    const a = generateCard(elementsDeck, baseSettings, 1);
    const b = generateCard(elementsDeck, { ...baseSettings, gameCode: '9999' }, 1);
    expect(a).not.toEqual(b);
  });

  it('has the correct grid dimensions', () => {
    const card = generateCard(elementsDeck, baseSettings, 1);
    expect(card).toHaveLength(5);
    for (const row of card) expect(row).toHaveLength(5);
  });

  it('has exactly one free center cell for odd grids with freeCenter on', () => {
    const card = generateCard(elementsDeck, baseSettings, 1);
    const freeCells = card.flat().filter((c) => c.isFree);
    expect(freeCells).toHaveLength(1);
    expect(card[2][2].isFree).toBe(true);
  });

  it('has no duplicate items on a card', () => {
    const card = generateCard(elementsDeck, baseSettings, 3);
    const ids = card
      .flat()
      .filter((c) => !c.isFree)
      .map((c) => c.item!.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('throws when the filtered deck is too small for the grid', () => {
    const s: GameSettings = { ...baseSettings, deckId: 'rocks', filterId: 'igneous', gridSize: 5, freeCenter: false };
    expect(() => generateCard(rocksDeck, s, 1)).toThrow();
  });

  it('renders square text according to the chosen card face', () => {
    const nameCard = generateCard(elementsDeck, { ...baseSettings, cardFace: 'name' }, 1);
    const cell = nameCard.flat().find((c) => !c.isFree)!;
    expect(cell.text).toBe(cell.item!.name);
  });
});

describe('generateDrawOrder', () => {
  it('includes every filtered item exactly once', () => {
    const items = getFilteredItems(elementsDeck, baseSettings.filterId);
    const order = generateDrawOrder(elementsDeck, baseSettings);
    expect(order).toHaveLength(items.length);
    expect(new Set(order.map((i) => i.id)).size).toBe(items.length);
  });

  it('is deterministic for the same settings', () => {
    const a = generateDrawOrder(elementsDeck, baseSettings);
    const b = generateDrawOrder(elementsDeck, baseSettings);
    expect(a).toEqual(b);
  });
});
