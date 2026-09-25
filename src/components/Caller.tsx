import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BingoItem, DeckConfig } from '../data/types';
import type { GameSettings } from '../lib/cards';
import { generateDrawOrder } from '../lib/cards';
import type { CallStyle, Theme } from '../lib/gameConfig';
import { callerProgressKey } from '../lib/gameConfig';
import type { WinPattern } from '../lib/bingo';
import { loadState, saveState, clearState } from '../lib/storage';
import { playCallSound, playWinSound } from '../lib/sound';
import { renderDisplayText } from '../lib/formula';
import CallCard, { type BounceOffset } from './CallCard';
import CalledList from './CalledList';
import CalledBoard from './CalledBoard';
import WinnerCheck from './WinnerCheck';
import ConfettiBurst from './ConfettiBurst';
import ThemeToggle from './ThemeToggle';

interface Props {
  deck: DeckConfig;
  settings: GameSettings;
  callStyle: CallStyle;
  winPattern: WinPattern;
  onExit: () => void;
  theme: Theme;
  onCycleTheme: () => void;
}

const SHUFFLE_MS = 1300;
const SHUFFLE_TICK_MS = 130;
const REST_OFFSET: BounceOffset = { x: 0, y: 0, rot: 0, scale: 1 };

/** A random hop for the shuffle animation — mostly upward, like a bounced ball. */
function randomBounceOffset(): BounceOffset {
  return {
    x: (Math.random() - 0.5) * 150,
    y: -Math.random() * 100,
    rot: (Math.random() - 0.5) * 26,
    scale: 0.85 + Math.random() * 0.3,
  };
}

