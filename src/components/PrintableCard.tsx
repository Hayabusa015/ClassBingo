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
  showNameBlank: boolean;
}

export default function PrintableCard({ deck, grid, cardNumber, gameCode, headerTitle, classLine, showNameBlank }: Props) {
  const size = grid.length;
  return (
    <div className="printable-card">
      <div className="printable-card-header">
        <h2>{headerTitle}</h2>
        {classLine && <p className="printable-card-classline">{classLine}</p>}
      </div>

      <div className="printable-card-grid" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <div key={`${r}-${c}`} className={`printable-cell ${cell.isFree ? 'free' : ''}`}>
              <span className="printable-cell-text">
                {cell.item ? renderDisplayText(deck, cell.item, cell.text) : cell.text}
              </span>
            </div>
          )),
        )}
      </div>

      <div className="printable-card-footer">
        {showNameBlank ? <span className="printable-card-nameblank">Name: ______________________</span> : <span />}
        <span className="printable-card-meta">
          Card #{cardNumber} &middot; Code {gameCode}
        </span>
      </div>
    </div>
  );
}
