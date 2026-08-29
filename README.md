# Vote CLT

Nonpartisan election information for Charlotte and Mecklenburg County — a static
[Astro](https://astro.build) site deployed to Firebase Hosting at
[voteclt.org](https://voteclt.org).

## Quick start

```sh
make install     # install dependencies
make dev         # http://localhost:4321 with live reload
```

Run `make` on its own to see every target.

| Target | What it does |
| --- | --- |
| `make dev` | Dev server with hot module reload, opens a browser tab |
| `make dev-bg` / `dev-logs` / `dev-stop` | Same server, detached |
| `make build` | Static build into `dist/` |
| `make test` | Unit tests (`src/**/*.test.ts`, Node's built-in runner) |
| `make preview` | Build, then serve the production output |
| `make emulate` | Build, then serve through the Firebase Hosting emulator — the only local mode that applies `firebase.json` (clean URLs, headers, the 404 page) |
| `make draft` | Deploy to a shareable, expiring preview URL |
| `make publish` | Build and deploy to the live site |
| `make login` | Refresh Firebase CLI credentials |
| `make clean` | Remove `dist/` and `.astro/` |

## Deploying

`make publish` runs `astro build` and then `firebase deploy --only hosting`
against the project named in `.firebaserc` (`vote-clt`). It uses whatever
account the Firebase CLI is logged in as — no service account or key file is
stored in this repo.

Credentials expire every so often. When a deploy fails with
`Authentication Error: Your credentials are no longer valid`, run:

```sh
make login       # firebase login --reauth
```

That opens a browser for the normal Google sign-in. Confirm the active account
any time with `make whoami`.

Before pointing anyone at a change, `make draft` publishes to a temporary
channel and prints a URL that expires on its own — safer than pushing straight
to the live site.

### Custom domain

Hosting serves `voteclt.org` only after the domain is connected in the Firebase
console (Hosting → Add custom domain), which requires adding the TXT and A
records Firebase provides to the registrar's DNS. Until then the site is live at
the default `*.web.app` / `*.firebaseapp.com` URLs.

## Project layout

```
src/
  components/    Header (nav + dropdown + language switch), Footer,
                 CandidateCard, Placeholder
  data/          The editable content: jurisdictions.ts, elections.ts, team.ts
  i18n/          ui.ts (chrome strings), utils.ts (helpers, route generation)
  layouts/       BaseLayout.astro — <head>, header, footer
  pages/         Routes (see below)
  styles/        global.css — design tokens and base elements
public/          Static assets served as-is
```

### Routing and languages

English lives at the site root and Spanish under `/es/`, from a single set of
page files. Every page sits under `src/pages/[...locale]/` — a rest parameter
that matches zero segments for English:

| File | English | Spanish |
| --- | --- | --- |
| `[...locale]/index.astro` | `/` | `/es` |
| `[...locale]/next-elections.astro` | `/next-elections` | `/es/next-elections` |
| `[...locale]/candidates/[jurisdiction].astro` | `/candidates/north-carolina` | `/es/candidates/north-carolina` |
| `[...locale]/about.astro` | `/about` | `/es/about` |
| `[...locale]/faq.astro` | `/faq` | `/es/faq` |
| `[...locale]/my-ballot/results.astro` | `/my-ballot/results` | `/es/my-ballot/results` |

Each page exports `getStaticPaths = localePaths` from `src/i18n/utils.ts`, which
is what produces both language variants. The candidates page composes that with
the jurisdiction list, so adding a jurisdiction adds pages in both languages.

### The My Ballot results page

`/my-ballot/results?address=…` calls the `lookupAddress` Cloud Function (see
`functions/README.md`), which returns the voter's districts, polling place,
precinct, and official sample-ballot PDFs from the Board of Elections. The page
is static: every contest in the election is pre-rendered hidden, and a small
client script matches the returned districts against each contest's
`ballotMatch` (`src/lib/ballotMatch.ts`, unit-tested) and reveals the ones
that apply. Locally, `astro dev`/`preview` have no `/api/lookupAddress`
rewrite — copy `.env.example` to `.env` to point at the deployed function.

To add a language, extend `locales` and `ui` in `src/i18n/ui.ts`, then add the
matching key to every `I18nText` value in `src/data/`. TypeScript will point out
what's missing.

## Editing content

### Candidates — from the editorial spreadsheet

Candidates and contests come from the `Candidate_Listing_2026` Google Sheet
and its `Candidate Images` Drive folder, which the editorial team maintains.
They reach the site through `make ingest`:

```sh
make ingest          # fetch the sheet + photos, regenerate the files below
git diff             # review what changed
```

It writes three committed files — reviewing an ingest is an ordinary pull
request:

- `src/data/generated/candidates.json` — contests and candidates in ballot
  order (shape in `src/data/candidateTypes.ts`).
- `public/candidates/<id>.jpg` — every headshot normalized to 480×600 JPEG.
- `data_quality_issues.md` — feedback for the editorial team: rows with typos,
  missing IDs, unticked photos, off-standard blurbs. Rewritten each run; send
  it to whoever owns the sheet.

`make ingest-check` tells you whether the committed data is behind the sheet
without writing anything. Both need no credentials (the sheet and folder are
link-shared); if `gcloud auth login --enable-gdrive-access` has been run, the
folder is listed through the Drive API instead of the public folder page.

Everything structural (office, district, seat, jurisdiction) is derived from
the NCSBE contest names, so a new race in the sheet flows through
automatically. The one thing that needs a developer is a **Spanish office
title**: add a line to `src/data/offices.ts` (that file also sets the display
order). The ingest prints a note when an office has no entry.

### Everything else — in `src/data/`

With English and Spanish side by side:

- **`jurisdictions.ts`** — the four entries in the "All Candidates" dropdown
  (labels, titles, and the "no contests this year" note).
- **`elections.ts`** — upcoming elections and their ballot initiatives, plus the
  polling-location link.
- **`team.ts`** — the About page roster and the FAQ entries. FAQ answers are
  Markdown (links, lists, paragraphs), rendered to HTML at build time by
  `src/lib/markdown.ts` — nothing Markdown-related ships to the browser.
- **`links.ts`** — the official NCSBE / Mecklenburg BOE URLs used in more
  than one place.

## Placeholders still to replace

- **Team photos.** Team records take an optional `photo` path under `public/`;
  without one they render the `Placeholder` graphic (as do candidates whose
  Image box isn't ticked in the sheet).
- **Logo.** The header renders the site name as text.
- **Copy.** The About mission statement, team names/roles, and FAQ answers are
  lorem-grade.
- **Spanish blurbs.** The sample-ballot sentence and the candidate cards fall
  back to English until the `Policy Blurb (ES)` column is filled in.
- **Fonts.** `--vc-font` in `src/styles/global.css` is a system stack; point it
  at the brand webfont once chosen.
