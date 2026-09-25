import type { ReactNode } from 'react';
import type { BingoItem, DeckConfig } from '../data/types';

/**
 * Renders a plain-text chemical formula like "SO4" as JSX with the digits
 * as subscripts: SO<sub>4</sub>. Non-digit characters pass through as-is,
 * so parenthesized groups like "Ca(OH)2" work too.
 */
export function renderFormula(formula: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let buffer = '';
  let key = 0;

  const flush = () => {
    if (buffer) {
      parts.push(<span key={`t${key++}`}>{buffer}</span>);
      buffer = '';
    }
  };

  let i = 0;
  while (i < formula.length) {
    const ch = formula[i];
    if (/\d/.test(ch)) {
      flush();
      let digits = '';
      while (i < formula.length && /\d/.test(formula[i])) {
        digits += formula[i];
        i++;
      }
      parts.push(<sub key={`s${key++}`}>{digits}</sub>);
      continue;
    }
    buffer += ch;
    i++;
  }
  flush();
  return parts;
}

/**
 * Renders a charge string like "2-", "+", "3+" as a superscript, e.g. "²⁻".
 * Falls back to a literal superscript element for exotic input.
 */
export function renderCharge(charge: string): ReactNode {
  const match = /^(\d*)([+-])$/.exec(charge.trim());
  if (!match) return <sup>{charge}</sup>;
  const [, count, sign] = match;
  return (
    <sup>
      {count}
      {sign}
    </sup>
  );
}

/** Combined helper: formula subscripts + charge superscript, e.g. SO4 + "2-" -> SO₄²⁻ styled. */
export function renderIon(formula: string, charge?: string): ReactNode[] {
  const parts = renderFormula(formula);
  if (charge) parts.push(<span key="charge">{renderCharge(charge)}</span>);
  return parts;
}

/**
 * Renders whatever plain text a deck put on a square/call/sheet as nicely
 * formatted JSX when it's an ion formula, or as-is otherwise. Used anywhere
 * `deck.squareText`/callsheet text is displayed, so printed ion cards read
 * as "SO4²⁻" instead of the raw "SO42-" stored in data.
 */
export function renderDisplayText(deck: DeckConfig, item: BingoItem, text: string): ReactNode {
  if (deck.id === 'ions' && item.formula && text === `${item.formula}${item.charge ?? ''}`) {
    return renderIon(item.formula, item.charge);
  }
  return text;
}
