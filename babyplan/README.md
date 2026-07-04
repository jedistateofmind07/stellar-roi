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
  list. Runs on the Claude Max subscription via the Agent SDK — no API billing.

## Structure

- `index.html` — the whole site (self-contained: inline CSS/JS, bilingual ES/EN)
- `api/state.js` — GET `/api/state`, returns saved notes `{ updates: [...] }`
- `api/add-info.js` — POST `/api/add-info` `{ text, files[] }`; saves the note
  and attachments (no AI)
- `api/ask.js` — POST `/api/ask` `{ question, files[], lang }`; runs headless
  Claude Code (Agent SDK, Max-subscription auth) with plan + notes + attachments
  as context; the bilingual answer is saved as a note
- `api/diag.js` — GET `/api/diag?k=bp-diag-7f3k9x2m`, shows env var *names* and
  blob contents (for debugging; remove later)

## Vercel project requirements

- `BLOB_READ_WRITE_TOKEN` — auto-added when a Blob store is connected
  (Storage tab → Create/Connect Blob store). Needed for notes to persist.
- `CLAUDE_CODE_OAUTH_TOKEN` — needed only for the "Ask Claude" button. Runs the
  Claude Agent SDK on the **Claude Max subscription** (no pay-per-use API).
  Generate once with `claude setup-token` on a machine logged into the Max
  account, and paste the token into this env var. (`ANTHROPIC_API_KEY` also
  works as a fallback.) Saving notes works without either; the button explains
  itself when unconfigured.

## Deploy

From this directory:

```sh
npx vercel deploy --prod
```

(or connect the Vercel project to this repo in the dashboard:
babyplan → Settings → Git, Root Directory = `babyplan`)
