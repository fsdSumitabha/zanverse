# Session 11 — Lead sources A: list and Today view

An agent opens the Calls tab and works a real cold-calling day on the phone: Today in three sections, two taps to log the result of a call, and bulk actions for managers.

---

Session 11 — Lead sources A: list and Today view.

Read docs/OVERVIEW.md §3 (Data, Navigation, Styling, Region, Dialer, Offline), §4 (packages), §5 (structure), §8 (shared code rule) and §11 risks 4 and 6.
Read docs/LEAD_SOURCES.md in full — it is the authoritative spec — especially "Status model", "Roles and access", the `/admin/operations/lead-sources` screen with its "On a phone" note, the flows "Cold call -> status change -> note", "Callback scheduling" and "Bulk actions", "Endpoints", and the Risks on the `today` contract, the callback day/time pair, 409s and retired code 60.
Read docs/CLIENT_SYSTEMS.md on `useNow` and AppState-gated polling, and docs/API_CONTRACT.md on the response envelope and region transport.
Reference (read-only): D:\zan-workspace —
`src/app/admin/operations/lead-sources/LeadSourcesClient.tsx` (the whole screen: query building, `requestId`, the quiet 60 s reload, `onUpdated`, selection, empty states),
`src/components/admin/operations/lead-sources/` — `ViewTabs.tsx`, `LeadSourceRow.tsx`, `StatusMenu.tsx`, `CallbackPicker.tsx`, `CallbackMenu.tsx`, `CallButton.tsx`, `dialer.ts`, `LeadSourceFilters.tsx`, `AssigneeSelect.tsx`, `BulkBar.tsx`, `ActionDialogs.tsx`, `DayChoice.tsx`, `StatusPill.tsx`, `api.ts`,
`src/lib/lead-sources/listQuery.ts` (how the server sorts and sections Today), `src/constants/leadSourceStatus.ts`, `src/constants/leadSourceRoles.ts`, `src/types/leadSource.ts`.

## Goal
The Calls tab opens on the lead sources list against the dev API. Today arrives already sorted and renders as three sections with sticky headers; a tap on the status badge opens a bottom sheet where the agent picks the result of the call, types a note and, for Call Back, picks a time; the row updates instantly and re-sorts a moment later with the tab counts. Managers also get the person / one-day / upload filters and the bulk Status, Assign, Day and Delete sheets.

