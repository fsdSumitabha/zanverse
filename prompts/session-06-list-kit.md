# Session 06 — Shared list kit

One list hook, one list scaffold and one filter sheet that every later module screen drops straight into — proven on a real paged endpoint on the device.

---

Session 06 — Shared list kit.

Read docs/OVERVIEW.md §3 (Data, Navigation, Styling), §4 (packages), §5 (structure), §8 (shared code rule) and §11 risk 4.
Read docs/CLIENT_SYSTEMS.md "usePagination" and "useSearch", docs/COMPONENTS.md rows for `Pagination.tsx`, `ListFilters.tsx`
and `filters/DateField.tsx`, docs/SCREENS.md `/admin/operations/leads` (its "On a phone" list), and docs/API_CONTRACT.md
§ envelope + response-shape inconsistencies.

Reference (read-only): D:\zan-workspace —
`src/hooks/usePagination.ts`, `src/hooks/useSearch.ts`, `src/components/admin/operations/ListFilters.tsx`,
`src/components/admin/operations/filters/DateField.tsx`, `src/components/admin/operations/Pagination.tsx`,
`src/components/admin/operations/SearchBar.tsx` (take `DEBOUNCE_MS` and the 2-char minimum only),
`src/app/admin/operations/leads/LeadsClient.tsx` (the fetch body this kit has to keep working verbatim),
`src/components/admin/operations/skeletons/LeadCardSkeleton.tsx`.

## Goal
At the end there is `useListQuery` + `ListScreen` + `ListFilters` in `src/`, and a throwaway demo screen that shows real
leads from the dev API: 10 rows on open, more rows appended as you scroll, pull-to-refresh, a status + date-range filter
sheet, in-screen search, and a fresh list every time you come back to the tab. Sessions 7, 9, 10, 11, 16, 18 and 19 then
write a card component and a query key, nothing else.

## Scope
- `src/hooks/useListQuery.ts` — holds `page`, `search`, `status`, `from`, `to`, `view`, `sort` using the web's exact query
  param names, so a fetch body copied out of `LeadsClient.tsx` works unchanged. Returns `{ query, setPage, setSearch,
  setFilters, resetFilters, items, total, pages, loading, refreshing, loadingMore, accessError, refresh, loadMore }`.
  `setPage` is a stable `useCallback` (the web relied on that; keep the property). Any change to `search`, `status`,
  `from`, `to`, `view` or `sort` resets `page` to 1 and replaces `items`; a `page` increase appends.
- Fetching through `src/api/client.ts` `send`/`sendRaw` from session 4: one `AbortController` per request, abort the
  previous one, swallow `AbortError`. Read `pagination.pages ?? pagination.totalPages` so the meetings endpoint fits too.
  `ApiError` with `status === 403` sets `accessError` to `error.message`; 401 is already handled inside the client.
- `useFocusEffect` (React Navigation 7) refetches page 1 quietly on focus, because tabs keep screens mounted — a stale
  list after a write on another tab is a mobile-only bug the web never had.
- Debounced search: 300 ms, fires only at 0 or 2+ characters, same as the web `SearchBar`.
- `src/components/list/ListScreen.tsx` — `FlatList` with `keyExtractor={(item) => item._id}`, `onEndReached` +
  `onEndReachedThreshold={0.5}` calling `loadMore` when `page < pages` and nothing is in flight, `RefreshControl` on
  `refresh`, a skeleton `ListFooterComponent` while `loadingMore`, 5 skeleton cards while the first page loads, a
  `ListEmptyComponent` from the `EmptyState` primitive, a header slot (search field + filter button + "N found" count),
  and `AccessDenied` rendered in place of the list when `accessError` is set. Props: `query` result, `renderItem`,
  `SkeletonComponent`, `emptyText`, `headerRight`.
- `src/components/list/ListFilters.tsx` — a plain RN `Modal` sheet with a status picker built from a `statusMeta` prop
  (`Record<string | number, { label: string }>`, i.e. `LEAD_STATUS_META` and friends), From/To `DateField`s, and a
  "Clear filters" row shown only when something is active. It applies on close by calling `setFilters` once.
- `src/components/list/DateField.tsx` — the web `DateField` on `@react-native-community/datetimepicker@^9.2`: same
  `label`/`value`/`min`/`max`/`active`/`onChange` props, same `YYYY-MM-DD` strings over the wire, same short display
  format when active.
- `src/lib/dates.ts` — `MIN_DATE = "2026-01-01"`, `todayLocal()` and `clampDate(value, today)` ported from `ListFilters.tsx`
  unchanged (From clamps to `[MIN_DATE, to]`, To clamps to `[from, today]`).
