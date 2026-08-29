# Vote CLT — working notes for Claude sessions

Nonpartisan voter-information site for Charlotte / Mecklenburg County, NC.
Live at https://voteclt.org (Firebase project `vote-clt`, also `vote-clt.web.app`).
Two halves in one repo:

| Part | Where | Stack | Detail docs |
| --- | --- | --- | --- |
| Static site | `src/`, `public/` | Astro 7 (`output: 'static'`), EN + ES from one set of pages | `README.md` |
| Ballot lookup API | `functions/` | Firebase Cloud Functions v2 (Node 22, TS, ESM), Genkit + Vertex AI Gemini, ScrapingBee, cheerio | `functions/README.md` |

Read those two READMEs first — they are accurate. This file records what they
don't: how work is done here, current status, and the traps.

## How the project is run

- Work arrives as numbered specs in `specs/NNN-*.md` (001 = the Cloud Function,
  002 = wiring it into the site — both shipped). Each spec becomes one branch
  and one PR against `main`. After a PR merges, start the next branch fresh off
  updated `main`.
- Specs end with "ask any clarifying questions before proceeding" — do that
  before implementing a new spec.
- The team is not very familiar with TypeScript: keep comments more verbose
  than usual, favor single-responsibility functions/classes, and structure for
  readability over brevity (see `functions/src/` for the established tone).
- Design source of truth is `mockup/vote-clt-mockup.pdf` (5 pages: home,
  candidates dropdown, NC candidates grid, Next Elections + About, and
  "Your Sample Ballot" — the results page). Check its mtime/page count at the
  start of a session; the team updates it in place.

## Architecture in one screen

```
Home (/, /es)  ──form GET ?address=──▶  /my-ballot/results   (static page + client <script>)
                                              │  fetch POST {data:{address}}
                                              ▼
            /api/lookupAddress  (firebase.json rewrite, same origin in prod)
                                              │
                                              ▼
            lookupAddress  (onCall, us-central1, 120s timeout, 512MiB, public/unauthenticated)
              1. GeminiAddressParser  — Vertex AI `gemini-3.5-flash-lite` on the `global` endpoint,
                                         Zod structured output → {houseNumber, streetName, streetType}
              2. BoeClient.search     — ScrapingBee (render_js + premium proxy) drives
                                         apps.meckboe.org/addressSearch_New.aspx; 0 links → not found,
                                         2+ → multiple_matches (with candidate links)
              3. BoeClient.retrieve   — fetches AddressSearchReturn_New.aspx?… and cheerio-scrapes
                                         districts / sample ballots / polling place / precinct
```

- Error contract: function throws `HttpsError` with `details.code` ∈
  `unrecognized_address | address_not_found | multiple_matches | upstream_error`
  (+ `details.candidates` for multiple). `src/lib/lookupClient.ts` mirrors this;
  `results.astro` maps codes to `results.error.*` strings in `src/i18n/ui.ts`.
- All editorial content is data: `src/data/{jurisdictions,elections,team}.ts`
  with `{ en, es }` strings side by side. Chrome strings are in `src/i18n/ui.ts`.
- The site never imports the Firebase SDK; the callable is invoked with plain
  `fetch` using the callable JSON convention.

## Commands that matter

```sh
make dev                  # site at :4321 — needs a root .env (see below)
make build                # astro build → dist/   (must pass before any PR)
npx astro check           # site typecheck (1 pre-existing error, see Gotchas)
make functions-build      # tsc; `cd functions && npx tsc --noEmit` for typecheck only
make functions-lookup-prod ADDR="3227 Planters Ridge Rd 28270"   # hit the DEPLOYED function
make functions-lookup ADDR="..."   # run the pipeline in-process (needs SCRAPINGBEE_API_KEY locally)
make draft                # preview channel deploy — use before touching the live site
make deploy               # build + deploy functions AND hosting (firebase runs functions build via predeploy)
make deploy-functions / make publish (hosting only)
```

Verification checklist for a change: `make build`, `npx astro check`,
`make test` (unit tests for the ballot matcher and blurb joiner),
`cd functions && npx tsc --noEmit`, and for anything touching the lookup path
a `--prod` lookup (or `make draft` and click through) with the known-good
address below. To see the results page locally: `cp .env.example .env`,
`make build`, `npx astro preview`, open
`/my-ballot/results?address=3227 Planters Ridge Rd 28270` (takes ~12 s;
costs ScrapingBee credits). Delete `.env` afterwards so a `make publish`
from this machine keeps using the same-origin rewrite.

## Environment & credentials (state as of 2026-08-29)

- Firebase CLI is logged in as the repo owner; `gcloud` ADC exists at
  `~/.config/gcloud/application_default_credentials.json` (needed only for
  in-process `make functions-lookup`, which calls Vertex AI locally).
- `functions/.env` exists but has **no `SCRAPINGBEE_API_KEY`** — so in-process
  runs fail at fetcher construction. Use `--prod` (which works) unless the key
  is added. In production the key is a Firebase secret
  (`firebase functions:secrets:set SCRAPINGBEE_API_KEY`), already set.
- Root `.env` does **not** exist. `astro dev` has no `/api/lookupAddress`
  rewrite, so for the results page to work locally:
  `cp .env.example .env` (it sets `PUBLIC_LOOKUP_URL` to the deployed function).
  Without it the dev server's results page will fail with the "network" error.
- Both site and function are deployed and healthy: `voteclt.org` 200, and
  `POST /api/lookupAddress` with an empty address returns the expected
  `INVALID_ARGUMENT`.

## Gotchas

