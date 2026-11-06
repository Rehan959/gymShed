# GymShed Kickoff Plan — rename, themes, full self-hosting

Branch: main · Author: /autoplan session · Date: 2026-11-04

## Premises (confirmed by user)

1. **Name = GymShed.** Full rename openGym → GymShed / gymshed.
2. **Rename depth = full.** Every occurrence: UI, i18n strings, packages, docker image
   names, CI, docs, website. Existing deployments tracking old image tags will need to
   re-point at the new registry — accepted.
3. **Themes = both.** More seasonal drops (existing pattern) AND new permanent base
   themes (AMOLED black, sepia, high-contrast).
4. **Self-hosting = build from source.** Break the `docker compose pull` → ghcr.io /
   registry dependency; everything must build and run from a git clone alone.

## What already exists (do not re-invent)

| Sub-problem | Existing code |
|---|---|
| Rename surface | `grep -rli opengym` → 275 files; scripted sed + manual review |
| Seasonal theme pattern | `frontend/src/lib/seasonal.js` (THEMES array, windows, auto/on/off), `seasonal/<id>.jsx` art loaded on demand (`components/Seasonal.jsx`) |
| Theme/accent CSS variable system | `frontend/src/index.css` (`:root[data-theme=…]`, per-accent `--acc-ink` contrast table 4.5:1) |
| Theme picker UI | `frontend/src/views/Settings.jsx:1039` (THEMES.map) and season choice rows |
| Source builds | `docker compose up -d --build` already works; multi-stage Dockerfiles embed Node; web image ships exercise animations (~80 MB), no first-run download |
| Local LLM coach | `api/coach/core/providers.js` — Ollama/LM Studio/llama.cpp baseUrl providers with `keyOptional` |
| Analytics is opt-in | Umami only injected when `VITE_UMAMI_SRC`/`VITE_UMAMI_ID` are set — self-hosters who never set them fetch nothing |

## Work item 1 — Rename to GymShed (full)

Mechanical core: `sed`-style replacement of `openGym` → `GymShed`, `opengym` →
`gymshed`, `OPENGYM` → `GYMSHED` across the 275-file surface, then hand-review of:

