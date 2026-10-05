# Session 19 — Dashboard feed, stats panels and search

The Dashboard tab opens on four stat cards, the next four meetings and a virtualized activity feed, with a global search screen one tap away.

---

Session 19 — Dashboard feed, stats panels and search.

Read docs/OVERVIEW.md §3 (Data, Navigation, Styling, Region, Offline), §4 (packages), §5 (structure), §8 (shared code rule) and §11 risks 4 and 6.
Read docs/SCREENS.md on `/admin/operations` (the dashboard feed, its "On a phone" note) and on the operations layout shell — the paragraph explaining that StatsPanel and UpcomingMeetingsPanel live in a desktop-only sticky aside and belong on the Dashboard tab instead, and that the layout SearchBar must split into a per-list field and a separate global-search screen.
Read docs/API_CONTRACT.md rows for `GET /api/admin/operations`, `/stats`, `/overall-stats`, `/search` and `/meetings`, plus the "NAVIGATION TARGETS ARE WEB PATHS" note on mapping `href` strings to screens.
Read docs/BACKEND_CHANGES.md "Strongly recommended — paginate the dashboard feed".
Reference (read-only): reference/zan-workspace —
`src/app/admin/operations/page.tsx` (the feed screen, its loading / error / empty states),
`src/components/admin/operations/EntityCard.tsx`, `InteractionCard.tsx`, `StatusChangeItem.tsx`, `skeletons/EntityCardSkeleton.tsx`,
`src/components/admin/operations/StatsPanel.tsx`, `UpcomingMeetingsPanel.tsx`,
`src/components/admin/operations/SearchBar.tsx`, `search/SearchResults.tsx`, `search/SearchResultRow.tsx`, `search/types.ts`,
`src/app/api/admin/operations/route.ts`, `src/app/api/admin/operations/search/route.ts`, `src/lib/stats/computeStats.ts`.

## Goal
The Dashboard tab is a real screen: a stats row, an upcoming-meetings card and the merged Lead / Client / Project
activity feed sorted by `lastInteractionAt`, every card opening its detail screen in the right stack. Pull-to-refresh
reloads all three. A search icon in the header opens a Search screen that queries all four entity types and navigates
to a hit. Charts stay out — they are session 20.

## Scope
- `src/screens/dashboard/DashboardScreen.tsx` — the `Dashboard` screen already registered in `DashboardStack`
  (session 5). One `FlatList` of feed items with `ListHeaderComponent` holding `StatsCards` + `UpcomingMeetingsCard`,
  so the whole tab scrolls as one surface and the panels stay virtualization-friendly. Pull-to-refresh refetches the
  feed, the stats and the meetings together. `AccessDenied` (session 3) replaces the body when the feed returns 403 —
  the API is `requireRole [10, 15, 60, 69, 70, 45, 50]`, so e.g. a role-20 account lands there.
- `src/hooks/useDashboardFeed.ts` — `GET /api/admin/operations` through `send` from `src/api/client.ts`. Send
  `?page=<n>&limit=20` and read `pagination.pages` when the response carries a `pagination` object; when it does not
  (the backend change has not landed), take `json.data` as the complete array, keep the web's
  `Array.isArray(json.data)` guard, and page it client-side in slices of 20 behind the same `loadMore` so the screen
  code is identical either way. Returns `items, loading, refreshing, loadingMore, error, accessError, refresh,
  loadMore`.
- `src/components/dashboard/EntityCard.tsx` — the port of the web card: the entity icon tile (`Briefcase` for
  `ENTITY_TYPE.LEAD` and `PROJECT`, `Building2` for `CLIENT`), `name || title`, the `company || companyName` line with
  `Building2`, then the meta row — `PhoneText` (session 7), email, `source`, and `TimeAgo` on `lastInteractionAt` —
  then `description`, then the last interaction. Group-hover tints become pressed states; the web's `w-[90%] mx-auto`
  wrapper becomes a full-bleed card with 16px gutters. Keep `getEntityConfig` and replace `getHref` with
  `navigateToEntity(navigation, entityType, _id)` from `src/lib/entityNav.ts`.
- `src/lib/entityNav.ts` — the one place web paths become screens: `ENTITY_TYPE.LEAD → LeadsStack/LeadDetail`,
  `CLIENT → ClientsStack/ClientDetail`, `PROJECT → ProjectsStack/ProjectDetail`, each with `{ id }`, plus
  `hrefToScreen(href)` parsing the `/admin/operations/{leads|clients|projects|meetings}/<id>` strings that
  `/search` returns. Reuse `resolveNotificationPath` from `src/navigation/linking.ts` if the shapes already match.
