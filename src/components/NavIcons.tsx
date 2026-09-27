/** Minimal stroke icons for the sidebar nav — no icon library dependency, kept to a single consistent line weight. */
type IconProps = { className?: string };

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export function HomeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function BingoIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="4" y="4" width="6" height="6" rx="1.2" />
      <rect x="14" y="4" width="6" height="6" rx="1.2" />
      <rect x="4" y="14" width="6" height="6" rx="1.2" />
      <rect x="14" y="14" width="6" height="6" rx="1.2" />
      <path d="M17 7h.01M7 17h.01" />
    </svg>
  );
}

export function MemoryIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="6" width="9" height="13" rx="1.6" />
      <rect x="12.5" y="3" width="9" height="13" rx="1.6" transform="rotate(8 17 9.5)" />
    </svg>
  );
}

export function JeopardyIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 4h12" />
      <path d="M9 4v3a3 3 0 0 0 6 0V4" />
      <path d="M12 13v4" />
      <path d="M8 21h8" />
      <path d="M9 17h6l1 4H8l1-4Z" />
    </svg>
  );
}

export function GlitchIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="M9 8v3l-2 1 2 1v3" />
      <path d="M15 8v3l2 1-2 1v3" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg {...base} width={16} height={16} className={className}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
