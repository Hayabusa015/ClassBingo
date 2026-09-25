import type { ReactNode } from 'react';
import type { BingoItem, DeckConfig } from '../data/types';
import { renderIon } from '../lib/formula';

interface Props {
  deck: DeckConfig;
  items: BingoItem[];
  calledIds: Set<string>;
  onPeek: (item: BingoItem) => void;
}

function sortedItems(deck: DeckConfig, items: BingoItem[]): BingoItem[] {
  if (deck.id === 'elements') {
    return [...items].sort((a, b) => (Number(a.meta?.atomicNumber) || 0) - (Number(b.meta?.atomicNumber) || 0));
  }
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

function tileLabel(deck: DeckConfig, item: BingoItem): ReactNode {
  if (deck.id === 'elements') return item.symbol ?? item.name;
  if (deck.id === 'ions') return item.formula ? renderIon(item.formula, item.charge) : item.name;
  return item.name;
}

export default function CalledBoard({ deck, items, calledIds, onPeek }: Props) {
  const ordered = sortedItems(deck, items);
  const calledCount = ordered.filter((i) => calledIds.has(i.id)).length;

  return (
    <div className="called-board">
      <div className="called-board-header">
        <h3>All items</h3>
        <span className="called-board-count">
          {calledCount} / {ordered.length} called
        </span>
      </div>
      <div className={`called-board-grid deck-${deck.id}`}>
        {ordered.map((item) => {
          const called = calledIds.has(item.id);
          return (
            <button
              key={item.id}
              className={`called-tile ${called ? 'called' : ''}`}
              title={item.name}
              onClick={() => onPeek(item)}
            >
              {tileLabel(deck, item)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
