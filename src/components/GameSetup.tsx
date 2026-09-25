import type { DeckConfig, CardFaceField } from '../data/types';
import type { GameSettings, GridSize } from '../lib/cards';
import { getFilteredItems, requiredItemCount, canGenerateCards, hasFreeCenter } from '../lib/cards';
import { WIN_PATTERNS, type WinPattern } from '../lib/bingo';
import type { CallStyle } from '../lib/gameConfig';
import { randomGameCode } from '../lib/rng';

interface Props {
  deck: DeckConfig;
  settings: GameSettings;
  onChangeSettings: (settings: GameSettings) => void;
  callStyle: CallStyle;
  onChangeCallStyle: (style: CallStyle) => void;
  winPattern: WinPattern;
  onChangeWinPattern: (pattern: WinPattern) => void;
  onStartCaller: () => void;
  onStartCardGenerator: () => void;
  onBack: () => void;
}

const GRID_SIZES: GridSize[] = [3, 4, 5];

export default function GameSetup({
  deck,
  settings,
  onChangeSettings,
  callStyle,
  onChangeCallStyle,
  winPattern,
  onChangeWinPattern,
  onStartCaller,
  onStartCardGenerator,
  onBack,
}: Props) {
  const itemCount = getFilteredItems(deck, settings.filterId).length;
  const need = requiredItemCount(settings);
  const canGenerate = canGenerateCards(itemCount, settings);
  const showFreeCenterOption = settings.gridSize % 2 === 1;

  const update = (patch: Partial<GameSettings>) => onChangeSettings({ ...settings, ...patch });

  return (
    <div className="page page-setup">
      <header className="setup-header">
        <button className="btn btn-ghost" onClick={onBack}>
          ← Back
        </button>
        <h1>{deck.title}</h1>
      </header>

      <div className="setup-grid">
        <section className="setup-card">
          <h2>Items in play</h2>
          <div className="option-list">
            {deck.filters.map((f) => (
              <label key={f.id} className="option-radio">
                <input
                  type="radio"
                  name="filter"
                  checked={settings.filterId === f.id}
                  onChange={() => update({ filterId: f.id })}
                />
                <span>{f.label}</span>
                <span className="option-count">{deck.items.filter(f.predicate).length}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="setup-card">
          <h2>Card layout</h2>
          <div className="option-row">
            <span className="option-label">Grid size</span>
            <div className="segmented">
              {GRID_SIZES.map((size) => (
                <button
                  key={size}
                  className={`segmented-btn ${settings.gridSize === size ? 'active' : ''}`}
                  onClick={() => update({ gridSize: size })}
                >
                  {size}×{size}
                </button>
              ))}
            </div>
          </div>

          {showFreeCenterOption && (
            <label className="option-checkbox">
              <input
                type="checkbox"
                checked={settings.freeCenter}
                onChange={(e) => update({ freeCenter: e.target.checked })}
              />
              <span>Free center space</span>
            </label>
          )}

          {deck.cardFaceOptions.length > 1 && (
            <div className="option-row">
              <span className="option-label">Student squares show</span>
              <div className="segmented">
                {deck.cardFaceOptions.map((opt) => (
                  <button
                    key={opt.id}
                    className={`segmented-btn ${settings.cardFace === opt.id ? 'active' : ''}`}
                    onClick={() => update({ cardFace: opt.id as CardFaceField })}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className={`item-count-note ${canGenerate ? '' : 'warn'}`}>
            {itemCount} items available · {need} needed for a {settings.gridSize}×{settings.gridSize} card
            {!canGenerate && ' — pick a smaller grid or a broader filter.'}
          </p>
        </section>

        <section className="setup-card">
          <h2>Calling the game</h2>
          <div className="option-row">
            <span className="option-label">Call style</span>
            <div className="segmented">
              <button
                className={`segmented-btn ${callStyle === 'both' ? 'active' : ''}`}
                onClick={() => onChangeCallStyle('both')}
              >
                Show both
              </button>
              <button
                className={`segmented-btn ${callStyle === 'challenge' ? 'active' : ''}`}
                onClick={() => onChangeCallStyle('challenge')}
              >
                Challenge (reveal on demand)
              </button>
            </div>
          </div>

          <div className="option-row">
            <span className="option-label">Win pattern</span>
            <select
              className="select"
              value={winPattern}
              onChange={(e) => onChangeWinPattern(e.target.value as WinPattern)}
            >
              {WIN_PATTERNS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="option-row">
            <span className="option-label">Game code</span>
            <div className="game-code-row">
              <input
                className="text-input game-code-input"
                value={settings.gameCode}
                maxLength={6}
                onChange={(e) => update({ gameCode: e.target.value.replace(/[^0-9]/g, '') })}
              />
              <button className="btn btn-ghost" onClick={() => update({ gameCode: randomGameCode() })}>
                Shuffle
              </button>
            </div>
            <p className="hint">
              Printed cards use this code too — write it on cards you'll play with this game.
            </p>
          </div>
        </section>
      </div>

      <div className="setup-actions">
        <button className="btn btn-primary btn-lg" disabled={!canGenerate} onClick={onStartCaller}>
          Start Calling ▶
        </button>
        <button className="btn btn-secondary btn-lg" disabled={!canGenerate} onClick={onStartCardGenerator}>
          Print Cards 🖨
        </button>
      </div>
      {hasFreeCenter(settings) && (
        <p className="hint center-hint">Free center space is on — cards need one fewer unique item.</p>
      )}
    </div>
  );
}