- `src/components/dashboard/LastInteraction.tsx` — the small `lastInteraction` block inside the card:
  `type === INTERACTION_TYPE.STATUS_CHANGED` (2510) renders the session 8 `StatusChangeItem` with `entityType`;
  anything else renders a compact row built from `INTERACTION_TYPE_META[type]` (icon name → an explicit
  `lucide-react-native` component map, the web's `getIcon` switch: calendar, check, times, refresh, file, phone, doc,
  briefcase, exchange-alt, defaulting to `FileText`), the title and `TimeAgo`. Fallback meta is `INTERACTION_TYPE_META[2110]`.
- `src/components/dashboard/EntityCardSkeleton.tsx` — five of them while the first page loads, from the session 3
  `Skeleton` primitives.
- `src/components/dashboard/StatsCards.tsx` — `GET /api/admin/operations/stats`, the four `ITEMS` copied from
  `StatsPanel.tsx` with their keys `leads`, `activeClients`, `projectsRunning`, `meetingsThisWeek`, their labels,
  lucide icons (`Target`, `Handshake`, `FolderKanban`, `CalendarClock`) and accent class strings. A 2x2 grid of
  pressable tiles instead of the desktop column; each tile navigates where the web links did — Leads list, Clients
  list with `status: 1` prefilled, Projects list, Meetings. Failures stay silent and show `—`, exactly as the web does;
  a `Skeleton` block shows while loading.
- `src/components/dashboard/UpcomingMeetingsCard.tsx` — `GET /api/admin/operations/meetings?range=upcoming&limit=20`,
  re-sorted soonest-first client-side and sliced to `VISIBLE_COUNT = 4`, because the route sorts `scheduledAt: -1`.
  Port `smartDate` verbatim (Today / Tomorrow / `ddd, h:mm A` / `MMM D, h:mm A`) and the `parentHref` switch through
  `entityNav`. Header "UPCOMING MEETINGS" with `CalendarClock`, a "View all" row opening the Meetings screen with
  `range: "upcoming"`, and an empty line when nothing is scheduled.
- `src/screens/dashboard/SearchScreen.tsx` — registered as `Search` in `DashboardStack`, reached from a `Search`
  header button on the Dashboard. An auto-focused `Input`, 300 ms debounce, a request only at 2+ characters, the
  `reqIdRef` out-of-order guard from `SearchBar.tsx`, and `GET /api/admin/operations/search?search=<term>&limit=10`.
  Sections in the web's order — Leads, Clients, Projects, Meetings (Users stays commented out server-side, so skip it)
  — rendered with a `SectionList`, section headers from the web's uppercase label style, and the loading / error /
  "No results for …" states ported. Keyboard arrow navigation and the mousedown-outside handler have no touch
  equivalent and are dropped.
- `src/components/dashboard/SearchResultRow.tsx` — the port of `search/SearchResultRow.tsx`: the `ICON` map
  (`LEAD: User`, `CLIENT: Building2`, `PROJECT: Folder`, `MEETING: Calendar`, `USER: UserCog`) and the `ICON_COLOR`
  class strings, title + optional subtitle, 44dp minimum height, tapping routes through `hrefToScreen(hit.href)`.
  A meeting hit opens the Meetings screen; log and ignore an href shape the mapper does not know.
- `src/types/search.ts` — `SearchEntity`, `SearchHit`, `SearchData`, `SearchResponse` copied from the web's
  `search/types.ts`.
- `src/api/endpoints.ts` gains `DASHBOARD_API = "/api/admin/operations"`, `STATS_API`, `SEARCH_API`.

## Already decided (follow these)
- Data is plain `fetch` + `useState`/`useEffect` through `src/api/client.ts` (`send`, `sendRaw`, `ApiError`), which
  already carries the Bearer token, `X-Active-Region` and the 401 reset. The feed has its own hook; `ListScreen` from
  session 6 is built for filtered lists, so borrow its paging habits rather than forcing this screen into it.
- `src/constants/` and `src/types/` are the session 2 verbatim copies: `ENTITY_TYPE`, `INTERACTION_TYPE`,
  `INTERACTION_TYPE_META`, `STATUS_META_BY_ENTITY`, `LEAD_STATUS_META`, `CLIENT_STATUS_META`, `PROJECT_STATUS_META`.
  Read labels and colours from them, never from literals.
