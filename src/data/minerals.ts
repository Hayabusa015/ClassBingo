import type { BingoItem, DeckConfig } from './types';

/** [name, formula, hardness (Mohs), luster, extra tags, clue] */
type Row = [string, string, number, string, string[], string];

// prettier-ignore
const ROWS: Row[] = [
  ['Talc', 'Mg3Si4O10(OH)2', 1, 'pearly', ['rock-forming', 'softest'], 'Softest mineral; soapy feel'],
  ['Gypsum', 'CaSO4·2H2O', 2, 'vitreous', ['rock-forming'], 'Soft enough to scratch with a fingernail'],
  ['Calcite', 'CaCO3', 3, 'vitreous', ['rock-forming', 'carbonate'], 'Fizzes with weak acid; reacts with HCl'],
  ['Dolomite', 'CaMg(CO3)2', 3.5, 'vitreous', ['carbonate'], 'Fizzes only when powdered'],
  ['Fluorite', 'CaF2', 4, 'vitreous', ['rock-forming'], 'Often purple or green; cubic cleavage'],
  ['Apatite', 'Ca5(PO4)3(OH,F,Cl)', 5, 'vitreous', [], 'Found in teeth and bones'],
  ['Orthoclase', 'KAlSi3O8', 6, 'vitreous', ['rock-forming', 'feldspar', 'silicate'], 'A pink/tan feldspar; two cleavage planes'],
  ['Plagioclase', '(Ca,Na)AlSi3O8', 6, 'vitreous', ['rock-forming', 'feldspar', 'silicate'], 'A white-gray feldspar; striations on cleavage'],
  ['Quartz', 'SiO2', 7, 'glassy', ['rock-forming', 'silicate', 'ore-adjacent'], 'Glassy luster, conchoidal fracture, no cleavage'],
  ['Topaz', 'Al2SiO4(F,OH)2', 8, 'vitreous', ['silicate'], 'Gemstone; found in many colors'],
  ['Corundum', 'Al2O3', 9, 'vitreous', [], 'Ruby and sapphire are gem varieties'],
  ['Diamond', 'C', 10, 'adamantine', ['hardest'], 'Hardest known natural mineral'],
  ['Muscovite', 'KAl2(AlSi3O10)(OH)2', 2.5, 'pearly', ['rock-forming', 'mica', 'silicate'], 'Light-colored mica; peels into thin sheets'],
  ['Biotite', 'K(Mg,Fe)3AlSi3O10(OH)2', 2.5, 'vitreous', ['rock-forming', 'mica', 'silicate'], 'Dark mica; peels into thin sheets'],
  ['Hornblende', 'Complex silicate', 5.5, 'vitreous', ['rock-forming', 'silicate'], 'Dark green-black; two cleavage planes at ~60/120°'],
  ['Augite', 'Complex silicate', 6, 'vitreous', ['rock-forming', 'silicate'], 'Dark; two cleavage planes near 90°'],
  ['Olivine', '(Mg,Fe)2SiO4', 6.5, 'glassy', ['rock-forming', 'silicate'], 'Olive-green, granular; found in basalt'],
  ['Garnet', 'Fe3Al2(SiO4)3', 7, 'vitreous', ['silicate'], 'Deep red, often in metamorphic rock'],
  ['Halite', 'NaCl', 2.5, 'vitreous', ['rock-forming'], 'Rock salt; cubic cleavage; tastes salty'],
  ['Kaolinite', 'Al2Si2O5(OH)4', 2, 'dull', ['clay'], 'Soft white clay mineral'],
  ['Serpentine', 'Mg3Si2O5(OH)4', 3.5, 'greasy', [], 'Greenish, waxy or greasy feel'],
  ['Tourmaline', 'Complex borosilicate', 7.5, 'vitreous', [], 'Often black; triangular crystal cross-section'],
  ['Beryl', 'Be3Al2Si6O18', 7.5, 'vitreous', [], 'Emerald and aquamarine are gem varieties'],
  ['Pyrite', 'FeS2', 6.5, 'metallic', ['ore', 'metallic-luster', 'sulfide'], '"Fool\'s gold"; brassy cubic crystals'],
  ['Galena', 'PbS', 2.5, 'metallic', ['ore', 'metallic-luster', 'sulfide'], 'Lead ore; cubic cleavage, very dense'],
  ['Sphalerite', 'ZnS', 3.5, 'resinous', ['ore', 'sulfide'], 'Main ore of zinc; resinous luster'],
  ['Chalcopyrite', 'CuFeS2', 3.5, 'metallic', ['ore', 'metallic-luster', 'sulfide'], 'Brassy yellow; main ore of copper'],
  ['Magnetite', 'Fe3O4', 6, 'metallic', ['ore', 'metallic-luster', 'oxide'], 'Naturally magnetic iron oxide'],
  ['Hematite', 'Fe2O3', 5.5, 'metallic', ['ore', 'oxide'], 'Red-brown streak; major iron ore'],
  ['Limonite', 'FeO(OH)·nH2O', 4.5, 'dull', ['ore', 'oxide'], 'Rust-colored; yellow-brown streak'],
  ['Bauxite', 'Mixed Al hydroxides', 2, 'dull', ['ore'], 'Main ore of aluminum'],
  ['Malachite', 'Cu2CO3(OH)2', 3.5, 'silky', ['ore', 'carbonate'], 'Bright green; bands with azurite'],
  ['Azurite', 'Cu3(CO3)2(OH)2', 3.5, 'vitreous', ['carbonate'], 'Deep blue; often with malachite'],
  ['Sulfur', 'S', 2, 'resinous', [], 'Bright yellow; smells like rotten eggs near volcanoes'],
  ['Graphite', 'C', 1.5, 'metallic', [], 'Soft, gray-black; used in pencils'],
  ['Native Copper', 'Cu', 3, 'metallic', ['metallic-luster'], 'Reddish native metal; very malleable'],
  ['Gold', 'Au', 2.5, 'metallic', ['metallic-luster', 'ore'], 'Dense, soft, yellow native metal'],
  ['Silver', 'Ag', 2.5, 'metallic', ['metallic-luster', 'ore'], 'Native metal; tarnishes to black'],
];

