# Vote CLT — Cloud Functions

The `lookupAddress` Cloud Function turns a free-form street address into the
voter's ballot information (districts, sample ballots, polling place, precinct)
by automating the Mecklenburg Board of Elections (BOE) address search.

## How it works

```
"3227 Planters Ridge Rd 28270"
        │
        ▼  GeminiAddressParser  (Vertex AI, gemini-3.5-flash-lite)
{ houseNumber: "3227", streetName: "Planters Ridge", streetType: "Rd" }
        │
        ▼  BoeClient.search      (fills + submits the BOE search form)
one matching address link   ── 0 matches → "address not found"
        │                     └─ 2+ matches → "multiple matches" (+ the links)
        ▼  BoeClient.retrieve    (scrapes the result page)
structured ballot JSON
```

### Why ScrapingBee?

The BOE site (`apps.meckboe.org`) sits behind **Cloudflare bot protection**
that blocks ordinary server-side HTTP requests (a plain `fetch()` gets a 403).
Only a real browser gets through. We use **ScrapingBee** — a cloud browser API —
to run the page like a browser and defeat the block, which keeps this Cloud
Function itself lightweight (it only makes HTTPS calls, no bundled Chromium).

The fetching layer is behind a `PageFetcher` interface
(`src/fetching/pageFetcher.ts`), so the provider is swappable via configuration —
today ScrapingBee, tomorrow a local browser or plain fetch — without touching any
BOE logic.

## Setup

```bash
cd functions
npm install
cp .env.example .env    # then fill in SCRAPINGBEE_API_KEY
```

For local runs, Vertex AI uses Application Default Credentials:

```bash
gcloud auth application-default login
```

Store the ScrapingBee key as a Firebase secret for production:

```bash
firebase functions:secrets:set SCRAPINGBEE_API_KEY
```

## The CLI harness

Run the whole pipeline from the command line — no emulator required.

```bash
# Full pipeline, locally (needs SCRAPINGBEE_API_KEY + Vertex ADC):
npm run lookup -- "3227 Planters Ridge Rd 28270"

# Call the DEPLOYED function over HTTPS (no emulator, no local creds):
npm run lookup -- --url https://us-central1-vote-clt.cloudfunctions.net/lookupAddress "741 Kenilworth Ave"

# Offline — parse saved BOE HTML with no API keys (tests the parser only):
npm run lookup -- --fixture-search test/fixtures/search-result.html
npm run lookup -- --fixture-info   test/fixtures/address-information.html
```

Or via the repo Makefile: `make functions-lookup ADDR="741 Kenilworth Ave"`.

## Deploy

```bash
make deploy             # build site + deploy BOTH functions and hosting
make deploy-functions   # functions only
```

## Layout

```
src/
  config.ts                     env-driven configuration
  index.ts                      the onCall lookupAddress function
  fetching/                     provider-agnostic page fetching (the adapter layer)
    pageFetcher.ts              interface + action/result types
    scrapingBeeFetcher.ts       ScrapingBee implementation (production)
    directFetcher.ts            plain fetch (offline/fixtures)
    fetcherFactory.ts           picks the provider from config
  parsing/geminiAddressParser.ts  AI address splitting (Vertex AI)
  boe/
    boeClient.ts                orchestrates search + retrieve
    boeResultParser.ts          cheerio HTML scraping (pure functions)
    boeUrls.ts                  endpoint + selector constants
  lookup/
    addressLookupService.ts     the top-level use case
    types.ts                    domain types + LookupError
cli/lookup.ts                   command-line harness
test/fixtures/                  decoded BOE sample pages for offline tests
```
