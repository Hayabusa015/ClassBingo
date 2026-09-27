import { describe, expect, it } from 'vitest';
import { normalizeTheme, THEME_ORDER } from '../lib/gameConfig';

describe('saved theme compatibility', () => {
  it.each(THEME_ORDER)('preserves the supported %s preference', (theme) => {
    expect(normalizeTheme(theme)).toBe(theme);
  });
  it.each(['violet', null, undefined, 'unknown', {}])('uses the default for an obsolete or invalid preference', (value) => {
    expect(normalizeTheme(value)).toBe('arcade');
  });
});
