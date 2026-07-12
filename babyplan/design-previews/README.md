# Layout redesign preview

One self-contained file — `preview.html` — showing the proposed redesign of the
main site: real top tabs instead of anchor-link scrolling, all sections
hidden/shown instead of one long page, and a new **Activity** tab that
replaces the always-visible notes list under "Add info".

## How to look at it

No build step, no server needed — just open the file directly:

```
git checkout claude/site-layout-redesign
open babyplan/design-previews/preview.html   # or double-click it in Finder/Explorer
```

The Save / Ask Claude buttons in this preview are **not wired to the real
backend** — clicking them just shows a placeholder message. The 9 activity
items are sample data (not your real notes/photos), so the branch is safe to
commit and view without exposing anything private.

## What's already settled (from your answers)

- Top tabs for navigation (not anchor scrolling).
- One combined "Activity" tab, not separate history sections scattered
  through the page.

## What the 3 layouts let you compare

Open the **Activity** tab and use the A / B / C switcher at the top:

- **A — Timeline + filters**: two expandable panels, "Notes & questions" and
  "Documents". Documents has filter chips (Prescriptions / Visits / Labs /
  Ultrasounds) to narrow the list once expanded.
- **B — Categories + search**: one search box up top, and documents grouped
  into their own expandable accordion per category. Notes get their own
  accordion at the bottom. Typing in the search box auto-expands whichever
  group has a match.
- **C — Dashboard + feed**: colored count tiles per category (click to
  filter) sitting above a single interleaved feed of everything, newest
  first, collapsed to the latest 3 with a "Show all" button.

Whichever one feels right, that becomes the pattern for the real Activity
tab — the auto-categorization (rx / visit / lab / ultrasound / other) will
be filled in for real by asking Claude to tag each save, matching what you
picked for that clarifying question.
