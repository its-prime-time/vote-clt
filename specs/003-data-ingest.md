# Candidate data ingest (`make ingest`) and the app data layer

The data/editorial team maintains candidate content in a Google Sheet. We want
a repeatable `make ingest` that pulls that sheet (and the candidate photos)
into a form the app consumes directly, and we want the site's candidate pages
to be generated from that data instead of the hand-written arrays in
`src/data/jurisdictions.ts`.

## Decision: bake the data in at build time — no Cloud Function

The data is ~14 KB, changes on an editorial cadence (days), and every change
should be reviewed before it goes live. That points to committing the ingested
JSON to the repo and letting Astro read it at build time:

- The "All Candidates" pages stay fully static (same as today).
- The My Ballot results page (which runs in the browser) imports the same
  JSON module; it bundles to a few KB gzipped. No runtime fetch needed.
- `git diff` on the generated file *is* the editorial review. A bad row in the
  sheet cannot take the site down; it fails `make ingest` on the dev's machine.
- No new infrastructure, no per-request latency, no dependency on Google at
  request time.

A Cloud Function "views" API would only earn its keep if editors needed to
publish without a deploy. If that becomes a requirement, the right shape is
still not a runtime proxy — it's a scheduled job that runs this same ingest and
redeploys hosting. So build `make ingest` as a pure, deterministic
sheet → JSON transform and that door stays open.

## What's in the sheet (as of 2026-08-29)

Spreadsheet `Candidate_Listing_2026`
(`10-ZfK0aqOk7VS9HlCoDO2LP1tnxn1y8rYQmHLTeNy0I`, owned by the editorial lead,
shared with andy@tmpt.me). Two tabs:

1. **`Mecklenburg 11/03/26`** (gid `420231940`) — the NCSBE candidate filing
   export for the 2026-11-03 general election, one row per candidacy.
   Columns: `ID, election_dt, county_name, contest_name, name_on_ballot,
   first_name, middle_name, last_name, name_suffix_lbl, nick_name,
   street_address, city, state, zip_code, phone, office_phone,
   business_phone, email, candidacy_dt, party_contest, party_candidate,
   is_unexpired, has_primary, is_partisan, vote_for, term`.
   78 candidates across 51 contests. `ID` is a lowercase
   `first_middle_last` slug and is the join key.
2. **`Candidate Profiles`** — the editorial layer, one row per candidate, same
   `ID`. Columns: `ID, Name on Ballot, First, Middle, Last, Party, Image,
   Website, Policy Blurb (EN), Policy Blurb (ES)`. Columns L–M hold a
   progress tally and the team's formatting notes (not data).
   38 of 78 profiles are complete (website + 3-line EN blurb + image);
   the other 40 are name/party only. `Policy Blurb (ES)` is empty for every
   row so far.

Photos live in the Drive folder **`Candidate Images`**
(`1X2o9tLDjNxqBQAMDlxc7nVjMHqJyMAfI`), named `<ID>.<jpg|jpeg|png>`. 38 files,
7 KB – 4.4 MB, mixed dimensions.

**Access:** the sheet and the folder are shared "anyone with the link", so
both are readable with no credentials — verified:

```
https://docs.google.com/spreadsheets/d/<sheetId>/gviz/tq?tqx=out:csv&sheet=<tab name>
https://drive.google.com/uc?export=download&id=<fileId>
```

Listing the folder's contents does need the Drive API (unauthenticated calls
get 403). The ingest gets a token from `gcloud auth print-access-token`;
developers run `gcloud auth login --enable-gdrive-access` once. The script
fails with exactly that instruction when no token is available.

Editorial conventions (from the notes column): blurb is three lines, one
priority per line, starting with a noun or an "-ing" verb, in the candidate's
own language where possible; judicial candidates get a paraphrased personal
statement instead; photos are plain-background headshots, uploaded as
`<ID>.<ext>`, then the `Image` box is ticked.

### Observations from the current data

Things the ingest normalizes silently (our problem, not editorial's):

- Districts are zero-padded in contest names (`NC HOUSE OF REPRESENTATIVES
  DISTRICT 088`) while the BOE lookup returns them unpadded
  (`NC HOUSE DISTRICT 105`). Ingest strips the padding.
- The 23 blank rows at the bottom of the listing are skipped.
- Party codes are NCSBE's (`DEM REP LIB GRE NP`; also possible: `UNA CST`).
  We adopt these codes in the data and map to labels/colours in the UI.
- Image files come as `.jpg`, `.jpeg`, or `.png`; ingest matches on the ID
  regardless of extension.

Things that are the editorial team's to fix (these go in the data-quality
report, §2, not in code):

