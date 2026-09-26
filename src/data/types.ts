export type ScienceDeckId = 'elements' | 'ions' | 'minerals' | 'rocks';
export type DeckId = ScienceDeckId | `curriculum:${string}` | `custom:${string}`;

export interface BingoItem {
  /** Stable id, e.g. "el-11", "ion-sulfate", "min-quartz", "rock-granite" */
  id: string;
  /** Full display name, e.g. "Sodium", "Sulfate", "Quartz", "Granite" */
  name: string;
  /** Elements: chemical symbol, e.g. "Na" */
  symbol?: string;
  /** Ions/minerals: formula without charge, e.g. "SO4", "SiO2" */
  formula?: string;
  /** Ions: charge string, e.g. "2-", "+", "3-" */
  charge?: string;
  /** Filter tags, e.g. "period-3", "alkali-metal", "igneous", "oxyanion" */
  tags: string[];
  /** Short caller clue, e.g. "Hardness 7, glassy luster" */
  clue?: string;
  /** Free-form metadata: atomicNumber, category, hardness, luster, type, texture, etc. */
  meta?: Record<string, string | number>;
}

export interface DeckFilter {
  id: string;
  label: string;
  /** Returns true if the item passes this filter. */
  predicate: (item: BingoItem) => boolean;
}

export type CardFaceField = 'symbol' | 'name' | 'formula' | 'mixed';

export interface CardFaceOption {
  id: CardFaceField;
  label: string;
}

export interface DeckConfig {
  id: DeckId;
  /** Rendering identity survives saving a selection as a custom playset. */
  presentation?: ScienceDeckId;
  subject?: string;
  grades?: string;
  supportsChallenge?: boolean;
  title: string;
  shortTitle: string;
  description: string;
  items: BingoItem[];
  filters: DeckFilter[];
  defaultFilterId: string;
  cardFaceOptions: CardFaceOption[];
  defaultCardFaceId: CardFaceField;
  /** Field shown as the "answer" the caller reveals when card face hides it. */
  callHeadline: (item: BingoItem) => string;
  callSubline: (item: BingoItem) => string;
  /** Text rendered on a student's square for a given item + face choice. */
  squareText: (item: BingoItem, face: CardFaceField, rngFloat?: number) => string;
  /**
   * In challenge call mode, which field (headline or subline) matches what's
   * printed on the student cards — that's the one hidden until "Reveal".
   */
  challengeHiddenField: (face: CardFaceField) => 'headline' | 'subline';
}
