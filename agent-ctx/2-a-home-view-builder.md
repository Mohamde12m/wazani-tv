# Task 2-a — home-view-builder

## Task
Build `src/components/views/home-view.tsx` (HOME view for ArabVision TV Arabic RTL app).

## Work Log
- Read `/home/z/my-project/worklog.md` and inspected shared components, hooks, stores, lib types, globals.css, and API routes (channels, matches) to confirm prop shapes and design tokens.
- Created `src/components/views/home-view.tsx` with named export `HomeView`.
- Two `useFetch` calls (channels + matches) + a single `useMemo` that derives 9 channel groupings and recent additions.
- Featured match selection: live-featured → upcoming-featured → upcoming-any.
- Custom `FeaturedHero` with emerald→emerald-dark gradient, gold glow, 64–80px team logos, score/kickoff, countdown chips, stadium + broadcaster, "شاهد القناة" + "كل المباريات" buttons.
- Reusable `ChannelSection` helper (hides when empty, shows LoadingRow while loading).
- Quick search bar (button → search view), today's matches horizontal scroll, 9 channel carousels, recently-added section, subtle demo-data hint.
- All section "عرض الكل" actions route via useNav to channels (category slug / country code) or matches.

## Lint
`bun run lint` → 0 errors, 0 warnings in this file (removed a stale eslint-disable for img; rule not firing).

## Stage Summary
HomeView complete, lint-clean, ready for orchestrator. Recommended next: matches-view, channels-view, player-view.

## Artifacts
- `src/components/views/home-view.tsx`
