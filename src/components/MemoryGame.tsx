import { useEffect, useMemo, useState } from 'react';
import type { DeckConfig } from '../data/types';
import { buildMemoryTiles, gridDimensions, type MemorySettings, type MemoryTile } from '../lib/memory';
import { randomGameCode } from '../lib/rng';
import type { Theme } from '../lib/gameConfig';
import ThemeToggle from './ThemeToggle';

interface Props {
  deck: DeckConfig;
  settings: MemorySettings;
  onReshuffle: (settings: MemorySettings) => void;
  onChangeBoard: () => void;
  onExit: () => void;
  theme: Theme;
  onCycleTheme: () => void;
}

const MISMATCH_DELAY_MS = 900;

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function MemoryGame({ deck, settings, onReshuffle, onChangeBoard, onExit, theme, onCycleTheme }: Props) {
  const tiles = useMemo(() => buildMemoryTiles(deck, settings), [deck, settings]);
  const { cols } = gridDimensions(tiles.length);

  const [revealed, setRevealed] = useState<string[]>([]);
  const [matchedItemIds, setMatchedItemIds] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [busy, setBusy] = useState(false);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    setRevealed([]);
    setMatchedItemIds(new Set());
    setMoves(0);
    setBusy(false);
    setStartedAt(Date.now());
    setElapsedMs(0);
  }, [tiles]);

  const won = matchedItemIds.size === settings.pairCount;

  useEffect(() => {
    if (won) return;
    const id = window.setInterval(() => setElapsedMs(Date.now() - startedAt), 500);
    return () => window.clearInterval(id);
  }, [won, startedAt]);

  const flip = (tile: MemoryTile) => {
    if (busy || won) return;
    if (matchedItemIds.has(tile.itemId)) return;
    if (revealed.includes(tile.tileId)) return;
    if (revealed.length >= 2) return;

    const next = [...revealed, tile.tileId];
    setRevealed(next);
    if (next.length < 2) return;

    setMoves((m) => m + 1);
    const [first, second] = next.map((id) => tiles.find((t) => t.tileId === id)!);
    if (first.itemId === second.itemId) {
      setMatchedItemIds((prev) => new Set(prev).add(first.itemId));
      setRevealed([]);
    } else {
      setBusy(true);
      window.setTimeout(() => {
        setRevealed([]);
        setBusy(false);
      }, MISMATCH_DELAY_MS);
    }
  };

  const playAgain = () => onReshuffle({ ...settings, gameCode: randomGameCode() });
  const elapsedLabel = formatElapsed(elapsedMs);

  return (
    <div className="page page-setup page-memory">
      <header className="setup-header">
        <button className="btn btn-ghost" onClick={onExit}>
          ← Library
        </button>
        <h1>{deck.title} — Memory</h1>
        <ThemeToggle theme={theme} onCycle={onCycleTheme} />
      </header>

      <div className="memory-stats">
        <span>
          <strong>
            {matchedItemIds.size} / {settings.pairCount}
          </strong>{' '}
          matched
        </span>
        <span>
          <strong>{moves}</strong> moves
        </span>
        <span>
          <strong>{elapsedLabel}</strong> elapsed
        </span>
        <button className="btn btn-ghost" onClick={onChangeBoard}>
          Change board
        </button>
        <button className="btn btn-secondary" onClick={playAgain}>
          Shuffle again
        </button>
      </div>

      <div className="memory-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {tiles.map((tile) => {
          const isMatched = matchedItemIds.has(tile.itemId);
          const isRevealed = isMatched || revealed.includes(tile.tileId);
          return (
            <button
              key={tile.tileId}
              className={`memory-tile ${isRevealed ? 'is-revealed' : ''} ${isMatched ? 'is-matched' : ''}`}
              onClick={() => flip(tile)}
              disabled={isMatched}
              aria-pressed={isRevealed}
              aria-label={isRevealed ? tile.label : 'Hidden tile'}
            >
              <span className="memory-tile-inner">
                <span className="memory-tile-face memory-tile-back" aria-hidden="true">
                  ?
                </span>
                <span className="memory-tile-face memory-tile-front">{tile.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {won && (
        <div className="memory-win-banner">
          <strong>Matched them all!</strong>
          <p>
            {moves} moves · {elapsedLabel}
          </p>
          <div className="resume-banner-actions">
            <button className="btn btn-primary" onClick={playAgain}>
              Play again
            </button>
            <button className="btn btn-ghost" onClick={onChangeBoard}>
              Change board
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
