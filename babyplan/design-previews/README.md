# Layout redesign preview

## Round 2 (current) — layouts 4, 5, 6

Feedback on round 1 (layouts 1-3): the tabs weren't feeling like real,
isolated tabs — clicking one would auto-scroll the page, which is exactly
what layout-3's "jump to and open" accordion did (now dropped). There was
also no dedicated place to have an actual back-and-forth conversation with
Claude — "Add info" mixed saving notes/files with asking questions.

Round 2 fixes both, and gives 3 fresh layout options to react to:

- **Every section is a real, isolated tab.** No `scroll-behavior:smooth`,
  no animated or accordion-triggered scrolling. Switching tabs swaps content
  instantly and resets to the top of the page — like a native app's tab
  bar, not a long page you scroll through.
- **New dedicated "Chat" tab** — an actual chat-bubble interface (your
  question on the right, Claude's answer on the left), separate from "Add
  info". A **"Previously answered questions"** button above the chat input
  expands/collapses to show past Q&A, exactly as asked.
- **"Add info" is now just the repository** — save a note or upload a
  photo/PDF. A **"View saved documents"** button expands to show them,
  categorized with filter chips (Prescriptions / Visits / Labs /
  Ultrasounds), same auto-categorization idea as before.

### The 3 new layouts

- **`layout-4-top-tabs.html`** — horizontal tab bar, refined version of the
  round-1 top-tabs layout with the scroll bug fixed and the new Chat/Add-info
  split.
- **`layout-5-sidebar.html`** — persistent left sidebar, same fixes applied.
- **`layout-6-grouped-tabs.html`** — new idea: 13 flat tabs felt like a lot,
  so this groups them into 3 top-level categories (**Overview**, **The
  plan**, **You**), each with its own row of sub-tabs underneath. Clicking a
  category shows its sub-tabs and remembers which one you were last on.

### How to look at them

```
git checkout claude/site-layout-redesign
open babyplan/design-previews/layout-4-top-tabs.html
open babyplan/design-previews/layout-5-sidebar.html
open babyplan/design-previews/layout-6-grouped-tabs.html
```

The Save / Ask buttons are demo-only (no real backend) — clicking "Ask" in
the Chat tab actually appends a demo bubble so you can feel the interaction,
it just doesn't call Claude for real. The 7 documents / 2 previous questions
are sample data, not real notes/photos, so the branch is safe to view.

Try clicking around each one specifically for: does any tab click cause an
unwanted scroll? Does the Chat tab feel right as its own section? Is the
document/question history easy to find behind its expand button? Point out
anything from any of the 3 you want to keep or drop when you reply.

## Round 1 (superseded) — layouts 1, 2, 3

Kept for reference only — these had the auto-scroll issue described above
and no dedicated Chat tab:

- `layout-1-top-tabs.html` — top tabs, with an extra A/B/C switcher inside
  its Activity tab comparing 3 ways to organize history specifically.
- `layout-2-sidebar.html` — left sidebar nav.
- `layout-3-accordion.html` — collapsible accordion sections with a "Jump
  to" strip (this is the pattern that caused the auto-scroll complaint).
- `preview.html` — the very first version, top tabs with just the Activity
  A/B/C comparison.
