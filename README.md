# BingoBash

A projector-friendly caller and printable-card generator with a searchable,
offline library of **22 classroom playsets**. Subjects include science, math,
English, social studies, world languages, technology, arts, and health/PE.
The original four science decks are joined by 18 sets of 30 answer/clue pairs.
Suggested grade bands help browsing; these are review sets, not claims of
alignment to a particular state's curriculum standards.

Runs in the browser or packaged desktop app, without a login or backend.
Custom playsets are saved in this browser/device's local storage. Use
**Export library** to back them up or move them to another computer; they do
not automatically sync across devices. A static deployment updates the
built-in catalog, not a user's saved library.

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

### Tailor or create a playset

- Search the game library by subject, title, or answer. **My playsets** shows
  your saved sets.
- If nothing matches, choose **Create this playset**. Your search carries
  over as its title so you can add the missing playset directly.
- In setup, check each item in or out. Search within the list, select/clear
  matches, or reset to the filter's full list. Every caller, printed card,
  master call sheet, and winner check uses the same chosen items.
- Changing items creates a fresh game code. Reprint cards after changing a
  selection. **Save to library** creates a separate reusable playset while
  leaving the original intact.
- **Create playset** accepts one answer per line, `answer | clue` pairs, or
  two pasted spreadsheet columns. The live card preview is generated from
  those entries. This is offline item entry, not topic-to-AI generation.
- Provide a clue for every item to enable Challenge mode. Answers alone
  also work in Show both mode. Duplicate answers and invalid rows are
  flagged before saving.
- A free-center 3×3 card requires 8 items; 5×5 requires 24. At least 30 is
  recommended for variety. Custom playsets support up to 300 items, with
  up to 100 saved playsets per library.
- **Export library / Import library** transfer saved sets as validated JSON.
  Identical imports are deduplicated. Conflicting versions receive separate
  IDs so existing games keep their original content. Save failures are
  reported instead of being silently discarded.

### Calling a game

- **Next** (Space) draws the next item with a quick shuffle animation.
- Element calls use an animated periodic-table card with an atomic number,
  large symbol, element name, atomic mass, and category glow. The card back
  features the SHULL OS logo; reduced-motion preferences are supported.
- **Undo** (Backspace) takes back the last call.
- **Reveal** (R) — only in Challenge mode — shows the hidden side of the
  current call.
- **F** toggles fullscreen, **M** toggles sound, and the palette icon (on
  every screen) cycles **Violet** (the default — a glowing dark
  asphalt/electric-violet/neon-pink theme) → Dark → Light → High contrast.
- **Bingo Mode** (button in the header, or **B**) switches to a big,
  distraction-free display for the class board: a much larger call card,
  a bigger "Called so far" list. The numbered element board stays visible
  for element games; other decks hide the full grid in this mode.
  It also goes fullscreen automatically.
- The **called board** ("All items" or "Element board") shows every item
  in play; called ones light up, and clicking any tile re-displays it
  without affecting game state.
- The **"Called so far"** list is a plain-language, numbered log of every
  call — read straight off it instead of repeating calls out loud.
  In Challenge mode, the current answer stays out of the history and
  highlights until Reveal, or until the next item is called.
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
- Redesigned cards include a BINGO heading and a clear free space, without
  a student name line. Print layouts support up to four cards per sheet.
- Click **Print / Save as PDF** and use your browser's print dialog — choose
  "Save as PDF" if you want a PDF file instead of printing directly.
- **View Call Sheet** gives you a printable master checklist of everything in
  the game, for marking off calls by hand as a backup.

## Desktop app (Windows installer, auto-updating)

BingoBash also ships as a real desktop program — a double-clickable
installer, its own window (no browser needed), and it checks for updates
every time it's launched, so a class computer never needs `git pull` again.

**Installing it:** grab the latest `BingoBash-Setup-x.y.z.exe` from the
repo's [Releases page](https://github.com/Hayabusa015/ClassBingo/releases)
and run it. Windows will likely show a **"Windows protected your PC"**
SmartScreen warning the first time, since the installer isn't
code-signed (that requires a paid certificate) — click **More info** →
**Run anyway**. This only happens once per machine.

> The app was renamed from ClassBingo to BingoBash at version 1.0.2. If
> you already have ClassBingo installed, the auto-updater can't turn it
> into BingoBash in place (Windows sees them as different programs) —
> uninstall ClassBingo once, then install the BingoBash installer above.
> Every update after that (BingoBash → BingoBash) goes smoothly through
> the normal auto-update flow.

**Getting updates:** every time the app opens, it quietly checks this
repo's latest published release. If there's a newer version, it downloads
in the background and asks "Restart now?" the moment it's ready — no
terminal, no `git`, nothing to type. There's also a **Check for Updates**
button on the home screen (with the current version next to it) if you
want to check on demand instead of waiting for the next launch.

**Shipping a new version** (for whoever maintains the repo): bump the
version and push a tag —

```bash
npm run release:patch   # 1.0.0 -> 1.0.1, tags it, pushes both
```

— and `.github/workflows/release.yml` builds the Windows installer and
publishes it to GitHub Releases automatically. Every installed copy of
BingoBash picks it up next time it's opened.

**Building it locally** (Windows installers are built by CI on a real
Windows runner, not needed day-to-day):

```bash
npm run electron:dev     # run the desktop shell against the Vite dev server
npm run electron:build   # produce an installer for the current OS
```

## Deploying the web version

The app is also a static site (Vite + React + TypeScript) independent of
the desktop build. A `netlify.toml` is included for one-click Netlify
deploys (`npm run build`, publish `dist/`). It also works on GitHub Pages,
Vercel, or any static host — just serve the `dist/` folder after
`npm run build`.

## Project structure

```
src/
  data/        # 22 built-in playsets, curriculum pairs, atomic masses
  lib/         # seeded RNG, card generation, win detection, formula
               # rendering, localStorage helpers, sound
  components/  # DeckPicker, GameSetup, Caller, CardGenerator, etc.
  styles/      # theme tokens, app styles, print stylesheet
electron/
  main.cjs     # desktop app window + auto-update check
```

See `PLAN.md` for the original design plan this was built from.
