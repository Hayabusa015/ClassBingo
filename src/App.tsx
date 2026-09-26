import { useEffect, useMemo, useState } from 'react';
import { DECK_ORDER, getDeck, findDeck } from './data/decks';
import type { DeckConfig, DeckId } from './data/types';
import { getFilteredItems, type GameSettings } from './lib/cards';
import type { WinPattern } from './lib/bingo';
import type { CallStyle, GameMode, SessionState, Theme, View } from './lib/gameConfig';
import { SESSION_KEY, THEME_ORDER } from './lib/gameConfig';
import { loadState, saveState, clearState } from './lib/storage';
import { randomGameCode } from './lib/rng';
import type { MemorySettings } from './lib/memory';
import {
  readLibrary,
  writeLibrary,
  validateLibrary,
  mergeLibrary,
  newPlayset,
  playsetToDeck,
  type SavedPlayset,
} from './lib/playsets';
import DeckPicker from './components/DeckPicker';
import GameSetup from './components/GameSetup';
import Caller from './components/Caller';
import CardGenerator from './components/CardGenerator';
import CustomPlayset from './components/CustomPlayset';
import MemorySetup from './components/MemorySetup';
import MemoryGame from './components/MemoryGame';

function defaultSettingsFor(deck: DeckConfig): GameSettings {
  const count = getFilteredItems(deck, deck.defaultFilterId).length;
  return {
    deckId: deck.id,
    filterId: deck.defaultFilterId,
    gridSize: count >= 24 ? 5 : count >= 16 ? 4 : 3,
    freeCenter: true,
    cardFace: deck.defaultCardFaceId,
    gameCode: randomGameCode(),
  };
}

