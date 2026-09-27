import { THEME_LABEL, type Theme } from '../lib/gameConfig';

interface Props {
  theme: Theme;
  onCycle: () => void;
}

/** Small palette button used on every screen's header; cycles through the app's themes. */
export default function ThemeToggle({ theme, onCycle }: Props) {
  return (
    <button
      className="btn btn-ghost theme-control"
      onClick={onCycle}
      aria-label={`Theme: ${THEME_LABEL[theme]}. Change theme`}
      title={`Theme: ${THEME_LABEL[theme]} (click to change)`}
    >
      <span className="theme-swatch" aria-hidden="true" />
      <span>{THEME_LABEL[theme]}</span>
    </button>
  );
}
