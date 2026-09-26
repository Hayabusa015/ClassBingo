/** Theme-aware SHULL OS mark: recolors per theme via CSS variables, unlike a raster badge. */
export default function ShullLogo() {
  return (
    <svg
      className="shull-logo"
      viewBox="0 0 100 100"
      style={{ aspectRatio: '1 / 1' }}
      role="img"
      aria-label="SHULL OS — Build, Teach, Improve"
    >
      <circle cx="50" cy="50" r="47" fill="var(--bg-elevated)" stroke="var(--accent)" strokeWidth="3" />
      <circle cx="50" cy="50" r="41" fill="none" stroke="var(--text)" strokeOpacity="0.14" strokeWidth="1" />
      <path
        d="M16 63 L33 33 L46 53 L55 28 L70 63"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.5"
      />
      <text
        x="50"
        y="65"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontWeight="800"
        fontSize="46"
        fill="var(--text)"
        stroke="var(--accent)"
        strokeWidth="1.1"
        paintOrder="stroke"
      >
        S
      </text>
      <g transform="translate(21 71)" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M-3 -11h6M-1 -11v6l-5 9.5a2 2 0 0 0 1.8 3h8.4a2 2 0 0 0 1.8-3l-5-9.5v-6" />
        <circle cx="0.5" cy="2.5" r="1.1" fill="var(--accent)" stroke="none" />
      </g>
      <path
        transform="translate(76 27)"
        d="M-4 -5.5-9.5 0l5.5 5.5M4 -5.5l5.5 5.5-5.5 5.5"
        stroke="var(--accent)"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