- `src/components/list/SearchField.tsx` — the in-screen search input, since the web's header `SearchBar` has no home on a phone.
- `src/screens/dev/ListKitDemoScreen.tsx` — the throwaway proof: `GET /api/admin/operations/leads?page&limit=10&search&status&from&to`
  with `LEAD_STATUS_META`, a one-line row (name, phone, status label) and nothing else. Reachable from the More tab.

## Already decided (follow these)
- Plain `fetch` + `useState`/`useEffect` through `src/api/client.ts`. No TanStack Query, no Redux, no Zustand.
- Styling is NativeWind `className` with the web's Tailwind strings; skeletons, cards and sheets reuse the session 3
  primitives in `src/components/ui/` (`Card`, `Skeleton`, `EmptyState`, `Button`, `Input`, `Modal`, `StatusPill`).
- Numbered `Pagination` is not ported. The server contract `{ page, limit, total, pages }` stays exactly as it is.
- `PAGE_SIZE` is 10 by default and overridable per screen (users list uses 5, activity logs 15, uploads 20).
- `src/constants/` is the copied web constants; statuses come from the `*_META` maps, never from literals.
- 4-space indent, no semicolons, double quotes, `function` declarations, `@/` imports, default export for components
  and screens, files under 250 lines.
- Packages already installed: `@react-navigation/native@^7`, `react-native-screens@^4.28`,
  `@react-native-community/datetimepicker@^9.2`, `react-native-mmkv@^4.3`, `lucide-react-native@^1.49`, `dayjs@^1.11`,
  `clsx@^2`. Add nothing new this session.

## Steps
1. Write `src/lib/dates.ts` and check `todayLocal()` against the device clock in a log line.
2. Build `src/hooks/useListQuery.ts`: state shape first, then the fetch effect with the abort + append logic, then
   `useFocusEffect`, then the debounce. Keep the whole hook under 250 lines; move the query-string builder into it as a
   local `buildQuery(query)` helper.
3. Build `ListScreen.tsx` against a hard-coded in-memory array of 35 fake rows so paging, footer skeleton, empty state
   and refresh are all visible before any network is involved.
4. Build `DateField.tsx`, then `ListFilters.tsx`, then `SearchField.tsx`.
5. Wire `ListKitDemoScreen.tsx` to the leads endpoint and add it to the More tab (roles 10, 15, 45, 50, 60, 65, 69, 70
   can read that endpoint; anyone else gets 403 and the `AccessDenied` view — that is the case to test).
6. On the emulator and on a real device: scroll to append pages, pull to refresh, filter by status, set a date range,
   search "a" (no request) then a 2-letter term (one request), switch tab away and back, turn off wifi and back on.
7. Log in as a role outside the list above and confirm the demo screen shows `AccessDenied` with the server's message.

## Definition of done
- [ ] `npm run android` installs and the demo screen opens from the More tab.
- [ ] The first page shows 10 lead rows; scrolling to the bottom appends page 2 and the footer skeleton appears while it loads.
- [ ] Scrolling past the last page fires no further requests (confirm in the Metro/Flipper network log, `page` stops at `pages`).
- [ ] Pull-to-refresh replaces the list with page 1 and clears nothing else (status, dates and search survive).
- [ ] Choosing a status in the filter sheet resets to page 1 and the row count line matches `pagination.total`.
- [ ] From/To cannot be set before 2026-01-01 or after today, and From never exceeds To.
- [ ] Typing a single character fires no request; two characters fire exactly one after 300 ms.
- [ ] Leaving the tab and returning refetches page 1 without a visible spinner flash, and no "setState on unmounted"
      warning or stale-response overwrite appears in the console.
- [ ] A 403 role sees the `AccessDenied` view with the API's message; a 401 lands on Login.
- [ ] An empty result shows the `EmptyState` text, not a blank screen.
- [ ] `npm run lint` and `npx tsc --noEmit` pass.

## When you are done
Write a short summary: files added or changed, what works on the device, anything deferred, and any blocker. Then stop.

--- FOLLOW-UP (paste only if the session stopped early) ---

Finish the shared list kit. If `onEndReached` fires repeatedly or on mount, gate `loadMore` on `loadingMore === false &&
page < pages` and set `onEndReachedThreshold={0.5}` with a non-zero `ListFooterComponent` height. If
`@react-native-community/datetimepicker@^9.2` fails to build on RN 0.87, keep `DateField`'s props and render a temporary
three-wheel `@react-native-picker/picker` day/month/year row behind the same `YYYY-MM-DD` `onChange`, and note the
package in the summary. If `useFocusEffect` double-fetches on first focus, skip the first invocation with a ref.
