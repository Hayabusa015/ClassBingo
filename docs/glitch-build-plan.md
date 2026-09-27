# GLITCH — Build Plan

A live, multiplayer social-deduction review game for StudyArcade. Students answer review questions on their Chromebooks to repair the arcade machine. A few of them are secretly **Glitches** trying to corrupt it. The class finds them by reasoning over evidence and voting.

This document is the full spec for implementing GLITCH in this repo. Build it **phase by phase** (§9). Each phase should be shippable, verified, and committed before starting the next.

> **Defaults assumed (confirm with the product owner if unsure):** name/theme is "GLITCH"; "levels" means difficulty presets the teacher picks; class sizes run 4–40 students.

---

## 1. Ground rules for the implementer

- **Read these files first.** GLITCH mirrors their patterns:
  - `src/lib/jeopardy.ts`: RPC wrapper, credential storage, realtime subscription.
  - `src/components/JeopardyHost.tsx`: host screen.
  - `src/JeopardyPlayApp.tsx`: student entry point.
  - `src/lib/memory.ts`: `pairLabel()` and `eligibleMemoryItems()`, which question generation reuses.
  - `src/components/MemorySetup.tsx`: playset setup screen, including filter and item selection.
  - `src/lib/gameConfig.ts`, `src/App.tsx`, `src/components/Sidebar.tsx`, `src/components/LandingPage.tsx`: routing and navigation.
  - `src/styles/modern.css` and `src/components/Reveal.tsx`: the current visual language and entry animation (see §6.5).
- **Backend:** Supabase project `xxlrpkspkvukddhbluap`, the same one Jeopardy uses. Apply schema changes as migrations. If you don't have Supabase access, write the SQL to a file and stop for the owner to apply it.
- **Security model:** copy Jeopardy's exactly. See §4.
- **Style:**
  - Use theme tokens (`var(--accent)`, `var(--bg-card)`, …). Never hard-code colors.
  - Scope arcade-only flourishes under `:root[data-theme='arcade']`.
  - Wrap feature CSS in `@media screen { … }` like `src/styles/jeopardy.css`.
  - Write no comments unless the *why* is non-obvious.
- **Verification before every commit:** `npx tsc -b`, `npx vitest run`, `npm run build`.
- **Sandbox limit:** in the cloud sandbox, a headless browser cannot reach `*.supabase.co` because of an egress policy. Verify the backend with direct SQL (§8). Verify the UI with Playwright wherever no network is needed. The owner tests live multiplayer on real devices after deploy.

---

## 2. Game design

### 2.1 Roles
| Mode | Majority role | Hidden role |
|---|---|---|
| **Hidden Glitch** (`hunt`) | Player | Glitch |
| **Outbreak** (`outbreak`) | Healthy | Infected (starts as "Patient Zero") |

Ejected or quarantined students become **Ghosts**. They keep answering questions and still add to the meter, but they cannot vote or sabotage. **Nobody sits out.**

### 2.2 Round structure (Hidden Glitch)
Each game runs `total_rounds` rounds, and each round runs these phases in order:

1. **Repair** (`repair`, timed). Active players are shuffled into **sectors** of 3–5 students; the grouping changes every round. Each student answers questions one at a time on their device.
   - A correct answer adds **1 point to their sector** for this round and **+1 charge** to that student.
   - Ghosts are in no sector. Their correct answers add straight to the meter.
