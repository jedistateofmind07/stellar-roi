# babyplan — project context

**Read this first when working on the pregnancy site in a new session.**

## What it is

A private, bilingual (Spanish/English) pregnancy-planning site for Robbie (reads
English) and his pregnant wife Angélica (reads Spanish), in Bogotá, Colombia.
It is a research dossier + living record + AI assistant for a **high-risk
pregnancy** (genetic thrombophilia, two prior losses, age 35, due ~Feb–Mar 2027,
delivering at Clínica La Colina). The single most important open medical
question the site tracks: **the exact thrombophilia diagnosis** (drives the
aspirin/heparin plan).

- **Live site (the one they use, on their phones):** https://babyplan-theta.vercel.app
- Source of truth: this repo, `babyplan/` folder (repo `jedistateofmind07/stellar-roi`)
- The link is unlisted, not indexed; data has "reasonable privacy, not
  medical-grade confidentiality." Never expose real medical data in previews,
  mockups, or commits — use fake sample data.

## Architecture (all in this folder)

Static frontend + Vercel serverless functions + Vercel Blob storage. No
framework, no build step, no database.

| File | Role |
|---|---|
| `index.html` | The entire frontend (~1500 lines, self-contained HTML/CSS/JS, bilingual via `.es`/`.en` spans toggled by `data-lang` on `<body>`) |
| `api/state.js` | GET: returns `{updates, brief}` from Blob. Exports `readUpdates()`, `readBrief()`, `DEFAULT_PATH`, `BRIEF_PATH` |
| `api/add-info.js` | POST `{text, files}`: saves a note + files to the record. Exports `storeFiles()` |
| `api/ask.js` | POST `{question, files}`: the Chat backend. Direct call to Anthropic Messages API. Exports `toContentBlock()` |
| `api/digest.js` | POST: the RAG layer — has Claude read all uploaded docs + notes, extracts structured facts, saves them as the "brief" |
| `api/upload.js` | Grants browser a scoped Blob upload token (`@vercel/blob/client handleUpload`), images+PDF, 25MB max |
| `api/diag.js` | Temp debug endpoint behind key `bp-diag-7f3k9x2m` (candidate for removal) |
| `vercel.json` | `maxDuration: 120` for `ask.js` and `digest.js` |
| `package.json` | Only dependency: `@vercel/blob` |

### Data model (Vercel Blob)

- `babyplan/updates.json` — the record index: array of
  `{ts, userText, files:[{name,type,url}], titleES, titleEN, noteES, noteEN, urgent}`.
  Notes with `noteES/noteEN` are Claude answers; user-only entries are saves.
- `babyplan/files/<timestamp>.<ext>` — each uploaded photo/PDF as its own public blob.
- `babyplan/brief.json` — **the digest**: `{brief:{thrombophiliaES/EN, gestES/EN,
  medsES/EN[], findingsES/EN[], stepsES/EN[], urgent}, ts, docCount}`.

### Auth to Claude — IMPORTANT

`api/ask.js` and `api/digest.js` call `https://api.anthropic.com/v1/messages`
**directly** with `Authorization: Bearer $CLAUDE_CODE_OAUTH_TOKEN` +
`anthropic-beta: oauth-2025-04-20` header. This bills Robbie's **Claude Max
subscription**, NOT a pay-per-use API key (his explicit requirement — do not
"fix" this to use an API key). When using OAuth the first system block must be
exactly `"You are Claude Code, Anthropic's official CLI for Claude."`.
Fallback: `ANTHROPIC_API_KEY` via `x-api-key`. The Agent SDK approach was tried
and **abandoned** (ships a ~240MB native CLI binary that exceeds Vercel limits,
and refuses `bypassPermissions` as root). Token generated via `claude setup-token`.

Env vars (project-level in the **babyplan** Vercel project):
`BLOB_READ_WRITE_TOKEN`, `CLAUDE_CODE_OAUTH_TOKEN` (+ optional `ANTHROPIC_API_KEY`).

## Frontend layout (chosen after 2 rounds of mockups)

