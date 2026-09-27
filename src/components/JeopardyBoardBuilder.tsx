import { useState } from 'react';
import type { JeopardyBoard, JeopardyCategory, JeopardyClue } from '../lib/jeopardy';
import { boardErrors, saveBoard, emptyCategory } from '../lib/jeopardy';
import type { Theme } from '../lib/gameConfig';
import ThemeToggle from './ThemeToggle';

interface Props {
  initialBoard: JeopardyBoard;
  boardId?: string;
  onBack: () => void;
  onHost: (board: JeopardyBoard) => Promise<void>;
  theme: Theme;
  onCycleTheme: () => void;
}

export default function JeopardyBoardBuilder({
  initialBoard,
  boardId,
  onBack,
  onHost,
  theme,
  onCycleTheme,
}: Props) {
  const [board, setBoard] = useState<JeopardyBoard>(initialBoard);
  const [savedId, setSavedId] = useState<string | undefined>(boardId);
  const [error, setError] = useState('');
  const [hosting, setHosting] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const errors = boardErrors(board);
  const canHost = errors.length === 0;

  const updateCategory = (catIdx: number, patch: Partial<JeopardyCategory>) => {
    setBoard((b) => ({ ...b, categories: b.categories.map((c, i) => (i === catIdx ? { ...c, ...patch } : c)) }));
  };
  const updateClue = (catIdx: number, clueIdx: number, patch: Partial<JeopardyClue>) => {
    setBoard((b) => ({
      ...b,
      categories: b.categories.map((c, i) =>
        i === catIdx ? { ...c, clues: c.clues.map((cl, j) => (j === clueIdx ? { ...cl, ...patch } : cl)) } : c,
      ),
    }));
  };
  const setDailyDouble = (catIdx: number, clueIdx: number) => {
    setBoard((b) => ({
      ...b,
      categories: b.categories.map((c, i) => ({
        ...c,
        clues: c.clues.map((cl, j) => ({ ...cl, dailyDouble: i === catIdx && j === clueIdx })),
      })),
    }));
  };
  const addCategory = () => {
    if (board.categories.length >= 6) return;
    setBoard((b) => ({ ...b, categories: [...b.categories, emptyCategory()] }));
  };
  const removeCategory = (catIdx: number) => {
    setBoard((b) => ({ ...b, categories: b.categories.filter((_, i) => i !== catIdx) }));
  };

  const persist = () => {
    const saved = saveBoard(board, savedId);
    setSavedId(saved.id);
    return saved;
  };

  const handleSave = () => {
    setError('');
    try {
      persist();
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save this board.');
    }
  };

  const handleHost = async () => {
    if (!canHost) return;
    setError('');
    setHosting(true);
    try {
      persist();
      await onHost(board);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the game.');
    } finally {
      setHosting(false);
    }
  };

  return (
    <div className="page page-setup page-jeopardy-builder">
      <header className="setup-header">
        <button className="btn btn-ghost" onClick={onBack}>
          ← Jeopardy
        </button>
        <h1>Build a Board</h1>
        <ThemeToggle theme={theme} onCycle={onCycleTheme} />
      </header>

      <section className="setup-card">
        <h2>Board title</h2>
        <input
          className="text-input"
          maxLength={80}
          value={board.title}
          onChange={(e) => setBoard((b) => ({ ...b, title: e.target.value }))}
          placeholder="e.g. Cell Biology Jeopardy"
        />
        <p className="hint">Students see this while they wait in the lobby — not the categories or clues.</p>
      </section>

      <section className="setup-card jeopardy-grid-editor">
        <div className="jeopardy-grid-heading">
          <h2>Categories &amp; clues</h2>
          <button className="btn btn-secondary" onClick={addCategory} disabled={board.categories.length >= 6}>
            + Add category
          </button>
        </div>
        <div
          className="jeopardy-builder-grid"
          style={{ gridTemplateColumns: `repeat(${board.categories.length}, minmax(220px, 1fr))` }}
        >
          {board.categories.map((cat, catIdx) => (
            <div className="jeopardy-builder-col" key={catIdx}>
              <div className="jeopardy-builder-cat-header">
                <input
                  className="text-input"
                  maxLength={40}
                  value={cat.title}
                  onChange={(e) => updateCategory(catIdx, { title: e.target.value })}
                  placeholder={`Category ${catIdx + 1}`}
                />
                {board.categories.length > 1 && (
                  <button
                    className="btn btn-ghost jeopardy-remove-cat"
                    onClick={() => removeCategory(catIdx)}
                    aria-label="Remove category"
                  >
                    ✕
                  </button>
                )}
              </div>
              {cat.clues.map((clue, clueIdx) => (
                <div className="jeopardy-builder-clue" key={clueIdx}>
                  <div className="jeopardy-builder-clue-head">
                    <span>${clue.value}</span>
                    <label className="jeopardy-dd-toggle">
                      <input
                        type="radio"
                        name="daily-double"
                        checked={clue.dailyDouble}
                        onChange={() => setDailyDouble(catIdx, clueIdx)}
                      />
                      Daily Double
                    </label>
                  </div>
                  <textarea
                    className="text-input jeopardy-clue-text-input"
                    rows={2}
                    maxLength={200}
                    value={clue.clue}
                    placeholder="Clue"
                    onChange={(e) => updateClue(catIdx, clueIdx, { clue: e.target.value })}
                  />
                  <input
                    className="text-input"
                    maxLength={120}
                    value={clue.answer}
                    placeholder="Answer (e.g. What is...?)"
                    onChange={(e) => updateClue(catIdx, clueIdx, { answer: e.target.value })}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="setup-card">
        <h2>Final Jeopardy</h2>
        <div className="option-row">
          <span className="option-label">Category</span>
          <input
            className="text-input"
            maxLength={60}
            value={board.final.category}
            onChange={(e) => setBoard((b) => ({ ...b, final: { ...b.final, category: e.target.value } }))}
          />
        </div>
        <div className="option-row">
          <span className="option-label">Clue</span>
          <textarea
            className="text-input"
            rows={2}
            maxLength={300}
            value={board.final.clue}
            onChange={(e) => setBoard((b) => ({ ...b, final: { ...b.final, clue: e.target.value } }))}
          />
        </div>
        <div className="option-row">
          <span className="option-label">Answer</span>
          <input
            className="text-input"
            maxLength={150}
            value={board.final.answer}
            onChange={(e) => setBoard((b) => ({ ...b, final: { ...b.final, answer: e.target.value } }))}
          />
        </div>
      </section>

      {errors.length > 0 && (
        <ul className="inline-error" role="alert">
          {errors.slice(0, 6).map((m) => (
            <li key={m}>{m}</li>
          ))}
          {errors.length > 6 && <li>And {errors.length - 6} more.</li>}
        </ul>
      )}
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}

      <div className="setup-actions">
        <button className="btn btn-secondary btn-lg" onClick={handleSave}>
          {savedFlash ? 'Saved ✓' : 'Save for later'}
        </button>
        <button className="btn btn-primary btn-lg" disabled={!canHost || hosting} onClick={handleHost}>
          {hosting ? 'Starting…' : 'Host This Game ▶'}
        </button>
      </div>
    </div>
  );
}