- A stray listing row with only `name_on_ballot = "Daniel Schmidt"` and no
  ID/contest.
- ID mismatch for Alma Adams: the listing now says `alma_shealey_adams`
  (fixed 2026-08-29) and the image is `alma_shealey_adams.jpg`, but the
  Profiles tab still has `alma_sheasley_adams`. The two tabs must agree.

Facts that affect the site, not the ingest:

- No City of Charlotte contests: Charlotte municipal elections are in odd
  years, so the "City of Charlotte" jurisdiction is empty for 2026-11-03.
  Keep the nav entry for now (PM to confirm); the page explains that the
  next city election is in 2027.
- Judicial seats dominate the county list: 3 Superior Court, 11 District
  Court, plus DA and Clerk of Superior Court, plus a nonpartisan
  Soil & Water race (vote for 2) and Commissioners At-Large (vote for 3).

## Deliverables

### 1. `make ingest`

A TypeScript script at `scripts/ingest/` run with `tsx` (root
devDependency), wired to `npm run ingest` and `make ingest`. It:

1. Downloads both tabs as CSV via the public gviz URL (sheet ID and tab names
   are constants in one config file) and lists the images folder via the
   Drive API using the `gcloud` token.
2. Parses with a real CSV parser (blurbs contain quoted newlines).
3. Validates. **Blocking** problems (the output would be wrong or the
   script can't proceed — see §5) exit non-zero with a readable message.
   Everything else is recorded in the data-quality report and the run
   continues, so one bad row never blocks publishing the other 77.
4. Joins listing + profile on `ID`, derives contest structure from
   `contest_name` (§3), and writes **`src/data/generated/candidates.json`** —
   sorted deterministically (by contest order, then ballot name) so reruns
   produce a clean diff.
5. Syncs photos (§4).
6. Rewrites **`data_quality_issues.md`** (§2).
7. Prints a summary: candidates, contests, complete profiles, photos
   fetched/skipped/removed, number of issues by severity.

Also `make ingest-check`: run the ingest to a temp dir and diff against the
committed output, for use as a "is the site behind the sheet?" check.

Generated files **are committed**: the JSON, the photos, and the
data-quality report. `make build` does not run the ingest; deploys use
whatever was reviewed and merged.

### 2. `data_quality_issues.md` — feedback for the editorial team

Rewritten from scratch on every ingest at the repo root, so it always
reflects the current sheet and its git history shows issues appearing and
being fixed. Written for the editorial team, not developers: plain language,
one line per issue, grouped by severity, each naming the tab, the row (by
`ID` or `Name on Ballot`), and what to change. Header records the sheet's
last-modified time and the ingest time. Example:

```markdown
# Candidate data quality report

Generated 2026-08-29 15:30 from Candidate_Listing_2026 (last edited 2026-08-28 21:03).
78 candidates · 51 contests · 38 complete profiles · 3 issues

## Needs fixing (the candidate is excluded or shown incomplete until resolved)

- **Alma S. Adams** — the `ID` differs between tabs: `alma_shealey_adams`
  (Mecklenburg 11/03/26) vs `alma_sheasley_adams` (Candidate Profiles). The
  profile, blurb, and photo are not linked to the candidate until both tabs match.
- **"Daniel Schmidt"** (Mecklenburg 11/03/26, row 80) — has a name but no ID or
  contest. Complete the row or delete it.

## Worth a look (published as-is)

- **Joyce Waddell** — Policy Blurb (EN) has 2 lines; the standard is 3.
```

Categories reported (each with the row it refers to):

- ID present in one tab but not the other; duplicate IDs; a non-empty row
  with no ID or no contest.
- `Image` ticked but no `<ID>.*` file in the folder; a file in the folder
  with no matching ID or with `Image` unticked; a file that isn't a
  decodable image.
- Blurb not exactly 3 lines (1 allowed for judicial), a line over ~40
  characters, leading/trailing whitespace.
- `Website` missing on a profile that is otherwise complete, or not an
  absolute `http(s)` URL.
- `Name on Ballot` or `Party` differing between the two tabs.
- Unknown party code.
- Source photo smaller than the target size (will look soft on the card).
- Profiles marked complete in the tally but missing a field, and vice
  versa.

Empty ES blurbs are *not* reported individually (they are known to be
outstanding); the header just gives the count.

### 3. Contest structure — derived, with a small override table

The office, district, and seat are parsed from `contest_name` with a handful
of generic rules, not a per-office list:

```
US SENATE                                          → office "us-senate"
US HOUSE OF REPRESENTATIVES DISTRICT 08            → office "us-house-of-representatives", district "8"
NC COURT OF APPEALS JUDGE SEAT 02                  → office "nc-court-of-appeals-judge", seat "2"
NC SUPERIOR COURT JUDGE DISTRICT 26C SEAT 01       → office "nc-superior-court-judge", district "26C", seat "1"
NC DISTRICT COURT JUDGE DISTRICT 26 SEAT 06 (UNEXPIRED) → …, seat "6", unexpired true
MECKLENBURG COUNTY BOARD OF COMMISSIONERS AT-LARGE → office "mecklenburg-county-board-of-commissioners", atLarge true
```

i.e. strip trailing `DISTRICT <x>`, `SEAT <n>`, `AT-LARGE`, `(UNEXPIRED)`
tokens; what's left, slugified, is the office key; the EN title is the
title-cased remainder. The jurisdiction is inferred from the prefix
(`US ` → united-states, `NC ` → north-carolina, everything else →
mecklenburg-county; city contests, when they exist, will carry `CHARLOTTE`
or a town name) and the `ballotMatch` key from the office key. All of this
is deterministic from the sheet, so a new office appearing in the sheet
flows through with no code change.

What genuinely cannot come from the sheet is kept in one small file,
`src/data/offices.ts`, keyed by the derived office key:

- the **Spanish title** (editors don't translate office names; the UI must),
- an optional **short EN title** where the NCSBE name is unwieldy
  (`US HOUSE OF REPRESENTATIVES` → "U.S. House"),
- the **display order** — an ordered array of office keys (§3a),
- an optional jurisdiction/ballotMatch override for the rare case the
  prefix rule is wrong.

An office with no entry there is not an error: it renders with the
title-cased EN name in both languages and sorts after the ordered ones, and
the ingest summary prints "office X has no Spanish title / no ordering" so a
developer adds a line. That keeps the hand-maintained surface to about a
dozen lines of translations, reviewable by anyone.

#### 3a. Proposed display order

Follows the NC ballot: federal → state legislative → state judicial → county
partisan → county judicial → nonpartisan. Within an office: at-large first,
then districts/seats in numeric order. Editorial can reorder by editing the
array in `offices.ts`.

- **United States** — U.S. Senate; U.S. House (8, 12, 14)
- **North Carolina** — NC Senate (37–42); NC House (88–112); NC Supreme
  Court Associate Justice; NC Court of Appeals Judge (seats 1–3)
- **Mecklenburg County** — Board of Commissioners (At-Large, then 1–6);
  Sheriff; District Attorney; Clerk of Superior Court; Superior Court Judge
  (26C, 26F, 26H); District Court Judge (seat 6 unexpired, then 13–21);
  Soil & Water Conservation District Supervisor
- **City of Charlotte** — no contests in 2026; page shows the next municipal
  election year.

### 4. Photos

For every profile with `Image = TRUE`, download `<ID>.<ext>` from the images
folder and run it through `sharp`: auto-rotate from EXIF, resize to 480×600
cover (the card renders at 4:5), strip metadata, encode JPEG quality 80,
and write `public/candidates/<ID>.jpg`. Every source image goes through
this regardless of its original size, so a 4.4 MB upload and a 7 KB one both
come out at roughly 30–60 KB.

The JSON records each source file's Drive `modifiedTime` and size; reruns
re-fetch only when those change, and delete local photos whose ID no longer
has a ticked `Image`. So when editorial swaps a photo in Drive, the next
`make ingest` picks it up and the diff shows exactly which file changed.

### 5. Published data shape

`src/data/generated/candidates.json` contains only what the site renders. The
listing's contact fields (`street_address`, `phone*`, `email`) are **not**
copied through — they're public filing records, but we have no reason to
republish candidates' home addresses.

```jsonc
{
  "generatedAt": "2026-08-29T15:30:00Z",
  "source": { "sheetId": "10-ZfK0…", "sheetModified": "2026-08-28T21:03:04Z" },
  "election": { "id": "2026-11-03", "date": "2026-11-03", "county": "MECKLENBURG" },
  "contests": [
    {
      "id": "nc-house-of-representatives-105",
      "name": "NC HOUSE OF REPRESENTATIVES DISTRICT 105",   // verbatim from NCSBE
      "office": "nc-house-of-representatives",             // derived key; titles resolved via offices.ts
      "jurisdiction": "north-carolina",
      "district": "105",                                    // unpadded; null for at-large/countywide
      "seat": null,                                         // "1" for judicial seats
      "atLarge": false,
      "voteFor": 1,
      "partisan": true,
      "unexpiredTerm": false,
      "ballotMatch": { "districtKey": "stateHouse", "district": "105" }
    }
  ],
  "candidates": [
    {
      "id": "raygan_jason_angel",
      "contestId": "nc-house-of-representatives-105",
      "name": "Raygan J. Angel",               // name_on_ballot
      "party": "DEM",                          // NCSBE code
      "website": "https://www.rayganfornc.com/",
      "issues": { "en": ["Fixing rigged maps", "Funding public schools", "Affordable healthcare"], "es": [] },
      "photo": { "path": "/candidates/raygan_jason_angel.jpg", "sourceModified": "2026-08-07T14:36:11Z", "sourceSize": 286238 },   // null when no image
      "profileComplete": true
    }
  ]
}
```

`ballotMatch` is the hook for the results page: the BOE lookup returns
`districts` keyed `congress | stateSenate | stateHouse | judicial |
superiorCourt | countyCommission | school | municipality | cityCouncil`
(see `functions/src/lookup/types.ts`). Countywide contests (Sheriff, DA,
Clerk, At-Large, Soil & Water, District Court 26) get
`{ "districtKey": "county" }`. Superior Court sub-districts (26A/26C/26F/26H)
match on `superiorCourt`. Building the matcher itself is spec 004; this spec
only guarantees the data can support it.

Blocking validation (the script stops): the sheet or folder can't be fetched,
a tab is missing an expected column, or the `gcloud` token is unavailable
when photos need syncing. Anything about the *content* of a row is a
data-quality issue, not a crash.

When a row has an issue that makes it unpublishable — no ID, duplicate ID,
unknown contest shape — the candidate is omitted from the JSON and the report
says so. A profile whose ID matches nothing in the listing is likewise
omitted (there's no contest to put them in). Partial problems (bad website
URL, missing image file) publish the row without the bad field.

### 6. Wire the site to the generated data

- `src/data/candidates.ts`: typed loader over the JSON (`import data from
  './generated/candidates.json'`) with helpers the pages need:
  `contestsFor(jurisdiction)`, `candidatesFor(contestId)`, `byId`, and
  `officeTitle(office, locale)` resolving through `offices.ts`.
- `src/pages/[...locale]/candidates/[jurisdiction].astro` and
  `CandidateCard.astro` render from it. The card's district band shows
  `District 105` / `Seat 1` / `At-Large` / nothing for countywide; party
  badge colours extend to LIB/GRE/NP; "Vote for 3" is shown on the race
  heading when `voteFor > 1`.
- `src/data/jurisdictions.ts` shrinks to jurisdiction metadata (slug, nav
  label, title, subtitle, and for Charlotte the "no contests this year"
  copy); its candidate arrays and the `tbd()` helper go away. Elections
  (`elections.ts`) and team/FAQ (`team.ts`) are untouched — they are not in
  the sheet.
- Every candidate in the sheet is published. Profiles without a blurb render
  name + party and the line "No additional data" (EN) / "Sin datos
  adicionales" (ES); the existing `Placeholder` graphic stands in for a
  missing photo.
- ES blurbs fall back to EN when empty (the `pick()` helper already does
  this for strings; extend it for the issues array).

### 7. Docs

Update `README.md` ("Editing content" now says: edit the sheet, run
`make ingest`, read `data_quality_issues.md`, review the diff, open a PR) and
`CLAUDE.md` (the ingest command, the `offices.ts` rule).

## Out of scope for this spec

- Matching BOE districts to contests on the results page, and the results
  page design — **spec 004**, which builds on `ballotMatch`.
- Moving elections/ballot initiatives or team/FAQ content into the sheet.
- Machine-translating blurbs to Spanish.
- Scheduled/CI ingest.

## Decisions made (2026-08-29)

1. Drive folder listing via `gcloud auth login --enable-gdrive-access`.
2. Photos are committed; re-fetched when the source changes.
3. City of Charlotte stays in the nav for now (PM to confirm).
4. Party codes stay as NCSBE's three-letter codes.
5. Photos normalized to 480×600 JPEG; every image goes through the optimizer.
6. All candidates published; incomplete ones say "No additional data".
7. Display order as in §3a, adjustable in `offices.ts`.
8. Data-quality findings are a deliverable (`data_quality_issues.md`),
   regenerated on every ingest, written for the editorial team.
