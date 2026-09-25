import type { BingoItem, DeckConfig } from './types';

/** [atomicNumber, symbol, name, category, period, group (0 = f-block, not in main grid)] */
type Row = [number, string, string, string, number, number];

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

// prettier-ignore
const ROWS: Row[] = [
  [1, 'H', 'Hydrogen', 'reactive-nonmetal', 1, 1],
  [2, 'He', 'Helium', 'noble-gas', 1, 18],
  [3, 'Li', 'Lithium', 'alkali-metal', 2, 1],
  [4, 'Be', 'Beryllium', 'alkaline-earth-metal', 2, 2],
  [5, 'B', 'Boron', 'metalloid', 2, 13],
  [6, 'C', 'Carbon', 'reactive-nonmetal', 2, 14],
  [7, 'N', 'Nitrogen', 'reactive-nonmetal', 2, 15],
  [8, 'O', 'Oxygen', 'reactive-nonmetal', 2, 16],
  [9, 'F', 'Fluorine', 'halogen', 2, 17],
  [10, 'Ne', 'Neon', 'noble-gas', 2, 18],
  [11, 'Na', 'Sodium', 'alkali-metal', 3, 1],
  [12, 'Mg', 'Magnesium', 'alkaline-earth-metal', 3, 2],
  [13, 'Al', 'Aluminum', 'post-transition-metal', 3, 13],
  [14, 'Si', 'Silicon', 'metalloid', 3, 14],
  [15, 'P', 'Phosphorus', 'reactive-nonmetal', 3, 15],
  [16, 'S', 'Sulfur', 'reactive-nonmetal', 3, 16],
  [17, 'Cl', 'Chlorine', 'halogen', 3, 17],
  [18, 'Ar', 'Argon', 'noble-gas', 3, 18],
  [19, 'K', 'Potassium', 'alkali-metal', 4, 1],
  [20, 'Ca', 'Calcium', 'alkaline-earth-metal', 4, 2],
  [21, 'Sc', 'Scandium', 'transition-metal', 4, 3],
  [22, 'Ti', 'Titanium', 'transition-metal', 4, 4],
  [23, 'V', 'Vanadium', 'transition-metal', 4, 5],
  [24, 'Cr', 'Chromium', 'transition-metal', 4, 6],
  [25, 'Mn', 'Manganese', 'transition-metal', 4, 7],
  [26, 'Fe', 'Iron', 'transition-metal', 4, 8],
  [27, 'Co', 'Cobalt', 'transition-metal', 4, 9],
  [28, 'Ni', 'Nickel', 'transition-metal', 4, 10],
  [29, 'Cu', 'Copper', 'transition-metal', 4, 11],
  [30, 'Zn', 'Zinc', 'transition-metal', 4, 12],
  [31, 'Ga', 'Gallium', 'post-transition-metal', 4, 13],
  [32, 'Ge', 'Germanium', 'metalloid', 4, 14],
  [33, 'As', 'Arsenic', 'metalloid', 4, 15],
  [34, 'Se', 'Selenium', 'reactive-nonmetal', 4, 16],
  [35, 'Br', 'Bromine', 'halogen', 4, 17],
  [36, 'Kr', 'Krypton', 'noble-gas', 4, 18],
  [37, 'Rb', 'Rubidium', 'alkali-metal', 5, 1],
  [38, 'Sr', 'Strontium', 'alkaline-earth-metal', 5, 2],
  [39, 'Y', 'Yttrium', 'transition-metal', 5, 3],
  [40, 'Zr', 'Zirconium', 'transition-metal', 5, 4],
  [41, 'Nb', 'Niobium', 'transition-metal', 5, 5],
  [42, 'Mo', 'Molybdenum', 'transition-metal', 5, 6],
  [43, 'Tc', 'Technetium', 'transition-metal', 5, 7],
  [44, 'Ru', 'Ruthenium', 'transition-metal', 5, 8],
  [45, 'Rh', 'Rhodium', 'transition-metal', 5, 9],
  [46, 'Pd', 'Palladium', 'transition-metal', 5, 10],
  [47, 'Ag', 'Silver', 'transition-metal', 5, 11],
  [48, 'Cd', 'Cadmium', 'transition-metal', 5, 12],
  [49, 'In', 'Indium', 'post-transition-metal', 5, 13],
  [50, 'Sn', 'Tin', 'post-transition-metal', 5, 14],
  [51, 'Sb', 'Antimony', 'metalloid', 5, 15],
  [52, 'Te', 'Tellurium', 'metalloid', 5, 16],
  [53, 'I', 'Iodine', 'halogen', 5, 17],
  [54, 'Xe', 'Xenon', 'noble-gas', 5, 18],
  [55, 'Cs', 'Cesium', 'alkali-metal', 6, 1],
  [56, 'Ba', 'Barium', 'alkaline-earth-metal', 6, 2],
  [57, 'La', 'Lanthanum', 'lanthanide', 6, 0],
  [58, 'Ce', 'Cerium', 'lanthanide', 6, 0],
  [59, 'Pr', 'Praseodymium', 'lanthanide', 6, 0],
  [60, 'Nd', 'Neodymium', 'lanthanide', 6, 0],
  [61, 'Pm', 'Promethium', 'lanthanide', 6, 0],
  [62, 'Sm', 'Samarium', 'lanthanide', 6, 0],
  [63, 'Eu', 'Europium', 'lanthanide', 6, 0],
  [64, 'Gd', 'Gadolinium', 'lanthanide', 6, 0],
  [65, 'Tb', 'Terbium', 'lanthanide', 6, 0],
  [66, 'Dy', 'Dysprosium', 'lanthanide', 6, 0],
  [67, 'Ho', 'Holmium', 'lanthanide', 6, 0],
  [68, 'Er', 'Erbium', 'lanthanide', 6, 0],
  [69, 'Tm', 'Thulium', 'lanthanide', 6, 0],
  [70, 'Yb', 'Ytterbium', 'lanthanide', 6, 0],
  [71, 'Lu', 'Lutetium', 'lanthanide', 6, 0],
  [72, 'Hf', 'Hafnium', 'transition-metal', 6, 4],
  [73, 'Ta', 'Tantalum', 'transition-metal', 6, 5],
  [74, 'W', 'Tungsten', 'transition-metal', 6, 6],
  [75, 'Re', 'Rhenium', 'transition-metal', 6, 7],
  [76, 'Os', 'Osmium', 'transition-metal', 6, 8],
  [77, 'Ir', 'Iridium', 'transition-metal', 6, 9],
  [78, 'Pt', 'Platinum', 'transition-metal', 6, 10],
  [79, 'Au', 'Gold', 'transition-metal', 6, 11],
  [80, 'Hg', 'Mercury', 'transition-metal', 6, 12],
  [81, 'Tl', 'Thallium', 'post-transition-metal', 6, 13],
  [82, 'Pb', 'Lead', 'post-transition-metal', 6, 14],
  [83, 'Bi', 'Bismuth', 'post-transition-metal', 6, 15],
  [84, 'Po', 'Polonium', 'post-transition-metal', 6, 16],
  [85, 'At', 'Astatine', 'halogen', 6, 17],
  [86, 'Rn', 'Radon', 'noble-gas', 6, 18],
  [87, 'Fr', 'Francium', 'alkali-metal', 7, 1],
  [88, 'Ra', 'Radium', 'alkaline-earth-metal', 7, 2],
  [89, 'Ac', 'Actinium', 'actinide', 7, 0],
  [90, 'Th', 'Thorium', 'actinide', 7, 0],
  [91, 'Pa', 'Protactinium', 'actinide', 7, 0],
  [92, 'U', 'Uranium', 'actinide', 7, 0],
  [93, 'Np', 'Neptunium', 'actinide', 7, 0],
  [94, 'Pu', 'Plutonium', 'actinide', 7, 0],
  [95, 'Am', 'Americium', 'actinide', 7, 0],
  [96, 'Cm', 'Curium', 'actinide', 7, 0],
  [97, 'Bk', 'Berkelium', 'actinide', 7, 0],
  [98, 'Cf', 'Californium', 'actinide', 7, 0],
  [99, 'Es', 'Einsteinium', 'actinide', 7, 0],
  [100, 'Fm', 'Fermium', 'actinide', 7, 0],
  [101, 'Md', 'Mendelevium', 'actinide', 7, 0],
  [102, 'No', 'Nobelium', 'actinide', 7, 0],
  [103, 'Lr', 'Lawrencium', 'actinide', 7, 0],
  [104, 'Rf', 'Rutherfordium', 'transition-metal', 7, 4],
  [105, 'Db', 'Dubnium', 'transition-metal', 7, 5],
  [106, 'Sg', 'Seaborgium', 'transition-metal', 7, 6],
  [107, 'Bh', 'Bohrium', 'transition-metal', 7, 7],
  [108, 'Hs', 'Hassium', 'transition-metal', 7, 8],
  [109, 'Mt', 'Meitnerium', 'unknown', 7, 9],
  [110, 'Ds', 'Darmstadtium', 'unknown', 7, 10],
  [111, 'Rg', 'Roentgenium', 'unknown', 7, 11],
  [112, 'Cn', 'Copernicium', 'unknown', 7, 12],
  [113, 'Nh', 'Nihonium', 'unknown', 7, 13],
  [114, 'Fl', 'Flerovium', 'unknown', 7, 14],
  [115, 'Mc', 'Moscovium', 'unknown', 7, 15],
  [116, 'Lv', 'Livermorium', 'unknown', 7, 16],
  [117, 'Ts', 'Tennessine', 'unknown', 7, 17],
  [118, 'Og', 'Oganesson', 'unknown', 7, 18],
];

