import { useMemo, useState } from 'react';
import type { DeckConfig } from '../data/types';
import { generateCard, getFilteredItems, type GameSettings } from '../lib/cards';
import type { Theme } from '../lib/gameConfig';
import PrintableCard from './PrintableCard';
import CallSheet from './CallSheet';
import ThemeToggle from './ThemeToggle';

interface Props {
  deck: DeckConfig;
  settings: GameSettings;
  onExit: () => void;
  onStartCaller: () => void;
  theme: Theme;
  onCycleTheme: () => void;
}

type ViewMode = 'cards' | 'callsheet';

function cardsPerPageOptions(gridSize: number): number[] {
  return gridSize === 5 ? [1, 2, 4] : [2, 4];
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export default function CardGenerator({ deck, settings, onExit, onStartCaller, theme, onCycleTheme }: Props) {
  const defaultTitle = `${deck.shortTitle.toUpperCase()} BINGO`;
  const [numCards, setNumCards] = useState(30);
  const [cardsPerPage, setCardsPerPage] = useState<number>(cardsPerPageOptions(settings.gridSize)[0]);
  const [headerTitle, setHeaderTitle] = useState(defaultTitle);
  const [classLine, setClassLine] = useState('');
  const [view, setView] = useState<ViewMode>('cards');
  const [paperPreview, setPaperPreview] = useState(false);

  const filteredItems = useMemo(
    () => getFilteredItems(deck, settings.filterId, settings.selectedItemIds),
    [deck, settings.filterId, settings.selectedItemIds],
  );

  const cardNumbers = useMemo(() => Array.from({ length: numCards }, (_, i) => i + 1), [numCards]);
  const pages = useMemo(() => chunk(cardNumbers, cardsPerPage), [cardNumbers, cardsPerPage]);

  const perPageOptions = cardsPerPageOptions(settings.gridSize);

  return (
    <div className="page page-cardgen">
      <header className="cardgen-header no-print">
        <button className="btn btn-ghost" onClick={onExit}>
          ← Setup
        </button>
        <h1>Print Cards — {deck.title}</h1>
        <button className="btn btn-secondary" onClick={onStartCaller}>
          Start Calling This Game ▶
        </button>
        <ThemeToggle theme={theme} onCycle={onCycleTheme} />
      </header>

      <div className="cardgen-controls no-print">
        <label className="option-row">
          <span className="option-label"># of cards</span>
          <input
            type="number"
            min={1}
            max={200}
            className="text-input"
            value={numCards}
            onChange={(e) => setNumCards(Math.max(1, Math.min(200, Number(e.target.value) || 1)))}
          />
        </label>

        <label className="option-row">
          <span className="option-label">Cards per page</span>
          <div className="segmented">
            {perPageOptions.map((n) => (
              <button
                key={n}
                className={`segmented-btn ${cardsPerPage === n ? 'active' : ''}`}
                onClick={() => setCardsPerPage(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </label>

        <label className="option-row">
          <span className="option-label">Header title</span>
          <input
            className="text-input"
            value={headerTitle}
            onChange={(e) => setHeaderTitle(e.target.value)}
          />
        </label>

        <label className="option-row">
          <span className="option-label">Class / period (optional)</span>
          <input
            className="text-input"
            placeholder="e.g. Period 3 Chemistry"
            value={classLine}
            onChange={(e) => setClassLine(e.target.value)}
          />
        </label>

        <div className="cardgen-view-toggle">
          <button
            className={`btn ${view === 'cards' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setView('cards')}
          >
            View Cards
          </button>
          <button
            className={`btn ${view === 'callsheet' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setView('callsheet')}
          >
            View Call Sheet
          </button>
          <button className="btn btn-primary btn-lg" onClick={() => window.print()}>
            Print / Save as PDF 🖨
          </button>
        </div>

        <p className="hint">
          Use your browser's Print dialog and choose "Save as PDF" if you want a PDF file instead of printing
          directly.
        </p>
      </div>

      {view === 'cards' && (
        <div className="card-preview-toolbar no-print">
          <div>
            <strong>Your classroom set</strong>
            <span>{numCards} cards · Same game, different boards</span>
          </div>
          <div className="segmented" aria-label="Card preview appearance">
            <button
              className={`segmented-btn ${!paperPreview ? 'active' : ''}`}
              aria-pressed={!paperPreview}
              onClick={() => setPaperPreview(false)}
            >
              Glow preview
            </button>
            <button
              className={`segmented-btn ${paperPreview ? 'active' : ''}`}
              aria-pressed={paperPreview}
              onClick={() => setPaperPreview(true)}
            >
              Paper preview
            </button>
          </div>
          <p>Prints with crisp black outlines on white paper.</p>
        </div>
      )}
      <div className={`printable-root ${paperPreview ? 'card-preview-paper' : ''}`}>
        {view === 'cards' ? (
          pages.map((pageNumbers, pageIndex) => (
            <div
              key={pageIndex}
              className={`print-page cards-per-page-${cardsPerPage}`}
              style={{ gridTemplateColumns: `repeat(${Math.min(cardsPerPage, 2)}, 1fr)` }}
            >
              <div className="print-page-label no-print">Page {pageIndex + 1}</div>
              {pageNumbers.map((n) => (
                <PrintableCard
                  key={n}
                  deck={deck}
                  grid={generateCard(deck, settings, n)}
                  cardNumber={n}
                  gameCode={settings.gameCode}
                  headerTitle={headerTitle}
                  classLine={classLine}
                />
              ))}
            </div>
          ))
        ) : (
          <div className="print-page call-sheet-page">
            <CallSheet
              deck={deck}
              items={filteredItems}
              gameCode={settings.gameCode}
              headerTitle={headerTitle}
            />
          </div>
        )}
      </div>
    </div>
  );
}
