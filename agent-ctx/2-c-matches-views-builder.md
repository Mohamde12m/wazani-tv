# Task 2-c — Matches / Tournaments views builder

**Task ID:** 2-c
**Agent:** matches-views-builder
**Task:** Build three React view components for the ArabVision TV app: `MatchesView`, `TournamentsView`, `TournamentView`.

## Work Log

Read `worklog.md` and explored the project to understand the design system, shared components, stores, hooks, and API contracts. Key context absorbed:
- Design tokens: emerald (`#0b6e4f`) / gold (`#c9962e`) / cream (`#faf6ec`); NO black, NO indigo/blue.
- Shared: `MatchCard` (accepts `{ match, featured }` and includes its own favorite + player-channel button), `SectionHeader`, `EmptyState`, `LoadingGrid` (accepts `className` to override columns).
- Hooks: `useFetch<T>(url, deps?)`.
- Stores: `useNav` (view router, `setView({ name: "tournament", id })`, `setView({ name: "player", channelId })`), `useFavorites` (kind: `channel | match | tournament | team`, `has`, `toggle`, `favorites` array).
- Lib: `lib/datetime` exports `isToday`, `isTomorrow`, `isSameDay`, `dayLabel`, `formatTime`, `formatDate`, `statusLabel`, `useCountdown`.
- Types: `Match` includes `tournamentId`, `tournament`, `tournamentName`, `kickoff`, `status`, `featured`, `channel`. `Tournament` includes `_count.matches` / `_count.teams`, `country`, `type` (`league|cup|international`), `logo` (SVG data URI). `Team` includes `nameAr`, `logo`.
- API: `GET /api/matches`, `GET /api/tournaments`, `GET /api/teams?tournamentId=<id>`.

Created three files:

### `src/components/views/matches-view.tsx`
- `"use client"`, named export `MatchesView({ tab })`.
- shadcn `Tabs` with controlled state, value initialized from `tab` prop (validated against `today | tomorrow | live | upcoming | finished | favorites`, defaults to `today`).
- `TabsList` restyled: horizontal scroll (`no-scrollbar overflow-x-auto`), `bg-card`, custom emerald active state (`data-[state=active]:bg-emerald data-[state=active]:text-white`), triggers use `flex-none` so they don't stretch.
- Six tab definitions with Lucide icons.
- Four filter chip rows below the tabs:
  1. **حسب البطولة** — "الكل" + unique tournaments derived from `match.tournamentId` + `match.tournamentName`.
  2. **حسب الدولة** — "الكل" + unique `match.tournament.country`.
  3. **حسب التاريخ** — "الكل" + "اليوم" + "غدًا" + next 3 days (offset 2/3/4 from today, labeled via `Intl.DateTimeFormat("ar", { weekday, day, month })`).
  4. **حسب الحالة** — "الكل" + "مباشر" + "مجدولة" + "منتهية".
- Chip component: pill, emerald when active, border-border otherwise.
- `useMemo`-based filtering pipeline: tab filter → tournament chip → country chip → date chip → status chip → sort (live first, then by kickoff asc for non-finished; kickoff desc for finished).
- Upcoming tab logic: future scheduled matches not today/tomorrow; falls back to all scheduled-not-today/tomorrow when no future matches exist.
- Favorites tab: filters by `favMatchIds` Set derived from `useFavorites` store.
- Featured matches rendered at top of grid (`grid-cols-1 sm:grid-cols-2 gap-3`) with `featured` prop on `MatchCard`, then non-featured matches in a second grid.
- Loading: `LoadingGrid count={4}`. Empty: `EmptyState` with sports icon and the required message "لا توجد مباريات في هذا القسم حاليًا".
- Wrapped in `<div className="space-y-4 px-4 py-4">`.

### `src/components/views/tournaments-view.tsx`
- `"use client"`, named export `TournamentsView()`.
- Fetches `/api/tournaments`.
- `SectionHeader` "البطولات الرياضية" + inline subtitle paragraph (since `SectionHeader` doesn't accept a subtitle prop, the subtitle is rendered below it inside a wrapper, preserving the spec's "with subtitle" intent).
- Grid `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3`.
- `TournamentCard`: 56px logo container (round, emerald-light→emerald gradient bg, ring border, SVG-fallback to first-letter), name (Ar), country, type badge (دوري/كأس/دولي with different bg tints), match count + team count with Lucide icons. Clicking navigates to `{ name: "tournament", id }`.
- Hover effect: translate-y, emerald-tinted border, shadow.
- Loading: `LoadingGrid` with override `className="grid-cols-2 sm:grid-cols-3 md:grid-cols-4"`. Empty: `EmptyState`.

### `src/components/views/tournament-view.tsx`
- `"use client"`, named export `TournamentView({ id })`.
- Fetches `/api/tournaments` (find by id), `/api/matches` (filter by `tournamentId === id`), `/api/teams?tournamentId=<id>` (URL-encoded).
- Header: large 72px tournament logo + name (Ar) + Latin name + favorite toggle (kind `tournament`) with sonner toast. Country chip (secondary bg, emerald text), type chip (gold bg), match count, team count.
- Tabs `matches | teams` with counts in labels, same emerald active-state styling.
- المباريات: groups matches by calendar day, header per group with gold dot + `dayLabel(kickoff)` + count + horizontal rule, then `grid-cols-1 sm:grid-cols-2` of `MatchCard` (passes `featured` per match so featured ones get gold border + countdown).
- الفرق: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4` of team cards (logo + name, hover lift).
- Loading/empty states per tab. Header skeleton when tournament not yet loaded.

## Lint result

`bun run lint` → **0 errors, 7 warnings** (all "Unused eslint-disable directive" for `@next/next/no-img-element` — same pattern as the orchestrator's existing `match-card.tsx` / `channel-logo.tsx`; rule isn't enabled in this project so the disables are no-ops but harmless). My three files compile cleanly; dev server log shows `✓ Compiled in 1580ms` / `✓ Compiled in 430ms` after the writes.

## Stage Summary

- Three view components delivered, all wired to existing stores (`useNav`, `useFavorites`), hooks (`useFetch`), and shared components (`MatchCard`, `SectionHeader`, `EmptyState`, `LoadingGrid`, shadcn `Tabs`).
- Design system respected: emerald + gold + cream only, no black/indigo/blue, RTL-friendly layouts, rounded-2xl cards, horizontal-scroll chip rows, custom emerald active state on tabs.
- All filters and tabs functional; loading + empty states handled gracefully.
- Ready to be consumed by `src/app/page.tsx` once all sibling view files from tasks 2-a, 2-b, 2-d, etc. are in place (page.tsx already imports these three correctly).

## Artifacts produced
- `src/components/views/matches-view.tsx`
- `src/components/views/tournaments-view.tsx`
- `src/components/views/tournament-view.tsx`
