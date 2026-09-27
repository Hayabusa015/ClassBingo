import { useEffect, useRef, type ReactNode } from 'react';

/** Reveal once on entry; content stays available without observer support. */
export default function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!node || preference.matches || !('IntersectionObserver' in window)) return;
    node.dataset.reveal = 'pending';
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.dataset.reveal = 'visible';
          observer.disconnect();
        }
      },
      { threshold: 0.06 },
    );
    observer.observe(node);
    const stop = () => {
      delete node.dataset.reveal;
      observer.disconnect();
    };
    preference.addEventListener('change', stop);
    return () => {
      stop();
      preference.removeEventListener('change', stop);
    };
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
