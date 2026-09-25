# ClassBingo — Build Plan

A projector-friendly bingo caller and printable card generator for four science decks:

| Game | Called on the board | Typical student-card square |
|---|---|---|
| Chemistry: Elements | Name + symbol (+ atomic number, category color) | Symbol **or** name |
| Chemistry: Polyatomic Ions | Name + formula with charge (e.g. Sulfate, SO₄²⁻) | Formula **or** name |
| Geology: Minerals | Name + one key clue (formula / hardness / luster) | Name |
| Geology: Rocks (all types) | Name + type badge (Igneous / Sedimentary / Metamorphic) + texture | Name |

The app runs entirely in the browser, needs no login or backend, and deploys as a static site.

---

## 1. Tech stack

- **Vite + React + TypeScript**, a static build (deploy to Netlify or GitHub Pages).
- **Plain CSS** with CSS variables for theming. No UI framework.
- **Printing** uses `window.print()` with `@media print` CSS, so "Save as PDF" in the browser produces the PDF. No PDF library.
- **Vitest** for unit tests on the logic and data.
- **localStorage** (every read and write wrapped in try/catch) keeps an in-progress game after a refresh.

## 2. Project structure

```
src/
  data/
    elements.ts        // all 118 elements
    polyatomicIons.ts  // ~35 common ions
    minerals.ts        // ~40 common HS-ID minerals
    rocks.ts           // ~35 rocks tagged igneous/sedimentary/metamorphic
    decks.ts           // registry: deck id -> items, filters, display config
  lib/
    rng.ts             // seeded PRNG (mulberry32) + shuffle
    cards.ts           // card generation from (deckConfig, seed, cardNumber)
    bingo.ts           // win detection (rows, cols, diagonals, optional blackout/4 corners)
    formula.tsx        // renders "SO4" + "2-" as SO₄²⁻ with <sub>/<sup>
    storage.ts         // safe localStorage wrapper
  components/
    DeckPicker.tsx     // home screen: 4 big tiles
    GameSetup.tsx      // filters + options
    Caller.tsx         // the projector screen
    CallCard.tsx       // big animated "current call" card
    CalledBoard.tsx    // grid of every item, called ones lit up
    WinnerCheck.tsx    // enter a card # to verify a bingo
    CardGenerator.tsx  // printable cards setup + preview
    PrintableCard.tsx  // one bingo card (print layout)
    CallSheet.tsx      // printable master list/checklist for the teacher
  App.tsx, main.tsx, styles/
tests/
```

## 3. Data model

```ts
type DeckId = 'elements' | 'ions' | 'minerals' | 'rocks';

interface BingoItem {
  id: string;               // stable, e.g. "el-11", "ion-sulfate", "min-quartz"
  name: string;             // "Sodium", "Sulfate", "Quartz", "Granite"
  symbol?: string;          // elements: "Na"
  formula?: string;         // ions/minerals: "SO4", "SiO2"
  charge?: string;          // ions: "2-", "+", "3-"
  tags: string[];           // filter tags: "period-3", "alkali-metal", "igneous", "oxyanion", ...
  clue?: string;            // short caller clue: "Hardness 7, glassy luster", "Coarse-grained, felsic"
  meta?: Record<string, string | number>; // atomicNumber, category, hardness, etc.
}
```

Each deck in `decks.ts` defines:
- `items`
- `filters`: the named subsets the teacher can pick (see §4)
- `cardFaceOptions`: which field(s) can appear on a student square (e.g. `symbol`, `name`)
- `callRender`: how the big call card looks for that deck

### Data content

