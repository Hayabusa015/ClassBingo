import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import CallCard from '../components/CallCard';
import { ELEMENTS, elementsDeck } from '../data/elements';
import { ATOMIC_MASSES } from '../data/atomicMasses';
import type { CardFaceField } from '../data/types';

const iron = ELEMENTS.find((item) => item.symbol === 'Fe')!;
function renderCard(cardFace: CardFaceField = 'symbol', challenge = false, revealed = false, shuffling = false) {
  const root = document.createElement('div');
  root.innerHTML = renderToStaticMarkup(<CallCard deck={elementsDeck} item={iron} cardFace={cardFace}
    callStyle={challenge ? 'challenge' : 'both'} revealed={revealed} onReveal={() => {}}
    isShuffling={shuffling} shuffleDisplayItem={iron} bounceOffset={{ x: 0, y: 0, rot: 0, scale: 1 }} />);
  return root;
}

describe('live element card', () => {
  it('places the atomic number, symbol, name and mass on the periodic tile', () => {
    const root = renderCard();
    expect(root.querySelector('.periodic-number strong')?.textContent).toBe('26');
    expect(root.querySelector('.periodic-symbol')?.textContent).toBe('Fe');
    expect(root.querySelector('.periodic-name')?.textContent).toBe('Iron');
    expect(root.querySelector('.periodic-mass strong')?.textContent).toBe('55.845');
  });
  it('hides symbols and identifying metadata until a challenge is revealed', () => {
    const root = renderCard('symbol', true);
    expect(root.querySelector('.periodic-symbol')?.textContent).toBe('?');
    expect(root.querySelector('.periodic-name')?.textContent).toBe('Iron');
    expect(root.querySelector('.periodic-mass strong')?.textContent).toBe('—');
    expect(root.querySelector('.periodic-number strong')?.textContent).toBe('—');
    expect(renderCard('symbol', true, true).querySelector('.periodic-symbol')?.textContent).toBe('Fe');
  });
  it('hides the name when student cards contain names', () => {
    const root = renderCard('name', true);
    expect(root.querySelector('.periodic-symbol')?.textContent).toBe('Fe');
    expect(root.textContent).not.toContain('Iron');
    expect(renderCard('name', true, true).querySelector('.periodic-name')?.textContent).toBe('Iron');
  });
  it('uses a neutral card back during drawing without exposing a challenge answer', () => {
    const root = renderCard('symbol', true, false, true);
    expect(root.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(root.querySelector('.periodic-face')).toBeNull();
    expect(root.textContent).not.toContain('Iron');
  });
});

describe('offline atomic masses', () => {
  it('covers every element with a positive value and distinguishes isotope mass numbers', () => {
    expect(Object.keys(ATOMIC_MASSES)).toHaveLength(118);
    for (const element of ELEMENTS) {
      const mass = ATOMIC_MASSES[element.symbol!];
      expect(mass).toBeDefined();
      expect(Number(mass.value.replace(/[\[\]]/g, ''))).toBeGreaterThan(0);
      expect(mass.value.startsWith('[')).toBe(mass.isotope);
    }
    expect(ATOMIC_MASSES.Li.value).toBe('6.94');
    expect(ATOMIC_MASSES.U.value).toBe('238.03');
    expect(ATOMIC_MASSES.Tc.isotope).toBe(true);
  });
});
