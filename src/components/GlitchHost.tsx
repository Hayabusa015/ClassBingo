import { useCallback, useEffect, useRef, useState } from 'react';
import type { GlitchHostCredentials, GlitchPlayerRow, GlitchSessionRow } from '../lib/glitch';
import {
  GLITCH_LEVELS,
  startGlitchGame,
  advanceGlitch,
  addGlitchTime,
  pauseGlitch,
  setGlitchLocked,
  kickGlitchPlayer,
  endGlitchSession,
  fetchGlitchSession,
  fetchGlitchPlayers,
  subscribeToGlitchSession,
  glitchServerNow,
  roundName,
  emblemShape,
  emblemColorIndex,
} from '../lib/glitch';
import type { Theme } from '../lib/gameConfig';
import ThemeToggle from './ThemeToggle';

interface Props {
  credentials: GlitchHostCredentials;
  onExit: () => void;
  theme: Theme;
  onCycleTheme: () => void;
}

function setFullscreen(enter: boolean): void {
  try {
    if (enter && !document.fullscreenElement) {
      document.documentElement.requestFullscreen()?.catch(() => {});
    } else if (!enter && document.fullscreenElement) {
      document.exitFullscreen()?.catch(() => {});
    }
  } catch {
    // fullscreen not supported — ignore
  }
}

