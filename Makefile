# Vote CLT — build, preview, and publish.
#
#   make dev       start the local dev server with live reload
#   make publish   build and deploy to Firebase Hosting
#
# Run `make` with no target for the full list.

NPM      ?= npm
FIREBASE ?= firebase
PROJECT  ?= vote-clt
PORT     ?= 4321
CHANNEL  ?= preview

.DEFAULT_GOAL := help
.PHONY: help install dev dev-bg dev-stop dev-logs build test preview emulate publish draft channels login whoami clean distclean \
        ingest ingest-check \
        functions-install functions-build functions-lookup functions-lookup-prod deploy deploy-functions deploy-hosting

## help: list the available targets
help:
	@echo "Vote CLT"
	@echo ""
	@echo "  make install    install npm dependencies"
	@echo "  make dev        dev server with live reload at http://localhost:$(PORT)"
	@echo "  make dev-bg     same, but detached; use dev-logs / dev-stop"
	@echo "  make dev-logs   tail a detached dev server's output"
	@echo "  make dev-stop   stop a detached dev server"
	@echo "  make build      build the static site into dist/"
	@echo "  make test       run the unit tests"
	@echo "  make preview    build, then serve the production build locally"
	@echo "  make emulate    build, then serve via the Firebase Hosting emulator"
	@echo "                  (honors firebase.json: clean URLs, headers, 404)"
	@echo "  make publish    build and deploy hosting to the live site (project: $(PROJECT))"
	@echo "  make draft      deploy to a shareable preview URL (CHANNEL=$(CHANNEL))"
	@echo "  make channels   list active preview channels"
	@echo ""
	@echo "  Candidate data (editorial spreadsheet → src/data/generated):"
	@echo "  make ingest         pull the spreadsheet + photos, write JSON and data_quality_issues.md"
	@echo "  make ingest-check   report whether the committed data is behind the spreadsheet"
	@echo ""
	@echo "  Cloud Functions:"
	@echo "  make functions-install  install functions/ dependencies"
	@echo "  make functions-build    compile the TypeScript functions"
	@echo "  make functions-lookup       run the lookup CLI locally (ADDR=\"...\")"
	@echo "  make functions-lookup-prod  call the deployed function (ADDR=\"...\")"
	@echo "  make deploy             build + deploy BOTH functions and hosting"
	@echo "  make deploy-functions   deploy only the Cloud Functions"
	@echo "  make deploy-hosting     deploy only hosting (same as publish)"
	@echo ""
	@echo "  make login      (re-)authenticate the Firebase CLI"
	@echo "  make whoami     show the signed-in Firebase account"
	@echo "  make clean      remove build output"
	@echo ""

# Reinstall whenever package.json changes; the touch keeps make's timestamp
# comparison honest, since npm doesn't always bump the directory mtime.
node_modules: package.json
	$(NPM) install
	@touch node_modules

## install: install npm dependencies
install: node_modules

## dev: local dev server with hot reload, opens a browser tab
dev: node_modules
	$(NPM) run dev -- --port $(PORT) --open

## dev-bg: same, detached — Astro keeps it alive across terminal sessions
dev-bg: node_modules
	$(NPM) run dev -- --port $(PORT) --background

## dev-logs: follow a detached dev server's output
dev-logs:
	npx astro dev logs --follow

## dev-stop: shut down a detached dev server
dev-stop:
	npx astro dev stop

## build: produce the static site in dist/
build: node_modules
	$(NPM) run build

## test: run the unit tests (src/**/*.test.ts) with Node's built-in runner
test: node_modules
	$(NPM) test

## preview: serve the built site with Astro's static preview server
preview: build
	$(NPM) run preview -- --port $(PORT) --open

## emulate: serve the built site through Firebase Hosting rules
emulate: build
	$(FIREBASE) emulators:start --only hosting --project $(PROJECT)

## publish: build and deploy hosting to the live channel
publish: build
	$(FIREBASE) deploy --only hosting --project $(PROJECT)

# ---------------------------------------------------------------------------
# Candidate data ingest (see specs/003-data-ingest.md)
# ---------------------------------------------------------------------------

## ingest: fetch the editorial spreadsheet and photos; writes src/data/generated, public/candidates, data_quality_issues.md
ingest: node_modules
	$(NPM) run ingest

## ingest-check: exit non-zero if the committed data differs from the spreadsheet (writes nothing)
ingest-check: node_modules
	$(NPM) run ingest:check

# ---------------------------------------------------------------------------
# Cloud Functions (address lookup)
# ---------------------------------------------------------------------------

# Install functions deps whenever functions/package.json changes.
functions/node_modules: functions/package.json
	$(NPM) --prefix functions install
	@touch functions/node_modules

## functions-install: install functions/ npm dependencies
functions-install: functions/node_modules

## functions-build: compile the TypeScript Cloud Functions into functions/lib
functions-build: functions/node_modules
	$(NPM) --prefix functions run build

## functions-lookup: run the lookup CLI locally, e.g. make functions-lookup ADDR="741 Kenilworth Ave"
functions-lookup: functions/node_modules
	$(NPM) --prefix functions run lookup -- "$(ADDR)"

## functions-lookup-prod: call the DEPLOYED function, e.g. make functions-lookup-prod ADDR="741 Kenilworth Ave"
functions-lookup-prod: functions/node_modules
	$(NPM) --prefix functions run lookup -- --prod "$(ADDR)"

## deploy-functions: deploy only the Cloud Functions (firebase runs the build)
deploy-functions: functions/node_modules
	$(FIREBASE) deploy --only functions --project $(PROJECT)

## deploy-hosting: deploy only hosting (alias of publish)
deploy-hosting: build
	$(FIREBASE) deploy --only hosting --project $(PROJECT)

## deploy: build the site and deploy BOTH Cloud Functions and hosting
deploy: build functions/node_modules
	$(FIREBASE) deploy --only functions,hosting --project $(PROJECT)

## draft: deploy to a temporary preview channel and print the URL
draft: build
	$(FIREBASE) hosting:channel:deploy $(CHANNEL) --project $(PROJECT)

## channels: list active preview channels
channels:
	$(FIREBASE) hosting:channel:list --project $(PROJECT)

## login: refresh Firebase CLI credentials
login:
	$(FIREBASE) login --reauth

## whoami: show the signed-in Firebase account
whoami:
	$(FIREBASE) login:list

## clean: remove build output
clean:
	rm -rf dist .astro functions/lib

## distclean: also remove installed dependencies
distclean: clean
	rm -rf node_modules functions/node_modules
