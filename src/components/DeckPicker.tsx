import { DECK_ORDER, DECKS } from '../data/decks';
import type { DeckId } from '../data/types';

interface Props {
  onPick: (deckId: DeckId) => void;
  resumeBanner?: { label: string; onResume: () => void; onDiscard: () => void } | null;
}

const DECK_ICON: Record<DeckId, string> = {
  elements: '⚛',
  ions: '🧪',
  minerals: '💎',
  rocks: '🪨',
};

export default function DeckPicker({ onPick, resumeBanner }: Props) {
  return (
    <div className="page page-home">
      <header className="home-header">
        <h1>ClassBingo</h1>
        <p className="subtitle">Pick a game to call or print cards for.</p>
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

      <div className="deck-grid">
        {DECK_ORDER.map((id) => {
          const deck = DECKS[id];
          return (
            <button key={id} className="deck-tile" onClick={() => onPick(id)}>
              <span className="deck-tile-icon" aria-hidden>
                {DECK_ICON[id]}
              </span>
              <span className="deck-tile-title">{deck.title}</span>
              <span className="deck-tile-desc">{deck.description}</span>
              <span className="deck-tile-count">{deck.items.length} items</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
