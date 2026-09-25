import type { BingoItem, DeckConfig } from './types';

type RockType = 'igneous' | 'sedimentary' | 'metamorphic';

/** [name, type, texture, clue] */
type Row = [string, RockType, string, string];

// prettier-ignore
const ROWS: Row[] = [
  // Igneous
  ['Granite', 'igneous', 'coarse-grained, intrusive', 'Light-colored, coarse-grained, felsic; cooled slowly underground'],
  ['Diorite', 'igneous', 'coarse-grained, intrusive', 'Speckled black-and-white, coarse-grained, intermediate'],
  ['Gabbro', 'igneous', 'coarse-grained, intrusive', 'Dark, coarse-grained, mafic; intrusive equivalent of basalt'],
  ['Peridotite', 'igneous', 'coarse-grained, intrusive', 'Dense, green, ultramafic; from the mantle'],
  ['Rhyolite', 'igneous', 'fine-grained, extrusive', 'Light-colored, fine-grained; extrusive equivalent of granite'],
  ['Andesite', 'igneous', 'fine-grained, extrusive', 'Gray, fine-grained, intermediate; common at volcanic arcs'],
  ['Basalt', 'igneous', 'fine-grained, extrusive', 'Dark, fine-grained, mafic; most common ocean-floor rock'],
  ['Obsidian', 'igneous', 'glassy, extrusive', 'Volcanic glass; cooled too fast to form crystals'],
  ['Pumice', 'igneous', 'vesicular, extrusive', 'Full of gas bubbles; light enough to float'],
  ['Scoria', 'igneous', 'vesicular, extrusive', 'Dark, bubbly, denser than pumice'],
  ['Tuff', 'igneous', 'pyroclastic', 'Formed from compacted volcanic ash'],
  ['Porphyry', 'igneous', 'porphyritic', 'Large crystals set in a fine-grained matrix; two cooling stages'],
  // Sedimentary
  ['Sandstone', 'sedimentary', 'clastic, medium grains', 'Cemented sand-sized grains, often quartz'],
  ['Shale', 'sedimentary', 'clastic, fine grains', 'Compacted mud/clay; splits into thin flat layers'],
  ['Siltstone', 'sedimentary', 'clastic, fine grains', 'Grain size between sandstone and shale'],
  ['Conglomerate', 'sedimentary', 'clastic, coarse, rounded', 'Rounded pebbles cemented together'],
  ['Breccia', 'sedimentary', 'clastic, coarse, angular', 'Angular rock fragments cemented together'],
  ['Limestone', 'sedimentary', 'chemical/biochemical', 'Mostly calcite; fizzes with acid; often from shells'],
  ['Chalk', 'sedimentary', 'biochemical', 'Soft, white limestone made of microscopic shells'],
  ['Coquina', 'sedimentary', 'biochemical, clastic', 'Loosely cemented shell fragments'],
  ['Coal (Bituminous)', 'sedimentary', 'organic', 'Compressed ancient plant material; burns as fuel'],
  ['Rock Salt', 'sedimentary', 'chemical, crystalline', 'Formed by evaporation of salt water; tastes salty'],
  ['Rock Gypsum', 'sedimentary', 'chemical, crystalline', 'Formed by evaporation; soft, used to make plaster'],
  ['Chert', 'sedimentary', 'chemical, cryptocrystalline', 'Very hard, fine-grained silica; breaks with sharp edges'],
  // Metamorphic
  ['Slate', 'metamorphic', 'foliated, fine', 'Low-grade metamorphism of shale; splits into flat sheets'],
  ['Phyllite', 'metamorphic', 'foliated, fine', 'Between slate and schist; shiny sheen on foliation'],
  ['Schist', 'metamorphic', 'foliated, medium-coarse', 'Visible mica flakes give it a shiny, wavy foliation'],
  ['Gneiss', 'metamorphic', 'foliated, coarse, banded', 'High-grade metamorphism; light/dark banding'],
  ['Marble', 'metamorphic', 'non-foliated', 'Metamorphosed limestone; interlocking calcite crystals'],
  ['Quartzite', 'metamorphic', 'non-foliated', 'Metamorphosed sandstone; very hard, glassy'],
  ['Anthracite', 'metamorphic', 'non-foliated', 'Metamorphosed coal; hard, shiny, high carbon'],
  ['Hornfels', 'metamorphic', 'non-foliated', 'Fine-grained; formed by contact metamorphism near magma'],
  ['Soapstone', 'metamorphic', 'non-foliated', 'Mostly talc; soft, soapy feel'],
];

const TYPE_LABEL: Record<RockType, string> = {
  igneous: 'Igneous',
  sedimentary: 'Sedimentary',
  metamorphic: 'Metamorphic',
};

export const ROCKS: BingoItem[] = ROWS.map(([name, type, texture, clue]) => {
  const id = `rock-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
  return {
    id,
    name,
    tags: [type],
    clue,
    meta: { type, texture },
  };
});

export const rocksDeck: DeckConfig = {
  id: 'rocks',
  title: 'Geology: Rocks (All Types)',
  shortTitle: 'Rocks',
  description: 'Igneous, sedimentary, and metamorphic rock identification.',
  items: ROCKS,
  filters: [
    { id: 'all', label: 'All types', predicate: () => true },
    { id: 'igneous', label: 'Igneous only', predicate: (i) => i.tags.includes('igneous') },
    { id: 'sedimentary', label: 'Sedimentary only', predicate: (i) => i.tags.includes('sedimentary') },
    { id: 'metamorphic', label: 'Metamorphic only', predicate: (i) => i.tags.includes('metamorphic') },
  ],
  defaultFilterId: 'all',
  cardFaceOptions: [{ id: 'name', label: 'Name' }],
  defaultCardFaceId: 'name',
  callHeadline: (item) => item.name,
  callSubline: (item) => `${TYPE_LABEL[item.meta?.type as RockType]} — ${item.clue ?? ''}`,
  squareText: (item) => item.name,
  challengeHiddenField: () => 'headline',
};
