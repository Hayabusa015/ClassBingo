import { THEME_LABEL, type Theme } from '../lib/gameConfig';

interface Props {
  theme: Theme;
  onCycle: () => void;
}

/** Small palette button used on every screen's header; cycles through the app's themes. */
export default function ThemeToggle({ theme, onCycle }: Props) {
  return (
    <button className="btn btn-ghost icon-btn" onClick={onCycle} title={`Theme: ${THEME_LABEL[theme]} (click to change)`}>
      🎨
    </button>
  );
}
