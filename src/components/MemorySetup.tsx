import { useEffect, useState } from 'react';
import type { DeckConfig } from '../data/types';
import { getFilteredItems, type GameSettings } from '../lib/cards';
import {
  eligibleMemoryItems,
  bestPairCount,
  MEMORY_PAIR_COUNTS,
  type MemoryPairCount,
  type MemorySettings,
} from '../lib/memory';
import { randomGameCode } from '../lib/rng';
import type { Theme } from '../lib/gameConfig';
import ThemeToggle from './ThemeToggle';
import ItemPicker from './ItemPicker';

interface Props {
  deck: DeckConfig;
  onStart: (settings: MemorySettings) => void;
  onBack: () => void;
  onSaveSelection: (title: string, filterId: string, selectedItemIds?: string[]) => void;
  theme: Theme;
  onCycleTheme: () => void;
}

export default function MemorySetup({ deck, onStart, onBack, onSaveSelection, theme, onCycleTheme }: Props) {
  const [filterId, setFilterId] = useState(deck.defaultFilterId);
  const [selectedItemIds, setSelectedItemIds] = useState<string[] | undefined>(undefined);
  const [pairCount, setPairCount] = useState<MemoryPairCount>(8);

  const eligible = eligibleMemoryItems(deck, filterId, selectedItemIds).length;
  const totalInFilter = getFilteredItems(deck, filterId, selectedItemIds).length;
  const missingClues = totalInFilter - eligible;
  const fittingCounts = MEMORY_PAIR_COUNTS.filter((count) => count <= eligible);
  const canStart = fittingCounts.includes(pairCount);

  useEffect(() => {
    if (fittingCounts.includes(pairCount)) return;
    const best = bestPairCount(eligible);
    if (best) setPairCount(best);
    // Leave pairCount as-is (and canStart false) when nothing fits yet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligible]);

  const pseudoSettings: GameSettings = {
    deckId: deck.id,
    filterId,
    gridSize: 3,
    freeCenter: false,
    cardFace: deck.defaultCardFaceId,
    gameCode: '0000',
    selectedItemIds,
  };

  return (
    <div className="page page-setup">
      <header className="setup-header">
        <button className="btn btn-ghost" onClick={onBack}>
          ← Library
        </button>
        <h1>{deck.title} — Memory</h1>
        <ThemeToggle theme={theme} onCycle={onCycleTheme} />
      </header>

      <div className="setup-grid">
        <section className="setup-card">
          <h2>Items in play</h2>
          <div className="option-list">
            {deck.filters.map((f) => (
              <label key={f.id} className="option-radio">
                <input
                  type="radio"
                  name="memory-filter"
                  checked={filterId === f.id}
                  onChange={() => {
                    setFilterId(f.id);
                    setSelectedItemIds(undefined);
                  }}
                />
                <span>{f.label}</span>
                <span className="option-count">{deck.items.filter(f.predicate).length}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="setup-card">
          <h2>Board size</h2>
          <div className="option-row">
            <span className="option-label">Pairs to match</span>
            <div className="segmented">
              {MEMORY_PAIR_COUNTS.map((count) => (
                <button
                  key={count}
                  className={`segmented-btn ${pairCount === count ? 'active' : ''}`}
                  disabled={!fittingCounts.includes(count)}
                  onClick={() => setPairCount(count)}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
          <p className={`item-count-note ${canStart ? '' : 'warn'}`}>
            {eligible === 0
              ? 'None of these items can be paired yet. Memory needs a symbol, formula, or a clue that no other item shares.'
              : `${eligible} items can be uniquely paired${missingClues > 0 ? ` (${missingClues} skipped — no symbol/formula/clue, or shared with another item)` : ''}.`}
            {eligible > 0 && !canStart && ' Pick fewer pairs or a broader filter.'}
          </p>
        </section>
      </div>

      <ItemPicker
        key={deck.id}
        deck={deck}
        settings={pseudoSettings}
        onChange={(next) => setSelectedItemIds(next.selectedItemIds)}
        onSave={(title) => onSaveSelection(title, filterId, selectedItemIds)}
      />

      <div className="setup-actions">
        <button
          className="btn btn-primary btn-lg"
          disabled={!canStart}
          onClick={() => onStart({ deckId: deck.id, filterId, selectedItemIds, pairCount, gameCode: randomGameCode() })}
        >
          Start Memory Game ▶
        </button>
      </div>
    </div>
  );
}
