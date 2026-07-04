# BabyPlan — pregnancy planning site

Live at https://babyplan-theta.vercel.app (Vercel project `babyplan`,
project ID `prj_swf0i0Cx8ZaEvDGtHpcCVPUCpLPm`, team `jedistateofminds-projects`).

Recovered from the deployed site and rebuilt here so the source lives in git.
Changes vs. the original deployment:

- **No passcode** — the "Add new information" feature works for anyone with
  the (unlisted) link.
- **No API dependency** — notes and photos are saved as-is to Vercel Blob.
  There is no server-side AI call; when analysis is wanted, ask Claude
  (claude.ai / Claude Code, covered by the Max subscription) about the saved
  result.

## Structure

- `index.html` — the whole site (self-contained: inline CSS/JS, bilingual ES/EN)
- `api/state.js` — GET `/api/state`, returns saved notes `{ updates: [...] }`
- `api/add-info.js` — POST `/api/add-info` `{ text, files[] }`; validates and
  appends the note (with image/PDF attachments as data URLs) to the blob
- `api/diag.js` — GET `/api/diag?k=bp-diag-7f3k9x2m`, shows env var *names* and
  blob contents (for debugging; remove later)

## Requirements

- `BLOB_READ_WRITE_TOKEN` — auto-added when a Blob store is connected to the
  project (Vercel dashboard → babyplan → Storage → Create/Connect Blob store).
  Without it the site works but notes don't persist.

## Deploy

From this directory:

```sh
npx vercel deploy --prod
```

(or connect the Vercel project to this repo in the dashboard:
babyplan → Settings → Git, Root Directory = `babyplan`)