- **Elements (118):** name, symbol, atomic number, category (alkali metal, alkaline earth, transition metal, post-transition metal, metalloid, nonmetal, halogen, noble gas, lanthanide, actinide), period, group.
  - Filters: *First 20*, *First 36*, *Main-group only*, *Common (the ~40 most-taught)*, *Custom range (atomic # from–to)*, *By category*.
- **Polyatomic ions (~35):** ammonium, hydronium, acetate, bicarbonate (hydrogen carbonate), bisulfate (hydrogen sulfate), carbonate, chlorate, chlorite, perchlorate, hypochlorite, chromate, dichromate, cyanide, hydroxide, nitrate, nitrite, oxalate, permanganate, phosphate, hydrogen phosphate, dihydrogen phosphate, phosphite, sulfate, sulfite, thiosulfate, peroxide, thiocyanate, silicate, bromate, iodate, cyanate, arsenate, borate, mercury(I) Hg₂²⁺, and so on.
  - Filters: *All*, *Core list (~20)*, *-ate/-ite pairs*, *Oxyanions of Cl*.
- **Minerals (~40):** quartz, orthoclase, plagioclase, muscovite, biotite, hornblende, augite, olivine, garnet, calcite, dolomite, halite, gypsum, talc, fluorite, apatite, corundum, topaz, diamond, graphite, sulfur, pyrite, galena, magnetite, hematite, limonite, chalcopyrite, sphalerite, malachite, azurite, kaolinite, serpentine, tourmaline, beryl, bauxite, native copper, gold, silver, and so on. Each gets a formula, Mohs hardness, luster, and a one-line clue.
  - Filters: *All*, *Mohs scale 10*, *Rock-forming minerals*, *Ore minerals*, *Metallic vs non-metallic luster*.
- **Rocks (~35):**
  - Igneous: granite, diorite, gabbro, peridotite, rhyolite, andesite, basalt, obsidian, pumice, scoria, tuff, porphyry.
  - Sedimentary: sandstone, shale, siltstone, conglomerate, breccia, limestone, chalk, coquina, coal (bituminous), rock salt, rock gypsum, chert.
  - Metamorphic: slate, phyllite, schist, gneiss, marble, quartzite, anthracite, hornfels, soapstone.
  - Filters: *All types*, *Igneous*, *Sedimentary*, *Metamorphic* (checkboxes, combinable).

**Validation rule:** the filtered deck must hold at least as many items as there are non-free squares. If it doesn't, the Start and Generate buttons stay disabled with a message like "Pick a smaller grid (e.g. 4×4) or add more items". A 5×5 grid needs 24 items and a 4×4 grid needs 15.

Use Unicode subscripts and superscripts only in the render layer. Keep the stored data plain ASCII.

## 4. Game setup screen

Options (defaults in bold):
- **Deck filter:** from the deck's filter list
- **Grid size:** 3×3 / 4×4 / **5×5**
- **Free center space:** **on** (odd grids only)
- **Student square shows:** e.g. elements: **Symbol** / Name / Mixed (random per square)
- **Call style:**
  - **Show both** (name + symbol together)
  - *Challenge*: show only the side that is *not* on the student cards, with a "Reveal" button (or the R key) for the answer
- **Win pattern:** **Line (row/col/diagonal)**, 4 corners, X, blackout (only used for the winner check and display text)
- **Game code (seed):** auto-generated 4-digit number, editable. **Cards printed with the same deck settings + game code are the ones the winner check can verify.**

## 5. Caller screen (projector view)

Layout: a large current-call card in the center, a compact called-items board to the side or below, and controls along the bottom.

- **Big current call:** huge type (readable from the back of the room). Elements look like a periodic-table tile: atomic number, big symbol, name, colored by category. Ions show a big formula with charge and the name. Minerals and rocks show the name, clue, and a type/luster badge.
- **Draw animation:** a quick 1–1.5 s "shuffle" (flicking through random items, slot-machine style) that lands on the pick with a pop/flip. There is a toggle to turn animation off.
- **Controls:** Next (Space/Enter or → key), Undo last (Backspace), Reveal (R, challenge mode), Fullscreen (F), Sound on/off (M), Auto-call every N seconds (off by default, with pause).
- **Counter:** "Call 14 of 36".
- **Last 5 calls strip** so students who missed one can catch up.
- **Called board:** every item in the deck in a grid (elements use a mini periodic-table layout when the full deck is in play). Called items light up. The teacher can click any tile to re-show it.
- **Winner check:** a student says "Bingo! Card #17". The teacher types 17, the app regenerates card 17 from the seed, overlays the called items, and shows either "✅ BINGO — row 3" or "❌ not yet (missing: Fe, Cu)".
- **New game / Reset:** asks for confirmation first.
- **Themes:** light, dark (the default for projectors), and high contrast. Everything stays readable at 1080p and 4K.
- Optional: small confetti burst when a bingo is verified.

State is saved to localStorage on every call, and a "Resume game?" prompt appears on load.

## 6. Card generator (print)

- Inputs: deck + filter + grid + free space + "square shows" (shared with game setup), **number of cards** (default 30), **cards per page** (1 or 2 for 5×5; 2 or 4 for 3×3/4×4), header title (default e.g. "ELEMENT BINGO"), optional class/period line, and a name blank.
- Each card shows its **card #** and the **game code** in a corner (for the winner check).
- Card *n* is generated deterministically: `rng = seed(gameCode, deckSettingsHash, n)`, then the first `cells` items of the shuffled deck. No two squares on a card repeat. Squares are auto-sized so long names (e.g. "Dihydrogen phosphate", "Rutherfordium") fit, and the font shrinks as needed.
- **Preview** on screen, then a **Print** button. Print CSS hides the app chrome, uses page breaks between cards, has black borders, avoids color-dependence, and uses Letter size with 0.5in margins.
- **Print call sheet:** a one-page checklist of the full filtered deck (both sides, e.g. name and symbol) for the teacher, marked with the game code.
- A "Start calling this game" button jumps to the caller with the same settings and seed.

## 7. Core logic (unit-tested)

- `rng.ts`: mulberry32 seeded from a string hash; Fisher–Yates shuffle.
- `cards.ts`: `generateCard(deckItems, settings, gameCode, cardNumber) → Cell[][]`. It is deterministic, has no duplicates, and places the free center.
- `bingo.ts`: `checkWin(card, calledIds, pattern) → { win: boolean; lines: ...; missing: BingoItem[] }`.
- The caller's draw order is a shuffled deck from the seed plus a pointer, so undo is trivial and refreshes are safe.
- Tests cover:
  - Data integrity: 118 elements, unique ids, atomic numbers 1–118, every rock has exactly one type tag, every ion has a charge.
  - Determinism: the same seed and card number always produce the same card.
  - No duplicate squares on a card.
  - Win detection for each pattern.
  - Deck-size validation.

## 8. Build order (milestones)

1. **Scaffold:** Vite React TS, Vitest, base CSS theme variables, and routing between Home → Setup → Caller / Card Generator. Use a simple state-based view switch; no router library is needed.
2. **Data files** for all four decks, plus integrity tests.
3. **Core logic:** rng, cards, bingo, formula rendering, plus tests.
4. **Caller screen** without animation: next, undo, called board, last-5 strip, keyboard shortcuts, persistence.
5. **Card generator + print CSS + call sheet.**
6. **Winner check.**
7. **Polish:** draw animation, sounds (short WebAudio blips, no audio files), themes, fullscreen, confetti, element-tile styling, responsive checks at 1920×1080 and laptop sizes.
8. **Deploy:** Netlify config (`netlify.toml`, build `npm run build`, publish `dist`) and a README with how-to-use instructions.

## 9. Acceptance checklist

- [ ] All four games are playable end to end on a projector at 1080p. The call card is readable from about 30 ft (symbol/formula at 20vh or more).
- [ ] Printed cards (Chrome → Save as PDF) fit on Letter paper and show no clipped text.
- [ ] Winner check correctly verifies a printed card by number.
- [ ] Refreshing mid-game resumes at the same call.
- [ ] `npm test` and `npm run build` pass with no TypeScript errors.

## 10. Later ideas (not v1)

- Mineral/rock photos (need openly licensed images, e.g. Wikimedia Commons, with attribution).
- Custom decks: the teacher pastes a list (vocab bingo for any unit).
- Student-phone digital cards.
- Optional SHULL Teacher Brand theme (Deep Forest / parchment / Bio Lime) as a selectable theme.