- Reuse the session 3 primitives (`Card`, `Badge`, `Skeleton`, `EmptyState`, `AccessDenied`, `Input`, `TimeAgo`,
  `notify`) and the session 8 `StatusChangeItem`. Styling is NativeWind with the web's class strings.
- Packages already installed: `nativewind@^4.1` + `tailwindcss@~3.4`, `@react-navigation/native@^7` +
  `native-stack` + `bottom-tabs`, `lucide-react-native@^1.49` on `react-native-svg@^15.15`, `dayjs@^1.11`,
  `clsx@^2`, `react-native-toast-message@^2.5`, `react-native-safe-area-context@^5.5.2`. Add nothing new; charts and
  `react-native-gifted-charts` belong to session 20.
- Edge-to-edge is on: the feed's bottom padding is `useBottomTabBarHeight() + insets.bottom`.
- Style per docs/CODING_STYLE.md: 4-space indent, no semicolons, double quotes, `function` declarations, `@/` imports,
  default export per component and screen, files under 250 lines, every string inside a `<Text>`, touch targets 44dp.

## Steps
1. Add the three endpoint constants and `src/lib/entityNav.ts`, and prove `navigateToEntity` from a temporary button
   that opens one known lead, client and project detail screen.
2. Write `useDashboardFeed.ts` with the `page`/`limit` path plus the full-array fallback, and render the rows as one
   line of text first to confirm the dev API's shape and which branch is live.
3. Build `EntityCard.tsx`, `LastInteraction.tsx` and `EntityCardSkeleton.tsx`, then wire the `FlatList`,
   `keyExtractor={(item) => item._id}`, `onEndReached`, `RefreshControl` and the empty / error / `AccessDenied` states.
4. Build `StatsCards.tsx` and `UpcomingMeetingsCard.tsx`, mount them as `ListHeaderComponent`, and join all three
   refetches to one `refresh()`.
5. Add the header search button, `SearchScreen.tsx`, `SearchResultRow.tsx` and `src/types/search.ts`, with the
   debounce, the 2-character floor and the `reqIdRef` guard.
6. Check the role paths: a role-10 account sees the feed; an account outside `[10, 15, 60, 69, 70, 45, 50]` sees
   `AccessDenied` with the API's message while the stats and meetings cards stay silent.
7. Switch region and confirm the feed, stats, meetings and search all refetch against the new `X-Active-Region`.
8. Run `npm run lint` and `npx tsc --noEmit`, then scroll the feed on a device and watch the Metro network log for one
   request per page.

## Definition of done
- [ ] `npm run android` installs, and the Dashboard tab opens on the stats cards, the meetings card and the feed from
      the dev API.
- [ ] The feed renders Lead, Client and Project cards with name/company, phone, email, source, time-ago and the last
      interaction; a 2510 row shows the from → to status pills.
- [ ] Tapping a Lead, a Client and a Project card each opens the matching detail screen in its own stack.
- [ ] Scrolling to the bottom appends the next 20 rows (from `page`/`limit` if the backend change is live, from the
      client-side slice if it is not) and the Metro log shows no duplicate in-flight request.
- [ ] Pull-to-refresh reloads the feed, the four counters and the meetings list in one gesture.
- [ ] The four stat tiles show real numbers from `/stats`, and tapping Active Clients opens the clients list filtered
      to status 1.
- [ ] The meetings card lists at most four meetings soonest-first with Today / Tomorrow / weekday labels, and each one
      opens its parent lead, client or project.
- [ ] Typing two characters in Search returns grouped Leads / Clients / Projects / Meetings hits, a one-character query
      fires no request, and tapping a hit opens the right screen.
- [ ] A query with no matches shows "No results for …" and a failed search shows the server's message.
- [ ] An account outside the feed's role list sees `AccessDenied` with the API's message instead of the feed.
- [ ] `npm run lint` and `npx tsc --noEmit` pass.

## When you are done
Write a short summary: files added or changed, what works on the device, anything deferred, and any blocker. Then stop.

--- FOLLOW-UP (paste only if the session stopped early) ---

Continue session 19. If `GET /api/admin/operations` still returns every row with no `pagination`, keep the client-side
slice in `useDashboardFeed.ts`, record the payload size and row count you measured, and leave the `page`/`limit` branch
in place for when the backend change lands. If the header panels inside `ListHeaderComponent` re-render or lose scroll
position on refresh, memoize the header element outside the render body. Otherwise name what is missing from Scope,
build those files, and re-run the Definition of done.
