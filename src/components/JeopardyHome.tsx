import { useState } from 'react';
import type { JeopardyBoard, SavedJeopardyBoard } from '../lib/jeopardy';
import { readBoardLibrary, deleteBoard, emptyBoard } from '../lib/jeopardy';
import type { Theme } from '../lib/gameConfig';
import ThemeToggle from './ThemeToggle';

interface Props {
  onEdit: (id: string | undefined, board: JeopardyBoard) => void;
  onHost: (board: JeopardyBoard) => Promise<void>;
  onBack: () => void;
  theme: Theme;
  onCycleTheme: () => void;
}

export default function JeopardyHome({ onEdit, onHost, onBack, theme, onCycleTheme }: Props) {
  const [boards, setBoards] = useState<SavedJeopardyBoard[]>(readBoardLibrary);
  const [removing, setRemoving] = useState<string | null>(null);
  const [hostingId, setHostingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleHost = async (saved: SavedJeopardyBoard) => {
    setError('');
    setHostingId(saved.id);
    try {
      await onHost(saved.board);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the game.');
    } finally {
      setHostingId(null);
    }
  };

  return (
    <main className="page page-home page-jeopardy-home">
      <div className="page-corner-controls">
        <ThemeToggle theme={theme} onCycle={onCycleTheme} />
      </div>
      <header className="home-header">
        <span className="home-eyebrow">
          <span className="status-spark" /> LIVE CLASSROOM GAME
        </span>
        <h1>Jeopardy</h1>
        <p className="subtitle">Build a board, then host it live — students join from their own device.</p>
      </header>

      <section className="library-controls" aria-label="Jeopardy boards">
        <div className="library-heading">
          <div>
            <h2>Your boards</h2>
            <p>{boards.length} saved</p>
          </div>
          <button className="btn btn-primary" onClick={() => onEdit(undefined, emptyBoard())}>
            + Create board
          </button>
        </div>
      </section>

      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}

      <div className="deck-grid library-grid">
        {boards.map((saved) => (
          <article className="library-entry" key={saved.id}>
            <button className="deck-tile" onClick={() => onEdit(saved.id, saved.board)}>
              <span className="subject-mark" aria-hidden="true">
                J!
              </span>
              <span className="deck-tile-title">{saved.board.title || 'Untitled board'}</span>
              <span className="deck-tile-desc">{saved.board.categories.length} categories</span>
              <span className="deck-tile-footer">
                <span className="deck-launch">
                  Edit <span aria-hidden="true">↗</span>
                </span>
              </span>
            </button>
            <button
              className="btn btn-primary library-remove-button"
              disabled={hostingId === saved.id}
              onClick={() => handleHost(saved)}
            >
              {hostingId === saved.id ? 'Starting…' : 'Host This Game ▶'}
            </button>
            {removing === saved.id ? (
              <div className="library-remove">
                <span>Delete this board?</span>
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    deleteBoard(saved.id);
                    setBoards(readBoardLibrary());
                    setRemoving(null);
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
                onClick={() => setRemoving(saved.id)}
                aria-label={`Delete ${saved.board.title || 'this board'}`}
              >
                Delete board
              </button>
            )}
          </article>
        ))}
      </div>

      {boards.length === 0 && (
        <div className="library-empty">
          <strong>No boards yet.</strong>
          <p>Create a board with up to 6 categories and 5 clues each, just like the real show.</p>
          <button className="btn btn-primary" onClick={() => onEdit(undefined, emptyBoard())}>
            Create your first board
          </button>
        </div>
      )}

      <footer className="home-footer">
        <button className="btn btn-ghost" onClick={onBack}>
          ← Back to BingoBash
        </button>
      </footer>
    </main>
  );
}
