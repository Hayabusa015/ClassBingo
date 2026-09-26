import type { CSSProperties } from 'react';
import type { BingoItem, CardFaceField, DeckConfig } from '../data/types';
import type { CallStyle } from '../lib/gameConfig';
import { renderIon } from '../lib/formula';
import ScienceArt from './ScienceArt';
import { ATOMIC_MASSES } from '../data/atomicMasses';
import ShullLogo from './ShullLogo';

export interface BounceOffset {
  x: number;
  y: number;
  rot: number;
  scale: number;
}

interface Props {
  deck: DeckConfig;
  item: BingoItem | null;
  cardFace: CardFaceField;
  callStyle: CallStyle;
  revealed: boolean;
  onReveal: () => void;
  isShuffling: boolean;
  shuffleDisplayItem: BingoItem | null;
  bounceOffset: BounceOffset;
}

const CATEGORY_LABEL: Record<string, string> = {
  'alkali-metal': 'Alkali metal',
  'alkaline-earth-metal': 'Alkaline earth metal',
  'transition-metal': 'Transition metal',
  'post-transition-metal': 'Post-transition metal',
  metalloid: 'Metalloid',
  'reactive-nonmetal': 'Nonmetal',
  halogen: 'Halogen',
  'noble-gas': 'Noble gas',
  lanthanide: 'Lanthanide',
  actinide: 'Actinide',
  unknown: 'Unknown properties',
};

function ElementTile({
  item,
  hideSymbol,
  hideName,
}: {
  item: BingoItem;
  hideSymbol: boolean;
  hideName: boolean;
}) {
  const category = String(item.meta?.category ?? 'unknown');
  const mass = ATOMIC_MASSES[item.symbol ?? ''];
  const guessing = hideSymbol || hideName;
  return (
    <div className={`element-reveal ${guessing ? 'element-guessing' : `cat-${category}`}`}>
      <div className="element-aura" aria-hidden="true" />
      <div className="element-flipper">
        <div className="element-reverse" aria-hidden="true">
          <ShullLogo />
          <span>CLASSBINGO</span>
        </div>
        <div className="periodic-face">
          <div className="periodic-topline">
            <div className="periodic-number">
              <span>ATOMIC NO.</span>
              <strong>{guessing ? '—' : item.meta?.atomicNumber}</strong>
            </div>
            <span className="periodic-category">{guessing ? 'Challenge' : CATEGORY_LABEL[category]}</span>
          </div>
          <div className="periodic-identity" key={guessing ? 'guess' : 'answer'}>
            <span className="periodic-symbol">{hideSymbol ? '?' : item.symbol}</span>
            <span className={`periodic-name ${hideName ? 'answer-hidden' : ''}`}>
              {hideName ? 'Name this element' : item.name}
            </span>
          </div>
          <div className="periodic-mass">
            <strong>{guessing ? '—' : (mass?.value ?? '—')}</strong>
            <span>{!guessing && mass?.isotope ? 'ISOTOPE MASS NUMBER' : 'ATOMIC MASS'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CallCard({
  deck,
  item,
  cardFace,
  callStyle,
  revealed,
  onReveal,
  isShuffling,
  shuffleDisplayItem,
  bounceOffset,
}: Props) {
  if (isShuffling && (deck.presentation ?? deck.id) === 'elements') {
    return (
      <div
        className="call-card periodic-stage periodic-drawing"
        aria-busy="true"
        aria-label="Drawing the next element"
      >
        <span className="stage-label">Drawing your next element</span>
        <div className="element-draw-stack" aria-hidden="true">
          <div className="draw-echo draw-echo-one" />
          <div className="draw-echo draw-echo-two" />
          <div className="element-draw-back">
            <ShullLogo />
            <strong>CLASSBINGO</strong>
            <span>THE NEXT DISCOVERY</span>
          </div>
        </div>
        <span className="stage-caption">Get ready to mark your card.</span>
      </div>
    );
  }
  if (isShuffling) {
    const shown = shuffleDisplayItem ?? item;
    const textStyle: CSSProperties = {
      transform: `translate(${bounceOffset.x}px, ${bounceOffset.y}px) rotate(${bounceOffset.rot}deg) scale(${bounceOffset.scale})`,
    };
    const ballStyle: CSSProperties = {
      transform: `translate(${bounceOffset.x * 0.7}px, ${bounceOffset.y}px)`,
    };
    return (
      <div className="call-card shuffling">
        <span className="bounce-ball" style={ballStyle} aria-hidden />
        <div className="call-card-shuffle-text" style={textStyle}>
          {shown ? deck.callHeadline(shown) : '?'}
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="call-card call-card-empty">
        <ScienceArt deck={deck.presentation ?? deck.id} />
        <span className="stage-label">Your classroom. Your game.</span>
        <div className="call-card-placeholder">Press "Next" to draw the first item</div>
      </div>
    );
  }

  const isChallenge = callStyle === 'challenge' && !revealed;
  const hiddenField = isChallenge ? deck.challengeHiddenField(cardFace) : null;

  const headlineHidden = hiddenField === 'headline';
  const sublineHidden = hiddenField === 'subline';

  return (
    <div
      className={`call-card call-card-landed deck-${deck.id} ${(deck.presentation ?? deck.id) === 'elements' ? 'periodic-stage' : ''}`}
    >
      <span className="stage-label">{isChallenge ? 'Make your guess' : 'On the board'}</span>
      {(deck.presentation ?? deck.id) === 'elements' ? (
        <ElementTile item={item} hideSymbol={headlineHidden} hideName={sublineHidden} />
      ) : (deck.presentation ?? deck.id) === 'ions' ? (
        <div className={`ion-headline ${headlineHidden ? 'dimmed' : ''}`}>
          {headlineHidden ? '?' : renderIon(item.formula ?? '', item.charge)}
        </div>
      ) : (
        <div className={`generic-headline ${headlineHidden ? 'dimmed' : ''}`}>
          {headlineHidden ? '?' : deck.callHeadline(item)}
        </div>
      )}

      {(deck.presentation ?? deck.id) !== 'elements' && (
        <div className={`call-card-subline ${sublineHidden ? 'dimmed' : ''}`}>
          {sublineHidden ? '?' : deck.callSubline(item)}
        </div>
      )}

      {(deck.presentation ?? deck.id) === 'elements' && !isChallenge && (
        <span className="stage-caption">Find it. Mark it. One step closer to bingo.</span>
      )}

      {isChallenge && (
        <button className="btn btn-primary reveal-btn" onClick={onReveal}>
          Reveal (R)
        </button>
      )}
    </div>
  );
}
