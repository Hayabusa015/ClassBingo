import type { GameMode } from '../lib/gameConfig';
import { GAME_MODE_LABEL, GAME_MODE_TAGLINE, GAME_MODES } from '../lib/gameConfig';
import { BingoIcon, ChevronRightIcon, JeopardyIcon, MemoryIcon } from './NavIcons';
import ShullLogo from './ShullLogo';

const MODE_ICON = { bingo: BingoIcon, memory: MemoryIcon, jeopardy: JeopardyIcon };

const STEPS = [
  {
    title: 'Pick a playset',
    body: 'Choose from 22+ ready-made subjects or build your own in a couple of minutes.',
  },
  {
    title: 'Launch it live',
    body: 'Project Bingo calls, a Memory board, or a full Jeopardy board on the classroom screen.',
  },
  {
    title: 'Class plays together',
    body: 'Students mark boards, race the clock, or buzz in from their own Chromebook.',
  },
];

const STATS = [
  { value: '3', label: 'Game modes' },
  { value: '22+', label: 'Ready-made playsets' },
  { value: '8', label: 'Subjects covered' },
  { value: '0', label: 'Logins required' },
];

interface Props {
  onNavigate: (mode: GameMode) => void;
}

export default function LandingPage({ onNavigate }: Props) {
  return (
    <main className="page page-landing">
      <section className="landing-hero">
        <span className="home-eyebrow">
          <span className="status-spark" /> YOUR CLASSROOM. YOUR GAME.
        </span>
        <h1 className="landing-headline">Turn any lesson into a game your class will beg to play.</h1>
        <p className="landing-subtext">
          Bingo, Memory, and live Jeopardy — built for the projector, tuned to your curriculum, zero logins
          required.
        </p>
        <div className="landing-cta-row">
          <button className="btn btn-primary btn-lg" onClick={() => onNavigate('bingo')}>
            Enter the Arcade <ChevronRightIcon />
          </button>
          <a className="btn btn-secondary btn-lg" href="#how-it-works">
            See how it works
          </a>
        </div>
      </section>

      <section className="landing-stats" aria-label="StudyArcade at a glance">
        {STATS.map((stat) => (
          <div className="landing-stat" key={stat.label}>
            <span className="landing-stat-value">{stat.value}</span>
            <span className="landing-stat-label">{stat.label}</span>
          </div>
        ))}
      </section>

      <section className="landing-modes" aria-label="Game modes">
        {GAME_MODES.map((mode) => {
          const Icon = MODE_ICON[mode];
          return (
            <article className={`landing-mode-card landing-mode-${mode}`} key={mode}>
              <span className="landing-mode-icon">
                <Icon />
              </span>
              <h3>{GAME_MODE_LABEL[mode]}</h3>
              <p>{GAME_MODE_TAGLINE[mode]}</p>
              <button className="btn btn-ghost landing-mode-link" onClick={() => onNavigate(mode)}>
                Play {GAME_MODE_LABEL[mode]} <ChevronRightIcon />
              </button>
            </article>
          );
        })}
      </section>

      <section className="landing-steps" id="how-it-works" aria-label="How it works">
        <h2>How it works</h2>
        <div className="landing-steps-grid">
          {STEPS.map((step, i) => (
            <div className="landing-step" key={step.title}>
              <span className="landing-step-num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-closing">
        <h2>Built for your classroom. Ready today.</h2>
        <p>No sign-up, no install required to try it — just pick a game and press start.</p>
        <button className="btn btn-primary btn-lg" onClick={() => onNavigate('bingo')}>
          Enter the Arcade <ChevronRightIcon />
        </button>
      </section>

      <footer className="landing-footer">
        <ShullLogo />
        <span>Built for the classroom by a science teacher.</span>
      </footer>
    </main>
  );
}
