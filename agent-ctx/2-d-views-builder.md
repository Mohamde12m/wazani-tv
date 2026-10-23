# Task 2-d — views: favorites / more / search

Agent: subagent (views builder)
Task: Build the three React view components `FavoritesView`, `MoreView`, `SearchView` for the ArabVision TV app, following the design system and shared components established by the orchestrator in Phase 1.

## Work Log

### Files produced
- `src/components/views/favorites-view.tsx` — `export function FavoritesView()`
- `src/components/views/more-view.tsx` — `export function MoreView()`
- `src/components/views/search-view.tsx` — `export function SearchView({ initialQuery }: { initialQuery?: string })`

### FavoritesView
- Uses `useFavorites` store + fetches full `/api/channels` and `/api/matches`, joins by id (per spec recommendation).
- Three shadcn `Tabs`: "القنوات" / "المباريات" / "البطولات والفرق".
- Per-tab count badges.
- Channels: flex-wrap grid of `ChannelCard`. Empty state: "لم تقم بإضافة أي قناة إلى المفضلة بعد".
- Matches: 2-col grid of `MatchCard`. Empty state.
- Tournaments/teams: simple list rows with kind label, refId (mono), and a working remove (Trash2) button that calls `toggle(kind, refId)`.
- Loading skeleton (`LoadingGrid`) while channels/matches are still fetching.
- Page header with gold gradient icon, total count chip.
- All favorite toggles/removes work optimistically via the store — UI updates immediately.

### MoreView
- Sections: قائمة التنقل · الإعدادات · الإدارة · حول التطبيق · حقوق المصادر وإخلاء المسؤولية.
- `MenuCard` helper renders `rounded-2xl border border-border bg-card p-4 flex items-center gap-3` with emerald-tinted (or gold-tinted) icon box, title, subtitle, and a `ChevronLeft` (RTL "forward").
- Navigation cards route to `{ name: "tournaments" }`, `{ name: "channels" }`, `{ name: "matches" }`.
- Theme toggle: shadcn `Switch` bound to `useTheme()` with mounted guard; `setTheme(theme === "dark" ? "light" : "dark")` per spec; toast feedback.
- Admin card (lock icon, gold tone) → `{ name: "admin" }`.
- About card: ArabVision TV brand, tagline "القنوات العربية ومباريات كرة القدم", v1.0.0 chip, short description.
- Disclaimer card: gold-tinted border, ShieldAlert icon, four short Arabic paragraphs explaining honest stream policy (only verified streams included, demo matches clearly marked, real availability depends on official sources, trademarks belong to their owners).

### SearchView
- Autofocus shadcn `Input` with `Search` icon (right in RTL) and a clear `X` button (left in RTL).
- Controlled `q` state initialized from `initialQuery`; instant per-keystroke filtering.
- Custom `normalize()` Arabic-aware helper: lowercases, strips tashkeel/tatweel, folds أإآٱ→ا, ى→ي, ؤ→و, ئ→ي, ة→ه, collapses whitespace.
- Searches across `name`, `nameAr`, `country.name`, `category.name`.
- Shows "نتائج البحث: N" with count chip; "لا توجد نتائج مطابقة لـ «...»" empty state.
- Empty-query state: popular categories as quick-filter chips (→ `{ name: "channels", category: slug }`) + featured channels grid.
- Loading skeleton while channels load.

### Lint
- Ran `bun run lint`. My three files produce zero errors and zero warnings.
- Fixed one unused `eslint-disable-next-line react-hooks/exhaustive-deps` in search-view.tsx (the deps array was already complete, so the directive was redundant).
- Remaining lint warnings are in files authored by the orchestrator (seed.ts, channel-logo.tsx, match-card.tsx, use-fetch.ts) and are not in scope.

### Design system adherence
- Strictly emerald + gold + cream tokens (`bg-emerald`, `text-emerald`, `bg-gold`, `text-gold`, `bg-emerald-dark`, `bg-emerald-light`, `.gold-text`).
- No black, no indigo, no blue.
- All cards `rounded-2xl border border-border bg-card shadow-sm`.
- RTL flows naturally (chevrons point left for "forward", icons positioned correctly).
- Responsive: 1-col on mobile, 2-col on `sm` for matches; flex-wrap channel grids.

## Stage Summary
Three production-ready views delivered. They integrate cleanly with the page router in `src/app/page.tsx` (which already imports them). All required exports and prop signatures match the spec exactly. Favorites toggles update optimistically; theme switch flips light/dark live; search is instant and Arabic-aware. No new dependencies introduced.

The dev server still reports missing modules for `tournaments-view`, `tournament-view`, `admin-view`, `matches-view` — those are owned by other agents and not in my scope.
