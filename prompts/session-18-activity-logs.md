# Session 18 — Activity logs

At the end of this session admins have a working audit feed on the phone: an infinite list of old→new change rows with coloured status pills and entity links, behind a filter sheet for entity, user, date range and name search.

---

Session 18 — Activity logs.

Read docs/OVERVIEW.md §3 (Data, Navigation, Styling), §4 (packages), §5 (structure) and §8 (shared code rule).
Read docs/SCREENS.md `/admin/operations/activity-logs` (purpose, API calls, state, roles, "On a phone") and its
`/admin/operations/profile` entry, docs/API_CONTRACT.md rows for `GET /api/admin/operations/activity-logs` and
`GET /api/admin/operations/users`, docs/COMPONENTS.md rows for `ActivityLogItem.tsx`, `ActivityLogList.tsx`,
`ActivityLogFilters.tsx` and `formatActivityValue.ts`, and docs/SHARED_CODE.md on `STATUS_META_BY_ENTITY`,
`entityTypes.ts` and `userRoles.ts`.

Reference (read-only): D:\zan-workspace —
`src/app/admin/operations/activity-logs/ActivityLogsClient.tsx` (the `ADMIN_ROLES = [10, 20]` gate and the Restricted-area card),
`src/components/admin/operations/activityLog/types.ts` (`ActivityLogRow`, `InteractionDetail`, `EMPTY_FILTERS`),
`src/components/admin/operations/activityLog/ActivityLogList.tsx` (`buildQuery`, `DEFAULT_LIMIT = 15`, the 300 ms search debounce),
`src/components/admin/operations/activityLog/ActivityLogItem.tsx` (453 lines — the whole diff renderer),
`src/components/admin/operations/activityLog/formatActivityValue.ts` (copy verbatim),
`src/components/admin/operations/activityLog/ActivityLogFilters.tsx`,
`src/app/api/admin/operations/activity-logs/route.ts` (the real query contract and the `scope` field).

## Goal
A new Activity Logs screen in the More stack. Roles 10 and 20 see a paged FlatList of audit rows — actor avatar and name,
a time-ago line, Created / Deleted / "Updated <field>" with an old→new pill pair, interaction rows labelled with their
interaction type and parent, and status numbers rendered as the same coloured pills the web shows. Every other role sees
the Restricted-area card pointing at their own profile. The same list component also powers the My-activity section on
the Profile screen.

## Scope
- `src/types/activityLog.ts` — copy `ActivityLogUser`, `InteractionDetail`, `ActivityLogRow`, `ActivityLogPagination`,
  `ActivityLogResponse` (keep `scope: "self" | "all"`), `ActivityLogFilterState` and `EMPTY_FILTERS` from the web's
  `activityLog/types.ts`, with `EntityType` imported from `@/constants/entityTypes`.
- `src/lib/activityLog/formatActivityValue.ts` — `normalizeEntityType`, `formatActivityValue`, `humanizeFieldName` copied
  verbatim, with the one date branch switched from `toLocaleString` to `dayjs(value).format("DD MMM YYYY, hh:mm A")`
  (Hermes has no full ICU). Unit-test it: a status number on a LEAD row, a role number, an ISO date, a 24-char ObjectId
  (→ `abc123…7f90`), a boolean, an empty array, `null` → `—`.
- `src/api/endpoints.ts` — add `GET /api/admin/operations/activity-logs`; the users list is already there from session 16.
- `src/hooks/useListQuery.ts` — add an optional `params: Record<string, string>` that is merged into the query string and
  included in the reset-to-page-1 key, so `entityType`, `userId` and `q` ride along without new hook state.
- `src/lib/activityLog/buildActivityParams.ts` — the web `buildQuery` rules kept exactly: `limit=15`; `userId` from
  `forceUserId` first, then `filters.userId`; `entityType` sent only when it is not `""` (0 = Lead is a real value, so
  compare against `""`); `from` as sent; `to` pushed to `23:59:59.999` and sent as an ISO string; `q` trimmed and sent
  only when there is no `userId` and no `forceUserId`.
