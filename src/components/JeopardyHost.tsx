import { useEffect, useMemo, useState } from 'react';
import type { HostCredentials, JeopardyPlayerRow, JeopardySessionRow, JeopardyBuzzRow, HostFinalAnswer } from '../lib/jeopardy';
import {
  startBoard,
  selectClue,
  returnToBoard,
  assignDailyDouble,
  openBuzzer,
  markAnswer,
  skipClue,
  startFinal,
  revealFinal,
  hostFinalAnswers,
  gradeFinal,
  endSession,
  fetchSession,
  fetchPlayers,
  fetchBuzzesForClue,
  subscribeToSession,
  clueKey,
} from '../lib/jeopardy';
import type { Theme } from '../lib/gameConfig';
import ThemeToggle from './ThemeToggle';

interface Props {
  credentials: HostCredentials;
  onExit: () => void;
  theme: Theme;
  onCycleTheme: () => void;
}

export default function JeopardyHost({ credentials, onExit, theme, onCycleTheme }: Props) {
  const { sessionId, hostSecret, code, board } = credentials;
  const [session, setSession] = useState<JeopardySessionRow | null>(null);
  const [players, setPlayers] = useState<JeopardyPlayerRow[]>([]);
  const [buzzes, setBuzzes] = useState<JeopardyBuzzRow[]>([]);
  const [finalAnswers, setFinalAnswers] = useState<HostFinalAnswer[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSession(sessionId).then(setSession).catch(() => {});
    fetchPlayers(sessionId).then(setPlayers).catch(() => {});
    const unsubscribe = subscribeToSession(sessionId, {
      onSession: setSession,
      onPlayersChanged: () => fetchPlayers(sessionId).then(setPlayers).catch(() => {}),
      onBuzz: (row) => setBuzzes((prev) => [...prev, row]),
    });
    return unsubscribe;
  }, [sessionId]);

  // Clear the buzz list whenever the host moves to a new clue/round.
  useEffect(() => {
    if (!session || session.current_cat_idx === null || session.current_clue_idx === null) {
      setBuzzes([]);
      return;
    }
    fetchBuzzesForClue(sessionId, session.current_cat_idx, session.current_clue_idx, session.current_round)
      .then(setBuzzes)
      .catch(() => {});
  }, [sessionId, session?.current_cat_idx, session?.current_clue_idx, session?.current_round]);

  // Final Jeopardy content is hidden pre-reveal, so realtime on the public
  // table alone can't tell the host who has submitted — poll instead.
  useEffect(() => {
    if (!session || (session.status !== 'final_wager' && session.status !== 'final_reveal')) return;
    const load = () => hostFinalAnswers(sessionId, hostSecret).then(setFinalAnswers).catch(() => {});
    load();
    const id = window.setInterval(load, 2000);
    return () => window.clearInterval(id);
  }, [session?.status, sessionId, hostSecret]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const playerById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const totalClues = useMemo(() => board.categories.reduce((sum, c) => sum + c.clues.length, 0), [board]);
  const allAnswered = (session?.answered_keys.length ?? 0) >= totalClues;

  if (!session) {
    return (
      <div className="page page-jeopardy-host">
        <p className="hint">Loading game…</p>
      </div>
    );
  }

  const activePlayer = session.active_player_id ? playerById.get(session.active_player_id) : undefined;
  const currentClue =
    session.current_cat_idx !== null && session.current_clue_idx !== null
      ? board.categories[session.current_cat_idx]?.clues[session.current_clue_idx]
      : null;
  const currentCategoryTitle = session.current_cat_idx !== null ? board.categories[session.current_cat_idx]?.title : '';

  return (
    <div className="page page-jeopardy-host">
      <header className="setup-header">
        <button className="btn btn-ghost" onClick={onExit}>
          ← End &amp; Exit
        </button>
        <h1>{board.title}</h1>
        <ThemeToggle theme={theme} onCycle={onCycleTheme} />
      </header>

      <div className="jeopardy-host-topbar">
        <span className="jeopardy-code-chip">
          Join code <strong>{code}</strong>
        </span>
        <div className="jeopardy-scoreboard">
          {players.map((p) => (
            <span key={p.id} className={`jeopardy-score-pill ${p.id === session.active_player_id ? 'is-active' : ''}`}>
              {p.name} <strong>{p.score}</strong>
            </span>
          ))}
          {players.length === 0 && <span className="hint">Waiting for players…</span>}
        </div>
      </div>

      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}

      {session.status === 'lobby' && (
        <section className="setup-card jeopardy-lobby">
          <h2>Waiting to start</h2>
          <p className="hint">Have students join with the code above, then start whenever you're ready.</p>
          <button
            className="btn btn-primary btn-lg"
            disabled={busy || players.length === 0}
            onClick={() => run(() => startBoard(sessionId, hostSecret))}
          >
            Start Game ▶
          </button>
          {players.length === 0 && <p className="hint">Waiting for at least one player…</p>}
        </section>
      )}

      {session.status === 'board' && (
        <>
          <section className="jeopardy-board">
            {board.categories.map((cat, catIdx) => (
              <div className="jeopardy-board-col" key={catIdx}>
                <div className="jeopardy-board-cat">{cat.title}</div>
                {cat.clues.map((clue, clueIdx) => {
                  const done = session.answered_keys.includes(clueKey(catIdx, clueIdx));
                  return (
                    <button
                      key={clueIdx}
                      className="jeopardy-board-cell"
                      disabled={done || busy}
                      onClick={() => run(() => selectClue(sessionId, hostSecret, catIdx, clueIdx))}
                    >
                      {done ? '' : `$${clue.value}`}
                    </button>
                  );
                })}
              </div>
            ))}
          </section>
          <div className="setup-actions">
            <button
              className={allAnswered ? 'btn btn-primary btn-lg' : 'btn btn-ghost'}
              disabled={busy}
              onClick={() => run(() => startFinal(sessionId, hostSecret))}
            >
              {allAnswered ? 'Final Jeopardy ▶' : 'Skip to Final Jeopardy'}
            </button>
          </div>
        </>
      )}

      {(session.status === 'clue_reveal' || session.status === 'buzzer_open' || session.status === 'holding') &&
        currentClue && (
          <section className="setup-card jeopardy-clue-stage">
            <p className="jeopardy-clue-category">
              {currentCategoryTitle} — ${currentClue.value}
            </p>
            <p className="jeopardy-clue-text">{currentClue.clue}</p>
            <p className="jeopardy-clue-answer">Answer: {currentClue.answer}</p>

            {session.status === 'clue_reveal' && (
              <div className="setup-actions">
                <button className="btn btn-primary btn-lg" disabled={busy} onClick={() => run(() => openBuzzer(sessionId, hostSecret))}>
                  Open Buzzers 🔔
                </button>
                <button className="btn btn-ghost" disabled={busy} onClick={() => run(() => skipClue(sessionId, hostSecret))}>
                  No one gets it — skip
                </button>
                <button className="btn btn-ghost" disabled={busy} onClick={() => run(() => returnToBoard(sessionId, hostSecret))}>
                  Back to board
                </button>
              </div>
            )}

            {session.status === 'buzzer_open' && <p className="jeopardy-waiting">Waiting for a buzz… ({buzzes.length} so far)</p>}

            {session.status === 'holding' && activePlayer && (
              <div className="jeopardy-holding">
                <p className="jeopardy-active-player">{activePlayer.name} buzzed in!</p>
                <div className="setup-actions">
                  <button className="btn btn-primary btn-lg" disabled={busy} onClick={() => run(() => markAnswer(sessionId, hostSecret, true))}>
                    Correct ✓
                  </button>
                  <button
                    className="btn btn-secondary btn-lg"
                    disabled={busy}
                    onClick={() => run(() => markAnswer(sessionId, hostSecret, false))}
                  >
                    Incorrect ✗
                  </button>
                </div>
              </div>
            )}

            {buzzes.length > 0 && (
              <ol className="jeopardy-buzz-order">
                {buzzes.map((b) => (
                  <li key={b.id}>{playerById.get(b.player_id)?.name ?? '…'}</li>
                ))}
              </ol>
            )}
          </section>
        )}

      {(session.status === 'daily_double_wager' || session.status === 'daily_double_clue') && currentClue && (
        <section className="setup-card jeopardy-clue-stage jeopardy-daily-double">
          <p className="jeopardy-clue-category">Daily Double! {currentCategoryTitle}</p>

          {session.status === 'daily_double_wager' && !session.active_player_id && (
            <div>
              <p className="hint">Who found the Daily Double?</p>
              <div className="jeopardy-player-pick">
                {players.map((p) => (
                  <button
                    key={p.id}
                    className="btn btn-secondary"
                    disabled={busy}
                    onClick={() => run(() => assignDailyDouble(sessionId, hostSecret, p.id))}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {session.status === 'daily_double_wager' && session.active_player_id && (
            <p className="jeopardy-waiting">Waiting for {activePlayer?.name} to lock in a wager on their device…</p>
          )}

          {session.status === 'daily_double_clue' && (
            <>
              <p className="jeopardy-clue-text">{currentClue.clue}</p>
              <p className="jeopardy-clue-answer">Answer: {currentClue.answer}</p>
              <p className="hint">
                {activePlayer?.name} wagered ${session.current_wager}.
              </p>
              <div className="setup-actions">
                <button className="btn btn-primary btn-lg" disabled={busy} onClick={() => run(() => markAnswer(sessionId, hostSecret, true))}>
                  Correct ✓
                </button>
                <button
                  className="btn btn-secondary btn-lg"
                  disabled={busy}
                  onClick={() => run(() => markAnswer(sessionId, hostSecret, false))}
                >
                  Incorrect ✗
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {session.status === 'final_wager' && (
        <section className="setup-card">
          <h2>Final Jeopardy — {board.final.category}</h2>
          <p className="hint">{board.final.clue}</p>
          <p className="hint">Answer: {board.final.answer}</p>
          <ul className="jeopardy-submission-list">
            {players.map((p) => {
              const submitted = finalAnswers.some((f) => f.player_id === p.id);
              return (
                <li key={p.id}>
                  {p.name} — {submitted ? 'Submitted ✓' : 'Waiting…'}
                </li>
              );
            })}
          </ul>
          <div className="setup-actions">
            <button className="btn btn-primary btn-lg" disabled={busy} onClick={() => run(() => revealFinal(sessionId, hostSecret))}>
              Reveal Answers ▶
            </button>
          </div>
        </section>
      )}

      {session.status === 'final_reveal' && (
        <section className="setup-card">
          <h2>Final Jeopardy Reveal</h2>
          {finalAnswers.length === 0 && <p className="hint">No one submitted a final answer.</p>}
          {finalAnswers.map((f) => (
            <div className="jeopardy-final-row" key={f.player_id}>
              <strong>{f.player_name}</strong>
              <span>Wagered ${f.wager}</span>
              <span>&ldquo;{f.answer}&rdquo;</span>
              {f.revealed ? (
                <span className={f.correct ? 'jeopardy-graded-correct' : 'jeopardy-graded-incorrect'}>
                  {f.correct ? 'Correct' : 'Incorrect'}
                </span>
              ) : (
                <span className="jeopardy-final-grade-actions">
                  <button className="btn btn-primary" disabled={busy} onClick={() => run(() => gradeFinal(sessionId, hostSecret, f.player_id, true))}>
                    Correct ✓
                  </button>
                  <button
                    className="btn btn-secondary"
                    disabled={busy}
                    onClick={() => run(() => gradeFinal(sessionId, hostSecret, f.player_id, false))}
                  >
                    Incorrect ✗
                  </button>
                </span>
              )}
            </div>
          ))}
          <div className="setup-actions">
            <button className="btn btn-primary btn-lg" disabled={busy} onClick={() => run(() => endSession(sessionId, hostSecret))}>
              End Game
            </button>
          </div>
        </section>
      )}

      {session.status === 'ended' && (
        <section className="setup-card">
          <h2>Final Scores</h2>
          <ol className="jeopardy-final-scoreboard">
            {[...players]
              .sort((a, b) => b.score - a.score)
              .map((p) => (
                <li key={p.id}>
                  {p.name} — {p.score}
                </li>
              ))}
          </ol>
          <div className="setup-actions">
            <button className="btn btn-primary btn-lg" onClick={onExit}>
              Back to Jeopardy Home
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
