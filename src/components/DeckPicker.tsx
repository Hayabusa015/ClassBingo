import { useRef, useState } from 'react';
import type { DeckConfig, DeckId } from '../data/types';
import type { Theme } from '../lib/gameConfig';
import ThemeToggle from './ThemeToggle';
import UpdateChecker from './UpdateChecker';
import ScienceArt from './ScienceArt';
import ShullLogo from './ShullLogo';

interface Props {
  decks: DeckConfig[];
  onPick: (deckId: DeckId) => void;
  onCreate: (title?: string) => void;
  onExport: () => void;
  onImport: (file: File) => Promise<void>;
  onRemove: (id: DeckId) => void;
  storageError: string | null;
  theme: Theme;
  onCycleTheme: () => void;
  resumeBanner?: { label: string; onResume: () => void; onDiscard: () => void } | null;
}
const SUBJECT_MARK: Record<string, string> = {
  Science: 'Sc',
  Math: 'x²',
  English: 'Aa',
  'Social studies': 'Gl',
  'World languages': 'Hola',
  Technology: '</>',
  Arts: 'Art',
  'Health & PE': 'PE',
  Custom: '+',
};

export default function DeckPicker({
  decks,
  onPick,
  onCreate,
  onExport,
  onImport,
  onRemove,
  storageError,
  theme,
  onCycleTheme,
  resumeBanner,
}: Props) {
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('All subjects');
  const [onlySaved, setOnlySaved] = useState(false);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState<DeckId | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const savedCount = decks.filter((deck) => deck.id.startsWith('custom:')).length;
  const subjects = [...new Set(decks.map((deck) => deck.subject || 'Science'))].sort();
  const shown = decks.filter(
    (deck) =>
      (!onlySaved || deck.id.startsWith('custom:')) &&
      (subject === 'All subjects' || deck.subject === subject) &&
      `${deck.title} ${deck.description} ${deck.subject} ${deck.items.map((item) => item.name).join(' ')}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <main className="page page-home page-library">
      <div className="page-corner-controls">
        <UpdateChecker />
        <ThemeToggle theme={theme} onCycle={onCycleTheme} />
      </div>
      <header className="home-header">
        <ShullLogo />
        <span className="home-eyebrow">
          <span className="status-spark" /> YOUR CLASSROOM. YOUR GAME.
        </span>
        <h1>BingoBash</h1>
        <p className="home-tagline">A playset for every kind of discovery.</p>
        <p className="subtitle">Choose a subject, tailor the items, and make it your game.</p>
      </header>
      {resumeBanner && (
        <div className="resume-banner">
          <span>{resumeBanner.label}</span>
          <div className="resume-banner-actions">
            <button className="btn btn-primary" onClick={resumeBanner.onResume}>
              Resume
            </button>
            <button className="btn btn-ghost" onClick={resumeBanner.onDiscard}>
              Start Fresh
            </button>
          </div>
        </div>
      )}
      <section className="library-controls" aria-label="Game library filters">
        <div className="library-heading">
          <div>
            <h2>Game library</h2>
            <p>
              {decks.length - savedCount} ready-made playsets · {savedCount} saved by you
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => onCreate(query.trim().slice(0, 80))}>
            + Create playset
          </button>
        </div>
        <div className="library-search-row">
          <input
            className="text-input"
            aria-label="Search game library"
            placeholder="Search subjects, playsets, or items…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="select"
            aria-label="Filter by subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option>All subjects</option>
            {subjects.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
          <button
            className={`btn ${onlySaved ? 'btn-primary' : 'btn-secondary'}`}
            aria-pressed={onlySaved}
            onClick={() => setOnlySaved(!onlySaved)}
          >
            My playsets
          </button>
        </div>
        <div className="library-meta">
          <span>{shown.length} playsets shown · Grade bands are suggestions</span>
          <div>
            <button className="btn btn-ghost" disabled={!savedCount} onClick={onExport}>
              Export library
            </button>
            <button className="btn btn-ghost" onClick={() => fileInput.current?.click()}>
              Import library
            </button>
            <input
              className="visually-hidden"
              ref={fileInput}
              type="file"
              accept=".json,application/json"
              aria-label="Import library file"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (!file) return;
                setError('');
                try {
                  await onImport(file);
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'The library could not be imported.');
                }
              }}
            />
          </div>
        </div>
        {(error || storageError) && (
          <p className="inline-error" role="alert">
            {error || storageError}
          </p>
        )}
      </section>
      <div className="deck-grid library-grid">
        {shown.map((deck) => {
          const art = deck.presentation ?? deck.id;
          const science = ['elements', 'ions', 'minerals', 'rocks'].includes(art);
          const custom = deck.id.startsWith('custom:');
          return (
            <article className="library-entry" key={deck.id}>
              <button className={`deck-tile deck-tile-${deck.id}`} onClick={() => onPick(deck.id)}>
                <div className="library-deck-top">
                  <span>{deck.subject || 'Science'}</span>
                  <span>{custom ? 'Saved' : `Grades ${deck.grades}`}</span>
                </div>
                {science ? (
                  <ScienceArt deck={art} />
                ) : (
                  <span className="subject-mark" aria-hidden="true">
                    {SUBJECT_MARK[deck.subject || 'Custom'] || '+'}
                  </span>
                )}
                <span className="deck-tile-title">{deck.title}</span>
                <span className="deck-tile-desc">{deck.description}</span>
                <span className="deck-tile-footer">
                  <span className="deck-tile-count">{deck.items.length} items</span>
                  <span className="deck-launch">
                    Customize <span aria-hidden="true">↗</span>
                  </span>
                </span>
              </button>
              {custom &&
                (removing === deck.id ? (
                  <div className="library-remove">
                    <span>Delete this saved playset?</span>
                    <button
                      className="btn btn-danger"
                      onClick={() => {
                        try {
                          onRemove(deck.id);
                          setRemoving(null);
                        } catch (e) {
                          setError(e instanceof Error ? e.message : 'Could not remove playset.');
                        }
                      }}
                    >
                      Delete
                    </button>
                    <button className="btn btn-ghost" onClick={() => setRemoving(null)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn btn-ghost library-remove-button"
                    onClick={() => setRemoving(deck.id)}
                    aria-label={`Delete ${deck.title}`}
                  >
                    Delete saved playset
                  </button>
                ))}
            </article>
          );
        })}
      </div>
      {shown.length === 0 && (
        <div className="library-empty">
          <strong>No playsets match yet.</strong>
          <p>Add your own items and we’ll turn them into a playable game and printable bingo boards.</p>
          <button className="btn btn-primary" onClick={() => onCreate(query.trim().slice(0, 80))}>
            Create this playset
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setQuery('');
              setSubject('All subjects');
              setOnlySaved(false);
            }}
          >
            Show all playsets
          </button>
        </div>
      )}
      <footer className="home-footer">
        <span>Built for your classroom.</span>
        <span>Saved on this device · Export your library for backup</span>
      </footer>
    </main>
  );
}
