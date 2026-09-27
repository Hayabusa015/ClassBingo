import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { JeopardySessionRow, JeopardyPlayerRow, JeopardyFinalAnswerRow, PlayerCredentials } from './lib/jeopardy';
import {
  joinSession,
  buzz,
  submitDailyDoubleWager,
  submitFinal,
  fetchSession,
  fetchPlayers,
  subscribeToSession,
  savePlayerSession,
  loadPlayerSession,
  clearPlayerSession,
} from './lib/jeopardy';
import { supabase } from './lib/supabase';
import type { Theme } from './lib/gameConfig';
import { THEME_ORDER } from './lib/gameConfig';
import { loadState, saveState } from './lib/storage';
import ThemeToggle from './components/ThemeToggle';

export default function JeopardyPlayApp() {
  const [theme, setTheme] = useState<Theme>(() => loadState<Theme>('ui:theme') ?? 'arcade');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveState('ui:theme', theme);
  }, [theme]);
  const cycleTheme = () => setTheme((t) => THEME_ORDER[(THEME_ORDER.indexOf(t) + 1) % THEME_ORDER.length]);

  const [credentials, setCredentials] = useState<PlayerCredentials | null>(loadPlayerSession);
  const [lobbyTitle, setLobbyTitle] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  const [session, setSession] = useState<JeopardySessionRow | null>(null);
  const [players, setPlayers] = useState<JeopardyPlayerRow[]>([]);
  const [finalAnswers, setFinalAnswers] = useState<JeopardyFinalAnswerRow[]>([]);
  const [wager, setWager] = useState('');
  const [finalAnswerText, setFinalAnswerText] = useState('');
  const [submittedFinal, setSubmittedFinal] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [buzzedThisRound, setBuzzedThisRound] = useState(false);

  useEffect(() => {
    if (!credentials) return;
    const { sessionId } = credentials;
    fetchSession(sessionId).then(setSession).catch(() => {});
    fetchPlayers(sessionId).then(setPlayers).catch(() => {});
    const unsubscribe = subscribeToSession(sessionId, {
      onSession: setSession,
      onPlayersChanged: () => fetchPlayers(sessionId).then(setPlayers).catch(() => {}),
      onFinalAnswersChanged: () => {
        supabase
          .from('jeopardy_final_answers')
          .select('*')
          .eq('session_id', sessionId)
          .then(({ data }) => {
            if (data) setFinalAnswers(data as JeopardyFinalAnswerRow[]);
          });
      },
    });
    return unsubscribe;
  }, [credentials]);

  // Reset the per-round buzz lock whenever the clue or round changes.
  useEffect(() => {
    setBuzzedThisRound(false);
  }, [session?.current_round, session?.current_cat_idx, session?.current_clue_idx]);

  const handleBuzz = () => {
    if (!credentials || buzzedThisRound) return;
    setBuzzedThisRound(true);
    buzz(credentials.sessionId, credentials.playerId, credentials.playerSecret).catch(() => {
      setBuzzedThisRound(false);
    });
  };

  // Spacebar buzzes in, matching a real buzzer — only while the buzzer is
  // actually open, and never while the student is typing into a field.
  useEffect(() => {
    if (!credentials || session?.status !== 'buzzer_open') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      e.preventDefault();
      handleBuzz();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credentials, session?.status, buzzedThisRound]);

  const me = useMemo(() => players.find((p) => p.id === credentials?.playerId), [players, credentials]);
  const isDisqualified = session?.disqualified_player_ids.includes(credentials?.playerId ?? '') ?? false;
  const isActive = session?.active_player_id === credentials?.playerId;

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    setJoinError('');
    setJoining(true);
    try {
      const result = await joinSession(code, name);
      const cred: PlayerCredentials = {
        sessionId: result.sessionId,
        playerId: result.playerId,
        playerSecret: result.playerSecret,
        name: result.name,
        code: result.code,
      };
      savePlayerSession(cred);
      setCredentials(cred);
      setLobbyTitle(result.title);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Could not join that game.');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = () => {
    clearPlayerSession();
    setCredentials(null);
    setSession(null);
    setPlayers([]);
    setSubmittedFinal(false);
    setCode('');
    setName('');
  };

  const submitWager = async (e: FormEvent) => {
    e.preventDefault();
    if (!credentials) return;
    setSubmitError('');
    try {
      await submitDailyDoubleWager(credentials.sessionId, credentials.playerId, credentials.playerSecret, Number(wager));
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not submit that wager.');
    }
  };

  const submitFinalAnswer = async (e: FormEvent) => {
    e.preventDefault();
    if (!credentials) return;
    setSubmitError('');
    try {
      await submitFinal(credentials.sessionId, credentials.playerId, credentials.playerSecret, Number(wager), finalAnswerText);
      setSubmittedFinal(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not submit your final answer.');
    }
  };

  if (!credentials) {
    return (
      <div className="page page-setup page-jeopardy-join">
        <header className="setup-header">
          <h1>Join a Jeopardy Game</h1>
          <ThemeToggle theme={theme} onCycle={cycleTheme} />
        </header>
        <form className="setup-card jeopardy-join-form" onSubmit={handleJoin}>
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
    <div className="page page-jeopardy-play">
      <header className="setup-header">
        <button className="btn btn-ghost" onClick={handleLeave}>
          Leave
        </button>
        <h1>{lobbyTitle || session?.title || 'Jeopardy'}</h1>
        <ThemeToggle theme={theme} onCycle={cycleTheme} />
      </header>

      <p className="jeopardy-you-are">
        Playing as <strong>{credentials.name}</strong> · Score: <strong>{me?.score ?? 0}</strong>
      </p>

      {(!session || session.status === 'lobby') && (
        <section className="setup-card">
          <h2>You're in!</h2>
          <p className="hint">Waiting for the teacher to start the game.</p>
          <h3>Players joined</h3>
          <ul className="jeopardy-roster">
            {players.map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        </section>
      )}

      {session && (session.status === 'board' || session.status === 'clue_reveal') && (
        <section className="setup-card jeopardy-wait-card">
          <p className="jeopardy-waiting-big">Get ready…</p>
        </section>
      )}

      {session?.status === 'buzzer_open' && (
        <section className="jeopardy-buzz-stage">
          <button className="jeopardy-buzz-button" disabled={buzzedThisRound || isDisqualified} onClick={handleBuzz}>
            {isDisqualified ? 'Already tried' : buzzedThisRound ? 'Buzzed!' : 'BUZZ'}
          </button>
          <p className="hint">Tap the button or press Space</p>
        </section>
      )}

      {session?.status === 'holding' && (
        <section className="setup-card jeopardy-wait-card">
          <p className="jeopardy-waiting-big">
            {isActive
              ? 'You buzzed in! Answer out loud.'
              : `${players.find((p) => p.id === session.active_player_id)?.name ?? 'Someone'} is answering…`}
          </p>
        </section>
      )}

      {session?.status === 'daily_double_wager' &&
        (isActive ? (
          <section className="setup-card">
            <h2>Daily Double! Your wager:</h2>
            <form onSubmit={submitWager} className="jeopardy-wager-form">
              <input className="text-input" type="number" min={0} value={wager} onChange={(e) => setWager(e.target.value)} />
              <button className="btn btn-primary btn-lg" type="submit">
                Lock In Wager
              </button>
            </form>
            {submitError && (
              <p className="inline-error" role="alert">
                {submitError}
              </p>
            )}
          </section>
        ) : (
          <section className="setup-card jeopardy-wait-card">
            <p className="jeopardy-waiting-big">Daily Double! Waiting on the wager…</p>
          </section>
        ))}

      {session?.status === 'daily_double_clue' && (
        <section className="setup-card jeopardy-wait-card">
          <p className="jeopardy-waiting-big">{isActive ? 'Answer out loud.' : 'Waiting for the answer…'}</p>
        </section>
      )}

      {session?.status === 'final_wager' &&
        (submittedFinal ? (
          <section className="setup-card jeopardy-wait-card">
            <p className="jeopardy-waiting-big">Locked in! Waiting for everyone else…</p>
          </section>
        ) : (
          <section className="setup-card">
            <h2>Final Jeopardy — {session.final_category}</h2>
            <form onSubmit={submitFinalAnswer} className="jeopardy-final-form">
              <label className="option-row">
                <span className="option-label">Your wager</span>
                <input
                  className="text-input"
                  type="number"
                  min={0}
                  max={Math.max(me?.score ?? 0, 0)}
                  value={wager}
                  onChange={(e) => setWager(e.target.value)}
                />
              </label>
              <label className="option-row">
                <span className="option-label">Your answer</span>
                <input
                  className="text-input"
                  value={finalAnswerText}
                  maxLength={200}
                  onChange={(e) => setFinalAnswerText(e.target.value)}
                  placeholder="What is...?"
                />
              </label>
              {submitError && (
                <p className="inline-error" role="alert">
                  {submitError}
                </p>
              )}
              <button className="btn btn-primary btn-lg" type="submit">
                Lock In Answer
              </button>
            </form>
          </section>
        ))}

      {session?.status === 'final_reveal' && (
        <section className="setup-card">
          <h2>Final Jeopardy Results</h2>
          <ul className="jeopardy-final-results">
            {players.map((p) => {
              const fa = finalAnswers.find((f) => f.player_id === p.id);
              return (
                <li key={p.id}>
                  {p.name}:{' '}
                  {fa?.revealed
                    ? `wagered $${fa.revealed_wager}, "${fa.revealed_answer}" — ${fa.correct ? 'Correct' : 'Incorrect'}`
                    : 'not revealed yet'}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {session?.status === 'ended' && (
        <section className="setup-card">
          <h2>Game Over!</h2>
          <ol className="jeopardy-final-scoreboard">
            {[...players]
              .sort((a, b) => b.score - a.score)
              .map((p) => (
                <li key={p.id}>
                  {p.name} — {p.score}
                </li>
              ))}
          </ol>
          <button className="btn btn-primary btn-lg" onClick={handleLeave}>
            Done
          </button>
        </section>
      )}
    </div>
  );
}
