import { useMemo } from 'react';

const COLORS = ['#8fe04b', '#f2b84b', '#4bc4f2', '#f2604b', '#a06ff2', '#f2d24b'];

interface Piece {
  left: number;
  delay: number;
  duration: number;
  color: string;
  rotation: number;
  drift: number;
}

/** Lightweight CSS-only confetti burst — no canvas, no library. */
export default function ConfettiBurst({ active }: { active: boolean }) {
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: 48 }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.3,
        duration: 1.4 + Math.random() * 0.9,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 360,
        drift: (Math.random() - 0.5) * 120,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [active],
  );

  if (!active) return null;

  return (
    <div className="confetti-layer" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg)`,
            // custom property read by the CSS animation for horizontal drift
            ['--drift' as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
