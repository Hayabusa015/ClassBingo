# ClassBingo

A projector-friendly bingo caller and printable-card generator for four science
games:

- **Chemistry: Elements** — element names and symbols
- **Chemistry: Common Polyatomic Ions** — formulas with charges (e.g. SO₄²⁻)
- **Geology: Minerals** — hand-sample ID practice
- **Geology: Rocks (All Types)** — igneous, sedimentary, and metamorphic

Runs entirely in the browser. No login, no backend, no database — just a
static site you open on your class computer/board.

## Quick start

```bash
npm install
npm run dev       # local dev server
npm run build     # production build -> dist/
npm test          # run the unit test suite
```

## Using it in class

1. **Pick a game** on the home screen.
2. **Set it up**: choose which items are in play (e.g. "First 20 elements",
   "Igneous only"), the grid size (3×3/4×4/5×5), whether students see the
   symbol/formula/name on their cards, the call style, and the win pattern.
   A 4-digit **game code** is generated automatically — it's what lets a
   printed card be re-checked for a bingo later.
3. **Start Calling** to open the projector view, or **Print Cards** to
   generate and print/PDF a batch of student cards first.

### Calling a game

- **Next** (Space) draws the next item with a quick shuffle animation.
- **Undo** (Backspace) takes back the last call.
- **Reveal** (R) — only in Challenge mode — shows the hidden side of the
  current call.
- **F** toggles fullscreen, **M** toggles sound, and the palette icon (on
  every screen) cycles **Violet** (the default — a glowing dark
  asphalt/electric-violet/neon-pink theme) → Dark → Light → High contrast.
- The **called board** on the side shows every item in play; called ones
  light up, and clicking any tile re-displays it without affecting game
  state.
- **Check a winner**: type a student's card number and it's regenerated from
  the game code and checked against everything called so far — no manual
  bingo-checking required.
- Progress is saved automatically. If the page reloads mid-game, you'll be
  offered a "Resume" prompt on the home screen.

### Printing cards

- Set the number of cards, cards per page, a header title, and an optional
  class/period line.
- Every card gets its own **card number** and the **game code**, both needed
  for the winner check.
- Click **Print / Save as PDF** and use your browser's print dialog — choose
  "Save as PDF" if you want a PDF file instead of printing directly.
- **View Call Sheet** gives you a printable master checklist of everything in
  the game, for marking off calls by hand as a backup.

## Deploying

This is a static site (Vite + React + TypeScript). A `netlify.toml` is
included for one-click Netlify deploys (`npm run build`, publish `dist/`).
It also works on GitHub Pages, Vercel, or any static host — just serve the
`dist/` folder after `npm run build`.

## Project structure

```
src/
  data/        # the four decks: elements, ions, minerals, rocks
  lib/         # seeded RNG, card generation, win detection, formula
               # rendering, localStorage helpers, sound
  components/  # DeckPicker, GameSetup, Caller, CardGenerator, etc.
  styles/      # theme tokens, app styles, print stylesheet
```

See `PLAN.md` for the original design plan this was built from.
