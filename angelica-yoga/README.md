# Angelica's Yoga

A calm, mobile-first yoga app: browse poses, browse Vinyasa routines, no login required.

## What's inside

- **Browse Poses** — ~60 curated yoga poses with Sanskrit + English names, difficulty, category tags, step-by-step instructions, benefits, and contraindications. Search by name, filter by difficulty and category.
- **Browse Routines** — 10 routines total: 5 classic Vinyasa **sequences** (Sun A, Sun B, Standing, Seated, Closing) and 5 full **classes** (Beginner, Power, Morning Flow, Restorative, Hip-Opening). Each routine lists its poses in order with hold times and breath cues.

## Stack

Pure static site — HTML, CSS, vanilla JS. No backend, no build step, no framework. Data lives in two JSON files. Hosted free on Vercel.

## Run locally

```
cd angelica-yoga
npx serve .
# or: python3 -m http.server 3000
```

Open `http://localhost:3000`.

## Deploy to Vercel

1. Create a new empty GitHub repo (e.g. `angelica-yoga`).
2. Copy the contents of this folder into the new repo.
3. `git init && git add . && git commit -m "Initial yoga app" && git push -u origin main`
4. Import the repo at [vercel.com/new](https://vercel.com/new) — no settings to change, it deploys as a static site.
5. (Optional) Point a custom domain at the Vercel project.

## Edit content

All content lives in two JSON files:

- `data/poses.json` — add / edit poses. Each pose needs an `id`, `english_name`, `sanskrit_name`, `image` path, `difficulty`, `categories[]`, `instructions[]`, `benefits[]`, `contraindications[]`.
- `data/routines.json` — add / edit routines. Each routine has `name`, `type` (`Sequence` or `Class`), `level`, `duration_minutes`, `description`, and a `poses[]` array of `{ pose_id, hold_seconds, note }`.

After editing, commit and push — Vercel redeploys automatically.

## Pose images

The shipped app uses simple SVG silhouettes grouped by category (Standing, Seated, Backbend, etc.) — calm, on-brand, and works offline. To swap in real photos:

1. Add a JPG to `public/poses/` named after the pose `id` (e.g. `downward-dog.jpg`).
2. Update that pose's `image` field in `data/poses.json` to `/public/poses/downward-dog.jpg`.

Recommended free sources: [Wikimedia Commons](https://commons.wikimedia.org/) (CC-BY-SA / CC0) and [Pexels](https://pexels.com) (Pexels License). Record attribution in `CREDITS.md`.

## File map

```
angelica-yoga/
├── index.html              Home
├── poses.html              Browse poses
├── pose.html               Single pose detail
├── routines.html           Browse routines
├── routine.html            Single routine detail
├── css/styles.css          All styles
├── js/                     One JS file per page + shared app.js
├── data/                   poses.json, routines.json
└── public/poses/           Pose images (SVG placeholders + space for JPGs)
```

## Verification (manual smoke test)

1. Home loads, shows two cards (Poses, Routines).
2. Poses page renders ~60 cards; typing "warrior" narrows to three.
3. Tap a difficulty chip → list filters; tap again → clears.
4. Tap a category chip → list narrows further (chips combine with AND).
5. Tap any pose → detail page shows name, image, tags, steps, benefits, contraindications.
6. Routines page shows two sections (Sequences, Classes) with cards.
7. Tap "Sun Salutation A" → 9 poses in order with thumbnails, hold times, notes; total duration matches header.
8. Tap a pose row in a routine → jumps to that pose's detail page.
9. Resize to phone width (375px) — layout reflows cleanly.
