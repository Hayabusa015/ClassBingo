import { useState } from 'react';
import type { DeckConfig } from '../data/types';
import { generateCard, type GameSettings, type CardGrid } from '../lib/cards';
import { checkWin, type WinPattern, type WinResult } from '../lib/bingo';

interface Props {
  deck: DeckConfig;
  settings: GameSettings;
  calledIds: Set<string>;
  winPattern: WinPattern;
  onWin: () => void;
}

function isWinningCell(result: WinResult | null, row: number, col: number): boolean {
  if (!result) return false;
  return result.winningCells.some((c) => c.row === row && c.col === col);
}

export default function WinnerCheck({ deck, settings, calledIds, winPattern, onWin }: Props) {
  const [cardNumberInput, setCardNumberInput] = useState('');
  const [grid, setGrid] = useState<CardGrid | null>(null);
  const [result, setResult] = useState<WinResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkedNumber, setCheckedNumber] = useState<number | null>(null);

  const runCheck = () => {
    const n = Number.parseInt(cardNumberInput, 10);
    if (!Number.isFinite(n) || n < 1) {
      setError('Enter a valid card number.');
      setGrid(null);
      setResult(null);
      return;
    }
    try {
      const card = generateCard(deck, settings, n);
      const r = checkWin(card, calledIds, winPattern);
      setGrid(card);
      setResult(r);
      setCheckedNumber(n);
      setError(null);
      if (r.win) onWin();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate that card.');
      setGrid(null);
      setResult(null);
    }
  };

  return (
    <div className="winner-check">
      <h3>Check a winner</h3>
      <div className="winner-check-input-row">
        <input
          className="text-input"
          placeholder="Card #"
          inputMode="numeric"
          value={cardNumberInput}
          onChange={(e) => setCardNumberInput(e.target.value.replace(/[^0-9]/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && runCheck()}
        />
        <button className="btn btn-primary" onClick={runCheck}>
          Check
        </button>
      </div>

      {error && <p className="winner-check-error">{error}</p>}

      {result && grid && (
        <div className="winner-check-result">
          <div className={`winner-check-banner ${result.win ? 'win' : 'not-win'}`}>
            {result.win ? `✅ BINGO — card #${checkedNumber}!` : `❌ Not yet — card #${checkedNumber}`}
          </div>
          {!result.win && result.missing.length > 0 && (
            <p className="winner-check-missing">
              Missing: {result.missing.map((i) => i.symbol ?? (i.formula ? `${i.formula}${i.charge ?? ''}` : i.name)).join(', ')}
            </p>
          )}
          <div
            className="winner-check-grid"
            style={{ gridTemplateColumns: `repeat(${grid.length}, 1fr)` }}
          >
            {grid.map((row, r) =>
              row.map((cell, c) => {
                const covered = cell.isFree || (cell.item !== null && calledIds.has(cell.item.id));
                const winning = isWinningCell(result, r, c);
                return (
                  <div
                    key={`${r}-${c}`}
                    className={`winner-check-cell ${covered ? 'covered' : ''} ${winning ? 'winning' : ''}`}
                  >
                    {cell.text}
                  </div>
                );
              }),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
