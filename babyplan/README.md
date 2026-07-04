# BabyPlan — pregnancy planning site

Live at https://babyplan-theta.vercel.app (Vercel project `babyplan`,
project ID `prj_swf0i0Cx8ZaEvDGtHpcCVPUCpLPm`, team `jedistateofminds-projects`).

Recovered from the deployed site and rebuilt here so the source lives in git.
Changes vs. the original deployment:

- **No passcode** — the "Add new information" feature works for anyone with
  the (unlisted) link.
- **Save is free and instant** — notes and photos save as-is to Vercel Blob,
  no AI call involved.
- **"Ask Claude" button** — asks a question with full context: the plan
  (thrombophilia priority, Colmédica vs Medisanitas insurance details and
  deadlines), all previously saved notes, recent saved photos/PDFs, and any
  files attached to the question. The bilingual answer is saved to the notes
  list. This is the one feature that calls the Claude API server-side.

## Structure

- `index.html` — the whole site (self-contained: inline CSS/JS, bilingual ES/EN)
- `api/state.js` — GET `/api/state`, returns saved notes `{ updates: [...] }`
- `api/add-info.js` — POST `/api/add-info` `{ text, files[] }`; saves the note
  and attachments (no AI)
- `api/ask.js` — POST `/api/ask` `{ question, files[], lang }`; Claude answer
  with plan + notes + attachments as context (`claude-opus-4-8`), saved as a note
- `api/diag.js` — GET `/api/diag?k=bp-diag-7f3k9x2m`, shows env var *names* and
  blob contents (for debugging; remove later)

## Vercel project requirements

- `BLOB_READ_WRITE_TOKEN` — auto-added when a Blob store is connected
  (Storage tab → Create/Connect Blob store). Needed for notes to persist.
- `ANTHROPIC_API_KEY` — needed only for the "Ask Claude" button (console.anthropic.com
  API key; pay-per-use). Saving notes works without it, and the button explains
  it isn't configured when the key is missing.

## Deploy

From this directory:

```sh
npx vercel deploy --prod
```

(or connect the Vercel project to this repo in the dashboard:
babyplan → Settings → Git, Root Directory = `babyplan`)