export const MINERALS: BingoItem[] = ROWS.map(([name, formula, hardness, luster, tags, clue]) => {
  const id = `min-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
  const allTags = [...tags, `luster-${luster}`, `hardness-${hardness}`];
  return {
    id,
    name,
    formula,
    tags: allTags,
    clue,
    meta: { hardness, luster },
  };
});

export const mineralsDeck: DeckConfig = {
  id: 'minerals',
  title: 'Geology: Minerals',
  shortTitle: 'Minerals',
  description: 'Common minerals for hand-sample identification practice.',
  items: MINERALS,
  filters: [
    { id: 'rock-forming', label: 'Rock-forming minerals', predicate: (i) => i.tags.includes('rock-forming') },
    { id: 'ore', label: 'Ore minerals', predicate: (i) => i.tags.includes('ore') },
    { id: 'metallic', label: 'Metallic luster', predicate: (i) => i.tags.includes('metallic-luster') },
    { id: 'mohs10', label: "Mohs scale minerals (10)", predicate: (i) => ['Talc','Gypsum','Calcite','Fluorite','Apatite','Orthoclase','Quartz','Topaz','Corundum','Diamond'].includes(i.name) },
    { id: 'all', label: 'All minerals', predicate: () => true },
  ],
  defaultFilterId: 'rock-forming',
  cardFaceOptions: [{ id: 'name', label: 'Name' }],
  defaultCardFaceId: 'name',
  callHeadline: (item) => item.name,
  callSubline: (item) => item.clue ?? item.formula ?? '',
  squareText: (item) => item.name,
  challengeHiddenField: () => 'headline',
};