- `src/components/activityLog/ActivityLogList.tsx` — `FlatList` on `useListQuery` with `keyExtractor={(row) => row._id}`,
  `onEndReached` → `loadMore`, `RefreshControl` → `refresh`, 5 skeleton rows on first load, a footer spinner while
  appending, the `{total} entries` / `{total} entry` count line, and `EmptyState` with
  "No activity matches the current filters." Props: `filters`, `forceUserId?`, `limit?`, `ListHeaderComponent?`.
- `src/components/activityLog/ActivityLogItem.tsx` — the row shell: avatar (ImageKit URL + `?tr=w-72,h-72`, falling back
  to the lucide `User` icon on error), actor name (`user.name || user.email || "System"`), `TimeAgo`, and the action line.
  Keep the web's marker logic: `isCreate` when `action === "CREATE"` or (`oldData === null && newData !== null`),
  `isDelete` when `action === "DELETE"` or (`oldData !== null && newData === null`), everything else a field change;
  `isInteractionMarker` when a CREATE row's normalized type is `ENTITY_TYPE.INTERACTION`.
- Split the 453-line web component so every file stays under 250 lines:
  `src/components/activityLog/ActivityDiff.tsx` (the `DiffPill` pair with the `ArrowRight` between them),
  `src/components/activityLog/InteractionLine.tsx` (the interaction chip from `INTERACTION_TYPE_META`, the "on <parent>"
  link, and the `InteractionDetailBlock` — `parseStatusTitle` on `interaction.title` for `INTERACTION_TYPE.STATUS_CHANGED`
  plus the `Remarks: …` line), and
  `src/components/activityLog/entityTarget.ts` (the `ENTITY_BADGE` colour map keyed by numeric `ENTITY_TYPE`, plus
  `getEntityTarget` / `getInteractionParentTarget` returning a `{ screen, params }` navigation target instead of an href:
  LEAD→LeadDetail, CLIENT→ClientDetail, PROJECT→ProjectDetail, USER→UserEdit, LEAD_SOURCE→LeadSourceDetail,
  LEAD_SOURCE_UPLOAD→UploadReport, everything else `null` so the badge stays a plain pill).
- `src/components/activityLog/ActivityLogFilterSheet.tsx` — the four controls stacked in a `Modal` sheet (they do not fit
  side by side at 360dp): an entity picker built from `Object.entries(ENTITY_TYPE_META)` with "All entities" first, a
  "Search by user name…" input disabled while a user is selected, the session-6 `DateField` pair for From/To
  (From `max={to}`, To `min={from}`), and a Reset row shown only when something is active. A filter button on the screen
  header carries a dot while any filter is set.
- `src/components/activityLog/UserPickerModal.tsx` — the web's 100-user `<select>` becomes a searchable modal list:
  `GET /api/admin/operations/users?limit=100` once on open, filtered locally by name/email, "All users" at the top, and a
  silent failure (empty list, the name search still works) exactly as the web does.
- `src/screens/activityLogs/ActivityLogsScreen.tsx` — `Activity` icon header with "Activity Log" and the subtitle "Every
  tracked change across the system. Filter by user, entity, or date range.", the filter button, and `ActivityLogList`
  with `isAdmin` filters. Non-admin roles get `src/components/activityLog/RestrictedArea.tsx`: the amber `ShieldAlert`
  card with "Restricted area" and "The system activity log is available only to administrators. Your own activity is
  visible on your profile page.", plus a button that navigates to Profile.
- Profile reuse: render `<ActivityLogList forceUserId={me._id} />` in the Profile screen's My-activity section, with the
  sheet's user picker and name search hidden (the web passes `isAdmin={false}`), replacing whatever stand-in session 17 used.

## Already decided (follow these)
- Plain `fetch` + `useState`/`useEffect` through `src/api/client.ts`; `useListQuery` + `ListScreen` conventions from
  session 6; page size 15 here. No TanStack Query.
- NativeWind `className` with the web's Tailwind strings copied verbatim including `dark:` variants, so `ENTITY_BADGE`,
  `INTERACTION_TYPE_META.color` and the `*_STATUS_META` colours keep working untouched.
- `STATUS_META_BY_ENTITY` is already in `src/constants/` from session 2 — read status labels and colours through it and
  through `LEAD_STATUS_META` / `CLIENT_STATUS_META` / `PROJECT_STATUS_META`, never from literals.