/** The ~40 elements most commonly taught / used in intro chem bingo. */
const COMMON_NUMBERS = new Set([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 24,
  25, 26, 27, 28, 29, 30, 33, 35, 36, 38, 47, 50, 53, 54, 56, 74, 78, 79, 80,
  82, 92,
]);

export const ELEMENTS: BingoItem[] = ROWS.map(
  ([atomicNumber, symbol, name, category, period, group]) => {
    const tags = [`period-${period}`, category];
    if (group > 0) tags.push(`group-${group}`);
    if (group === 0) tags.push('f-block');
    if (COMMON_NUMBERS.has(atomicNumber)) tags.push('common');
    if (atomicNumber <= 20) tags.push('first-20');
    if (atomicNumber <= 36) tags.push('first-36');
    const mainGroup = [1, 2, 13, 14, 15, 16, 17, 18].includes(group);
    if (mainGroup) tags.push('main-group');

    return {
      id: `el-${atomicNumber}`,
      name,
      symbol,
      tags,
      clue: `${CATEGORY_LABEL[category]}, period ${period}`,
      meta: { atomicNumber, category, period, group },
    };
  },
);

export const elementsDeck: DeckConfig = {
  id: 'elements',
  title: 'Chemistry: Elements',
  shortTitle: 'Elements',
  description: 'Element names and symbols from the periodic table.',
  items: ELEMENTS,
  filters: [
    { id: 'common', label: 'Common (~40 most-taught)', predicate: (i) => i.tags.includes('common') },
    { id: 'first-20', label: 'First 20 elements', predicate: (i) => i.tags.includes('first-20') },
    { id: 'first-36', label: 'First 36 elements', predicate: (i) => i.tags.includes('first-36') },
    { id: 'main-group', label: 'Main-group only', predicate: (i) => i.tags.includes('main-group') },
    { id: 'all', label: 'All 118 elements', predicate: () => true },
  ],
  defaultFilterId: 'common',
  cardFaceOptions: [
    { id: 'symbol', label: 'Symbol' },
    { id: 'name', label: 'Name' },
    { id: 'mixed', label: 'Mixed (random per square)' },
  ],
  defaultCardFaceId: 'symbol',
  callHeadline: (item) => item.symbol ?? '',
  callSubline: (item) => item.name,
  squareText: (item, face, rngFloat = 0.5) => {
    if (face === 'symbol') return item.symbol ?? item.name;
    if (face === 'name') return item.name;
    if (face === 'mixed') return rngFloat < 0.5 ? (item.symbol ?? item.name) : item.name;
    return item.name;
  },
  challengeHiddenField: (face) => (face === 'name' ? 'subline' : 'headline'),
};