- Display typography: "GymShed" (camel, one word) — README hero, `frontend/public/manifest.json`
  name/short_name, `capacitor.config.json` appName + appId (`ch.duartesantos.opengym` → new
  app id; NOTE: store listings can't keep an existing ID when it changes — flagged risk),
  `RP_NAME` default in `.env.example`, page `<title>`, sw.js notification fallback.
- Identifiers: package names (`opengym-frontend`, root), vite plugin names, sw cache keys
  (`opengym-rt-…`, `opengym-device`, `opengym-media-v1` — bump so old caches don't collide),
  docker-compose project `name:`, image refs `ghcr.io/duartesantos8/opengym-{api,web}` →
  user's new registry/repo, `.github/workflows/docker-publish.yml`, `.gitlab-ci.yml`,
  `helm/`, `kubernetes/`, `mcp/`, `watch-zepp/app.json`, `frontend/garmin/*` strings + the
  generator `garmin-strings.mjs` (16 languages), `ios/ci/widget-strings.mjs`, iOS/Android
  fastlane metadata.
- URL anchors: `opengym.ch` links across README/docs/website become new home (user's
  domain TBD — placeholder `gymshed.app` until confirmed), trendshift/buymeacoffee
  badges are upstream project support links — REMOVE, they point at Duarte's accounts.
- Deep-link scheme `https://opengym.ch/nfc`, `…/r` in `api/integrations/*` → new origin,
  kept as relative paths where possible so any origin works.

Verification: `grep -ri opengym --exclude-dir=node_modules --exclude-dir=.git` returns
zero hits; `npm test` in frontend + api suites pass; `docker compose build` succeeds.

## Work item 2 — Themes

**2a. Base themes (permanent):** add `data-theme` values to `frontend/src/index.css`:
- `amoled` — pure black surfaces (also saves OLED battery), distinct-elevation hairlines.
- `sepia` — warm paper background, low blue-light, darkish ink.
- `contrast` — high-contrast for accessibility (thicker hairlines, max ink contrast).
Each needs a full `--acc-ink` / `--on-acc` re-check against the 8 accents
(contrast table pattern is already in index.css:155-191). Theme picker grows from
(light/or System) to (System/dark/light/amoled/sepia/contrast).

**2b. Seasonal drops:** add to `THEMES` in `lib/seasonal.js` + one `seasonal/<id>.jsx`
each, following the halloween/christmas shape (choices auto/on/off, optional colors
override, optional workout decoration, optional app icon):
- `newyear` — [12,31]-[1,1] wrap (window-wrap already supported: "A window may wrap the new year").
- `valentine` — [2,10]-[2,15], pink accent.
- `summer` — [6,1]-[8,31], long window.
- `pride` — [6,20]-[6,30] (overlaps summer; first-win rule applies — document order).
- `easter` — NOT a fixed window: computed date. seasonal.js needs a `when(now)` hook or a
  precomputed window table for movable feasts; flag as an engineering detail, not a blocker.

## Work item 3 — Self-hosting (build from source)

1. `docs/SELF_HOSTING.md` §1 becomes build-first: `docker compose up -d --build` is the
   default five-minute path; `docker compose pull` documented as the optional convenience.
2. Compose: keep the `image:` lines only as tags you push to; add a comment showing how to
   strip them (`image:` removed → always builds locally) or an optional
   `docker-compose.registry.yml` for those who keep their own registry.
3. New doc section: "Your own registry" (self-hosted `registry:2` or Harbor) — build,
   tag, push locally; helm/kubernetes consumers point at it.
4. Runtime audit (must.be verified during execution, not assumed): confirm the built app
   fetches nothing external at runtime — fonts bundled or local, animations bundled,
   exercise catalogue embedded, push/VAPID keys self-generated, `VITE_UMAMI_*` left unset
   = zero external script loads. Anything found reaching out gets inlined or dropped.
5. AI Coach: docs snippet for pointing at a local Ollama/LM Studio endpoint in the admin
   dashboard (feature already exists; just document it under self-hosting).

## NOT in scope (deferred)

- Store listing / Fastlane metadata regeneration for iOS/Android releases (needs app-store
  account; ID change means new listings).
- New seasonal art direction review with the design-review skill — one pass per new theme
  at execution time instead.
- Rebranding the live demo / discord / website domains (owner's DNS decisions).

## 12-month delta

This plan takes the fork from "openGym fork sharing upstream's identity" to a
distinctly-named, fully-source-buildable, offline-ish product. It does not by itself
grow features; it changes whose name is on the box and what the box depends on.

## Risks

R1 — appId change breaks Android/iOS upgrade paths for any existing installs (uninstall/reinstall).
R2 — Full rename breaks existing deployments pinning old image tags (documented migration note).
R3 — Easter movable-date logic (small, contained, needs the `when()` hook design).
R4 — Web search down during planning: name availability/domains unverified — verify gymshed.app
     and GitHub org/repo name before publishing.

## GSTACK REVIEW REPORT

Pipeline: CEO review (dual voice: Codex CLI + Claude subagent) → inline design/eng/DX review
→ user gate (D5–D7) → execution. Both review voices ran pre-gate; their converged findings
drove the plan below and were resolved as follows.

### Decisions taken at the gate (user said "go"; defaults applied)

| # | Question | Decision | Rationale |
|---|---|---|---|
| D5 | Full rename vs fork velocity vs upstream `DuarteSantos8/openGym` | **A: full rename, hard fork.** `mirror.yml` deleted; FUNDING.yml, CLA.md + both CLA workflows (Duarte's personal CLA infrastructure) removed | Merge with upstream was never viable across 5,000+ touched files; keeping display-layer-only rename contradicted the chosen domain/appId work |
| D6 | NOTICE.md media license ("licensed to openGym", not AGPL) | **A: proceed.** Personal self-hosting use is the user's stated use case; NOTICE rewritten as explicit fork-attribution (upstream copyright preserved verbatim) | Redistributing renamed media publicly remains a real risk — flagged below as the one open legal item |
| D7 | Unverified identity anchors (`gymshed.app`, GitHub org) | **Placeholders:** org `gymshed`, repo `GymShed`, domain `gymshed.app`. All are one-line swaps in `.env.example`-style places; `update.js` release check reads `gymshed/GymShed` | Could not verify on the network mid-runs (search tooling was down); user confirmed "go" with placeholders acceptable |

### Review findings and how they landed

- **appId/bundle migration is unreadable in-place (R1, eng review).** Android
  `applicationId` → `app.gymshed` (reverse-DNS of the placeholder domain), Java package
  trees moved `ch/duartesantos/opengym` → `app/gymshed` in all 9 flavor variants, iOS
  bundle IDs and entitlement files renamed, media (`catalogue` media shipped intact).
  Play-store rename-tax documented in `docs/APP_STORES.md` untouched — that is inherent.
- **`prefers-contrast: more` already exists (design review).** The planned third base theme
  "high-contrast" was dropped as redundant with the OS-level setting; `amoled` and `sepia`
  shipped instead. Deliberate deviation from premise 3, DRY (P1).
- **Seasonal windows must never overlap (found in existing test invariant).** Pride was
  slotted late June and Summer moved to Jul 1–Aug 31; Christmas shortened to Dec 30 so New
  Year's Eve owns the 31st. The pre-existing "two never overlap" test now covers all 7 themes.
- **Easter's movable date (R3).** Implemented as THEMES `when(now)` returning the md window
  (Meeus/Jones/Butcher Easter Sunday, Sat–Mon window), with the static `from`/`to` fields
  kept for schema continuity; tests pin 2026/2027/2029 dates.
- **House rule "every animation has an end"** (design review of existing seasonal art):
  the five new modules use zero `infinite` animations, all finite runs, reduced-motion
  honored, `aria-hidden`, no tap targets except none (all passive, unlike the pumpkin).
- **CSP hash binding (eng review catch):** renaming strings inside `index.html`'s inline
  boot script invalidates the CSP hash in `web/Dockerfile` — recomputed and updated; the
  `csp.test.js` reads both files and passes.
- **GymShed carries no donation links** (brand review + Settings support rows): BuMeACoffee,
  Ko-fi, GitHub Sponsors, App Store rate link, Trendshift and Discord badges all removed;
  Settings' support block replaced with a Play rate row (Play) and a GitHub star row. Tests
  rewritten to the new contract.

### Verification at execution time

- `grep -rIi opengym` over tracked text files: **0 hits** (only NOTICE.md's deliberate
  fork-attribution mentions the name "openGym").
- Frontend: **652 test files, 7858 tests green** (full vitest run).
- API: **800/800 green** (`node --test`).
- `docker compose config` valid with build-only services + `.env` present.

### Remaining risks (not blockers)

1. **Domain/org placeholders everywhere** — `gymshed.app`, `gymshed/GymShed`,
   `registry.example.com` in docs, `ghcr.io/gymshed/*` in compose comments. Single-swap list
   lives in this plan's §Work item 1.
2. **NOTICE.md media clause** — still licensed "to openGym" by Gym Visual; public
   redistribution of the renamed product with the media pack intact is the residual legal
   question. Personal use is fine per the user's choice (D6: A).
3. **Hero PNG assets** (`assets/readme/hero-*.png`, favicon SVGs regenerated by script, app
   icons regenerated) still render "openGym" word-mark inside binary images; regenerate
   hero images by hand once the logo is settled.
4. **App Store listing claim stale** — `docs/APP_STORES.md` and website flag an App Store
   "since 23 October 2026" that points to the fork's GitHub; the store presence itself
   needs the user's own Apple account before this copy is again true.

_(populated by the review pipeline)_