- Reuse the session 3 primitives (`Card`, `Skeleton`, `EmptyState`, `Button`, `Input`, `Modal`, `StatusPill`), session 6's
  `DateField` on `@react-native-community/datetimepicker@^9.2`, and session 15's `TimeAgo`.
- Admin gate is `[10, 20]` read from the auth context; the API scopes non-admins to their own rows anyway (`scope: "self"`).
- Packages already installed: `lucide-react-native@^1.49` on `react-native-svg@^15.15`, `dayjs@^1.11`, `clsx@^2`,
  `@react-native-community/datetimepicker@^9.2`. Add nothing new.
- `ActivityHeatmap.tsx` stays on the web: it is imported by nothing there and `/activity-logs/heatmap` has no mobile home.
- 4-space indent, no semicolons, double quotes, `function` declarations, `@/` imports, default export for components and
  screens, files under 250 lines.

## Steps
1. Write `src/types/activityLog.ts`, copy `formatActivityValue.ts` with the dayjs change, and add its unit test.
2. Add the `params` option to `useListQuery` and write `buildActivityParams.ts`; log one built query string and compare it
   field by field with what the web sends for the same filters.
3. Build `entityTarget.ts`, then `ActivityDiff.tsx`, then `InteractionLine.tsx`, then `ActivityLogItem.tsx`, rendering them
   first against three hard-coded rows: a field change with a status number, a CREATE, and an interaction `STATUS_CHANGED`
   row with remarks.
4. Build `ActivityLogList.tsx` and register `ActivityLogsScreen` in the More stack; confirm 15 rows load and page 2 appends.
5. Build `DateField`-based `ActivityLogFilterSheet.tsx` and `UserPickerModal.tsx`, wire them to the screen's filter state.
6. Add `RestrictedArea.tsx` and the non-admin branch, then point the Profile screen's activity section at
   `ActivityLogList` with `forceUserId`.
7. Test on the emulator as a role-10 account, then as a role-60 account.

## Definition of done
- [ ] `npm run android` installs and Activity Logs opens from the More tab.
- [ ] The first page shows 15 rows newest-first and scrolling appends the next 15, stopping at the last page with no duplicate `_id`.
- [ ] A `status` field-change row shows the two status pills with the labels and colours from the `*_STATUS_META` map, not raw numbers.
- [ ] A role field-change row shows the `USER_ROLE_META` label; an ObjectId value renders shortened; an ISO date renders as `DD MMM YYYY, hh:mm A`.
- [ ] A CREATE row shows the green Created chip, a DELETE row the red Deleted chip, and a field change shows "Updated <humanized field>".
- [ ] An interaction row shows its `INTERACTION_TYPE_META` chip, "on Lead — <name>", and for a 2510 row the from→to pills plus `Remarks:`.
- [ ] Tapping a Lead, Client, Project or Lead Source badge opens that detail screen; an Interaction or Meeting badge is a plain pill that does not navigate.
- [ ] Selecting entity "Lead" (code 0) actually filters, confirming the `""` comparison rather than a truthy check.
- [ ] Setting a To date includes rows from that same day (end-of-day ISO on the wire).
- [ ] Choosing a user in the picker disables the name search; clearing it re-enables it, and each change resets to page 1.
- [ ] A role-60 account sees the amber Restricted area card and its button lands on Profile.
- [ ] The Profile screen's My-activity list shows only that user's rows and has no user picker.
- [ ] `npm run lint`, `npx tsc --noEmit` and the `formatActivityValue` test pass.

## When you are done
Write a short summary: files added or changed, what works on the device, anything deferred, and any blocker. Then stop.

--- FOLLOW-UP (paste only if the session stopped early) ---

Most likely sticking point: the split of the 453-line `ActivityLogItem`. Finish it by keeping `ActivityLogItem.tsx` as the
shell only — avatar, actor, `TimeAgo`, badges — and moving every branch body into `ActivityDiff.tsx` and
`InteractionLine.tsx`, with the colour maps and navigation targets in `entityTarget.ts`. If rows render blank, log one raw
row and check `normalizeEntityType` against both the numeric and the legacy `"LEAD"` string form. If `entityName` comes
back null on User rows, that is a server-side key mismatch — render the `#last6` id fallback and note it for week 6.
