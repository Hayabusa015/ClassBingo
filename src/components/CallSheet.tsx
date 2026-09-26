import type { ReactNode } from 'react';
import type { BingoItem, DeckConfig } from '../data/types';
import { renderIon } from '../lib/formula';

interface Props {
  deck: DeckConfig;
  items: BingoItem[];
  gameCode: string;
  headerTitle: string;
}

function secondaryText(deck: DeckConfig, item: BingoItem): ReactNode {
  if ((deck.presentation ?? deck.id) === 'elements') return item.symbol ?? '';
  if ((deck.presentation ?? deck.id) === 'ions') return renderIon(item.formula ?? '', item.charge);
  return item.clue ?? '';
}

export default function CallSheet({ deck, items, gameCode, headerTitle }: Props) {
  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="call-sheet">
      <div className="call-sheet-header">
        <h2>{headerTitle} — Master Call Sheet</h2>
        <span className="call-sheet-meta">
          Code {gameCode} &middot; {sorted.length} items
        </span>
      </div>
      <div className="call-sheet-list">
        {sorted.map((item, i) => (
          <label key={item.id} className="call-sheet-row">
            <input type="checkbox" readOnly />
            <span className="call-sheet-index">{i + 1}.</span>
            <span className="call-sheet-name">{item.name}</span>
            <span className="call-sheet-secondary">{secondaryText(deck, item)}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
