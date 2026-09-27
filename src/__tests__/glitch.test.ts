import { describe, it, expect } from 'vitest';
import { elementsDeck } from '../data/elements';
import { vocabularyDeck } from '../data/vocabulary';
import type { BingoItem } from '../data/types';
import {
  buildGlitchQuestions,
  glitchQuestionCount,
  glitchCount,
  computeMeterGoal,
  tallyVotes,
  estimatedMinutes,
  roundName,
  emblemShape,
  emblemColorIndex,
  GLITCH_LEVELS,
  EMBLEM_SHAPES,
} from '../lib/glitch';

function makeItems(n: number, withTags = false): BingoItem[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `item-${i}`,
    name: `Name ${i}`,
    clue: `Clue ${i}`,
    tags: withTags ? [i % 2 === 0 ? 'even' : 'odd'] : [],
  }));
}

describe('buildGlitchQuestions', () => {
  const deck = vocabularyDeck('curriculum:test', 'Test', 'Test', 'Test', '', makeItems(10));

  it('gives every question a unique, valid answer index among its choices', () => {
    const questions = buildGlitchQuestions(deck, 'all', undefined, 0, 'seed-a');
    for (const q of questions) {
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.choices.length);
      expect(new Set(q.choices).size).toBe(q.choices.length);
    }
  });

  it('matches the level\'s choice count', () => {
    const l0 = buildGlitchQuestions(deck, 'all', undefined, 0, 'seed-b');
    expect(l0.every((q) => q.choices.length === GLITCH_LEVELS[0].choices)).toBe(true);
    const l2 = buildGlitchQuestions(deck, 'all', undefined, 2, 'seed-b');
    expect(l2.every((q) => q.choices.length === GLITCH_LEVELS[2].choices)).toBe(true);
  });

  it('produces one direction for a single-direction level, both for mixed', () => {
    const l0 = buildGlitchQuestions(deck, 'all', undefined, 0, 'seed-c');
    expect(l0.every((q) => q.direction === 'clue-to-term')).toBe(true);
    expect(l0).toHaveLength(10);

    const l2 = buildGlitchQuestions(deck, 'all', undefined, 2, 'seed-c');
    const directions = new Set(l2.map((q) => q.direction));
    expect(directions.has('clue-to-term')).toBe(true);
    expect(directions.has('term-to-clue')).toBe(true);
    expect(l2).toHaveLength(20);
  });

  it('is deterministic for a given seed and varies with a different seed', () => {
    const a = buildGlitchQuestions(deck, 'all', undefined, 0, 'same-seed');
    const b = buildGlitchQuestions(deck, 'all', undefined, 0, 'same-seed');
    expect(a).toEqual(b);

    const c = buildGlitchQuestions(deck, 'all', undefined, 0, 'different-seed');
    expect(c).not.toEqual(a);
  });

  it('never produces two items with the same back-tile label', () => {
    const dupDeck = vocabularyDeck('curriculum:dup', 'Dup', 'Test', 'Test', '', [
      { id: 'a', name: 'Alpha', clue: 'Same clue', tags: [] },
      { id: 'b', name: 'Beta', clue: 'Same clue', tags: [] },
      ...makeItems(8).map((i) => ({ ...i, id: `pad-${i.id}` })),
    ]);
    const questions = buildGlitchQuestions(dupDeck, 'all', undefined, 0, 'seed-d');
    const itemIds = new Set(questions.map((q) => q.itemId));
    expect(itemIds.has('a')).toBe(false);
    expect(itemIds.has('b')).toBe(false);
  });

  it('throws when fewer than 8 items are eligible', () => {
    const tinyDeck = vocabularyDeck('curriculum:tiny', 'Tiny', 'Test', 'Test', '', makeItems(5));
    expect(() => buildGlitchQuestions(tinyDeck, 'all', undefined, 0, 'seed-e')).toThrow();
  });

  it('prefers tag-matched distractors on Legend (L3)', () => {
    const items = makeItems(12, true); // 5 same-tag peers, 6 opposite-tag peers per item
    const tagged = vocabularyDeck('curriculum:tagged', 'Tagged', 'Test', 'Test', '', items);
    const questions = buildGlitchQuestions(tagged, 'all', undefined, 3, 'seed-f');
    const byId = new Map(items.map((it) => [it.id, it]));

    for (const q of questions) {
      const answerItem = byId.get(q.itemId)!;
      const distractorTexts = q.choices.filter((_, idx) => idx !== q.answer);
      const distractorItems = items.filter((it) => {
        if (it.id === q.itemId) return false;
        const text = q.direction === 'clue-to-term' ? it.name : it.clue;
        return distractorTexts.includes(text!);
      });
      // 5 same-tag peers exist and only 3 distractors are needed, so every
      // distractor should come from the same-tag pool, none from the other.
      const sameTagCount = distractorItems.filter((it) => it.tags[0] === answerItem.tags[0]).length;
      expect(sameTagCount).toBe(distractorTexts.length);
    }
  });

  it('respects a selectedItemIds filter', () => {
    const items = makeItems(10);
    const subset = items.slice(0, 8).map((i) => i.id);
    const questions = buildGlitchQuestions(deck, 'all', subset, 0, 'seed-g');
    expect(questions.every((q) => subset.includes(q.itemId))).toBe(true);
  });
});