**Real top tabs** — every section is its own tab (`nav.jump [role=tab]` with
`data-target` → `section[role=tabpanel]`); exactly one section visible;
switching is instant (no smooth scroll — this was explicit feedback: "no auto
scrolling"). On mobile (≤640px, the primary device) the tab bar is a single
horizontal-scrolling strip (~57px) with a right-edge fade; on desktop it wraps.
Tab switch lands just under the sticky bar.

Tabs: Priority · Hospital · Do now · Insurance · Week by week · Vitamins ·
Diet · Exercise · Warning signs · Checklist · **Add info** · **Chat** ·
For Robbie · Sources.

- **Priority tab** hosts the `#doc-brief` panel ("What your documents tell
  us"): renders the digest — the extracted thrombophilia type (or "not in the
  documents yet"), gestational age, meds, findings, next steps — with an
  "Update from documents" button that POSTs `/api/digest`.
- **Add info tab**: save note/photos/PDFs (direct browser→Blob upload via
  esm.sh `@vercel/blob/client`, 10 files, 25MB each; images downscaled to
  1400px JPEG q0.78 client-side). "View saved documents" expands a list
  auto-categorized by filename/note keywords (rx/visit/lab/us/other) with
  filter chips. After each save the frontend fires `/api/digest` in the
  background so the brief stays current.
- **Chat tab**: bubble UI (user right, Claude left) → POST `/api/ask`.
  "Previously answered questions" expands stored Q&A history. The backend
  attaches: request files + up to 6 most recent stored files + last 20 notes +
  **the brief** (so it never re-asks what documents already answer).
- Old passcode system fully removed (`ACCESS_CODE` env var is vestigial).
- `design-previews/` = throwaway mockups from layout selection (fake data), plus
  `preview.test.js` (run: `node --test`).

## Deployment — the #1 gotcha

TWO Vercel projects serve this code:

1. **`babyplan`** (project `prj_swf0i0Cx8ZaEvDGtHpcCVPUCpLPm`) → the real site
   at babyplan-theta.vercel.app. Root = the `babyplan/` folder, so `api/*.js`
   run as functions and env vars live here. **NOT git-connected** — deploys
   happen from Robbie's Mac: his `~/babyplan` folder is a plain directory (not
   a git clone!) linked to the project; he runs `npx vercel --prod` there.
2. **`stellar-roi`** → auto-deploys the whole repo on every merge to `main` at
   stellar-roi.vercel.app. There `babyplan/` is just static files (`api/*.js`
   served as text, functions do NOT run). Useful as a raw-file CDN.

**Consequence:** merging to `main` does NOT update the real site. To ship, the
files in Robbie's `~/babyplan` must be updated and redeployed. Established
routine (he runs this; keep the file list current when adding files!):

```bash
cd ~/babyplan
B=https://stellar-roi.vercel.app/babyplan
curl -s -o index.html       $B/index.html
curl -s -o package.json     $B/package.json
curl -s -o vercel.json      $B/vercel.json
curl -s -o api/state.js     $B/api/state.js
curl -s -o api/add-info.js  $B/api/add-info.js
curl -s -o api/ask.js       $B/api/ask.js
curl -s -o api/upload.js    $B/api/upload.js
curl -s -o api/digest.js    $B/api/digest.js
curl -s -o api/diag.js      $B/api/diag.js
npx vercel --prod
```

Past incidents to avoid repeating: partial curl updates left stale
`api/` files → 401s (old passcode code) and 500 `FUNCTION_INVOCATION_FAILED`
(missing `@vercel/blob` because `package.json` was stale). When behavior looks
wrong, first check **which version is actually deployed** (`/api/state`
response shape, Vercel runtime logs) before touching code.

## Working conventions for this project

- Workflow: branch → verify (run `node --check` on api files; parse `<script>`
  with `new Function`; drive `index.html` in headless Chromium — Playwright is
  at `/opt/node22/lib/node_modules/playwright`, Chromium at
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`; stub `/api/*` with a
  tiny node server) → PR → merge → give Robbie the curl+deploy block.
- Test at 375px (mobile-first!) AND desktop. Zero JS errors is the bar.
- Robbie's style: wants things to just work, hates re-explaining; verify
  in a real browser before telling him something is fixed. Ask clarifying
  questions before big UI changes; he chose "top tabs" and wants feedback
  incorporated on all examples.
- Keep everything bilingual (every user-visible string has `.es`/`.en`).
- The model used by the site's API calls: `claude-opus-4-8`.

## Current state / open threads

- Layout rebuild + Chat tab + doc categorization: **live**.
- Digest/RAG layer (`api/digest.js` + brief panel + brief-in-chat-context):
  built, needs Robbie's redeploy (list above) and a first tap of
  "Update from documents".
- Possible next: remove `api/diag.js` + `ACCESS_CODE` env var; smarter
  categorization via Claude at save time; richer chat history rendering.
