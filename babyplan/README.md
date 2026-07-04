# BabyPlan — pregnancy planning site

Live at https://babyplan-theta.vercel.app (Vercel project `babyplan`,
project ID `prj_swf0i0Cx8ZaEvDGtHpcCVPUCpLPm`, team `jedistateofminds-projects`).

Recovered from the deployed site and rebuilt here so the source lives in git.
This version **removes the passcode requirement** from the "Add new information"
feature — anyone with the (unlisted) link can read and add notes.

## Structure

- `index.html` — the whole site (self-contained: inline CSS/JS, bilingual ES/EN)
- `api/state.js` — GET `/api/state`, returns saved notes `{ updates: [...] }`
- `api/add-info.js` — POST `/api/add-info` `{ text, files[], lang }`; asks Claude
  for a bilingual personalized note and saves everything to Vercel Blob
- `api/diag.js` — GET `/api/diag?k=bp-diag-7f3k9x2m`, shows env var *names*,
  blob contents and whether the API keys are present (for debugging; remove later)

## Requirements (Vercel project env vars)

- `BLOB_READ_WRITE_TOKEN` — auto-added when a Blob store is connected to the
  project (Storage tab → Create/Connect Blob store) — needed to persist notes
- `ANTHROPIC_API_KEY` — needed for the assistant replies (notes still save
  without it, with a placeholder message)

## Deploy

From this directory:

```sh
npx vercel deploy --prod
```

(or connect the Vercel project to this repo in the dashboard:
babyplan → Settings → Git, Root Directory = `babyplan`)
