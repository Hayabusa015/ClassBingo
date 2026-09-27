import { useState } from 'react';
import type { DeckConfig } from '../data/types';
import type { GameSettings } from '../lib/cards';
import { randomGameCode } from '../lib/rng';
import {
  GLITCH_LEVELS,
  GLITCH_LEVEL_ORDER,
  glitchQuestionCount,
  buildGlitchQuestions,
  estimatedMinutes,
  glitchCount,
  createGlitchSession,
  saveGlitchHostSession,
  type GlitchLevelId,
  type GlitchHostCredentials,
} from '../lib/glitch';
import type { Theme } from '../lib/gameConfig';
import ThemeToggle from './ThemeToggle';
import ItemPicker from './ItemPicker';

interface Props {
  deck: DeckConfig;
  onBack: () => void;
  onHost: (credentials: GlitchHostCredentials) => void;
  onSaveSelection: (title: string, filterId: string, selectedItemIds?: string[]) => void;
  theme: Theme;
  onCycleTheme: () => void;
}

export default function GlitchSetup({ deck, onBack, onHost, onSaveSelection, theme, onCycleTheme }: Props) {
  const [filterId, setFilterId] = useState(deck.defaultFilterId);
  const [selectedItemIds, setSelectedItemIds] = useState<string[] | undefined>(undefined);
  const [level] = useState<GlitchLevelId>(0);
  const [title, setTitle] = useState(`${deck.shortTitle} GLITCH`.slice(0, 60));
  const [rounds, setRounds] = useState(GLITCH_LEVELS[0].defaultRounds);
  const [hosting, setHosting] = useState(false);
  const [error, setError] = useState('');

  const settings = GLITCH_LEVELS[level];
  const questionCount = glitchQuestionCount(deck, filterId, selectedItemIds, level);
  const canHost = questionCount >= 8 && title.trim().length > 0;
  const minutes = estimatedMinutes(settings, rounds);

  const pseudoSettings: GameSettings = {
    deckId: deck.id,
    filterId,
    gridSize: 3,
    freeCenter: false,
    cardFace: deck.defaultCardFaceId,
    gameCode: '0000',
    selectedItemIds,
  };

  const handleHost = async () => {
    setError('');
    setHosting(true);
    try {
      const seed = randomGameCode();
      const questions = buildGlitchQuestions(deck, filterId, selectedItemIds, level, seed);
      const credentials = await createGlitchSession(title.trim(), 'hunt', level, rounds, settings, questions);
      saveGlitchHostSession(credentials);
      onHost(credentials);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start this game.');
    } finally {
      setHosting(false);
    }
  };

  return (
    <div className="page page-setup page-glitch-setup">
      <header className="setup-header">
        <button className="btn btn-ghost" onClick={onBack}>
          ← Library
        </button>
        <h1>{deck.title} — GLITCH</h1>
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
                  name="glitch-filter"
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
          <p className={`item-count-note ${canHost ? '' : 'warn'}`}>
            {questionCount} questions available.{' '}
            {questionCount < 8 ? 'Pick a broader filter — GLITCH needs at least 8.' : ''}
          </p>
        </section>

        <section className="setup-card">
          <h2>Board title</h2>
          <label className="option-row">
            <span className="option-label">Students see this while they wait to join</span>
            <input
              className="text-input"
              maxLength={60}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cell Biology GLITCH"
            />
          </label>
          <div className="option-row">
            <span className="option-label">Rounds</span>
            <input
              className="text-input glitch-rounds-input"
              type="number"
              min={1}
              max={10}
              value={rounds}
              onChange={(e) => setRounds(Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
            />
          </div>
          <p className="hint">~{minutes} min, based on the current round count.</p>
        </section>
      </div>

      <section className="glitch-level-grid" aria-label="Difficulty level">
        {GLITCH_LEVEL_ORDER.map((id) => {
          const l = GLITCH_LEVELS[id];
          const active = id === level;
          const locked = id !== 0;
          const preview = glitchCount(id, 24);
          return (
            <article
              key={id}
              className={`glitch-level-card glitch-level-${id} ${active ? 'active' : ''} ${locked ? 'locked' : ''}`}
            >
              <div className="glitch-level-pips" aria-hidden="true">
                {Array.from({ length: 4 }, (_, i) => (
                  <span key={i} className={i < l.pips ? 'filled' : ''} />
                ))}
              </div>
              <h3>{l.name}</h3>
              <p className="glitch-level-bestfor">{l.bestFor}</p>
              {locked ? (
                <span className="glitch-level-badge">Coming soon</span>
              ) : (
                <>
                  <p className="hint">With 24 students → {preview || 'no'} Glitches</p>
                  <p className="hint">~{estimatedMinutes(l, l.defaultRounds)} min</p>
                </>
              )}
            </article>
          );
        })}
      </section>

      <ItemPicker
        key={deck.id}
        deck={deck}
        settings={pseudoSettings}
        onChange={(next) => setSelectedItemIds(next.selectedItemIds)}
        onSave={(savedTitle) => onSaveSelection(savedTitle, filterId, selectedItemIds)}
      />

      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}

      <div className="setup-actions">
        <button className="btn btn-primary btn-lg" disabled={!canHost || hosting} onClick={handleHost}>
          {hosting ? 'Starting…' : 'Host This Game ▶'}
        </button>
      </div>
    </div>
  );
}
