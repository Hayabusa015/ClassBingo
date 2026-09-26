import { useMemo, useState } from 'react';
import { parseItemLines, newPlayset, type SavedPlayset } from '../lib/playsets';
import { vocabularyDeck } from '../data/vocabulary';
import { generateCard, type GameSettings } from '../lib/cards';
import PrintableCard from './PrintableCard';

interface Props {
  initialTitle?: string;
  onSave: (playset: SavedPlayset) => void;
  onBack: () => void;
}

export default function CustomPlayset({ initialTitle = '', onSave, onBack }: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [subject, setSubject] = useState('Custom');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const parsed = useMemo(() => parseItemLines(text), [text]);
  const count = parsed.items.length;
  const valid = count >= 8 && count <= 300 && parsed.errors.length === 0;
  const deck = useMemo(
    () => vocabularyDeck('custom:preview', title || 'My playset', subject, 'Custom', '', parsed.items),
    [title, subject, parsed.items],
  );
  const settings: GameSettings = {
    deckId: deck.id,
    filterId: 'all',
    gridSize: count >= 24 ? 5 : count >= 16 ? 4 : 3,
    freeCenter: true,
    cardFace: 'name',
    gameCode: '1234',
  };
  const hasAllClues = count > 0 && parsed.items.every((item) => item.clue);

  const save = () => {
    setError('');
    if (!title.trim()) {
      setError('Give your playset a title first.');
      return;
    }
    if (!valid) {
      setError('Add at least 8 unique items and fix the listed issues.');
      return;
    }
    try {
      onSave(newPlayset(title, subject, parsed.items));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The playset could not be saved.');
    }
  };

  return (
    <main className="page custom-playset">
      <header className="setup-header">
        <button className="btn btn-ghost" onClick={onBack}>
          ← Library
        </button>
        <h1>Create a playset</h1>
      </header>
      <p className="library-intro">
        Bring your own vocabulary, review questions, or matching pairs. Your items become a caller, randomized
        student cards, and a master call sheet.
      </p>
      <div className="custom-layout">
        <section className="setup-card custom-form">
          <label className="option-row">
            <span className="option-label">Playset title</span>
            <input
              className="text-input"
              maxLength={80}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unit 3 vocabulary"
            />
          </label>
          <label className="option-row">
            <span className="option-label">Subject</span>
            <select className="select" value={subject} onChange={(e) => setSubject(e.target.value)}>
              {[
                'Custom',
                'Science',
                'Math',
                'English',
                'Social studies',
                'World languages',
                'Technology',
                'Arts',
                'Health & PE',
              ].map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
          <label className="option-row">
            <span className="option-label">Items — one per line</span>
            <textarea
              className="text-input playset-text"
              value={text}
              maxLength={100000}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                'Mitosis | Nuclear division that produces identical nuclei\nOsmosis | Water moving through a selectively permeable membrane\nDNA | The molecule that stores genetic information'
              }
              spellCheck={false}
            />
          </label>
          <p className="hint">
            Use <strong>answer | clue</strong>, or paste two columns from a spreadsheet. Answers alone also
            work. The answer goes on the card; the clue can be shown during Challenge mode.
          </p>
          <div className="selection-meter">
            <strong>{count} unique items</strong>
            <span>{count >= 30 ? 'A full classroom set' : '30+ recommended for variety'}</span>
          </div>
          <p className="hint">
            8 items supports 3×3 with a free center. 24 supports 5×5. Maximum 300.{' '}
            {hasAllClues
              ? 'Every item has a clue: Challenge mode is available.'
              : 'Add a clue to every item to enable Challenge mode.'}
          </p>
          {parsed.errors.length > 0 && (
            <ul className="inline-error" role="alert">
              {parsed.errors.slice(0, 5).map((message) => (
                <li key={message}>{message}</li>
              ))}
              {parsed.errors.length > 5 && <li>And {parsed.errors.length - 5} more issues.</li>}
            </ul>
          )}
          {error && (
            <p className="inline-error" role="alert">
              {error}
            </p>
          )}
          <button className="btn btn-primary btn-lg" disabled={!valid || !title.trim()} onClick={save}>
            Create playset
          </button>
          <p className="hint">
            Saved on this device. Export your library to back it up or move it to another computer.
          </p>
        </section>
        <section className="custom-preview">
          <h2>Automatic card preview</h2>
          <p className="hint">Preview code 1234. A new game code is assigned when you create the playset.</p>
          {valid ? (
            <PrintableCard
              deck={deck}
              grid={generateCard(deck, settings, 1)}
              cardNumber={1}
              gameCode="1234"
              headerTitle={title || 'My playset'}
            />
          ) : (
            <div className="library-empty">
              <strong>Your first board starts here.</strong>
              <p>
                Add eight unique answers to see a card. At 24 items, the preview becomes a full 5×5 board.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
