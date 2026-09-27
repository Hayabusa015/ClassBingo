import type { NavTarget, Theme } from '../lib/gameConfig';
import { GAME_MODE_LABEL, GAME_MODES } from '../lib/gameConfig';
import { HomeIcon, BingoIcon, MemoryIcon, JeopardyIcon } from './NavIcons';
import ThemeToggle from './ThemeToggle';
import UpdateChecker from './UpdateChecker';

const MODE_ICON = { bingo: BingoIcon, memory: MemoryIcon, jeopardy: JeopardyIcon };

interface Props {
  active: NavTarget;
  onNavigate: (target: NavTarget) => void;
  onOpenLegal: (page: 'privacy' | 'terms') => void;
  theme: Theme;
  onCycleTheme: () => void;
}

export default function Sidebar({ active, onNavigate, onOpenLegal, theme, onCycleTheme }: Props) {
  return (
    <nav className="sidebar" aria-label="Main navigation">
      <button className="sidebar-brand" onClick={() => onNavigate('landing')}>
        <span className="sidebar-brand-mark" aria-hidden="true">
          S
        </span>
        <span className="sidebar-brand-word">StudyArcade</span>
      </button>

      <div className="sidebar-nav">
        <button
          className={`sidebar-nav-item ${active === 'landing' ? 'active' : ''}`}
          aria-current={active === 'landing' ? 'page' : undefined}
          onClick={() => onNavigate('landing')}
        >
          <HomeIcon />
          <span>Home</span>
        </button>
        <div className="sidebar-nav-label">Games</div>
        {GAME_MODES.map((mode) => {
          const Icon = MODE_ICON[mode];
          return (
            <button
              key={mode}
              className={`sidebar-nav-item ${active === mode ? 'active' : ''}`}
              aria-current={active === mode ? 'page' : undefined}
              onClick={() => onNavigate(mode)}
            >
              <Icon />
              <span>{GAME_MODE_LABEL[mode]}</span>
            </button>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <UpdateChecker />
        <ThemeToggle theme={theme} onCycle={onCycleTheme} />
      </div>
      <div className="sidebar-legal">
        <button onClick={() => onOpenLegal('privacy')}>Privacy</button>
        <span aria-hidden="true">·</span>
        <button onClick={() => onOpenLegal('terms')}>Terms</button>
      </div>
    </nav>
  );
}
