/**
 * Deterministic PRNG utilities. Given the same seed string, every game
 * (draw order, generated card N, etc.) is exactly reproducible — this is
 * what lets the winner-check feature regenerate a printed card from just
 * its card number and the game code.
 */

/** Hashes an arbitrary string to a 32-bit unsigned int (cyrb53-lite / djb2 variant). */
export function hashStringToSeed(input: string): number {
  let h = 2166136261 >>> 0; // FNV offset basis
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32: small, fast, decent-quality seeded PRNG returning floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Creates a seeded RNG function from any string. */
export function createRng(seedString: string): () => number {
  return mulberry32(hashStringToSeed(seedString));
}

/** Fisher–Yates shuffle using a supplied RNG. Does not mutate the input array. */
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Generates a random 4-digit game code as a string, e.g. "4821". */
export function randomGameCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}
