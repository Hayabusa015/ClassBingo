import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type { GlitchSessionRow, GlitchPlayerRow, GlitchPlayerCredentials, GlitchNextQuestion } from './lib/glitch';
import {
  joinGlitchSession,
  nextGlitchQuestion,
  submitGlitchAnswer,
  fetchGlitchSession,
  fetchGlitchPlayers,
  subscribeToGlitchSession,
  saveGlitchPlayerSession,
  loadGlitchPlayerSession,
  clearGlitchPlayerSession,
  roundName,
  emblemShape,
  emblemColorIndex,
} from './lib/glitch';
import type { Theme } from './lib/gameConfig';
import { normalizeTheme, THEME_ORDER } from './lib/gameConfig';
import { loadState, saveState } from './lib/storage';
import ThemeToggle from './components/ThemeToggle';

interface AnswerFeedback {
  correct: boolean;
  correctIndex: number;
  itemName: string;
  pairLabel: string;
}

export default function GlitchPlayApp() {
  const [theme, setTheme] = useState<Theme>(() => normalizeTheme(loadState('ui:theme')));
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveState('ui:theme', theme);
  }, [theme]);
  const cycleTheme = () => setTheme((t) => THEME_ORDER[(THEME_ORDER.indexOf(t) + 1) % THEME_ORDER.length]);

  const [credentials, setCredentials] = useState<GlitchPlayerCredentials | null>(loadGlitchPlayerSession);
  const [lobbyTitle, setLobbyTitle] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  const [session, setSession] = useState<GlitchSessionRow | null>(null);
  const [players, setPlayers] = useState<GlitchPlayerRow[]>([]);
  const [question, setQuestion] = useState<GlitchNextQuestion | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [charges, setCharges] = useState(0);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!credentials) return;
    const { sessionId } = credentials;
    fetchGlitchSession(sessionId).then(setSession).catch(() => {});
    fetchGlitchPlayers(sessionId).then(setPlayers).catch(() => {});
    const unsubscribe = subscribeToGlitchSession(sessionId, {
      onSession: setSession,
      onPlayersChanged: () => fetchGlitchPlayers(sessionId).then(setPlayers).catch(() => {}),
    });
    return unsubscribe;
  }, [credentials]);

  // Connection indicator: school Wi-Fi drops a lot, so refresh state the
  // moment the browser reports it's back online rather than waiting on a
  // realtime event that may never arrive over a flaky connection.
  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      if (credentials) {
        fetchGlitchSession(credentials.sessionId).then(setSession).catch(() => {});
        fetchGlitchPlayers(credentials.sessionId).then(setPlayers).catch(() => {});
      }
    };
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [credentials]);

  // Keep the screen awake during an active game — Chromebooks otherwise
  // dim and lock mid-round.
  useEffect(() => {
    if (!credentials || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    let cancelled = false;
    const nav = navigator as Navigator & { wakeLock: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> } };
    const acquire = () => {
      nav.wakeLock
        .request('screen')
        .then((lock) => {
          if (cancelled) {
            lock.release().catch(() => {});
            return;
          }
          wakeLockRef.current = lock;
        })
        .catch(() => {});
    };
    acquire();
    const onVisible = () => {
      if (document.visibilityState === 'visible') acquire();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [credentials]);

  const me = useMemo(() => players.find((p) => p.id === credentials?.playerId), [players, credentials]);
  const isGhost = me?.status === 'ghost';

  const fetchNextQuestion = async () => {
    if (!credentials) return;
    setLoadingQuestion(true);
    try {
      const q = await nextGlitchQuestion(credentials.sessionId, credentials.playerId, credentials.playerSecret);
      setQuestion(q);
      setSelectedChoice(null);
    } catch {
      setQuestion(null);
    } finally {
      setLoadingQuestion(false);
    }
  };

  useEffect(() => {
    if (session?.phase === 'repair' && !question && !feedback && !loadingQuestion) {
      fetchNextQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.phase, session?.round]);

  useEffect(() => {
    if (!question) return;
    const tick = () => setRemaining(Math.max(0, Math.ceil((new Date(question.expiresAt).getTime() - Date.now()) / 1000)));
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [question]);

  useEffect(() => () => {
    if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current);
  }, []);

  const handleAnswer = async (choiceIndex: number) => {
    if (!credentials || !question || answering) return;
    setAnswering(true);
    setSelectedChoice(choiceIndex);
    try {
      const result = await submitGlitchAnswer(credentials.sessionId, credentials.playerId, credentials.playerSecret, question.questionId, choiceIndex);
      setCharges(result.charges);
      setFeedback({ correct: result.correct, correctIndex: result.correctIndex, itemName: result.itemName, pairLabel: result.pairLabel });
      setQuestion(null);
      feedbackTimerRef.current = window.setTimeout(() => {
        setFeedback(null);
        setAnswering(false);
      }, 1500);
    } catch {
      setAnswering(false);
      setSelectedChoice(null);
    }
  };

  useEffect(() => {
    if (!feedback && !question && !answering && session?.phase === 'repair') {
      fetchNextQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback]);

  useEffect(() => {
    if (session?.phase !== 'repair') return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const idx = ['1', '2', '3', '4'].indexOf(e.key);
      if (idx >= 0 && question && idx < question.choices.length) {
        e.preventDefault();
        handleAnswer(idx);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.phase, question, answering]);

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    setJoinError('');
    setJoining(true);
    try {
      const result = await joinGlitchSession(code, name);
      const cred: GlitchPlayerCredentials = {
        sessionId: result.sessionId,
        playerId: result.playerId,
        playerSecret: result.playerSecret,
        name: result.name,
        code: result.code,
      };
      saveGlitchPlayerSession(cred);
      setCredentials(cred);
      setLobbyTitle(result.title);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Could not join that game.');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = () => {
    clearGlitchPlayerSession();
    setCredentials(null);
    setSession(null);
    setPlayers([]);
    setQuestion(null);
    setFeedback(null);
    setCode('');
    setName('');
  };

  if (!credentials) {
    return (
      <div className="page page-setup page-glitch-join">
        <header className="setup-header">
          <h1>Join GLITCH</h1>
          <ThemeToggle theme={theme} onCycle={cycleTheme} />
        </header>
        <form className="setup-card glitch-join-form" onSubmit={handleJoin}>
          <label className="option-row">
            <span className="option-label">Game code</span>
            <input
              className="text-input jeopardy-code-input"
              value={code}
              maxLength={6}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              autoFocus
            />
          </label>
          <label className="option-row">
            <span className="option-label">Your name</span>
            <input
              className="text-input"
              value={name}
              maxLength={30}
              onChange={(e) => setName(e.target.value)}
              placeholder="First name"
            />
          </label>
          {joinError && (
            <p className="inline-error" role="alert">
              {joinError}
            </p>
          )}
          <button className="btn btn-primary btn-lg" type="submit" disabled={joining || !code.trim() || !name.trim()}>
            {joining ? 'Joining…' : 'Join Game ▶'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="page page-glitch-play">
      <header className="setup-header">
        <button className="btn btn-ghost" onClick={handleLeave}>
          Leave
        </button>
        <h1>{lobbyTitle || session?.title || 'GLITCH'}</h1>
        <ThemeToggle theme={theme} onCycle={cycleTheme} />
      </header>

      <div className="glitch-player-status">
        <span className={`glitch-connection-dot ${online ? 'online' : 'offline'}`} aria-hidden="true" />
        <span>{online ? 'Live' : 'Reconnecting…'}</span>
        <span className="glitch-charges">⚡ {charges}</span>
      </div>

      {isGhost && session?.phase !== 'ended' && (
        <p className="glitch-ghost-banner">You're a ghost — keep repairing! Your correct answers still help.</p>
      )}

      {(!session || session.phase === 'lobby') && (
        <section className="setup-card">
          <h2>You're in!</h2>
          <p className="hint">Waiting for the teacher to start the game.</p>
          <h3>Players joined</h3>
          <ul className="glitch-roster">
            {players.map((p) => (
              <li key={p.id} className="glitch-roster-row">
                <span className={`glitch-emblem glitch-emblem-color-${emblemColorIndex(p.emblem)}`}>{emblemShape(p.emblem)}</span>
                <span>{p.name}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {session?.phase === 'repair' && (
        <section className="setup-card glitch-question-stage">
          <p className="hint">{roundName(session.round)}</p>
          {feedback ? (
            <div className={`glitch-feedback ${feedback.correct ? 'correct' : 'incorrect'}`}>
              <p className="glitch-feedback-mark">{feedback.correct ? '✔' : '✘'}</p>
              <p className="glitch-feedback-pair">
                <strong>{feedback.itemName}</strong> — {feedback.pairLabel}
              </p>
            </div>
          ) : question ? (
            <>
              <div className="glitch-question-timer">
                <div
                  className={`glitch-question-timer-fill ${remaining <= 5 ? 'danger' : ''}`}
                  style={{ width: `${Math.min(100, (remaining / 30) * 100)}%` }}
                />
              </div>
              <p className="glitch-question-prompt">{question.prompt}</p>
              <div className="glitch-choice-grid">
                {question.choices.map((choice, idx) => (
                  <button
                    key={choice}
                    className={`btn btn-secondary glitch-choice-btn ${selectedChoice === idx ? 'is-selected' : ''}`}
                    disabled={answering}
                    onClick={() => handleAnswer(idx)}
                  >
                    <span className="glitch-choice-num">{idx + 1}</span>
                    {choice}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="hint">Loading the next question…</p>
          )}
        </section>
      )}

      {session?.phase === 'intermission' && (
        <section className="setup-card glitch-wait-card">
          <p className="glitch-waiting-big">Round complete!</p>
          {session.last_result && <p className="hint">+{session.last_result.meterGained} to the meter.</p>}
          <p className="hint">Waiting for the teacher to start the next round…</p>
        </section>
      )}

      {session?.phase === 'ended' && (
        <section className="setup-card">
          <h2>{session.winner === 'players' ? '🎉 System Repaired!' : 'Game Over'}</h2>
          <p className="hint">
            Final meter: {session.meter} / {session.meter_goal}
          </p>
          <p className="hint">You earned {charges} charges this game.</p>
          <button className="btn btn-primary btn-lg" onClick={handleLeave}>
            Done
          </button>
        </section>
      )}
    </div>
  );
}