export default function GlitchHost({ credentials, onExit, theme, onCycleTheme }: Props) {
  const { sessionId, hostSecret, level } = credentials;
  const [session, setSession] = useState<GlitchSessionRow | null>(null);
  const [players, setPlayers] = useState<GlitchPlayerRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [clockOffsetMs, setClockOffsetMs] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef<string | null>(null);

  useEffect(() => {
    fetchGlitchSession(sessionId).then(setSession).catch(() => {});
    fetchGlitchPlayers(sessionId).then(setPlayers).catch(() => {});
    glitchServerNow()
      .then((serverNow) => setClockOffsetMs(serverNow.getTime() - Date.now()))
      .catch(() => {});
    const unsubscribe = subscribeToGlitchSession(sessionId, {
      onSession: setSession,
      onPlayersChanged: () => fetchGlitchPlayers(sessionId).then(setPlayers).catch(() => {}),
    });
    return unsubscribe;
  }, [sessionId]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const run = useCallback(async (action: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }, []);

  const handleAdvance = useCallback(() => {
    if (!session) return;
    return run(() => advanceGlitch(sessionId, hostSecret, session.phase, session.round));
  }, [session, sessionId, hostSecret, run]);

  // Auto-advance once a timed phase's clock runs out — idempotent server-side,
  // but firedRef stops us from spamming the same phase/round every tick.
  useEffect(() => {
    if (!session || !session.phase_ends_at || session.paused_remaining_ms !== null) return;
    const key = `${session.phase}:${session.round}`;
    const endsAt = new Date(session.phase_ends_at).getTime();
    if (now + clockOffsetMs >= endsAt && firedRef.current !== key) {
      firedRef.current = key;
      advanceGlitch(sessionId, hostSecret, session.phase, session.round).catch(() => {});
    }
  }, [now, clockOffsetMs, session, sessionId, hostSecret]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleAdvance();
      } else if (e.key === 'p' || e.key === 'P') {
        if (session) run(() => pauseGlitch(sessionId, hostSecret, session.paused_remaining_ms === null));
      } else if (e.key === '=' || e.key === '+') {
        run(() => addGlitchTime(sessionId, hostSecret, 30));
      } else if (e.key.toLowerCase() === 'f') {
        setFullscreen(!document.fullscreenElement);
      } else if (e.key.toLowerCase() === 'm') {
        setSoundOn((s) => !s);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleAdvance, run, session, sessionId, hostSecret]);

  if (!session) {
    return (
      <div className="page page-glitch-host">
        <p className="hint">Loading game…</p>
      </div>
    );
  }

  const settings = GLITCH_LEVELS[level];
  const joinUrl = `${window.location.origin}/?glitch`;
  const isPaused = session.paused_remaining_ms !== null;
  const remainingMs = session.phase_ends_at
    ? Math.max(0, new Date(session.phase_ends_at).getTime() - (now + clockOffsetMs))
    : session.paused_remaining_ms ?? 0;
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const isFinalRound = session.round >= session.total_rounds;
  const meterPct = Math.min(100, Math.round((session.meter / Math.max(1, session.meter_goal)) * 100));
  const activePlayers = players.filter((p) => p.status === 'active');

  return (
    <div className="page page-glitch-host">
      <header className="setup-header">
        <button className="btn btn-ghost" onClick={onExit}>
          ← Exit
        </button>
        <h1>{session.title}</h1>
        <ThemeToggle theme={theme} onCycle={onCycleTheme} />
      </header>

      <div className="glitch-host-topbar">
        <span className="glitch-code-chip">
          Join at <strong>{joinUrl}</strong> — code <strong>{session.code}</strong>
        </span>
        <span className={`glitch-level-badge glitch-level-badge-${level}`}>{settings.name}</span>
        {session.phase !== 'lobby' && session.phase !== 'ended' && (
          <span className="hint">
            {roundName(session.round)} · Round {session.round} / {session.total_rounds}
            {isFinalRound && <span className="glitch-final-round-badge"> FINAL ROUND</span>}
          </span>
        )}
        <button
          className="btn btn-ghost icon-btn"
          title={soundOn ? 'Sound on (M)' : 'Sound off (M)'}
          onClick={() => setSoundOn((s) => !s)}
        >
          {soundOn ? '🔊' : '🔇'}
        </button>
        <button
          className="btn btn-ghost"
          disabled={busy}
          onClick={() => run(() => endGlitchSession(sessionId, hostSecret).then(onExit))}
        >
          End Game
        </button>
      </div>

      <p className="hint glitch-shortcut-legend">Space next · P pause · + time · F fullscreen · M mute</p>

      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}

      {session.phase === 'lobby' && (
        <section className="setup-card glitch-lobby">
          <h2>Waiting to start</h2>
          <p className="hint">Have students join at the link above, then start whenever you're ready.</p>
          <div className="glitch-lobby-actions">
            <button
              className={`btn ${session.locked ? 'btn-primary' : 'btn-secondary'}`}
              disabled={busy}
              aria-pressed={session.locked}
              onClick={() => run(() => setGlitchLocked(sessionId, hostSecret, !session.locked))}
            >
              {session.locked ? 'Room locked 🔒' : 'Lock room'}
            </button>
            <button
              className="btn btn-primary btn-lg"
              disabled={busy || players.length === 0}
              onClick={() => run(() => startGlitchGame(sessionId, hostSecret))}
            >
              Start Game ▶
            </button>
          </div>
          <ul className="glitch-roster">
            {players.map((p) => (
              <li key={p.id} className="glitch-roster-row">
                <span className={`glitch-emblem glitch-emblem-color-${emblemColorIndex(p.emblem)}`}>
                  {emblemShape(p.emblem)}
                </span>
                <span>{p.name}</span>
                <button
                  className="btn btn-ghost glitch-kick-btn"
                  aria-label={`Remove ${p.name}`}
                  onClick={() => run(() => kickGlitchPlayer(sessionId, hostSecret, p.id))}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          {players.length === 0 && <p className="hint">Waiting for players…</p>}
        </section>
      )}

      {(session.phase === 'repair' || session.phase === 'intermission') && (
        <section className="setup-card glitch-meter-stage">
          <div className="glitch-meter" role="progressbar" aria-valuenow={meterPct} aria-valuemin={0} aria-valuemax={100}>
            <div className="glitch-meter-fill" style={{ width: `${meterPct}%` }} />
            <span className="glitch-meter-tick" style={{ left: '25%' }} />
            <span className="glitch-meter-tick" style={{ left: '50%' }} />
            <span className="glitch-meter-tick" style={{ left: '75%' }} />
          </div>
          <p className="glitch-meter-label">
            {session.meter} / {session.meter_goal}
            {isFinalRound && session.meter < session.meter_goal && (
              <span className="glitch-needs-more"> · needs {session.meter_goal - session.meter} more</span>
            )}
          </p>

          {session.phase === 'repair' && (
            <>
              <p className={`glitch-timer ${remainingSeconds <= 5 ? 'glitch-timer-danger' : ''}`}>
                {isPaused ? 'Paused' : `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, '0')}`}
              </p>
              <p className="hint">{activePlayers.length} students repairing</p>
              <div className="setup-actions">
                <button className="btn btn-secondary" disabled={busy} onClick={() => run(() => pauseGlitch(sessionId, hostSecret, !isPaused))}>
                  {isPaused ? 'Resume ▶' : 'Pause ⏸'}
                </button>
                <button className="btn btn-secondary" disabled={busy || isPaused} onClick={() => run(() => addGlitchTime(sessionId, hostSecret, 30))}>
                  +30s
                </button>
                <button className="btn btn-ghost" disabled={busy} onClick={handleAdvance}>
                  Skip to results
                </button>
              </div>
            </>
          )}

          {session.phase === 'intermission' && (
            <>
              {session.last_result && (
                <p className="hint">
                  {roundName(session.last_result.round)} complete — +{session.last_result.meterGained} to the meter.
                </p>
              )}
              <div className="setup-actions">
                <button className="btn btn-primary btn-lg" disabled={busy} onClick={handleAdvance}>
                  Next Round ▶
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {session.phase === 'ended' && (
        <section className="setup-card glitch-ended">
          <h2>{session.winner === 'players' ? '🎉 System Repaired!' : 'Time ran out'}</h2>
          <p className="hint">
            {session.winner === 'players'
              ? `Your class reached the goal — ${session.meter} / ${session.meter_goal}.`
              : `The system wasn't fully repaired in time — ${session.meter} / ${session.meter_goal}.`}
          </p>
          <div className="setup-actions">
            <button className="btn btn-primary btn-lg" onClick={onExit}>
              Back to GLITCH Library
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