describe('glitchQuestionCount', () => {
  const deck = vocabularyDeck('curriculum:count', 'Count', 'Test', 'Test', '', makeItems(10));
  it('doubles for mixed-direction levels', () => {
    expect(glitchQuestionCount(deck, 'all', undefined, 0)).toBe(10);
    expect(glitchQuestionCount(deck, 'all', undefined, 2)).toBe(20);
  });
});

describe('glitchCount', () => {
  it('assigns zero Glitches at Practice', () => {
    expect(glitchCount(0, 20)).toBe(0);
  });
  it('always assigns exactly one at Rookie', () => {
    expect(glitchCount(1, 4)).toBe(1);
    expect(glitchCount(1, 30)).toBe(1);
  });
  it('scales up at Pro and Legend for larger classes', () => {
    expect(glitchCount(2, 8)).toBe(1);
    expect(glitchCount(2, 24)).toBe(3);
    expect(glitchCount(3, 7)).toBe(1);
    expect(glitchCount(3, 21)).toBe(3);
  });
  it('never lets Glitches reach a third of the class', () => {
    for (const level of [1, 2, 3] as const) {
      for (const n of [4, 5, 6, 7, 8, 9, 10, 15, 20, 30, 40]) {
        const count = glitchCount(level, n);
        expect(count).toBeGreaterThanOrEqual(1);
        expect(count).toBeLessThanOrEqual(Math.floor((n - 1) / 3) || 1);
      }
    }
  });
});

describe('computeMeterGoal', () => {
  it('matches the SQL formula and floors at 10', () => {
    const goal = computeMeterGoal({ repairSeconds: 90, goalFactor: 0.75 }, 6, 4);
    // questionsPerRound=9, expected=6*4*9*0.7=151.2, goal=ceil(151.2*0.75)=114
    expect(goal).toBe(114);
  });
  it('never returns less than 10', () => {
    const goal = computeMeterGoal({ repairSeconds: 20, goalFactor: 0.5 }, 1, 1);
    expect(goal).toBe(10);
  });
});

describe('tallyVotes', () => {
  it('ejects a clear plurality', () => {
    const result = tallyVotes([{ targetId: 'a' }, { targetId: 'a' }, { targetId: 'b' }, { targetId: null }]);
    expect(result.ejectedId).toBe('a');
  });
  it('ejects nobody on a tie', () => {
    const result = tallyVotes([{ targetId: 'a' }, { targetId: 'b' }]);
    expect(result.ejectedId).toBeNull();
  });
  it('ejects nobody when Skip matches or beats the leader', () => {
    const result = tallyVotes([{ targetId: 'a' }, { targetId: 'a' }, { targetId: null }, { targetId: null }]);
    expect(result.ejectedId).toBeNull();
  });
  it('handles no votes at all', () => {
    expect(tallyVotes([]).ejectedId).toBeNull();
  });
});

describe('level flavor helpers', () => {
  it('estimates a positive playtime that grows with more rounds', () => {
    const short = estimatedMinutes(GLITCH_LEVELS[0], 4);
    const long = estimatedMinutes(GLITCH_LEVELS[0], 8);
    expect(short).toBeGreaterThan(0);
    expect(long).toBeGreaterThan(short);
  });
  it('names known rounds and falls back for extras', () => {
    expect(roundName(1)).toBe('Boot Sequence');
    expect(roundName(99)).toBe('Round 99');
  });
});

describe('emblems', () => {
  it('derives a shape and color deterministically from the emblem int', () => {
    expect(emblemShape(0)).toBe(EMBLEM_SHAPES[0]);
    expect(emblemColorIndex(0)).toBe(0);
    expect(emblemColorIndex(EMBLEM_SHAPES.length)).toBe(1);
  });
});

describe('real deck sanity', () => {
  it('builds a full question bank from the elements deck', () => {
    const questions = buildGlitchQuestions(elementsDeck, 'common', undefined, 2, 'sanity-seed');
    expect(questions.length).toBeGreaterThan(8);
    expect(questions.every((q) => q.choices.length === 4)).toBe(true);
  });
});
