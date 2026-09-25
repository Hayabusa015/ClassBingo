import { describe, it, expect } from 'vitest';
import { createRng, shuffle, hashStringToSeed } from '../lib/rng';

describe('rng', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createRng('game-4821');
    const b = createRng('game-4821');
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = createRng('game-4821');
    const b = createRng('game-4822');
    expect(a()).not.toBe(b());
  });

  it('returns floats in [0, 1)', () => {
    const rng = createRng('range-check');
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('hashStringToSeed is deterministic', () => {
    expect(hashStringToSeed('abc')).toBe(hashStringToSeed('abc'));
    expect(hashStringToSeed('abc')).not.toBe(hashStringToSeed('abd'));
  });

  it('shuffle is deterministic given the same rng seed and preserves elements', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const shuffledA = shuffle(items, createRng('shuffle-seed'));
    const shuffledB = shuffle(items, createRng('shuffle-seed'));
    expect(shuffledA).toEqual(shuffledB);
    expect([...shuffledA].sort()).toEqual([...items].sort());
  });

  it('shuffle does not mutate the input array', () => {
    const items = [1, 2, 3];
    const copy = [...items];
    shuffle(items, createRng('no-mutate'));
    expect(items).toEqual(copy);
  });
});
