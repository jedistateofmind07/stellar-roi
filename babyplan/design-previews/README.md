# Layout redesign preview

Three self-contained files, each a different **overall site layout** for the
main babyplan page — replacing today's single long scrolling page with anchor
links. All three share the same content, design tokens, and the same
"Activity" concept (a combined notes + documents history hidden behind
expand/collapse instead of an always-visible list); only the outer navigation
structure differs.

## The 3 layouts

- **`layout-1-top-tabs.html`** — horizontal tab bar under the hero (like the
  current sticky nav, but real tabs: one section visible at a time, no
  scrolling through everything). Includes an extra A/B/C switcher inside its
  Activity tab to also compare 3 ways of organizing that history specifically
  (timeline + filter chips, category accordions + search, dashboard tiles +
  feed).
- **`layout-2-sidebar.html`** — a persistent left-hand sidebar (like a docs
  site or settings page) with the content area to its right. On narrow
  screens the sidebar collapses into a wrapping row above the content.
- **`layout-3-accordion.html`** — no separate tab UI at all. Every section
  lives on one page as a collapsible accordion (closed by default, except
  "Priority" which opens first). A "Jump to" strip up top scrolls to and
  opens whichever section you pick, and there's an "Expand all" toggle.

## How to look at them

No build step, no server needed — just open the files directly:

```
git checkout claude/site-layout-redesign
open babyplan/design-previews/layout-1-top-tabs.html
open babyplan/design-previews/layout-2-sidebar.html
open babyplan/design-previews/layout-3-accordion.html
```

The Save / Ask Claude buttons in all three are **not wired to the real
backend** — clicking them just shows a placeholder message. The 9 "Activity"
items are sample data (not your real notes/photos), so the branch is safe to
commit and view without exposing anything private.

## What's already settled (from earlier answers)

- One combined "Activity" section/tab, not history scattered through the
  page — present in all 3 layouts.
- Documents auto-categorized (rx / visit / lab / ultrasound / other) — shown
  here with sample categories; the real version will tag each save via
  Claude once a layout is picked.

Pick whichever overall layout (1, 2, or 3) feels right — that becomes the
site's new information architecture. If you like a mix (e.g. layout 2's
sidebar, but layout 1's Activity sub-designs), point that out too.

## Legacy file

`preview.html` is the original Activity-only comparison (top tabs, with just
the A/B/C sub-variants) from before this was widened into a full 3-layout
comparison — kept for reference, superseded by `layout-1-top-tabs.html`.