- **Known-good test address: `3227 Planters Ridge Rd 28270`** (returns full
  ballot JSON in ~12s). The README's example `741 Kenilworth Ave` currently
  returns `address_not_found` from the real BOE — it is not a bug in our code;
  don't chase it.
- Each lookup costs ScrapingBee credits (2 rendered, premium-proxy requests per
  lookup). Don't loop lookups in tests; use the offline fixture modes
  (`npm run lookup -- --fixture-search/--fixture-info`) for parser work.
- If Cloudflare ever blocks ScrapingBee, the search page will have no
  `#dgAddress` links and the function will report `address_not_found` rather
  than `upstream_error`. If "not found" suddenly happens for the known-good
  address, suspect the fetcher/proxy tier (`SCRAPINGBEE_PROXY_MODE=stealth`)
  before the parser.
- `functions/lib/src/` is stale output from an old tsconfig layout (rootDir
  mismatch, fixed in PR #4). Gitignored and harmless; `make clean` removes it.
- `results.astro` has one client `<script>` shared by both locales, so any
  string the script needs at runtime must go through the `lookup-messages`
  JSON island, not be hard-coded.
- The callable is public with no rate limiting or App Check — acceptable for
  public voter info, but keep in mind before adding anything costly.
- `functions/.env.example` has an uncommitted local edit (commenting out
  `GCLOUD_PROJECT=`); it's the owner's, leave it unless asked.

## Candidate data pipeline (spec 003 — shipped)

- Source: Google Sheet `Candidate_Listing_2026` (id in `scripts/ingest/config.ts`),
  tabs `Mecklenburg 11/03/26` (NCSBE filing export) and `Candidate Profiles`
  (editorial: website, 3-line EN/ES blurbs, Image flag); join key `ID`.
  Photos: Drive folder `Candidate Images`, files named `<ID>.<ext>`.
- `make ingest` → `src/data/generated/candidates.json` + `public/candidates/*.jpg`
  (480×600) + `data_quality_issues.md`. All three are **committed**; the diff
  is the review. `make ingest-check` = is the committed data behind the sheet.
  An ingest that finds nothing new writes nothing (timestamps are ignored).
- No credentials needed: sheet via public gviz CSV, photos via public download,
  folder listing via Drive API if `gcloud auth print-access-token` has Drive
  scope, else via the public `embeddedfolderview` page (a fallback that could
  break if Google changes the markup — the API path is the durable one).
- Contest structure (office / district / seat / jurisdiction / `ballotMatch`)
  is **derived** from the NCSBE contest name in `scripts/ingest/lib/contests.ts`.
  `src/data/offices.ts` holds only what can't be derived: ES titles, display
  order, and per-office jurisdiction/ballotMatch overrides. Unknown office ⇒
  a console note, not an error.
- Site reads through `src/data/candidates.ts` (`officeGroupsFor`,
  `officeTitle`, `issuesFor`, `partyAbbreviation`). Party codes stay NCSBE's
  (`DEM/REP/LIB/GRE/…`). `jurisdictions.ts` is nav chrome only.
- Content problems never crash the ingest — they go to the report and the
  row is omitted or published without the bad field. Structural problems
  (sheet unreachable, missing column) do exit non-zero.
- `ballotMatch.districtKey` maps onto the BOE lookup's `districts` keys
  (plus `statewide` / `county`).

## Results page (spec 004 — shipped)

- `src/pages/[...locale]/my-ballot/results.astro` pre-renders **every**
  contest (`BallotContest.astro`, `CandidateCard variant="ballot"`) hidden,
  with `data-key` / `data-district` from `ballotMatch`. The client script
  calls `matchContests()` (`src/lib/ballotMatch.ts`, pure, unit-tested) on
  the BOE `districts` and un-hides matches; it also fills the voting-details
  panel and lifts a single contest's pill next to the office heading.
- Matching rules: `statewide`/`county` always; district keys compare the
  trailing token (`"NC HOUSE DISTRICT 105"` → `105`, `26A` ≠ `26C`);
  `municipality`/`cityCouncil` require the BOE municipality to be
  `CHARLOTTE`. A voter in Superior Court 26A correctly sees no Superior Court
  contest this year (only 26C/F/H have seats).
- Blurb sentence: `src/lib/blurb.ts` — "This candidate prioritizes a, b, and
  c." / "Prioriza a, b y c."; the template follows the language the blurb
  exists in (`issuesLocale`), so English blurbs on `/es` read as English.
- Candidate order within a contest is alphabetical by last name (team
  decision 2026-08-29; NC's statutory ballot order is not encoded).
- Page `<title>` stays "Your ballot"; the H1 is "Your Sample Ballot".

## Where the project stands / likely next work

Done: full site scaffold (all mockup pages, EN/ES), Cloud Function, CLI
harness, site wiring with loading/error states, footer attribution,
candidate data ingest + generated All Candidates pages (spec 003), the
sample-ballot results page (spec 004).

Still placeholder or rough:

1. **Ballot order / band design review** — the results page follows mockup
   page 5 plus decisions recorded above; the design team hasn't seen the
   voting-details panel or the multi-seat rows yet.
2. **Editorial data gaps** — see `data_quality_issues.md` (ID typo for Alma
   Adams, stray row, 40 profiles without blurbs, no Spanish blurbs yet).
3. **Copy** — About mission, team roster, FAQ answers are lorem-grade.
4. **Brand** — logo is text; `--vc-font` is a system stack.
5. `candidatesUrl` from the scraper is always `null` (the BOE info page has no
   such link) — drop or keep, but don't rely on it.
