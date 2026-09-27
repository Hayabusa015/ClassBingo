import type { ReactNode } from 'react';
import type { NavTarget, Theme } from '../lib/gameConfig';
import Sidebar from './Sidebar';

interface Props {
  active: NavTarget;
  onNavigate: (target: NavTarget) => void;
  theme: Theme;
  onCycleTheme: () => void;
  children: ReactNode;
}

/** Persistent left-nav shell wrapping the landing page and each game mode's library. Setup/gameplay/projector screens render full-screen without this. */
export default function AppShell({ active, onNavigate, theme, onCycleTheme, children }: Props) {
  return (
    <div className="app-shell">
      <Sidebar active={active} onNavigate={onNavigate} theme={theme} onCycleTheme={onCycleTheme} />
      <div className="app-shell-content">{children}</div>
    </div>
  );
}
