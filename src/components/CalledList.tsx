import type { BingoItem, DeckConfig } from '../data/types';
import { renderIon } from '../lib/formula';

interface Props {
  deck: DeckConfig;
  /** Called items in call order (oldest first). */
  calledItems: BingoItem[];
}

function secondaryBadge(deck: DeckConfig, item: BingoItem) {
  if (deck.id === 'elements') return item.symbol;
  if (deck.id === 'ions') return item.formula ? renderIon(item.formula, item.charge) : null;
  if (deck.id === 'minerals') return item.formula ?? null;
  return null;
}

/**
 * A plain-language, numbered log of every call so far (most recent on top).
 * Meant to answer "what have we had already?" without the teacher needing
 * to repeat every call out loud — read straight off the board.
 */
export default function CalledList({ deck, calledItems }: Props) {
  const total = calledItems.length;
  const mostRecentFirst = [...calledItems].reverse();

  return (
    <div className="called-list">
      <div className="called-list-header">
        <h3>Called so far</h3>
        <span className="called-list-count">{total}</span>
      </div>
      {total === 0 ? (
        <p className="called-list-empty">Nothing called yet — press Next to start.</p>
      ) : (
        <ol className="called-list-items">
          {mostRecentFirst.map((item, i) => {
            const badge = secondaryBadge(deck, item);
            return (
              <li key={item.id} className={`called-list-row ${i === 0 ? 'current' : ''}`}>
                <span className="called-list-num">{total - i}</span>
                <span className="called-list-name">{item.name}</span>
                {badge && <span className="called-list-badge">{badge}</span>}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
