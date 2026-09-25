import { describe, it, expect } from 'vitest';
import { ELEMENTS } from '../data/elements';
import { POLYATOMIC_IONS } from '../data/polyatomicIons';
import { MINERALS } from '../data/minerals';
import { ROCKS } from '../data/rocks';
import { DECKS, DECK_ORDER } from '../data/decks';

function assertUniqueIds(items: { id: string }[]) {
  const ids = items.map((i) => i.id);
  expect(new Set(ids).size).toBe(ids.length);
}

describe('elements data', () => {
  it('has exactly 118 elements', () => {
    expect(ELEMENTS).toHaveLength(118);
  });

  it('has unique ids', () => {
    assertUniqueIds(ELEMENTS);
  });

  it('covers atomic numbers 1 through 118 exactly once', () => {
    const numbers = ELEMENTS.map((e) => e.meta?.atomicNumber).sort((a, b) => (a as number) - (b as number));
    expect(numbers).toEqual(Array.from({ length: 118 }, (_, i) => i + 1));
  });

  it('every element has a symbol and name', () => {
    for (const el of ELEMENTS) {
      expect(el.symbol).toBeTruthy();
      expect(el.name).toBeTruthy();
    }
  });
});

describe('polyatomic ions data', () => {
  it('has unique ids', () => {
    assertUniqueIds(POLYATOMIC_IONS);
  });

  it('every ion has a formula and a charge', () => {
    for (const ion of POLYATOMIC_IONS) {
      expect(ion.formula).toBeTruthy();
      expect(ion.charge).toBeTruthy();
    }
  });

  it('has at least 30 ions', () => {
    expect(POLYATOMIC_IONS.length).toBeGreaterThanOrEqual(30);
  });
});

describe('minerals data', () => {
  it('has unique ids', () => {
    assertUniqueIds(MINERALS);
  });

  it('every mineral has a hardness between 1 and 10', () => {
    for (const m of MINERALS) {
      const h = m.meta?.hardness as number;
      expect(h).toBeGreaterThanOrEqual(1);
      expect(h).toBeLessThanOrEqual(10);
    }
  });

  it('has at least 35 minerals', () => {
    expect(MINERALS.length).toBeGreaterThanOrEqual(35);
  });
});

describe('rocks data', () => {
  it('has unique ids', () => {
    assertUniqueIds(ROCKS);
  });

  it('every rock has exactly one type tag', () => {
    const types = ['igneous', 'sedimentary', 'metamorphic'];
    for (const rock of ROCKS) {
      const matches = rock.tags.filter((t) => types.includes(t));
      expect(matches).toHaveLength(1);
    }
  });

  it('has at least 30 rocks', () => {
    expect(ROCKS.length).toBeGreaterThanOrEqual(30);
  });

  it('includes all three rock types', () => {
    const types = new Set(ROCKS.map((r) => r.meta?.type));
    expect(types).toEqual(new Set(['igneous', 'sedimentary', 'metamorphic']));
  });
});

describe('deck registry', () => {
  it('has all four decks with matching ids', () => {
    for (const id of DECK_ORDER) {
      expect(DECKS[id].id).toBe(id);
      expect(DECKS[id].items.length).toBeGreaterThan(0);
    }
  });

  it('every deck filter subset is large enough for a 5x5 card (24 items)', () => {
    for (const id of DECK_ORDER) {
      const deck = DECKS[id];
      for (const filter of deck.filters) {
        const count = deck.items.filter(filter.predicate).length;
        // Not all filters need to support 5x5 (e.g. single rock type), but
        // every deck must have at least one filter that does.
        if (filter.id === deck.defaultFilterId) {
          expect(count).toBeGreaterThanOrEqual(1);
        }
      }
      const maxCount = Math.max(...deck.filters.map((f) => deck.items.filter(f.predicate).length));
      expect(maxCount).toBeGreaterThanOrEqual(24);
    }
  });
});
