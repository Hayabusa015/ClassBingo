import type { BingoItem, DeckConfig } from './types';

/** [name, formula (plain digits, no charge), charge, tags] */
type Row = [string, string, string, string[]];

// prettier-ignore
const ROWS: Row[] = [
  ['Ammonium', 'NH4', '+', ['core', 'cation']],
  ['Hydronium', 'H3O', '+', ['cation']],
  ['Mercury(I)', 'Hg2', '2+', ['cation']],
  ['Acetate', 'C2H3O2', '-', ['core']],
  ['Hydroxide', 'OH', '-', ['core']],
  ['Cyanide', 'CN', '-', ['core']],
  ['Cyanate', 'OCN', '-', []],
  ['Thiocyanate', 'SCN', '-', []],
  ['Permanganate', 'MnO4', '-', ['core']],
  ['Nitrate', 'NO3', '-', ['core', 'oxyanion', 'nitrogen']],
  ['Nitrite', 'NO2', '-', ['core', 'oxyanion', 'nitrogen', 'ate-ite-pair']],
  ['Bicarbonate (hydrogen carbonate)', 'HCO3', '-', ['core', 'oxyanion']],
  ['Bisulfate (hydrogen sulfate)', 'HSO4', '-', ['oxyanion']],
  ['Hypochlorite', 'ClO', '-', ['oxyanion', 'chlorine-oxyanion']],
  ['Chlorite', 'ClO2', '-', ['oxyanion', 'chlorine-oxyanion', 'ate-ite-pair']],
  ['Chlorate', 'ClO3', '-', ['core', 'oxyanion', 'chlorine-oxyanion', 'ate-ite-pair']],
  ['Perchlorate', 'ClO4', '-', ['oxyanion', 'chlorine-oxyanion']],
  ['Bromate', 'BrO3', '-', ['oxyanion']],
  ['Iodate', 'IO3', '-', ['oxyanion']],
  ['Carbonate', 'CO3', '2-', ['core', 'oxyanion']],
  ['Sulfate', 'SO4', '2-', ['core', 'oxyanion', 'ate-ite-pair']],
  ['Sulfite', 'SO3', '2-', ['core', 'oxyanion', 'ate-ite-pair']],
  ['Thiosulfate', 'S2O3', '2-', ['oxyanion']],
  ['Peroxide', 'O2', '2-', []],
  ['Chromate', 'CrO4', '2-', ['core', 'oxyanion']],
  ['Dichromate', 'Cr2O7', '2-', ['core', 'oxyanion']],
  ['Oxalate', 'C2O4', '2-', []],
  ['Silicate', 'SiO3', '2-', []],
  ['Hydrogen phosphate', 'HPO4', '2-', ['oxyanion']],
  ['Phosphate', 'PO4', '3-', ['core', 'oxyanion']],
  ['Phosphite', 'PO3', '3-', ['oxyanion', 'ate-ite-pair']],
  ['Dihydrogen phosphate', 'H2PO4', '-', ['oxyanion']],
  ['Arsenate', 'AsO4', '3-', []],
  ['Borate', 'BO3', '3-', []],
];

export const POLYATOMIC_IONS: BingoItem[] = ROWS.map(([name, formula, charge, tags]) => {
  const id = `ion-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
  const allTags = [...tags, charge.endsWith('+') ? 'cation' : 'anion'];
  return {
    id,
    name,
    formula,
    charge,
    tags: allTags,
    clue: `Charge: ${charge}`,
    meta: { charge },
  };
});

export const ionsDeck: DeckConfig = {
  id: 'ions',
  title: 'Chemistry: Common Polyatomic Ions',
  shortTitle: 'Polyatomic Ions',
  description: 'Name-to-formula matching for the most common polyatomic ions.',
  items: POLYATOMIC_IONS,
  filters: [
    { id: 'core', label: 'Core list (~20)', predicate: (i) => i.tags.includes('core') },
    { id: 'oxyanions', label: 'Oxyanions only', predicate: (i) => i.tags.includes('oxyanion') },
    { id: 'ate-ite', label: '-ate / -ite pairs', predicate: (i) => i.tags.includes('ate-ite-pair') },
    { id: 'chlorine-oxyanions', label: 'Oxyanions of chlorine', predicate: (i) => i.tags.includes('chlorine-oxyanion') },
    { id: 'all', label: 'All ions', predicate: () => true },
  ],
  defaultFilterId: 'core',
  cardFaceOptions: [
    { id: 'formula', label: 'Formula' },
    { id: 'name', label: 'Name' },
    { id: 'mixed', label: 'Mixed (random per square)' },
  ],
  defaultCardFaceId: 'formula',
  callHeadline: (item) => `${item.formula}${item.charge}`,
  callSubline: (item) => item.name,
  squareText: (item, face, rngFloat = 0.5) => {
    if (face === 'formula') return `${item.formula}${item.charge}`;
    if (face === 'name') return item.name;
    if (face === 'mixed') return rngFloat < 0.5 ? `${item.formula}${item.charge}` : item.name;
    return item.name;
  },
  challengeHiddenField: (face) => (face === 'name' ? 'subline' : 'headline'),
};
