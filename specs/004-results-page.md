# Your Sample Ballot — the results page

Spec 002 wired the address lookup into the site and left the success state as
a raw JSON table "for now". Page 5 of `mockup/vote-clt-mockup.pdf` ("Your
Sample Ballot") is the real design. This spec turns the lookup result into
that page, using the candidate data from spec 003.

## What the mockup shows

- Page heading **Your Sample Ballot**.
- One block per contest: the office title with the mockup's short underline
  (`US Senate`), and when the contest has a district, a blue **pill** after
  the title (`US House of Representatives  [District 8]`). Under it,
  **"Select one."** in muted text.
- The candidates side by side with a large grey **VS** between them. Each
  card: photo (4:5, same as the All Candidates card) with a coloured band
  reading **NORTH CAROLINA** — blue for D, red for R, gold for L — then the
  name in bold with the party letter, then the blurb as one sentence:
  *"This candidate prioritizes lowering the cost of groceries, making
  healthcare affordable, and lowering energy/utility costs."*
- Placeholder cards for candidates without photos use the existing sky/hill
  graphic.

Not on the mockup, but returned by the lookup and worth showing: the matched
address, polling place (with the BOE's directions link), precinct, and links
to the official sample-ballot PDFs. Also not on the mockup: what to do when
several seats of one office are on the ballot (three Court of Appeals seats,
ten District Court seats), contests with one candidate, and multi-seat
contests ("vote for 3"). Decisions on all of these are below.

## What the lookup gives us

`lookupAddress` returns (`functions/src/lookup/types.ts`):

```
ballot.matchedAddress      "3227 PLANTERS RIDGE RD 28270"
ballot.electionTitle       "2026 Primary Election"   ← whatever the BOE page says
ballot.districts           { congress: "CONGRESSIONAL DISTRICT 8",
                             stateSenate: "NC SENATE DISTRICT 42",
                             stateHouse: "NC HOUSE DISTRICT 105",
                             judicial: "JUDICIAL DISTRICT 26",
                             superiorCourt: "SUPERIOR COURT DISTRICT 26A",
                             countyCommission: "BOARD OF COMMISSIONERS DISTRICT 6",
                             school: "SCHOOL BOARD DIST 6",
                             municipality: "CHARLOTTE",
                             cityCouncil: "CITY COUNCIL DISTRICT 7" }
ballot.sampleBallots[]     { party, url, hasBallot }
ballot.pollingPlace        { name, streetAddress, city, state, zip, mapUrl?, directionsUrl? }
ballot.precinct            "PCT 091"
```

Every contest in `candidates.json` carries a `ballotMatch` written for
exactly this: `{ districtKey: 'stateHouse', district: '105' }`,
`{ districtKey: 'statewide' }`, `{ districtKey: 'county' }`, etc.

## Design

### 1. Matching — `src/lib/ballotMatch.ts`

A pure function, no DOM, no network:

```ts
matchContests(districts: Record<string, string>, contests: Contest[]): Contest[]
```

Rules, per contest `ballotMatch`:

| `districtKey` | Included when |
| --- | --- |
| `statewide`, `county` | always |
| `congress`, `stateSenate`, `stateHouse`, `judicial`, `superiorCourt`, `countyCommission`, `school`, `cityCouncil` | the BOE value for that key ends in the contest's `district` (`"NC HOUSE DISTRICT 105"` → `105`; `"SUPERIOR COURT DISTRICT 26A"` → `26A`). Comparison is on the trailing number+letter token, case-insensitive, zero-padding stripped on both sides. |
| `municipality` | the BOE `municipality` value is `CHARLOTTE` (contests in the `city-of-charlotte` jurisdiction) |

A BOE key that's missing or unparseable simply matches nothing for that key —
the page never guesses. The address above therefore gets: US Senate, US House
8, NC Senate 42, NC House 105, Supreme Court, Court of Appeals ×3, District
Court ×10 (judicial 26), DA, Commissioners At-Large + District 6, Sheriff,
Clerk, Soil & Water — and *no* Superior Court contest, because 26A has no
seat up this year while 26C/F/H do. That's correct, not a bug.

This module gets unit tests (see §6): it is the one piece of logic where a
mistake shows a voter the wrong candidates.

### 2. Rendering — pre-rendered, revealed by JS

The results page is static HTML with a client script (spec 002). Rather than
rebuild the card markup in JavaScript, the page **pre-renders every contest
block for the election, hidden**, and the script un-hides the ones that
match. Each block carries its `ballotMatch` as data attributes; the script
reads them, calls `matchContests`, and toggles `hidden`. Images use
`loading="lazy"`, so hidden cards cost no downloads. This keeps one card
component for both pages, keeps the ballot page fully translatable through
the normal Astro path, and keeps the client script small (matching only).

Cost: ~80 cards per locale in the HTML (≈70 KB before gzip). Acceptable.

Success-state layout, top to bottom:

1. `<h1>` **Your Sample Ballot** / **Tu boleta de muestra**.
2. **Voting details panel** (filled by the script from the lookup result):
   the matched address; polling place name + address with a "Directions"
   link (`directionsUrl`); precinct; "Official sample ballot (PDF)" links —
   one per party with `hasBallot: true`, none if all are false. Labelled as
   coming from the Mecklenburg Board of Elections (the footer attribution
   already says so; the panel repeats it in one line).
3. **Contest blocks**, grouped by office in the same order as the All
   Candidates pages (`officeGroupsFor` order across all four jurisdictions).
   - Office heading with the underline; when the office has one contest on
     this ballot with a district, the pill sits next to the heading
     (`US House of Representatives [District 8]`), as in the mockup.
   - When several contests of one office match (Court of Appeals seats 1–3,
     District Court seats), the heading appears once and each contest is a
     **row** underneath with its own pill (`Seat 1`, `Seat 2`, …) and its
     own "Select one." — otherwise the page would repeat "District Court
     Judge" ten times.
   - "Select one." / "Select up to 3." from `voteFor`.
   - Candidates in a wrapping row with **VS** between them (`aria-hidden`;
     the list is a `<ul>` for screen readers). A single-candidate contest
     shows the card with no VS. On narrow screens the row stacks and the VS
     sits between rows.
4. **Also on your ballot** — a short line linking to the election's ballot
   initiatives on Next Elections ("3 constitutional amendments"), using
   `elections.ts` matched by `election.id`. Skipped if there are none.
5. If nothing matched at all (the BOE returned districts we don't know), a
   friendly message with the All Candidates links instead of an empty page.

Everything from spec 002 stays: `?address=` in the URL, the loading
interstitial, the error states with candidate links, the retry box.

### 3. The card — `CandidateCard` gets a `variant`

`variant="grid"` (default, All Candidates) is unchanged. `variant="ballot"`:

- Band text is the **jurisdiction label** (`NORTH CAROLINA`, `MECKLENBURG
  COUNTY`, `UNITED STATES`, `CITY OF CHARLOTTE`) — matching the mockup's
  one example. The district is already in the pill on this page, so the
  band doesn't repeat it.
- Band colours: D blue, R red, **L gold** (new token `--vc-gold`), G green
  (new `--vc-green`), everything else grey. The grid variant picks up the
  same colours for consistency.
- Name in bold.
- Blurb as a sentence: *"This candidate prioritizes {a}, {b}, and {c}."* —
  lines joined with commas and an Oxford comma, each line's first letter
  lower-cased unless the first word is an all-caps abbreviation (`NC`) —
  Spanish *"Este candidato prioriza {a}, {b} y {c}."* A single-line blurb (the
  judicial personal statements) is shown as-is. No blurb → "No additional
  data" as on the grid.
- Campaign-website link as on the grid.

### 4. Party colours everywhere

`src/styles/global.css` gains `--vc-gold` and `--vc-green`; the card maps
`party-LIB` / `party-GRE` to them (both variants).

### 5. Strings

New `ui.ts` keys: `results.title` becomes "Your Sample Ballot" / "Tu boleta
de muestra"; `ballot.selectOne`, `ballot.selectUpTo` ("Select up to"),
`ballot.vs`, `ballot.detailsHeading` ("Your voting details"),
`ballot.pollingPlace`, `ballot.directions`, `ballot.precinct`,
`ballot.samplePdf` ("Official sample ballot (PDF)"), `ballot.alsoOnBallot`,
`ballot.noMatches`, `ballot.prioritizes` (the sentence template, with
`{issues}`), plus the four jurisdiction band labels.

### 6. Tests

Add a minimal test runner — Node's built-in `node --test` through `tsx`
(`npm test`), no new framework — with `src/lib/ballotMatch.test.ts` covering:
statewide/county always match; padded vs unpadded districts; `26A` vs `26C`;
municipality Charlotte vs not; missing keys match nothing. And
`src/lib/blurb.test.ts` for the sentence joiner (1, 2, 3 lines; `NC`
abbreviation kept; Spanish "y"). `make test` target; CLAUDE.md's
verification checklist adds it.

### 7. Docs

README "Placeholders still to replace" drops the results-page item;
CLAUDE.md marks spec 004 shipped and describes the reveal-by-JS mechanism.

## Out of scope

- Any change to the Cloud Function or the lookup contract.
- Ballot initiatives beyond the link to Next Elections (no per-address
  referendum data exists in the lookup).
- Rendering the official sample-ballot PDFs inline.
- Spanish blurbs (the data is still empty; the template is ready for them).

## Decisions made (2026-08-29)

1. Band label on the ballot card = the jurisdiction ("NORTH CAROLINA",
   "MECKLENBURG COUNTY").
2. Candidates within a contest are alphabetical by last name.
3. Voting-details panel at the top, compact.
4. Offices with several seats on the ballot: one heading, a row per seat.
5. Browser title and nav stay "Your ballot" / "My Ballot"; H1 is
   "Your Sample Ballot".

Implementation note: an English blurb shown on the Spanish page uses the
English sentence template (the template follows the blurb's language), so
nothing reads half-translated while the ES column is empty.

## Open questions (as put to the team; answered above)

1. **Band label on the ballot card.** The mockup's one example shows
   `NORTH CAROLINA` on a US Senate card. I'm reading that as "the
   jurisdiction electing this seat" and using it for every card
   (`MECKLENBURG COUNTY` for Sheriff, etc.). Alternative: show the district
   on the band as the grid does, and drop the pill. Recommend jurisdiction.
2. **Candidate order within a contest.** The mockup lists Cooper (D), Bray
   (L), Whatley (R). NC prints partisan candidates grouped by party in an
   order set each cycle by statute; alphabetical by last name is what the
   grid does. Recommend **alphabetical by last name** for both pages until
   the team wants ballot order (which we'd then encode explicitly).
3. **Voting details panel** (polling place, precinct, PDF links) — include
   at the top, at the bottom, or leave it off until the design team draws
   it? Recommend top, kept compact: the polling place is the single most
   useful thing on the page.
4. **Multi-seat rows under one heading** for judicial offices (§2.3) — OK,
   or one heading per contest exactly like the mockup even if it repeats?
5. Should the page **title** stay "Your ballot" in the browser tab and nav
   ("My Ballot") with "Your Sample Ballot" only as the H1? Recommend yes —
   nav stays "My Ballot".