2. **Resolve** (server-side, folded into the `repair → alert` transition — not a phase of its own). Every sector that a Glitch corrupted this round contributes **0 points**. Every clean sector contributes its points. The meter increases by the total. The two Repair-time win checks (§2.5, #1–#2) are evaluated here, before Alert ever shows.
3. **Alert** (`alert`, timed discussion). The projector shows the evidence: each sector's members and whether it was corrupted. The class discusses out loud.
4. **Vote** (`vote`, timed). Each active student votes for one active student, or Skip. Votes are anonymous. At the end of this phase the server tallies votes and ejects (or doesn't) — this is written into `reveal`'s state, but **no win check runs yet**.
5. **Reveal** (`reveal`, **untimed / host-paced**, same pattern as L0's `intermission`). The projector shows who was ejected and, if the level allows, their role. **This is the veto window**: the host may call `glitch_veto_ejection` any time while still in `reveal`. Only when the host clicks **Next round** (`glitch_advance` from `reveal`) does the server evaluate the role-based win checks (§2.5, #3–#4), using the roster state *as it stands at that moment* — so a veto genuinely can prevent a spurious win or loss, not just annotate the record after the fact.

### 2.3 The "Scan" button: peek-proof sabotage
Every student sees the **same screen**: a question, a charge counter, and a **Scan** button. Scanning costs charges.
- **Player:** Scan removes one wrong choice from the current question (a hint).
- **Glitch:** Scan *also visibly removes one wrong choice*, and **silently corrupts** the glitch's sector for this round.
- **Infected (Outbreak):** Scan also visibly removes a wrong choice, and silently **exposes** a chosen target (§2.6).

A student peeking at a neighbor's screen therefore sees nothing different. Anything role-specific, such as the role itself, the framing target (L3), or the infection target, lives only inside the **role card**, which appears only while the student **presses and holds** the "Hold to view role" button.

### 2.4 Voting rules
- A plurality among targets ejects that student.
- If Skip votes ≥ the top target's votes, **or** there is a tie for top, nobody is ejected.
- Students who don't vote are simply not counted.

### 2.5 Win conditions (Hidden Glitch)
The server checks these in the order listed, split across two moments (see §2.2 step 5 for why #3–#4 wait for the host, not the vote):
1. **At `repair → alert`** (resolve time): if `meter >= meter_goal`, **Players win** — skip Alert/Vote/Reveal entirely.
2. **At `repair → alert`**, in the **final round**: if `meter < meter_goal`, **Glitches win** — skip Alert/Vote/Reveal entirely.
3. **At `reveal → repair`** (when the host clicks Next round, after any veto): if there are zero active Glitches, **Players win**.
4. **At `reveal → repair`**: if active Glitches ≥ active honest players (`activeCount − activeGlitchCount`), **Glitches win**.

Otherwise the game continues to the next round's Repair. Checks always run active-vs-active, ghosts of either kind don't count toward either side.

### 2.6 Outbreak mode (Phase 3)
- **Patient Zero:** 1 infected if players < 25, otherwise 2. Infected students can see each other in their role card.
- **Target:** an infected student's role card has a picker listing their **current sector-mates**. The Scan action targets whoever is picked.
- **Exposure and shield:** an exposed target's **next served question** is silently flagged as a *shield* question. It looks exactly like any other question. If the target answers it wrong or times out, they become infected **at the end of this Repair**. If they answer correctly, nothing happens.
- **Cure meter:** healthy students' correct answers fill the **Cure meter**. Infected students' answers add nothing. Ghost answers still count.
- **Alert:** shows only "N new infections this round" and the meter. It never shows names.
- **Vote:** quarantine vote, same rules as §2.4. The quarantined student becomes a Ghost.
- **Wins:**
  - Cure ≥ goal → Healthy win.
  - Every infected student quarantined → Healthy win.
  - Active infected ≥ active healthy → Infected win.
  - Final round ends with the Cure meter short → Infected win.
- **Newly infected students:** at the start of the next round, the role card button pulses and reads "Your role card changed — hold to check."

### 2.7 Classroom safeguards (all levels)
- A wrong answer is **never** evidence. Only deliberate Scan-corruption shows up. Never show per-student accuracy publicly.
- The host can **veto** an ejection (during Reveal), **kick** a student, and **end** the game at any time.
- Anyone who joins after the game has started joins as a Ghost.

---

## 3. Levels (difficulty presets)

Define these in `src/lib/glitch.ts` as `GLITCH_LEVELS`. The host sends the chosen level's parameters in `p_settings` when creating the session. The server validates their ranges and stores them.

| Param | **L0 Practice** | **L1 Rookie** | **L2 Pro** | **L3 Legend** |
|---|---|---|---|---|
| `hiddenRoles` | none (co-op) | 1 Glitch | see formula | see formula |
| `repairSeconds` | 90 | 90 | 75 | 60 |
| `questionSeconds` (per question, server-enforced) | 30 | 30 | 20 | 15 |
| `choices` | 3 | 3 | 4 | 4 |
| `directions` | clue→term | clue→term | mixed | mixed |
| `tagMatchedDistractors` | no | no | no | yes |
| `discussionSeconds` | — | 90 | 75 | 60 |
| `voteSeconds` | — | 30 | 30 | 25 |
| `revealRoleOnEject` | — | yes | yes | **no** |
| `scanCost` (charges) | 2 | 3 | 2 | 2 |
| `canFrameNeighbor` | — | no | no | **yes** |
| `outbreakAllowed` | no | no | yes | yes |
| `defaultRounds` | 4 | 5 | 5 | 6 |
| `goalFactor` | 0.75 | 0.85 | 0.80 | 0.80 |

**Glitch count** (`n` = active students when the game starts):
- L1: `1`
- L2: `n < 10 ? 1 : floor(n / 8)`
- L3: `n < 8 ? 1 : floor(n / 7)`
- For every level, cap the count at `floor((n - 1) / 3)`, with a minimum of 1.

**L0 Practice** has no roles, sectors, Alert, or Vote. Each round is Repair, then an `intermission` screen showing the meter. The class wins if the meter reaches the goal before the rounds run out.

**L3 framing:** the Glitch's role card has a toggle, "Target: My sector / Sector ←or→". A corruption hits the chosen sector. Sectors are numbered in a ring, so "neighbor" means sector ±1 (mod count).

**Meter goal**, computed server-side when the game starts:
```
questionsPerRound = repairSeconds / 10        -- assumes ~10s per question incl. feedback
expected          = honestCount * totalRounds * questionsPerRound * 0.7   -- ~70% accuracy
meter_goal        = ceil(expected * goalFactor)
```
`honestCount` = students − glitches (for L0, all students). **These constants are tuning guesses.** Keep them in one place so they're easy to adjust after playtesting.

**Sector assignment:**
- Sector count = `max(1, ceil(activeNonGhosts / 4))`. Deal students round-robin after a shuffle, which yields sizes of 3–5.
- **Spread Glitches across different sectors** whenever the sector count allows it.

---

## 4. Database (Supabase)

### 4.1 Security model (same as Jeopardy)
- **Public tables** have RLS enabled with a single `select using (true)` policy for `anon, authenticated`. They're in the `supabase_realtime` publication. They must **never** contain roles, answers, sabotage records, or who-voted-for-whom.
- **Secret tables** have RLS enabled and **zero policies**, so the API can't read them at all. Only `SECURITY DEFINER` RPCs touch them, and each RPC first verifies a bearer secret (`host_secret` or `player_secret`).
- Every function needs `SECURITY DEFINER` + `SET search_path = public`.
- For internal helpers (`glitch_check_host`, `glitch_check_player`, `glitch_resolve_round`, …), run `revoke execute on function … from public, anon, authenticated`.
- Client-facing RPCs stay executable by `anon`. The Supabase advisor will warn about that. The warning is expected, exactly like the existing `jeopardy_*` RPCs.
- Reuse `public.jeopardy_generate_code()` for 6-character join codes.

### 4.2 Schema (migration `glitch_schema`)
```sql
-- PUBLIC (realtime)
create table public.glitch_sessions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null default 'GLITCH',
  mode text not null default 'hunt' check (mode in ('hunt','outbreak')),
  level int not null default 1 check (level between 0 and 3),
  phase text not null default 'lobby'
    check (phase in ('lobby','repair','intermission','alert','vote','reveal','ended')),
  round int not null default 0,
  total_rounds int not null default 5 check (total_rounds between 1 and 10),
  phase_ends_at timestamptz,
  meter int not null default 0,
  meter_goal int not null default 100,
  last_result jsonb,          -- public round summary, see §4.4
  winner text check (winner in ('players','glitches','healthy','infected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.glitch_players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.glitch_sessions(id) on delete cascade,
  name text not null,
  status text not null default 'active' check (status in ('active','ghost')),
  sector int,                 -- null for ghosts / lobby
  joined_at timestamptz not null default now()
);

-- SECRET (RLS on, no policies)
create table public.glitch_session_secrets (
  session_id uuid primary key references public.glitch_sessions(id) on delete cascade,
  host_secret uuid not null default gen_random_uuid(),
  settings jsonb not null,    -- level params from GLITCH_LEVELS
  questions jsonb not null    -- [{id, prompt, choices[], answer, itemId, itemName}]
);

create table public.glitch_player_secrets (
  player_id uuid primary key references public.glitch_players(id) on delete cascade,
  player_secret uuid not null default gen_random_uuid(),
  role text not null default 'player'
    check (role in ('player','glitch','healthy','infected')),
  charges int not null default 0,
  current_question_id text,
  question_served_at timestamptz,
  removed_choices int[] not null default '{}',   -- choices hidden by Scan on the current question
  shield_pending boolean not null default false, -- outbreak
  frame_target text not null default 'own' check (frame_target in ('own','left','right')), -- L3
  infect_target uuid                              -- outbreak
);

create table public.glitch_answers (
  id bigserial primary key,
  session_id uuid not null references public.glitch_sessions(id) on delete cascade,
  player_id uuid not null references public.glitch_players(id) on delete cascade,
  round int not null,
  question_id text not null,
  sector int,
  correct boolean not null,
  was_shield boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.glitch_answers (session_id, round);

create table public.glitch_sabotages (
  id bigserial primary key,
  session_id uuid not null references public.glitch_sessions(id) on delete cascade,
  player_id uuid not null references public.glitch_players(id) on delete cascade,
  round int not null,
  kind text not null check (kind in ('corrupt','expose')),
  target_sector int,
  target_player uuid,
  created_at timestamptz not null default now()
);

create table public.glitch_votes (
  session_id uuid not null references public.glitch_sessions(id) on delete cascade,
  round int not null,
  voter_id uuid not null references public.glitch_players(id) on delete cascade,
  target_id uuid references public.glitch_players(id) on delete cascade, -- null = skip
  created_at timestamptz not null default now(),
  primary key (session_id, round, voter_id)
);

-- RLS + policies
alter table public.glitch_sessions enable row level security;
alter table public.glitch_players enable row level security;
alter table public.glitch_session_secrets enable row level security;
alter table public.glitch_player_secrets enable row level security;
alter table public.glitch_answers enable row level security;
alter table public.glitch_sabotages enable row level security;
alter table public.glitch_votes enable row level security;
create policy "GLITCH sessions are publicly readable" on public.glitch_sessions
  for select to anon, authenticated using (true);
create policy "GLITCH players are publicly readable" on public.glitch_players
  for select to anon, authenticated using (true);

alter publication supabase_realtime add table public.glitch_sessions, public.glitch_players;
```
Also add an `updated_at` trigger on `glitch_sessions`, or set `updated_at = now()` in every RPC that updates it.

> **As actually deployed in Phase 1** (verified live against `xxlrpkspkvukddhbluap`): `glitch_players` and `glitch_sessions` already carry every column this section anticipated needing early — `emblem int not null`, `locked boolean not null default false`, `paused_remaining_ms int` — and the `mode`, `phase`, `role`, and `winner` check constraints already enumerate the full Phase 2/3 vocabulary (`hunt`/`outbreak`, all 7 phases, `player`/`glitch`/`healthy`/`infected`, all 4 winners). **Not** deployed yet: `glitch_sabotages`, `glitch_votes`, or the `frame_target`/`shield_pending`/`infect_target` columns on `glitch_player_secrets` — matching this project's habit of not adding a column before a phase actually reads or writes it.

#### 4.2b Phase 2 schema delta (new migration `glitch_phase2_schema`)
Only what Hidden Glitch (L1–L2) actually needs. `kind` on sabotages is scoped to `'corrupt'` only — Phase 3 adds `'expose'` via `alter table … add column` when Outbreak needs it, rather than reserving the value now.
```sql
create table public.glitch_sabotages (
  id bigserial primary key,
  session_id uuid not null references public.glitch_sessions(id) on delete cascade,
  player_id uuid not null references public.glitch_players(id) on delete cascade,
  round int not null,
  target_sector int not null,
  created_at timestamptz not null default now()
);
create index on public.glitch_sabotages (session_id, round);

create table public.glitch_votes (
  session_id uuid not null references public.glitch_sessions(id) on delete cascade,
  round int not null,
  voter_id uuid not null references public.glitch_players(id) on delete cascade,
  target_id uuid references public.glitch_players(id) on delete cascade, -- null = skip
  created_at timestamptz not null default now(),
  primary key (session_id, round, voter_id)
);

alter table public.glitch_player_secrets
  add column streak int not null default 0,
  add column best_streak int not null default 0;

alter table public.glitch_sabotages enable row level security;
alter table public.glitch_votes enable row level security;
-- zero policies on either — same "secret table" pattern as the rest.
```
Both new tables stay **off** the `supabase_realtime` publication — nothing about them is ever read directly by a client, only through RPCs.

### 4.3 RPCs
Each RPC starts with `glitch_check_host(...)` or `glitch_check_player(...)`, modeled on `jeopardy_check_host` and `jeopardy_check_player` (read them with `pg_get_functiondef`). Use `select … for update` on the session row whenever the RPC reads, then writes, phase or meter state. That is what serializes races (it's how `jeopardy_buzz` guarantees fair buzz order).

**Host RPCs** (every one takes `p_session_id uuid, p_host_secret uuid`):

| RPC | Behavior |
|---|---|
| `glitch_create_session(p_title text, p_mode text, p_level int, p_total_rounds int, p_settings jsonb, p_questions jsonb)` → `(session_id, code, host_secret)` | Validate mode/level/rounds. Require ≥ 8 questions, each with 3–4 choices and a valid `answer`. Allocate a code with a retry loop (copy `jeopardy_create_session`). Store settings and questions in secrets. |
| `glitch_start_game` | Lobby only. Require ≥ 1 student for L0 and ≥ 4 for the other levels. Assign roles per §3. Compute `meter_goal`. Then run `glitch_begin_repair` (internal): increment `round`, reassign sectors, clear everyone's `current_question_id`/`removed_choices`, set `phase='repair'` and `phase_ends_at = now() + repairSeconds`. |
| `glitch_advance(p_expected_phase text, p_expected_round int)` | **Idempotent.** If the session isn't in the expected phase/round, return without doing anything. This is how the host UI auto-advances safely when a timer hits 0. Transitions: `repair → resolve`, which then leads to `intermission` (L0) or `alert`; the win checks from §2.5 can instead lead to `ended`. Then `intermission → repair`, `alert → vote`, `vote → reveal` (tally the votes and eject), and `reveal → repair` (next round, after the win checks) or `ended`. |
| `glitch_add_time(p_seconds int)` | Extend `phase_ends_at` by 1–120 seconds. Allowed only in `repair`, `alert`, and `vote`. |
| `glitch_veto_ejection` | Allowed only in `reveal`. Restore the ejected student to `active`, and set `last_result.vetoed = true`. |
| `glitch_kick_player(p_player_id uuid)` | Delete the student's row (cascades to their secret row). |
| `glitch_vote_count` → `int` | Number of votes cast this round. Counts only; never who voted for whom. |
| `glitch_host_recap` → `jsonb` | Allowed only in `ended`. Returns every student's role, class accuracy, and the 5 most-missed questions (`itemName`, % correct). Teacher-only. |
| `glitch_end_session` | Set `phase='ended'`. The cleanup cron deletes the session later. |

**Student RPCs:**

| RPC | Behavior |
|---|---|
| `glitch_join(p_code text, p_name text)` → `(player_id, player_secret, session_id, title)` | Same validation as `jeopardy_join`, plus a **cap of 40 students**. Anyone joining after the lobby joins as `status='ghost'`. |
| `glitch_my_state(p_session_id, p_player_id, p_player_secret)` → `jsonb` | Returns `{ role, charges, scanCost, fellowInfected?, sectorMates?, frameTarget?, infectTarget? }`. **The only way a student learns their role.** |
| `glitch_next_question(...)` → `{ questionId, prompt, choices, removed, expiresAt }` | Allowed only in `repair`. If the student has an unanswered question, return that same one again; this prevents fishing for easy questions. Otherwise pick a random question this student hasn't answered this game, or any question once they've seen them all. Store `current_question_id` and `question_served_at`. **Never return the answer.** |
| `glitch_submit_answer(..., p_question_id text, p_choice int)` → `{ correct, correctIndex, charges }` | Must match `current_question_id`. Any of these count as wrong: past `question_served_at + questionSeconds + 2s`, the phase isn't `repair`, or `now() > phase_ends_at + 2s`. Insert into `glitch_answers` with the student's current sector. If the answer is correct, add +1 charge. Ghosts' correct answers add +1 to `meter` immediately. Sector points are only tallied at resolve. Clear `current_question_id`. If this was a shield question and the answer is wrong, record the pending infection. Returning `correctIndex` after answering is intentional: it's a feedback moment for learning. |
| `glitch_scan(...)` → `{ removedChoice, charges }` | Requires `charges >= scanCost` and an open current question with more than 2 visible choices. Deduct the charges, pick one wrong choice that isn't already removed, and append it to `removed_choices`. **Additionally**, depending on the role:<br>• Glitch (active, `hunt`): insert a `corrupt` sabotage into their sector, or into the frame target's sector on L3.<br>• Infected (active, `outbreak`): if `infect_target` is set and that student is healthy and active, insert an `expose` sabotage and set that student's `shield_pending = true`.<br>**The response is identical for every role.** |
| `glitch_set_target(..., p_frame_target text, p_infect_target uuid)` | Store the L3 frame target or the outbreak infect target. Validate that the infect target is a current sector-mate. |
| `glitch_cast_vote(..., p_target_id uuid)` | Allowed only in `vote`, and only for `active` students. The target must be `active`. `null` means Skip. Upsert, so a student can change their vote until the timer ends. |

**Shield questions (outbreak):** in `glitch_next_question`, when `shield_pending` is true, set it back to false and mark the served question internally as a shield. Track this with a column such as `current_is_shield boolean`; add it to `glitch_player_secrets`.

#### 4.3b Phase 2 implementation notes (grounded in the deployed Phase 1 functions)

**Untouched by Phase 2:** `glitch_next_question` and `glitch_submit_answer` need **zero changes**. Their existing rule — `if sector is null then meter += 1 directly, else just record the answer` — already generalizes: in L0 every active player has `sector = null` (direct add), and once Phase 2 starts populating `sector` for hunt-mode players, only Ghosts keep `sector = null`, so they alone still add directly. Sectored players' correct answers just accumulate in `glitch_answers` until Resolve tallies them. This is the payoff of the "sector-null-means-direct-add" design called out when Phase 1 shipped.

**`glitch_begin_repair` gains role-aware sector assignment**, gated on `(settings->>'hiddenRoles')::boolean`. L0 keeps today's behavior exactly (every `sector` stays null). For hunt/outbreak:
```sql
v_sector_count := greatest(1, ceil(active_count::numeric / 4));
-- Walk active players ordered "glitches first (each shuffled by random()), then everyone else (shuffled)"
-- and deal them round-robin into v_sector_count buckets via a running cursor:
--   sector := (cursor % v_sector_count) + 1; cursor := cursor + 1;
-- Putting glitches first in that ordering means they land in *different* buckets
-- (0, 1, 2, ... mod sector_count) before honest players start filling in behind them —
-- the simplest ordering that satisfies "spread Glitches across sectors whenever the count allows it."
```
This also means sectors are reassigned on **every** call to `glitch_begin_repair`, i.e. every round — matching "the grouping changes every round" in §2.2.

**`glitch_start_game` gains role assignment**, before its existing `glitch_begin_repair` call: when `hiddenRoles` is true, pick `glitchCount(level, activeCount)` active player ids at random (`order by random() limit n`) and set their `role = 'glitch'`; use `honestCount = activeCount - glitchCount` (instead of `activeCount`) in the meter-goal formula. `glitchCount()` needs a SQL mirror of the pure `glitchCount()` helper in `glitch.ts` — keep both in sync the same way `computeMeterGoal()` already has a documented JS/SQL parity requirement, and cover it with the same kind of parity test.

**`glitch_advance` grows two new phase branches and the `repair` branch forks on `hiddenRoles`:**
- `repair` (hunt/outbreak fork): tally correct answers per sector (`glitch_answers` grouped by `sector`, `round = current`), mark a sector `corrupted` if it has any row in `glitch_sabotages` for that `session_id + round + target_sector`, sum points from **un**corrupted sectors, add the Ghosts' direct total on top, write `last_result = {round, meterGained, sectors: [{sector, playerIds, corrupted}, …]}`, then run win checks #1–#2 (§2.5) → `ended` or → `alert` with `phase_ends_at = now() + discussionSeconds`.
- `alert` → `vote`, `phase_ends_at = now() + voteSeconds`.
- `vote` → tally with the **same tie/skip logic as the pure `tallyVotes()` helper** (plurality; a tie at the top or Skip ≥ the leader means no ejection), set the ejected player's `status = 'ghost'` and `sector = null` if any, **merge** (`last_result || jsonb_build_object(...)`, not overwrite — Resolve's `sectors`/`meterGained` must survive) in `{votes, ejectedId, ejectedWasHidden, vetoed: false}`, then move to `reveal` **with no `phase_ends_at`** (host-paced, like `intermission`).
- `reveal` → run win checks #3–#4 (§2.5) against the *current* roster (after any veto) → `ended`, or `glitch_begin_repair` for the next round.

**New RPCs**, all following the existing `check_host`/`check_player` + `for update` pattern:
| RPC | Behavior |
|---|---|
| `glitch_my_state(p_session_id, p_player_id, p_player_secret)` → `jsonb` | `{role, charges, scanCost, streak, bestStreak}`. The only way a student learns their role. Fetched on mount and on refresh-recovery; `charges`/`streak` also arrive incrementally via `glitch_submit_answer`'s response, this is just the source of truth on (re)load. |
| `glitch_scan(p_session_id, p_player_id, p_player_secret)` → `{removedChoice, charges}` | Requires `phase='repair'`, not paused, an open (`current_question_id is not null`) and unexpired current question, `charges >= scanCost`, and at least 3 still-visible choices (`totalChoices - array_length(removed_choices,1) > 2`) so a hint never collapses the question to one option. Deducts `scanCost`, appends a random not-yet-removed wrong index to `removed_choices`. **Then, only for `role='glitch'`:** insert one row into `glitch_sabotages` (`target_sector` = the scanning player's own sector — L3's frame targeting is Phase 3). The response shape is identical for every role; nothing distinguishes a Glitch's call from a Player's. |
| `glitch_cast_vote(p_session_id, p_player_id, p_player_secret, p_target_id uuid \| null)` → `void` | Requires `phase='vote'` and the caller `status='active'`; `null` means Skip. If `p_target_id` is set, it must be an `active` player in the same session. Upserts on the `(session_id, round, voter_id)` primary key, so a changed mind before time's up just overwrites. |
| `glitch_vote_count(p_session_id, p_host_secret)` → `int` | Host-only (matches its listing as a Host RPC) — count of rows in `glitch_votes` for the session's current round. Reveals a count only, never who voted for whom. Powers the projector's "X / Y votes in" and the "N haven't voted" nudge (§10.3). |
| `glitch_veto_ejection(p_session_id, p_host_secret)` → `void` | Requires `phase='reveal'`, `last_result->>'ejectedId'` not null, and not already vetoed. Restores that player's `status='active'` and merges `{vetoed: true}` into `last_result`. Because the reveal→repair win checks (#3–#4) run *after* this is possible, a veto can genuinely change the outcome, not just annotate history after the fact. |

### 4.4 `last_result` (public JSON, written in two stages that **merge**, not overwrite)
`repair → alert` writes the first shape below; `vote → reveal` merges (`last_result || jsonb_build_object(...)`) the second shape on top, so a client reading `last_result` during `reveal` sees both at once. This merge is a deliberate change from Phase 1, where `last_result` was always a single full replace (fine for L0, which only ever writes it once per round).
```jsonc
// written at repair → alert (or repair → intermission for L0, unchanged)
{
  "round": 2,
  "meterGained": 41,
  // hunt only:
  "sectors": [ { "sector": 1, "playerIds": ["…","…"], "corrupted": true }, … ]
  // outbreak only (Phase 3): "newInfections": 1
}
// merged in at vote → reveal:
{
  "votes": [ { "targetId": "…", "count": 5 }, { "targetId": null, "count": 3 } ],
  "ejectedId": "…" | null,
  "ejectedWasHidden": true | false | null,   // null when nobody was ejected, or the level hides roles (L3)
  "vetoed": false                            // flips to true if the host calls glitch_veto_ejection
}
```

### 4.5 Retention and privacy (required)
- Replace the cleanup cron with `public.cleanup_old_live_sessions()`. It deletes from **both** `jeopardy_sessions` and `glitch_sessions` where `created_at < now() - interval '7 days'`. Unschedule `cleanup-old-jeopardy-sessions`, schedule the new job daily at `17 3 * * *`, and drop the old function. Revoke execute from public/anon/authenticated.
- In `src/components/LegalPage.tsx`, update the Privacy Policy. "Only live Jeopardy talks to a server" must become "live Jeopardy **and GLITCH** games". List what GLITCH stores: first name, answers and correctness, Scan and vote activity, and roles. Both games follow the same 7-day auto-delete.
- Update `PrivacyNotice.tsx` copy and the Terms page to match.

---

## 5. Question generation (client, pure, unit-tested)

Add `buildGlitchQuestions(deck, filterId, selectedItemIds, level, seed)` to `src/lib/glitch.ts`:
- Items: `eligibleMemoryItems(deck, filterId, selectedItemIds)`. It already guarantees each item's `pairLabel()` is unique, which avoids ambiguous questions such as two elements that are both "Nonmetal, period 3."
- **clue→term:** prompt `Which term matches: “{pairLabel(item)}”?`. The choices are item names.
- **term→clue:** prompt `Which matches {item.name}?`. The choices are `pairLabel()` values.
- `directions: 'mixed'` produces both directions for every item.
- Distractors come from other items in the same pool. When `tagMatchedDistractors` is on, prefer items that share a tag with the answer item, then fill from the rest of the pool.
- Shuffle the choices, and record `answer` as the index of the correct choice.
- Make it deterministic with `createRng(seed)` / `shuffle` from `src/lib/rng.ts`, the same way Memory uses a game code.
- Cap the bank at 200 questions. Question ids look like `${itemId}:${direction}`.
- Also export `glitchQuestionCount(...)` so the setup screen can show "N questions available" and **block hosting below 8**.

Unit tests go in `src/__tests__/glitch.test.ts`:
- Choices are unique.
- The answer is always among the choices.
- The choice count matches the level.
- Output is deterministic per seed.
- No duplicate labels.
- Tag-matched distractors are used when available.
- Throws or blocks when there are fewer than 8 items.

Also add pure helpers with tests for glitch count, meter goal, and the vote tally. Mirror those formulas in SQL.

---

## 6. Frontend

### 6.1 New files
| File | Purpose |
|---|---|
| `src/lib/glitch.ts` | Types (`GlitchSessionRow`, `GlitchPlayerRow`, `GlitchLevel`…), `GLITCH_LEVELS`, question builder, formula helpers, RPC wrappers (copy the `call<T>` pattern), `subscribeToGlitchSession` (realtime on `glitch_sessions` + `glitch_players`), and credentials in **sessionStorage** under `classbingo:glitch-host-session` and `classbingo:glitch-player-session` so a refresh resumes the game. |
| `src/components/GlitchSetup.tsx` | Teacher setup after picking a playset. Mirror `MemorySetup.tsx`: filter plus optional `ItemPicker`, level cards (L0–L3 with a one-line description each), mode (Outbreak only if the level allows it), rounds (default from level), a live "N questions available" count, and a **Host game** button. |
| `src/components/GlitchHost.tsx` | Projector screen (§6.3). |
| `src/GlitchPlayApp.tsx` | Student entry at `/?glitch` (§6.4). |
| `src/styles/glitch.css` | Styles. Import in `src/main.tsx` next to `jeopardy.css`. |

### 6.2 Wiring existing files
- `src/lib/gameConfig.ts`:
  - Add `'glitch'` to `GameMode` and `GAME_MODES`.
  - Add `GAME_MODE_LABEL.glitch = 'GLITCH'` and a `GAME_MODE_TAGLINE`, e.g. "Repair the machine. Find the glitch. Trust no one."
  - Add views `'glitch-setup' | 'glitch-host'`.
- `src/components/NavIcons.tsx`: add a `GlitchIcon` in the same stroke style. Register it in the `MODE_ICON` maps in **both** `Sidebar.tsx` and `LandingPage.tsx`; TypeScript will flag them.
- `src/App.tsx`:
  - Sidebar "GLITCH" already routes to `libraryMode='glitch'` + `view='home'`, which shows the playset library.
  - `handlePickDeck` currently sends every non-memory mode to Bingo setup. **Add a `glitch` branch** that opens `glitch-setup` with the chosen deck.
  - Add `glitch-setup` and `glitch-host` render branches. Resume a saved host session on load, mirroring `loadHostSession()` for Jeopardy.
- `src/components/DeckPicker.tsx`: set the eyebrow copy for `glitch` to "SOCIAL DEDUCTION" and the tile label to "Play GLITCH".
- `src/components/LandingPage.tsx`: change the `STATS` entry "3 Game modes" to 4, and add GLITCH to the hero copy and the "Launch it live" step text (both currently list only Bingo/Memory/Jeopardy).
- `index.html`: add GLITCH to the `<meta name="description">` game list.
- `src/main.tsx`: a `?glitch` query param renders `<GlitchPlayApp />`. Keep `?play` → Jeopardy unchanged.
- `README.md`: add GLITCH to the game list.

### 6.3 Host (projector) screen
- **Top bar:** join code (large) + join URL `${location.origin}/?glitch`, round `x / total`, a phase label, a countdown timer, and End Game.
- **System Meter:** a large bar with the goal marker, always visible. It reads "Cure" in Outbreak.
- **Lobby:** a roster of names that appear live, with kick (×) buttons. Start is enabled once the minimum player count is met.
- **Repair:** meter plus timer, and the number of students answering. **Don't** show live per-sector progress; that would reveal corruption early.
- **Intermission (L0):** meter change for the round, and a Next button.
- **Alert:** the evidence board, one card per sector with member names and **Clean** or **CORRUPTED** (hunt), or "N new infections" (outbreak). Also a discussion timer and "+30s".
- **Vote:** timer, "X / Y votes in", and a Close vote button.
- **Reveal:** vote totals per name, then the ejected student and, if the level allows, whether they were a Glitch. Offer **Veto** and **Next round**.
- **Ended:** the winner banner. Unmask every role via `glitch_host_recap`, and show the most-missed questions.
- **Auto-advance:** when `phase_ends_at` passes, call `glitch_advance(expectedPhase, expectedRound)`. It's idempotent, so double calls are harmless. Always offer a manual "Next" button too.
- **Clock skew:** compute a client offset once, from an RPC that returns `now()` (add a tiny `glitch_now()`) or from row timestamps.

### 6.4 Student screen (`GlitchPlayApp`)
- **Join:** code + first name. Copy `JeopardyPlayApp`'s form and error handling.
- **Lobby:** "You're in! Waiting for the teacher…" plus a roster.
- **Always visible during the game:** name, charge counter, **Scan** button (disabled when there aren't enough charges), and a **Hold to view role** button. The role card shows only while it's held (pointer down/up plus touch). It holds the role, fellow infected (Outbreak), the frame toggle (L3 Glitch), and the infect target picker (Outbreak).
- **Repair:**
  - A question card with big choice buttons. Keys `1`–`4` answer too.
  - Removed choices are greyed out.
  - Brief feedback after each answer (✔ / ✘ plus the correct answer), then auto-fetch the next question.
  - Show the per-question countdown.
- **Alert:** "Discuss! Look at the board."
- **Vote:** a list of active names plus Skip. The current selection can be changed until the timer ends.
- **Reveal:** result text that mirrors the projector.
- **Ghost:** a banner reading "You're a ghost — keep repairing!" Questions keep working; there's no vote UI and no sabotage effect.
- **Ended:** winner, plus "You were a Glitch / Player."
- Re-fetch `glitch_my_state` whenever a new round starts; roles can change in Outbreak.

### 6.5 Theming
- **`src/styles/modern.css` is the current design source of truth.** It loads after the other feature stylesheets and deliberately gives the Arcade theme a restrained, sleek look (Linear-inspired): it sets `--glow-*` to `transparent`, points `--font-arcade` at the body font, and removes the background effects. Match that language. **Don't** reintroduce neon glows, scanlines, or pixel fonts.
- Use theme tokens (`--bg-card`, `--border`, `--accent`, `--danger`, `--radius`), and `--ease-product` for motion. Respect `prefers-reduced-motion`.
- For list/grid entries that animate in, use the existing `Reveal` component (`src/components/Reveal.tsx`), as `DeckPicker` does.
- Must look right in all four themes (Arcade, Dark, Light, High contrast).
- Tension comes from content, not effects: a clear meter, a crisp "CORRUPTED" state that uses `--danger`, and a large, tabular-numeral timer.
- Theme init in `GlitchPlayApp`: copy `JeopardyPlayApp`, which uses `normalizeTheme(loadState('ui:theme'))`.

---

## 7. Edge cases to handle
- A student refreshes mid-game: sessionStorage credentials plus `glitch_my_state` and `glitch_next_question` (which returns the same unanswered question) restore them.
- The host refreshes: the host session resumes from sessionStorage, and state comes from the row.
- A Glitch is kicked mid-game: the win checks still run at the next resolve/reveal.
- Everyone skips the vote: nobody is ejected.
- Only one sector exists (small class): evidence is weak, which is fine. L1 needs at least 4 students.
- A late joiner becomes a Ghost.
- A student scans with no open question: return a friendly error. Don't deduct charges.
- The playset has fewer than 8 eligible items: block hosting in setup with a clear message.

---

## 8. Verification

**Backend (SQL):** after each migration, run a `DO $$ … $$` script through the Supabase SQL tool. It should create a session, join 6 fake students, start the game, answer and scan as various roles, advance through every phase, vote, and assert on meter, winner, and roles. Hard-won lessons from building Jeopardy's tests:
- An exception inside a `DO` block rolls back **everything** since the block started. Wrap each *expected-to-fail* call in its own nested `begin … exception when others then … end;`.
- Temp tables don't survive between separate SQL tool calls; each call is a new connection. Recreate them at the top of every script.
- After `set local role anon;` you can't write to a temp table the privileged role created. Run anon-secrecy checks as their own small script: as `anon`, `select` from each secret table and confirm zero rows or a permission error.
- Watch `select … into` targets. Assigning a column into the wrong record variable silently corrupts later calls.
- Then run `get_advisors` (security). The only acceptable new warnings are "anon can execute SECURITY DEFINER" on **client-facing** RPCs.

**Frontend:**
- Vitest for `glitch.ts` pure helpers (§5).
- `npx tsc -b`, `npx vitest run`, `npm run build`.
- Playwright against `npx vite` for screens that don't need the network: setup-screen validation, level cards, join form rendering, and all four themes.
- Live multiplayer is tested by the owner on real devices after deploy.

---

## 9. Build phases

Commit after each phase with a clear message. Each phase lists its acceptance criteria.

### Phase 1: L0 Practice (co-op, no roles)
- **Tables:** `glitch_sessions`, `glitch_players`, `glitch_session_secrets`, `glitch_player_secrets` (role/charges columns can exist but go unused), `glitch_answers`.
- **RPCs:** create, join, start, next_question, submit_answer, advance (`repair ↔ intermission → ended`), add_time, kick, end, `glitch_now`, check helpers.
- **Cleanup:** the new `cleanup_old_live_sessions` cron.
- **Code:** `glitch.ts` (builder, levels, wrappers), `GlitchSetup` (L0 only is fine), `GlitchHost` (lobby / repair / intermission / ended), `GlitchPlayApp` (join / lobby / question loop / ended), and all wiring from §6.2.
- **Also:** Privacy/Terms/notice updates, plus every **[P1]** item in §10 (emblems, pause, lock room, host shortcuts, connection indicator, wake lock, named rounds, learning feedback, name filter…).
- ✅ **Acceptance:** a SQL script plays a full 2-round L0 game, including a pause/resume and a locked-room join rejection; the meter reaches its goal and `winner` is set. The UI renders in all themes. Tests and build pass.

### Phase 2: Hidden Glitch, Levels 1–2
- **Schema:** apply `glitch_phase2_schema` (§4.2b) — `glitch_sabotages`, `glitch_votes`, `streak`/`best_streak` on `glitch_player_secrets`. No other tables or columns.
- **RPC changes:** rewrite `glitch_begin_repair` (role-aware sector assignment), `glitch_start_game` (role assignment + honest-count-based meter goal), `glitch_advance` (the four new phase branches in §4.3b); add `glitch_my_state`, `glitch_scan`, `glitch_cast_vote`, `glitch_vote_count`, `glitch_veto_ejection`. `glitch_next_question` and `glitch_submit_answer` are unchanged — confirm that explicitly in review rather than re-deriving their logic.
- **Streak bonus in `glitch_submit_answer`:** on a correct answer, `streak += 1` (reset to 0 on wrong), `best_streak := greatest(best_streak, streak)`, and every `streak % 3 == 0` grants **+1 bonus charge** on top of the normal +1 — so a 3-streak's third correct answer nets +2 charges that call. Return `streak`/`bestStreak` in the response (extends `GlitchAnswerResult`).
- **UI:** hold-to-peek role card, charge pips + Scan (with the affordability ring), alert board (evidence reveal), vote screen with a live selection + "vote locked" state, reveal screen with a Veto button (visible only while `phase='reveal'` and `ejectedId` isn't null and not yet vetoed), ghost state, plus every **[P2]** item in §10 (level cards for L1/L2, glitches-remaining counter, lobby tips, private streaks, detective notes, evidence/vote reveals, result lines, vote nudge, role unmask grid, student end-of-round summary…).
- ✅ **Acceptance** (SQL scripts against the live project, mirroring Phase 1's approach):
  1. A 6+ student L1 game where the class ejects the actual Glitch: `ejectedWasHidden = true`, the next `reveal → repair` win check finds zero active Glitches, `winner = 'players'`.
  2. A game where the meter falls short in the final round: winner is set at `repair → alert` (`glitches`), and Alert/Vote/Reveal are skipped entirely for that round (phase goes straight to `ended`).
  3. A wrongful ejection followed by `glitch_veto_ejection`, then `glitch_advance` from `reveal`: the vetoed player is `active` again *before* the win check runs, and the check's outcome reflects that (i.e. construct a case where the veto is the only thing standing between "everyone's a ghost but one honest player" and a Glitch win).
  4. A 3-answer-streak grants exactly one bonus charge on the 3rd correct answer, verified against `glitchCount()`'s SQL mirror and `computeMeterGoal()`'s existing parity pattern — add a matching parity check for `tallyVotes()` against the SQL vote-tally query (tie-at-top and Skip-wins-the-tie cases specifically).
  5. `anon` reading `glitch_sabotages` or `glitch_votes` directly returns zero rows (RLS, no policies) — same check pattern as the existing three secret tables.
  6. `glitch_scan`'s response shape (`{removedChoice, charges}`) is byte-for-byte identical for a `role='player'` caller and a `role='glitch'` caller in the same round; only a direct read of `glitch_sabotages` (as an internal SQL check, never as a client) shows the difference.

### Phase 3: Level 3 + Outbreak
- **L3:** hidden role on ejection, framing a neighbor sector, tag-matched distractors.
- **Outbreak:** infected roles, target picker, expose → shield question → infection at resolve, the Cure meter, "N new infections" evidence, the quarantine vote, and Outbreak win conditions.
- **Also:** every **[P3]** item in §10.
- ✅ **Acceptance:** SQL scripts cover an infection spreading through a failed shield question, a successful shield blocking it, and each Outbreak win path.

### Phase 4: Polish
- Sound design and meter milestones / "CLUTCH REPAIR" (§10.3).
- `glitch_host_recap` screen: most-missed questions → "Make a review playset from these", plus positive awards (§10.4).
- Rematch with the same code and roster (§10.4).
- Suggested next level (§10.1).
- A short "How to play" panel on `GlitchSetup` and the student lobby.
- ✅ **Acceptance:** a SQL script runs a full game, then a rematch, and confirms students stay joined with fresh state. The most-missed list saves as a playable local playset. It's a polished, playable class game in all themes.

---

## 10. Small details that make it feel like a game

These details are what separate "a quiz with roles" from a game students ask for again. Each item is tagged with the phase it ships in: **[P1]**–**[P4]**. **Build every item tagged for a phase as part of that phase**, not as an afterthought.

Four rules apply to every detail:
- **Personal stats stay private.** They show only on that student's own device, never on the projector.
- **Public highlights are positive only.** Never rank the "worst" anything.
- **Motion respects `prefers-reduced-motion`.**
- **Nothing is persisted beyond the session**, except where "local" is stated.

### 10.1 Level flavor
| Detail | Phase |
|---|---|
| **Level cards with real numbers.** Each card shows a difficulty pip bar (1–4), a "Best for" line (L0 *First day / warm-up*, L1 *First real game*, L2 *Regular review*, L3 *Test prep / challenge day*), a **live Glitch-count preview for the current roster** ("With 24 students → 3 Glitches"), and an estimated length ("~20 min"). The estimate is computed from `repairSeconds`, `discussionSeconds`, `voteSeconds`, and rounds. | P1 (L0 card), P2 (rest) |
| **Level badge identity.** Practice, Rookie, Pro, and Legend each get a distinct badge. Define per-level accent tokens in `glitch.css` for all four themes. The badge appears on setup, the projector top bar, and student lobbies. | P1 |
| **Named rounds.** Rounds get system-stage names: 1 *Boot Sequence*, 2 *Memory Check*, 3 *Core Scan*, 4 *Firewall*, 5 *System Restore*, 6 *Final Patch*. Display as "ROUND 3 · CORE SCAN". | P1 |
| **Final-round callout.** A "FINAL ROUND" badge appears. The goal marker on the meter gently emphasizes. The host sees "Needs 58 more" next to the meter. | P1 |
| **Glitches-remaining counter.** L1–L2: "Glitches remaining: 2". L3: "Glitches remaining: ?". | P2 / P3 |
| **Lobby tips.** Rotating one-line tips on both the projector and student lobby, specific to the level and mode. Examples: "A name that shows up in two corrupted sectors is a strong clue." / "Scanning costs charges — every correct answer earns one." | P2 |
| **Suggested next level (local).** Keep a per-level "games hosted" count in the teacher's `localStorage` via `saveState`. After 3 games on a level, the setup screen suggests the next one ("You've run Rookie 3 times — ready for Pro?"). | P4 |

### 10.2 Student device
| Detail | Phase |
|---|---|
| **Emblems.** On join, each student gets a random emblem, a shape (● ▲ ■ ◆ ★ ⬢) plus one of 8 token colors, unique within the session where possible. It shows beside their name everywhere. This keeps the projector scannable and tells apart two students named "Alex". Store it as a public `emblem int` column on `glitch_players`. | P1 |
| **Duplicate names.** `glitch_join` auto-suffixes duplicates: "Alex", "Alex 2". | P1 |
| **Question-card timer bar.** A thin bar drains across the top of the card. For the last 5 seconds it switches to `--danger`. | P1 |
| **Numbered choices.** Choice buttons show key hints `1`–`4`. The picked choice gets a short "lock-in" press state before the result appears. | P1 |
| **Learning feedback.** On a wrong answer, show the correct pairing in full ("**Sodium** — Alkali metal, period 3") for about 1.5s before the next question. On a right answer, show a quick ✔. Include `itemName` and `pairLabel` in the submit response for this. | P1 |
| **Private streaks.** Count consecutive correct answers on the device: "🔥 3 in a row". Every **3-streak awards +1 bonus charge**, which rewards accuracy without public pressure. Track `streak` and `best_streak` in `glitch_player_secrets`, return them from `glitch_submit_answer`, and use `best_streak` for awards (§10.4). | P2 |
| **Charge pips + Scan ring.** Show charges as pips (●●○). The Scan button carries a progress ring that fills toward `scanCost` and gets a subtle "ready" state once it's affordable. | P2 |
| **Personal round summary.** At the end of each Repair, the student's own device shows "You answered 7 · 5 correct · +6 charges" and never displays it anywhere else. | P2 |
| **Role reveal moment.** At game start the device shows "Your role is ready — press and hold to view." The first hold plays a card flip. Call `navigator.vibrate(60)` where supported, i.e. phones; Chromebooks just skip it. | P2 |
| **Detective notes (local only).** During Alert and Vote, tapping a name cycles its mark: none → 🤔 suspicious → ✅ cleared. The marks live in component state only and are **never sent to the server**. Marks carry over between rounds and reset at game end. | P2 |
| **Vote clarity.** The current pick is highlighted, with the note "You can change your vote until time's up." When time runs out, the screen switches to a "Vote locked" state. | P2 |
| **Ghost mode.** The UI desaturates slightly and shows a ghost badge plus "Your repairs still count." The vote and role controls disappear. | P2 |
| **Connection indicator.** A small status dot: green = live, amber = reconnecting. Show a "Reconnecting…" banner, then refetch the session and `glitch_my_state` when the realtime channel recovers. School Wi-Fi drops a lot. | P1 |
| **Keep the screen awake.** Request a Screen Wake Lock (`navigator.wakeLock`, where supported) while the game is active, and re-acquire it on `visibilitychange`. | P1 |
| **Readable questions.** Question text is at least 20px on the device, left-aligned, and uses the body font. CORRUPTED/Clean states always pair an icon with text, never color alone. | P1 |

### 10.3 Projector / host
| Detail | Phase |
|---|---|
| **Lobby.** Names pop in with their emblems, under a big "18 joined" counter. The join URL and code are huge in the lobby, then shrink to a top-bar chip once the game starts. **Optional:** a QR code for students on phones, using a small QR library; leave it out if it adds a heavy dependency. | P1 |
| **Lock room.** A host toggle stops new joins, e.g. once class has started. Add a public `locked boolean` column on `glitch_sessions`; `glitch_join` rejects joins while it's set. | P1 |
| **Pause.** The host can pause the timers for interruptions like a fire drill or a question from the office. Add a `paused_remaining_ms int` column on `glitch_sessions`: while paused, `phase_ends_at` is null. While paused, submits and scans are rejected with a friendly message, and student devices show "Paused by teacher." Add a `glitch_pause(p_paused bool)` RPC. | P1 |
| **Host keyboard shortcuts.** `Space` = Next/advance, `P` = pause/resume, `=` = +30s, `F` = fullscreen, `M` = mute. These mirror the existing Bingo caller shortcuts. Show a small "?" legend. | P1 |
| **Live activity equalizer.** During Repair, a subtle bar visualizer pulses with answers per second across the whole class. It carries **no** correctness or sector information, so it shows energy without leaking anything. The host already receives the answering count, so derive it from that. | P2 |
| **Evidence reveal.** In Alert, sector cards reveal one at a time, about 400ms apart, like a diagnostic readout. With reduced motion, show them all at once. | P2 |
| **Vote tally reveal.** In Reveal, vote bars grow one name at a time before the result line. | P2 |
| **Result lines.** These must be original, not Among Us phrasing. Glitch found: "**GLITCH FOUND** — Maya". Wrong student: "**SCAN CLEAN** — Maya was not a Glitch". L3 with roles hidden: "**SIGNAL LOST** — Maya's identity is unknown". No ejection: "**NO CONSENSUS** — the system stays as-is". | P2 |
| **Vote nudge.** "3 students haven't voted" appears in the last 10 seconds (a count, never names). | P2 |
| **Meter milestones.** Tick marks at 25/50/75% of the goal, each with a soft chime when crossed. **"CLUTCH REPAIR"** banner if the goal is crossed in the last 10 seconds of a Repair. | P4 |
| **Sound design.** Use `src/lib/sound.ts` (mute with `M`, off by default in the student app): a tick for the last 5 seconds, a chime at 10 seconds left, a corruption alert when an Alert shows a CORRUPTED sector, a vote-reveal sting, and win/lose stings. | P4 |

### 10.4 End of game
| Detail | Phase |
|---|---|
| **Role unmask grid.** Every student's emblem and name, with their role revealed one card at a time. Glitches get a distinct outline. | P2 |
| **Positive awards (host can toggle off).** Up to 4, each only if earned. **Top Repairer** (most correct). **Streak Master** (highest `best_streak`). **Sharpest Detective** (most votes cast for actual Glitches). **Sneakiest Glitch** (most corruptions without being ejected). Compute them in `glitch_host_recap` and show them on the projector. | P4 |
| **Most-missed → new playset.** The recap lists the 5 most-missed items. A **"Make a review playset from these"** button saves those items as a local custom playset (reuse `newPlayset()` from `src/lib/playsets.ts`, like "Save this selection"), so the class can drill them next in Bingo or Memory. | P4 |
| **Rematch.** "Play again" resets the **same session** to `lobby` with the same code, and joined students stay connected: roles are cleared, `round = 0`, the meter resets, votes, sabotages, and answers for that session are deleted, and every student is set back to `active`. Add a `glitch_rematch` host RPC. The host can change the level before restarting. | P4 |
| **Student end screen.** Winner, their own role, and a private personal line: "You answered 34 · 🔥 best streak 7." | P2 |

### 10.5 Classroom guardrails
| Detail | Phase |
|---|---|
| **Name filter.** `glitch_join` rejects names that match a small server-side blocklist of common profanity; keep the list short and in SQL. Show a generic "Please choose a different name" error. The host can always kick. | P1 |
| **Late joiners.** They see "Game in progress — you'll join as a Ghost and can still repair." | P1 |
| **Join rejection messages.** Friendly, specific errors for: room locked, game ended, room full (40), and bad code. | P1 |

**Schema deltas this section adds to §4.2:**
- `glitch_players.emblem int not null`
- `glitch_sessions.locked boolean not null default false`
- `glitch_sessions.paused_remaining_ms int`
- `glitch_player_secrets.streak int not null default 0` and `best_streak int not null default 0`

**New RPCs:** `glitch_pause`, `glitch_set_locked`, `glitch_rematch`.

---

## 11. Out of scope (don't build)
- Avatars, maps, movement, or anything resembling Among Us visuals or terms ("crewmate," "impostor," "vent," "emergency meeting").
- In-app text chat. Discussion happens out loud in class.
- Accounts or login.
- Persisting results beyond the 7-day auto-delete.