## Scope
- `src/screens/leadSources/LeadSourcesScreen.tsx` — the `LeadSources` screen already registered in `CallsStack` (session 5). Header "Lead Sources" with the subtitle "Cold-calling lists for the whole team" for managers and "Numbers to call, assigned to you" for everyone else, the rose "N callbacks are due." banner whose "Show them" action jumps to Today page 1, `ViewTabs`, the manager filter bar, the Today progress bar, the list, `BulkBar`.
- `src/hooks/useLeadSourceList.ts` — one hook owning the list: `view` (`today | upcoming | unscheduled | closed | all`, plus the `day` pseudo-view that sends `view=all` with `day=<YYYY-MM-DD>`), `status`, `assignee`, `upload`, `day`, `search`, `page`, `limit=50`. It fetches `GET /api/admin/operations/lead-sources` through `sendRaw` from `src/api/client.ts`, because that envelope carries `counts` and `progress` next to `data` and `pagination`, and returns rows, `counts`, `progress`, `pagination`, loading/refreshing flags, `accessError`, `refresh`, `loadMore`, `setFilters` and `onUpdated`. Keep the web's `requestId` ref so an out-of-order answer is discarded.
- `today` comes from `todayString()` in `src/lib/leadSourceDay.ts`, recomputed at request time, on every mutation and when AppState returns to `"active"`, so a phone backgrounded past midnight still sends the right day.
- The optimistic swap, verbatim in behaviour: a write returns the updated `LeadSourceRow`, the hook replaces that row in place keeping its old `section`, and ~900 ms later a quiet reload re-sorts it and refreshes the counts. The quiet 60 s poll runs only while `AppState.currentState === "active"` and while a `menusOpen` counter, any open sheet and the selection are all clear; a background→active transition refetches at once, and pull-to-refresh is the visible refresh.
- `src/components/leadSources/LeadSourceRow.tsx` — two lines (name + `listInfo` joined with " · " + a "Lead →" link when `convertedLeadId` is set; then the phone through `formatPhoneForDisplay(row.phone, phoneCountry)` and `lastNote` dimmed), and on the right the callback clock chip, the day chip, the assignee avatar for managers, the status badge and the round green call button. Fixed row height with `getItemLayout`, a rose left edge when the callback is `"due"`, a blue background while selected.
- Sections without a `SectionList`: when `view === "today"`, flatten `rows` into `{ kind: "section" | "row" }` items with headers from `row.section` (0 "Callbacks due now" rose, 1 "Today" grey, 2 "Left over from earlier days" amber), pass their indices as `stickyHeaderIndices`, and size `getItemLayout` from `ROW_HEIGHT` and `SECTION_HEIGHT`.
- `src/components/leadSources/ViewTabs.tsx` — the five tabs in a horizontal `ScrollView` with count pills from `counts.today / upcoming / unscheduled / closed / all`, and under them the status filter: a `SelectSheet` of `LEAD_SOURCE_STATUSES` labelled from `LEAD_SOURCE_STATUS_META`, default "All statuses".
- `src/components/leadSources/StatusMenuSheet.tsx` — the badge plus its bottom sheet: "Result of the call", a 2-column grid of `LEAD_SOURCE_PICKABLE_STATUSES` with the dot colour from the meta map and the current one marked "now", `CallbackPicker` when Call Back is picked, `NoteBox`, Cancel / Save. Save sends `PATCH /api/admin/operations/lead-sources/:id/status` with `{ status, note?, today, callbackAt?, callbackDay? }` and toasts `Callback set for ${formatCallback(row.callbackAt)}` or `${name}: ${label}`. The badge is locked and reads "Converted to a lead" when `status === LEAD_SOURCE_STATUS.CONVERTED`.
- `src/components/leadSources/NoteBox.tsx` — a `maxLength={2000}` multiline input with a visible Save button and a character counter, since Shift+Enter has no meaning on a phone.
- `src/components/leadSources/CallbackPicker.tsx` — `CALLBACK_PRESETS` from `src/lib/callback.ts` (15 min, 30 min, 1 hour, 2 hours, 4 hours, Tomorrow 10 AM) as plain pill buttons, plus an "or at" row that opens `@react-native-community/datetimepicker` in `date` then `time` mode. Keep the web's `CallbackChoice` / `EMPTY_CHOICE` / `resolveChoice` shape, show `formatCallback` + `relativeCallback` on a `useNow(15_000)` tick, and send both fields through `callbackPayload(at)`.
- `src/components/leadSources/LeadSourceFilters.tsx` (managers only) — person (`Everyone` / `Assigned to me` = `me` / `Not assigned` = `none` / a named user), one exact day on the session 6 `DateField`, an "Uploads" row navigating to `LeadSourceUploads`, a Clear button, the "Showing one upload only." strip with "Show all uploads", and the "Showing every source set for this day, in any status." line when `day` is set.
- `src/hooks/useAssignees.ts` + `src/components/leadSources/AssigneeSelect.tsx` — the web `useAssignees(regions, enabled)` on `GET /api/admin/operations/lead-sources/assignees?regions=<sorted,joined>`, cancellable and keyed by the sorted regions, with `roleLabel(role)` from `USER_ROLE_META`; a `SelectSheet` listing "{name} ({role label})" and the "Nobody with a lead source role covers …" line when it comes back empty.
- `src/components/leadSources/BulkBar.tsx` — a floating dark bar above the tab bar (`useBottomTabBarHeight() + insets.bottom`): "N selected", a clear X (the phone's replacement for Esc), Status for everyone, Assign / Day / Delete for managers. Long-press starts a selection; while one is active a tap toggles the row and the call buttons are hidden.
- `src/components/leadSources/bulk/StatusSheet.tsx`, `AssignSheet.tsx`, `DaySheet.tsx`, `DeleteSheet.tsx`, `src/components/leadSources/DayChoice.tsx` (No day / Today / Tomorrow / Other day over a `DateField` clamped to `[today, addDays(today, 366)]`) and `runBulk()` in `src/lib/leadSourceBulk.ts` — all four post `POST /api/admin/operations/lead-sources/bulk` with `{ ids, action, today, … }`, max 200 ids, and report `"{n} lead sources {verb}. {n} already set. {n} skipped."`. Keep the web's copy: the Day sheet says "Any callback time on them is cleared, because the day changes.", the Status sheet offers every pickable status except Call Back with "To set Call Back, open each one, so each gets its own time.", the Delete sheet says "Converted leads are not touched. Only the lead source rows are deleted."
- `src/components/leadSources/CallButton.tsx` + `src/lib/dialer.ts` — the round green button going through one `startCall({ name, phone }, phoneCountry)`, which for now toasts the formatted number with a Copy action and "Calling from the CRM is not set up yet." (session 12 swaps the body for `Linking.openURL("tel:…")`).
- The empty states from the web `EmptyState` in `LeadSourcesClient.tsx` ("Nothing to call today", "No lead sources match" / "Change the search or the filters.", and the upcoming / unscheduled / closed bodies), and `LEAD_SOURCES_API = "/api/admin/operations/lead-sources"` added to `src/api/endpoints.ts`.
- Deferred to session 12: the standalone callback sheet (`PATCH /:id/callback` set / change / clear), the detail screen, `POST /:id/convert` and real dialing. The row chip renders callback state here and opens the status sheet on Call Back.

## Already decided (follow these)
- `src/constants/leadSourceStatus.ts`, `leadSourceRoles.ts`, `src/types/leadSource.ts`, `src/lib/leadSourceDay.ts`, `src/lib/callback.ts`, `src/lib/phone.ts` and `src/hooks/useNow.ts` are the session 2 copies: import them, and read every label, colour and role array from them.
- Role gating mirrors the server: `canManageLeadSources(role)` (MANAGE = 10, 15, 45, 69) drives the filter bar, the assignee avatars and the Assign / Day / Delete buttons, while WORK roles (50, 60, 65, 70) get the calling loop; `LEAD_SOURCE_ACCESS_ROLES` already gates the tab, and a 403 renders `AccessDenied` with the server's message.
- Status colours come from `LEAD_SOURCE_STATUS_META` through the session 3 `Badge` (the `StatusPill` replacement), which already falls back to a grey "Unknown" for retired code 60. Sheets are the session 3 `Dialog` / `SelectSheet` on RN `<Modal>`; `@gorhom/bottom-sheet` arrives in session 21.
- Data is plain `fetch` + `useState`/`useEffect` through `src/api/client.ts` (`send`, `sendRaw`, `ApiError`), which already carries the Bearer token, `X-Active-Region` and the 401 reset. Borrow the session 6 `ListScreen` paging habits, and keep this screen's own hook for counts, progress and sections.
- Packages already installed: `nativewind@^4.1` + `tailwindcss@~3.4`, `lucide-react-native@^1.49` on `react-native-svg@^15.15`, `@react-native-community/datetimepicker@^9.2`, `react-native-toast-message@^2.5`, `dayjs@^1.11`, `clsx@^2`, `libphonenumber-js@^1.13`, `react-native-safe-area-context@^5.5.2`. Nothing new is needed.
- Style per docs/CODING_STYLE.md: 4-space indent, no semicolons, double quotes, `function` declarations, `@/` imports, default export per component, files under 250 lines, every string inside a `<Text>`, touch targets at least 44dp.

## Steps
1. Add `LEAD_SOURCES_API` to `src/api/endpoints.ts` and write `useLeadSourceList.ts`: query building first (one `buildQuery(state, today)` helper), then the `sendRaw` fetch with `requestId`, then `loadMore` and `refresh`.
2. Render the screen with rows as plain text lines, and confirm `counts`, `progress` and `pagination.total` from the dev API look right on each of the five tabs.
3. Build `LeadSourceRow.tsx` with the fixed height, chips, badge and call button, then the section flattening, `getItemLayout` and `stickyHeaderIndices`.
4. Build `StatusMenuSheet.tsx`, `NoteBox.tsx` and `CallbackPicker.tsx`, and log one real status change end to end: payload sent, row swapped, toast shown, 900 ms reload, counts moved.
5. Add the optimistic `onUpdated` + 900 ms reload, the AppState-gated 60 s poll with the `menusOpen` / sheet / selection guard, and the `today` recompute on `"active"`.
6. Add selection by long-press, `BulkBar.tsx` and the four bulk sheets on `runBulk()`.
7. Add `ViewTabs.tsx`, the status filter, `LeadSourceFilters.tsx`, `useAssignees.ts`, `AssigneeSelect.tsx` and `DayChoice.tsx`, and check the manager-only pieces disappear for a role-60 account.
8. Handle the error paths: a 403 renders `AccessDenied`; a 409 keeps the sheet open with the typed note intact, shows the server's message ("This lead source changed while you were saving. Reload it and try again.") and refetches.
9. Run `npm run lint` and `npx tsc --noEmit`, then walk the whole loop on a device as a role-60 account.

## Definition of done
- [ ] `npm run android` installs, and the Calls tab opens the lead sources list on the dev API.
- [ ] Today shows up to 50 rows with sticky headers "Callbacks due now", "Today" and "Left over from earlier days" in the server's order, and scrolling appends the next page.
- [ ] The five tabs show the live counts from `counts`, switching a tab or the status filter resets to page 1, and the Today progress bar reads "{worked} of {total} for today called".
- [ ] Picking a status, typing a note and saving fires one `PATCH /:id/status` carrying `today`; the badge changes at once and about a second later the row re-sorts and the counts change.
- [ ] Picking Call Back with the "2 hours" preset sends `callbackAt` and `callbackDay` that agree, and the row shows a violet chip that turns amber inside 15 minutes and rose with a red left edge once the time passes.
- [ ] Save stays disabled for Call Back until a time is chosen, with "Pick when to call back." on screen.
- [ ] A row holding retired status 60 renders a grey "Unknown" badge instead of crashing.
- [ ] Backgrounding the app for two minutes and returning refetches once, and the poll fires no request while a sheet is open or rows are selected (confirm in the Metro network log).
- [ ] Long-press selects, a tap toggles, the X clears, and a bulk Status on three rows toasts "3 lead sources marked …" with any "already set" and "skipped" counts.
- [ ] A role-60 account sees no filter bar, no assignee avatars and no Assign / Day / Delete; a role-10 account sees all of them and the person filter lists real people from `/assignees`.
- [ ] A 403 renders `AccessDenied` with the API's message, an empty view shows its own copy, and the bulk bar clears the tab bar and gesture bar in edge-to-edge mode.
- [ ] `npm run lint` and `npx tsc --noEmit` pass.

## When you are done
Write a short summary: files added or changed, what works on the device, anything deferred, and any blocker. Then stop.

--- FOLLOW-UP (paste only if the session stopped early) ---

Continue session 11. If sticky section headers and `getItemLayout` fight each other, keep the flat item array and drop `stickyHeaderIndices` for now, noting it. If `@react-native-community/datetimepicker@^9.2` will not open in `time` mode on RN 0.87, ship the six presets alone and record the exact error. If the 900 ms reload makes rows jump under the thumb, confirm the swapped row keeps its old `section` and that the poll is paused while a sheet is open. Otherwise name what is missing from Scope, build those files, and re-run the Definition of done.