export default function Caller({ deck, settings, callStyle, winPattern, onExit, theme, onCycleTheme }: Props) {
  const drawOrder = useMemo(() => generateDrawOrder(deck, settings), [deck, settings]);
  const progressKey = useMemo(() => callerProgressKey(settings, deck.id), [settings, deck.id]);

  const [calledIds, setCalledIds] = useState<string[]>(() => loadState<string[]>(progressKey) ?? []);
  const [revealed, setRevealed] = useState(false);
  const [peekItem, setPeekItem] = useState<BingoItem | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shuffleDisplayItem, setShuffleDisplayItem] = useState<BingoItem | null>(null);
  const [bounceOffset, setBounceOffset] = useState<BounceOffset>(REST_OFFSET);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [autoCallOn, setAutoCallOn] = useState(false);
  const [autoCallSeconds, setAutoCallSeconds] = useState(8);

  const [soundOn, setSoundOn] = useState<boolean>(() => loadState<boolean>('ui:sound') ?? true);

  const animTimerRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);

  // Reset call progress when the game itself changes (new deck/settings/code).
  useEffect(() => {
    setCalledIds(loadState<string[]>(progressKey) ?? []);
    setPeekItem(null);
    setRevealed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressKey]);

  useEffect(() => {
    saveState(progressKey, calledIds);
  }, [calledIds, progressKey]);

  useEffect(() => {
    saveState('ui:sound', soundOn);
  }, [soundOn]);

  const itemById = useMemo(() => {
    const map = new Map<string, BingoItem>();
    for (const item of drawOrder) map.set(item.id, item);
    return map;
  }, [drawOrder]);

  const calledIdSet = useMemo(() => new Set(calledIds), [calledIds]);
  const remaining = drawOrder.length - calledIds.length;
  const currentItem = peekItem ?? (calledIds.length > 0 ? (itemById.get(calledIds[calledIds.length - 1]) ?? null) : null);

  const stopShuffleTimer = () => {
    if (animTimerRef.current !== null) {
      window.clearInterval(animTimerRef.current);
      animTimerRef.current = null;
    }
  };

  const handleNext = useCallback(() => {
    if (isAnimatingRef.current) return;
    if (calledIds.length >= drawOrder.length) return;
    setPeekItem(null);
    setRevealed(false);
    isAnimatingRef.current = true;
    setIsAnimating(true);

    const start = Date.now();
    animTimerRef.current = window.setInterval(() => {
      const randomPick = drawOrder[Math.floor(Math.random() * drawOrder.length)];
      setShuffleDisplayItem(randomPick);
      setBounceOffset(randomBounceOffset());
      if (Date.now() - start >= SHUFFLE_MS) {
        stopShuffleTimer();
        isAnimatingRef.current = false;
        setIsAnimating(false);
        setShuffleDisplayItem(null);
        setBounceOffset(REST_OFFSET);
        setCalledIds((prev) => {
          if (prev.length >= drawOrder.length) return prev;
          return [...prev, drawOrder[prev.length].id];
        });
        if (soundOn) playCallSound();
      }
    }, SHUFFLE_TICK_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calledIds.length, drawOrder, soundOn]);

  const handleUndo = useCallback(() => {
    if (isAnimatingRef.current) return;
    setPeekItem(null);
    setRevealed(false);
    setCalledIds((prev) => prev.slice(0, -1));
  }, []);

  const handleReveal = useCallback(() => setRevealed(true), []);

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        void document.documentElement.requestFullscreen();
      } else {
        void document.exitFullscreen();
      }
    } catch {
      // fullscreen not supported — ignore
    }
  };

  const confirmReset = () => {
    clearState(progressKey);
    setCalledIds([]);
    setPeekItem(null);
    setRevealed(false);
    setShowResetConfirm(false);
  };

  const handleWin = useCallback(() => {
    setCelebrate(true);
    if (soundOn) playWinSound();
    window.setTimeout(() => setCelebrate(false), 2200);
  }, [soundOn]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'Backspace') {
        e.preventDefault();
        handleUndo();
      } else if (e.key.toLowerCase() === 'r' && callStyle === 'challenge') {
        handleReveal();
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      } else if (e.key.toLowerCase() === 'm') {
        setSoundOn((s) => !s);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleNext, handleUndo, handleReveal, callStyle]);

  // Auto-call
  useEffect(() => {
    if (!autoCallOn) return;
    const id = window.setInterval(() => {
      if (!isAnimatingRef.current && calledIds.length < drawOrder.length) {
        handleNext();
      }
    }, autoCallSeconds * 1000);
    return () => window.clearInterval(id);
  }, [autoCallOn, autoCallSeconds, handleNext, calledIds.length, drawOrder.length]);

  useEffect(() => stopShuffleTimer, []);

  const lastFive = [...calledIds]
    .slice(-5)
    .reverse()
    .map((id) => itemById.get(id))
    .filter((i): i is BingoItem => !!i);

  const calledItemsInOrder = calledIds.map((id) => itemById.get(id)).filter((i): i is BingoItem => !!i);

  return (
    <div className="page page-caller">
      <ConfettiBurst active={celebrate} />
      <header className="caller-header">
        <button className="btn btn-ghost" onClick={onExit}>
          ← Setup
        </button>
        <div className="caller-title">
          <h1>{deck.title}</h1>
          <span className="game-code-badge">Code {settings.gameCode}</span>
        </div>
        <div className="caller-header-controls">
          <button className="btn btn-ghost icon-btn" onClick={() => setSoundOn((s) => !s)} title="Toggle sound (M)">
            {soundOn ? '🔊' : '🔇'}
          </button>
          <ThemeToggle theme={theme} onCycle={onCycleTheme} />
          <button className="btn btn-ghost icon-btn" onClick={toggleFullscreen} title="Fullscreen (F)">
            ⛶
          </button>
        </div>
      </header>

      <div className="caller-counter">
        Call {calledIds.length} of {drawOrder.length}
        {remaining === 0 && <span className="caller-done-badge"> — all items called!</span>}
      </div>

      <div className="caller-main">
        <div className="caller-call-area">
          <CallCard
            key={currentItem?.id ?? 'empty'}
            deck={deck}
            item={currentItem}
            cardFace={settings.cardFace}
            callStyle={callStyle}
            revealed={revealed || !!peekItem}
            onReveal={handleReveal}
            isShuffling={isAnimating}
            shuffleDisplayItem={shuffleDisplayItem}
            bounceOffset={bounceOffset}
          />

          {peekItem && (
            <button className="btn btn-ghost" onClick={() => setPeekItem(null)}>
              ← Back to current call
            </button>
          )}

          <div className="last-five">
            <span className="last-five-label">Last calls:</span>
            {lastFive.length === 0 && <span className="last-five-empty">none yet</span>}
            {lastFive.map((item, i) => (
              <span key={item.id} className={`last-five-chip ${i === 0 ? 'current' : ''}`}>
                {renderDisplayText(deck, item, deck.callHeadline(item))}
              </span>
            ))}
          </div>

          <div className="caller-controls">
            <button className="btn btn-primary btn-lg" onClick={handleNext} disabled={remaining === 0 || isAnimating}>
              Next ▶ (Space)
            </button>
            <button className="btn btn-secondary" onClick={handleUndo} disabled={calledIds.length === 0 || isAnimating}>
              Undo ⟲ (Backspace)
            </button>
            <label className="auto-call-toggle">
              <input type="checkbox" checked={autoCallOn} onChange={(e) => setAutoCallOn(e.target.checked)} />
              Auto-call every
              <input
                type="number"
                min={3}
                max={60}
                className="text-input auto-call-seconds"
                value={autoCallSeconds}
                onChange={(e) => setAutoCallSeconds(Math.max(3, Number(e.target.value) || 8))}
              />
              sec
            </label>
            {showResetConfirm ? (
              <span className="reset-confirm">
                Start a brand-new game? This clears all calls.
                <button className="btn btn-danger" onClick={confirmReset}>
                  Yes, reset
                </button>
                <button className="btn btn-ghost" onClick={() => setShowResetConfirm(false)}>
                  Cancel
                </button>
              </span>
            ) : (
              <button className="btn btn-ghost" onClick={() => setShowResetConfirm(true)}>
                New Game
              </button>
            )}
          </div>
        </div>

        <aside className="caller-sidebar">
          <CalledList deck={deck} calledItems={calledItemsInOrder} />
          <CalledBoard deck={deck} items={drawOrder} calledIds={calledIdSet} onPeek={setPeekItem} />
          <WinnerCheck deck={deck} settings={settings} calledIds={calledIdSet} winPattern={winPattern} onWin={handleWin} />
        </aside>
      </div>
    </div>
  );
}
