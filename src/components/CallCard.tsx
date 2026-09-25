import type { BingoItem, CardFaceField, DeckConfig } from '../data/types';
import type { CallStyle } from '../lib/gameConfig';
import { renderIon } from '../lib/formula';

interface Props {
  deck: DeckConfig;
  item: BingoItem | null;
  cardFace: CardFaceField;
  callStyle: CallStyle;
  revealed: boolean;
  onReveal: () => void;
  isShuffling: boolean;
  shuffleDisplayItem: BingoItem | null;
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

function ElementTile({ item, dimmed }: { item: BingoItem; dimmed?: boolean }) {
  const category = String(item.meta?.category ?? 'unknown');
  return (
    <div className={`element-tile cat-${category} ${dimmed ? 'dimmed' : ''}`}>
      <span className="element-tile-number">{item.meta?.atomicNumber}</span>
      <span className="element-tile-symbol">{dimmed ? '?' : item.symbol}</span>
      <span className="element-tile-category">{dimmed ? '' : CATEGORY_LABEL[category]}</span>
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
}: Props) {
  if (isShuffling) {
    const shown = shuffleDisplayItem ?? item;
    return (
      <div className="call-card shuffling">
        <div className="call-card-shuffle-text">{shown ? deck.callHeadline(shown) : '?'}</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="call-card call-card-empty">
        <div className="call-card-placeholder">Press "Next" to draw the first item</div>
      </div>
    );
  }

  const isChallenge = callStyle === 'challenge' && !revealed;
  const hiddenField = isChallenge ? deck.challengeHiddenField(cardFace) : null;

  const headlineHidden = hiddenField === 'headline';
  const sublineHidden = hiddenField === 'subline';

  return (
    <div className={`call-card deck-${deck.id}`}>
      {deck.id === 'elements' ? (
        <ElementTile item={item} dimmed={headlineHidden} />
      ) : deck.id === 'ions' ? (
        <div className={`ion-headline ${headlineHidden ? 'dimmed' : ''}`}>
          {headlineHidden ? '?' : renderIon(item.formula ?? '', item.charge)}
        </div>
      ) : (
        <div className={`generic-headline ${headlineHidden ? 'dimmed' : ''}`}>
          {headlineHidden ? '?' : deck.callHeadline(item)}
        </div>
      )}

      <div className={`call-card-subline ${sublineHidden ? 'dimmed' : ''}`}>
        {sublineHidden ? '?' : deck.callSubline(item)}
      </div>

      {isChallenge && (
        <button className="btn btn-primary reveal-btn" onClick={onReveal}>
          Reveal (R)
        </button>
      )}
    </div>
  );
}
