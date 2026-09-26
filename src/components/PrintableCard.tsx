import type { DeckConfig } from '../data/types';
import type { CardGrid } from '../lib/cards';
import { renderDisplayText } from '../lib/formula';

interface Props {
  deck: DeckConfig;
  grid: CardGrid;
  cardNumber: number;
  gameCode: string;
  headerTitle: string;
  classLine?: string;
}

export default function PrintableCard({ deck, grid, cardNumber, gameCode, headerTitle, classLine }: Props) {
  const size = grid.length;
  return (
    <article className={`printable-card bingo-card bingo-card-${deck.id}`} aria-label={`${headerTitle}, card ${cardNumber}`}>
      <div className="bingo-card-edition"><span>SHULL SCIENCE</span><span>{size} × {size} · {deck.shortTitle}</span></div>
      <div className="printable-card-header">
        <div className="bingo-card-heading">
          <h2>{headerTitle}</h2>
          {classLine && <p className="printable-card-classline">{classLine}</p>}
        </div>
        <div className="bingo-card-number"><span>CARD</span><strong>{String(cardNumber).padStart(3, '0')}</strong></div>
      </div>

      <div className="bingo-letter-strip" aria-hidden="true">
        {'BINGO'.split('').map((letter) => <span key={letter}>{letter}</span>)}
      </div>

      <div className="printable-card-grid" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <div key={`${r}-${c}`} className={`printable-cell ${cell.isFree ? 'free' : ''} ${cell.text.length <= 3 ? 'short-face' : 'word-face'} ${cell.text.split(/\s+/).some((word) => word.length >= 12) ? 'long-word' : ''}`}>
              {cell.isFree ? (
                <svg className="free-space-emblem" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                  <path d="m24 3 6 5 8 2 2 8 5 6-5 6-2 8-8 2-6 5-6-5-8-2-2-8-5-6 5-6 2-8 8-2Z" stroke="currentColor" strokeWidth="1.5" />
                  <path d="m24 12 3.7 7.5 8.3 1.2-6 5.9 1.4 8.3-7.4-3.9-7.4 3.9 1.4-8.3-6-5.9 8.3-1.2Z" fill="currentColor" />
                </svg>
              ) : <span className="cell-coordinate" aria-hidden="true">{String(r * size + c + 1).padStart(2, '0')}</span>}
              <span className="printable-cell-text">
                {cell.item ? renderDisplayText(deck, cell.item, cell.text) : cell.text}
              </span>
            </div>
          )),
        )}
      </div>

      <div className="printable-card-footer">
        <span className="bingo-card-signoff">Find it. Mark it. Call it.</span>
        <span className="printable-card-meta">
          GAME <strong>{gameCode}</strong>
        </span>
      </div>
    </article>
  );
}
