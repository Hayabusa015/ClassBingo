import { useState } from 'react';
import type { DeckConfig } from '../data/types';
import { getFilteredItems, type GameSettings } from '../lib/cards';

interface Props {
  deck: DeckConfig;
  settings: GameSettings;
  onChange: (settings: GameSettings) => void;
  onSave: (title: string) => void;
}
export default function ItemPicker({ deck, settings, onChange, onSave }: Props) {
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState(`${deck.shortTitle} — my selection`.slice(0, 80));
  const [error, setError] = useState('');
  const items = getFilteredItems(deck, settings.filterId);
  const selected = new Set(
    getFilteredItems(deck, settings.filterId, settings.selectedItemIds).map((item) => item.id),
  );
  const visible = items.filter((item) =>
    `${item.name} ${item.symbol ?? ''} ${item.clue ?? ''}`.toLowerCase().includes(query.toLowerCase()),
  );
  const update = (ids: Set<string>) =>
    onChange({
      ...settings,
      selectedItemIds: items.filter((item) => ids.has(item.id)).map((item) => item.id),
    });
  const bulk = (include: boolean) => {
    const next = new Set(selected);
    for (const item of visible) {
      if (include) next.add(item.id);
      else next.delete(item.id);
    }
    update(next);
  };
  return (
    <section className="setup-card item-picker">
      <div className="item-picker-heading">
        <div>
          <h2>Build your playset</h2>
          <p className="hint">
            Check the items your class should play with. Cards, calls, and winner checks use this exact
            selection.
          </p>
        </div>
        <strong className="selection-count" aria-live="polite">
          {selected.size} / {items.length} selected
        </strong>
      </div>
      <div className="item-picker-tools">
        <input
          className="text-input"
          aria-label="Search playset items"
          placeholder="Search answers or clues"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn btn-secondary" onClick={() => bulk(true)}>
          Select {query ? 'matches' : 'all'}
        </button>
        <button className="btn btn-ghost" onClick={() => bulk(false)}>
          Clear {query ? 'matches' : 'all'}
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => onChange({ ...settings, selectedItemIds: undefined })}
        >
          Reset selection
        </button>
      </div>
      <div className="item-choice-grid">
        {visible.map((item) => (
          <label key={item.id} className={`item-choice ${selected.has(item.id) ? 'is-selected' : ''}`}>
            <input
              type="checkbox"
              checked={selected.has(item.id)}
              onChange={(e) => {
                const next = new Set(selected);
                if (e.target.checked) next.add(item.id);
                else next.delete(item.id);
                update(next);
              }}
            />
            <span>
              <strong>
                {item.symbol ? `${item.symbol} · ` : ''}
                {item.name}
              </strong>
              {item.clue && <small>{item.clue}</small>}
            </span>
          </label>
        ))}
      </div>
      {visible.length === 0 && <p className="hint">No items match this search.</p>}
      <p className="hint">
        Changing items creates a new game code. Print new cards after changing your selection.
      </p>
      <div className="save-selection">
        <label>
          <span className="option-label">Save this selection as a new playset</span>
          <input
            className="text-input"
            maxLength={80}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <button
          className="btn btn-secondary"
          disabled={selected.size < 8 || !title.trim()}
          onClick={() => {
            setError('');
            try {
              onSave(title.trim());
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Could not save this selection.');
            }
          }}
        >
          Save to library
        </button>
      </div>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