export default function App() {
  const [libraryState, setLibraryState] = useState(readLibrary);
  const library = libraryState.playsets;
  const [view, setView] = useState<View>('home');
  const [libraryMode, setLibraryMode] = useState<GameMode>('bingo');
  const [creating, setCreating] = useState(false);
  const [creationTitle, setCreationTitle] = useState('');
  const [deckId, setDeckId] = useState<DeckId | null>(null);
  const [activeCustom, setActiveCustom] = useState<SavedPlayset | undefined>();
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [memoryDeck, setMemoryDeck] = useState<DeckConfig | null>(null);
  const [memoryActiveCustom, setMemoryActiveCustom] = useState<SavedPlayset | undefined>();
  const [memorySettings, setMemorySettings] = useState<MemorySettings | null>(null);
  const [callStyle, setCallStyle] = useState<CallStyle>('both');
  const [winPattern, setWinPattern] = useState<WinPattern>('line');
  const [resumable, setResumable] = useState<SessionState | null>(null);
  const [theme, setTheme] = useState<Theme>(() => loadState<Theme>('ui:theme') ?? 'violet');
  const decks = useMemo(() => [...DECK_ORDER.map(getDeck), ...library.map(playsetToDeck)], [library]);
  const deck = useMemo(
    () => (activeCustom ? playsetToDeck(activeCustom) : deckId ? findDeck(deckId) : null),
    [activeCustom, deckId],
  );

  useEffect(() => {
    const saved = loadState<SessionState>(SESSION_KEY);
    if (!saved || (saved.view !== 'caller' && saved.view !== 'cardgen')) return;
    try {
      if (saved.customPlayset) validateLibrary([saved.customPlayset]);
      if (saved.customPlayset || findDeck(saved.deckId)) setResumable(saved);
    } catch {
      /* Leave an invalid session unused. Never rewrite the user's library. */
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveState('ui:theme', theme);
  }, [theme]);
  const cycleTheme = () => setTheme((t) => THEME_ORDER[(THEME_ORDER.indexOf(t) + 1) % THEME_ORDER.length]);

  useEffect(() => {
    if (!['setup', 'caller', 'cardgen'].includes(view) || !deckId || !settings) return;
    const session: SessionState = {
      view,
      deckId,
      settings,
      callStyle,
      winPattern,
      customPlayset: activeCustom,
    };
    saveState(SESSION_KEY, session);
  }, [view, deckId, settings, callStyle, winPattern, activeCustom]);

  const startDeck = (chosen: DeckConfig, saved?: SavedPlayset) => {
    setDeckId(chosen.id);
    setActiveCustom(saved);
    setSettings(defaultSettingsFor(chosen));
    setCallStyle('both');
    setWinPattern('line');
    setView('setup');
    setCreating(false);
  };
  const startMemory = (chosen: DeckConfig, saved?: SavedPlayset) => {
    setMemoryDeck(chosen);
    setMemoryActiveCustom(saved);
    setMemorySettings(null);
    setView('memory-setup');
  };
  const handlePickDeck = (id: DeckId) => {
    const saved = library.find((entry) => entry.id === id);
    const chosen = saved ? playsetToDeck(saved) : findDeck(id);
    if (!chosen) return;
    if (libraryMode === 'memory') startMemory(chosen, saved);
    else startDeck(chosen, saved);
  };
  const persistNewPlayset = (saved: SavedPlayset) => {
    if (libraryState.error)
      throw new Error('Restore your library from an export before saving a new playset.');
    const next = [...library, saved];
    writeLibrary(next);
    setLibraryState({ playsets: next, error: null });
  };
  const saveNew = (saved: SavedPlayset) => {
    persistNewPlayset(saved);
    startDeck(playsetToDeck(saved), saved);
  };
  const saveSelection = (title: string) => {
    if (!deck || !settings) return;
    const items = getFilteredItems(deck, settings.filterId, settings.selectedItemIds);
    const source = activeCustom ? activeCustom.sourceDeckId : deck.id;
    saveNew(newPlayset(title, deck.subject || 'Science', items, source));
  };
  const saveMemorySelection = (title: string, filterId: string, selectedItemIds?: string[]) => {
    if (!memoryDeck) return;
    const items = getFilteredItems(memoryDeck, filterId, selectedItemIds);
    const source = memoryActiveCustom ? memoryActiveCustom.sourceDeckId : memoryDeck.id;
    persistNewPlayset(newPlayset(title, memoryDeck.subject || 'Science', items, source));
  };
  const exitMemory = () => {
    setView('home');
    setMemoryDeck(null);
    setMemoryActiveCustom(undefined);
    setMemorySettings(null);
  };
  const exportLibrary = () => {
    const blob = new Blob(
      [JSON.stringify({ format: 'classbingo-library', version: 1, playsets: library }, null, 2)],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'classbingo-library.json';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importLibrary = async (file: File) => {
    if (file.size > 2_000_000) throw new Error('Choose a ClassBingo library file smaller than 2 MB.');
    let data;
    try {
      data = JSON.parse(await file.text());
    } catch {
      throw new Error('This file is not readable JSON. Choose a ClassBingo library export.');
    }
    if (data?.format !== 'classbingo-library' || data.version !== 1)
      throw new Error('Choose a ClassBingo library export (version 1).');
    const next = mergeLibrary(library, validateLibrary(data.playsets));
    writeLibrary(next);
    setLibraryState({ playsets: next, error: null });
  };
  const removePlayset = (id: DeckId) => {
    const next = library.filter((saved) => saved.id !== id);
    writeLibrary(next);
    setLibraryState({ playsets: next, error: null });
  };
  const handleResume = () => {
    if (!resumable) return;
    setDeckId(resumable.deckId);
    setActiveCustom(resumable.customPlayset);
    setSettings(resumable.settings);
    setCallStyle(resumable.callStyle);
    setWinPattern(resumable.winPattern);
    setView(resumable.view);
    setResumable(null);
  };
  const handleBackToHome = () => {
    clearState(SESSION_KEY);
    setView('home');
    setDeckId(null);
    setSettings(null);
    setActiveCustom(undefined);
    setResumable(null);
  };
  const updateSettings = (next: GameSettings) => {
    const changedItems =
      settings &&
      (next.filterId !== settings.filterId ||
        JSON.stringify(next.selectedItemIds) !== JSON.stringify(settings.selectedItemIds));
    if (changedItems) {
      let gameCode = randomGameCode();
      while (gameCode === settings.gameCode) gameCode = randomGameCode();
      setSettings({ ...next, gameCode });
    } else setSettings(next);
  };

  if (creating)
    return <CustomPlayset initialTitle={creationTitle} onSave={saveNew} onBack={() => setCreating(false)} />;
  if (view === 'memory-setup' && memoryDeck)
    return (
      <MemorySetup
        deck={memoryDeck}
        onStart={(s) => {
          setMemorySettings(s);
          setView('memory-play');
        }}
        onBack={exitMemory}
        onSaveSelection={saveMemorySelection}
        theme={theme}
        onCycleTheme={cycleTheme}
      />
    );
  if (view === 'memory-play' && memoryDeck && memorySettings)
    return (
      <MemoryGame
        deck={memoryDeck}
        settings={memorySettings}
        onReshuffle={setMemorySettings}
        onChangeBoard={() => setView('memory-setup')}
        onExit={exitMemory}
        theme={theme}
        onCycleTheme={cycleTheme}
      />
    );
  if (view === 'home' || !deck || !settings)
    return (
      <DeckPicker
        decks={decks}
        onPick={handlePickDeck}
        mode={libraryMode}
        onChangeMode={setLibraryMode}
        onCreate={(title = '') => {
          setCreationTitle(title);
          setCreating(true);
        }}
        onExport={exportLibrary}
        onImport={importLibrary}
        onRemove={removePlayset}
        storageError={libraryState.error}
        theme={theme}
        onCycleTheme={cycleTheme}
        resumeBanner={
          resumable
            ? {
                label: `Resume your ${resumable.customPlayset?.title ?? findDeck(resumable.deckId)?.title ?? 'saved'} game (code ${resumable.settings.gameCode})?`,
                onResume: handleResume,
                onDiscard: () => {
                  clearState(SESSION_KEY);
                  setResumable(null);
                },
              }
            : null
        }
      />
    );
  if (view === 'setup')
    return (
      <GameSetup
        deck={deck}
        settings={settings}
        onChangeSettings={updateSettings}
        callStyle={callStyle}
        onChangeCallStyle={setCallStyle}
        winPattern={winPattern}
        onChangeWinPattern={setWinPattern}
        onStartCaller={() => setView('caller')}
        onStartCardGenerator={() => setView('cardgen')}
        onBack={handleBackToHome}
        theme={theme}
        onCycleTheme={cycleTheme}
        onSaveSelection={saveSelection}
      />
    );
  if (view === 'caller')
    return (
      <Caller
        deck={deck}
        settings={settings}
        callStyle={callStyle}
        winPattern={winPattern}
        onExit={() => setView('setup')}
        theme={theme}
        onCycleTheme={cycleTheme}
      />
    );
  return (
    <CardGenerator
      deck={deck}
      settings={settings}
      onExit={() => setView('setup')}
      onStartCaller={() => setView('caller')}
      theme={theme}
      onCycleTheme={cycleTheme}
    />
  );
}
