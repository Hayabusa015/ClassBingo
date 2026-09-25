import { useEffect, useState } from 'react';
import { getDeck } from './data/decks';
import type { DeckId } from './data/types';
import type { GameSettings } from './lib/cards';
import type { WinPattern } from './lib/bingo';
import type { CallStyle, SessionState, View } from './lib/gameConfig';
import { SESSION_KEY } from './lib/gameConfig';
import { loadState, saveState, clearState } from './lib/storage';
import { randomGameCode } from './lib/rng';
import DeckPicker from './components/DeckPicker';
import GameSetup from './components/GameSetup';
import Caller from './components/Caller';
import CardGenerator from './components/CardGenerator';

function defaultSettingsFor(deckId: DeckId): GameSettings {
  const deck = getDeck(deckId);
  return {
    deckId,
    filterId: deck.defaultFilterId,
    gridSize: 5,
    freeCenter: true,
    cardFace: deck.defaultCardFaceId,
    gameCode: randomGameCode(),
  };
}

export default function App() {
  const [view, setView] = useState<View>('home');
  const [deckId, setDeckId] = useState<DeckId | null>(null);
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [callStyle, setCallStyle] = useState<CallStyle>('both');
  const [winPattern, setWinPattern] = useState<WinPattern>('line');
  const [resumable, setResumable] = useState<SessionState | null>(null);

  // On first load, check for a saved in-progress game to offer resuming.
  useEffect(() => {
    const saved = loadState<SessionState>(SESSION_KEY);
    if (saved && (saved.view === 'caller' || saved.view === 'cardgen')) {
      setResumable(saved);
    }
  }, []);

  // Persist navigation state so a page refresh can resume the same game.
  useEffect(() => {
    if (view === 'home' || !deckId || !settings) return;
    const session: SessionState = { view, deckId, settings, callStyle, winPattern };
    saveState(SESSION_KEY, session);
  }, [view, deckId, settings, callStyle, winPattern]);

  const handlePickDeck = (id: DeckId) => {
    setDeckId(id);
    setSettings(defaultSettingsFor(id));
    setCallStyle('both');
    setWinPattern('line');
    setView('setup');
  };

  const handleResume = () => {
    if (!resumable) return;
    setDeckId(resumable.deckId);
    setSettings(resumable.settings);
    setCallStyle(resumable.callStyle);
    setWinPattern(resumable.winPattern);
    setView(resumable.view);
    setResumable(null);
  };

  const handleDiscardResume = () => {
    clearState(SESSION_KEY);
    setResumable(null);
  };

  const handleBackToHome = () => {
    clearState(SESSION_KEY);
    setView('home');
    setDeckId(null);
    setSettings(null);
  };

  if (view === 'home' || !deckId || !settings) {
    return (
      <DeckPicker
        onPick={handlePickDeck}
        resumeBanner={
          resumable
            ? {
                label: `Resume your ${getDeck(resumable.deckId).title} game (code ${resumable.settings.gameCode})?`,
                onResume: handleResume,
                onDiscard: handleDiscardResume,
              }
            : null
        }
      />
    );
  }

  const deck = getDeck(deckId);

  if (view === 'setup') {
    return (
      <GameSetup
        deck={deck}
        settings={settings}
        onChangeSettings={setSettings}
        callStyle={callStyle}
        onChangeCallStyle={setCallStyle}
        winPattern={winPattern}
        onChangeWinPattern={setWinPattern}
        onStartCaller={() => setView('caller')}
        onStartCardGenerator={() => setView('cardgen')}
        onBack={handleBackToHome}
      />
    );
  }

  if (view === 'caller') {
    return (
      <Caller
        deck={deck}
        settings={settings}
        callStyle={callStyle}
        winPattern={winPattern}
        onExit={() => setView('setup')}
      />
    );
  }

  return (
    <CardGenerator deck={deck} settings={settings} onExit={() => setView('setup')} onStartCaller={() => setView('caller')} />
  );
}
