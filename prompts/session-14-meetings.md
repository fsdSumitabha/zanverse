# Session 14 — Meetings module

A Meetings screen under More: every meeting as a card with status, temporal and entity context, filterable, and the three write flows (reschedule, cancel, mark completed) working as sheets on the device.

---

Session 14 — Meetings module.

Read docs/OVERVIEW.md §3 (Styling, Data, Navigation, Forms), §4 (packages), §5 (structure), §6 (modules and screens) and §8 (shared code rule).
Read docs/SCREENS.md `/admin/operations/meetings` in full (its API list, State, Roles and "On a phone" notes).
Read docs/API_CONTRACT.md rows for `GET /api/admin/operations/meetings`, `PATCH /api/admin/operations/meetings/:id/status`,
`PATCH /api/admin/operations/meetings/:id/reschedule`, plus the "response shape inconsistencies" line about `pagination.totalPages`.
Read docs/COMPONENTS.md rows for `MeetingCard.tsx`, `MeetingFilters.tsx`, `RescheduleMeetingForm.tsx`, `MeetingLinkButton.tsx`,
`TemporalBadge .tsx`, `skeletons/MeetingCardSkeleton.tsx`.

Reference (read-only): reference/zan-workspace —
`src/app/admin/operations/meetings/MeetingsClient.tsx`, `src/app/admin/operations/meetings/page.tsx`,
`src/components/admin/operations/MeetingCard.tsx`, `src/components/admin/operations/MeetingFilters.tsx`,
`src/components/admin/operations/RescheduleMeetingForm.tsx`, `src/components/admin/operations/MeetingLinkButton.tsx`,
`src/components/admin/operations/skeletons/MeetingCardSkeleton.tsx`, `src/utils/MeetingTemporalStatus.ts`,
`src/constants/meetingStatus.ts`, `src/constants/meetingTypes.ts`, `src/types/meeting.ts`,
and the two server rules in `src/app/api/admin/operations/meetings/[id]/status/route.ts` and `[id]/reschedule/route.ts`.

## Goal
The More tab's Meetings row opens a paged list of every meeting, newest `scheduledAt` first, with status, entity and
temporal-range filters. Each card carries its status badge, TODAY/UPCOMING/PAST badge, parent entity row, attendee chips,
agenda, reschedule history and outcome. A permitted role can reschedule with a reason, cancel, or mark a past meeting
completed with an outcome note — each in a sheet, each refreshing the list in place. Online meetings open their Google
Meet link with `Linking`.

## Scope
- `src/screens/meetings/MeetingsListScreen.tsx` — `useListQuery` + `ListScreen` from session 6 against
  `GET /api/admin/operations/meetings?page&limit=10&search&status&range&entityType`, `PAGE_SIZE` 10. Read total pages as
  `json.pagination.totalPages ?? json.pagination.pages ?? 1` (this endpoint is the one that says `totalPages`).
  Pull-to-refresh calls the query's refresh, 5 `MeetingCardSkeleton` cards show while the first page loads, empty state
  text "No meetings found", 403 → `AccessDenied` with the server message.
- `src/components/meetings/MeetingFilters.tsx` (or the `statusMeta`/extra-filter props of session 6's `ListFilters`, if it
  already fits) — status from `MEETING_STATUS_META` (2010 Scheduled → 2050 Completed) in a `SelectSheet`, entity from
  `ENTITY_TYPE_META` in a second `SelectSheet`, and the four ranges as a horizontal `Pressable` chip row:
  `""` All, `today` Today, `last7` Last 7 days, `upcoming` Upcoming. Any filter change resets `page` to 1. A "Clear
  filters" action appears when any of status / range / entityType is set.
- `src/components/meetings/MeetingCard.tsx` — port the web card: title, `Badge` with `MEETING_STATUS_META`,
  `TemporalBadge` (only for 2010/2020) from `getMeetingTemporalStatus(scheduledAt)` ported into
  `src/lib/meetingTemporal.ts`, `TimeAgo` on `createdAt`, a tappable `entity.title` row, attendee name chips when
  `attendees[0]` is an object, agenda and description with `numberOfLines={2}` plus a Read more / Read less toggle at
  >110 combined characters, the amber reschedule-history block (`oldDate` struck through + `reason`, count in the
  header), "Scheduled: `<TimeAgo date={scheduledAt} />`", and the emerald Outcome block on completed meetings with its
  own Read more at >140 characters. Keep the border and pulsing-dot rules: cancelled/missed red + `opacity-70`,
  completed green + `opacity-80`, today emerald, upcoming blue, rescheduled wins the dot as orange.
- Replace the web's `(Icons as any)[...]` dynamic lookup with an explicit `MEETING_ICONS` map from the `icon` strings in
  `MEETING_STATUS_META` (`calendar`, `refresh`, `times`, `exclamation-circle`, `check`) to `lucide-react-native`
  components, defaulting to `Calendar`.
- Entity row navigation: switch on `meeting.entityType` (0 → `LeadDetail`, 1 → `ClientDetail`, 2 → `ProjectDetail`) with
  `{ id: meeting.entityId }`. This replaces the web's `entityHref` string, which builds a double-slash path.
- `src/components/meetings/MeetingCardSkeleton.tsx` — `SkeletonBlock` rows matching the card, passed to `ListScreen` as
  `SkeletonComponent`.
- `src/components/meetings/RescheduleSheet.tsx` — `Dialog` holding `DateTimeField` (session 8, seeded from the meeting's
  `scheduledAt`, minimum = now) and a required reason `Textarea`. Confirm sends
  `PATCH /meetings/:id/reschedule` with `{ scheduledAt: date.toISOString(), reason: reason.trim() }`. Keep the client
  guards in order: no date → "Please pick a new date and time", empty reason → "Please provide a reason", a time at or
  before now → "New time must be in the future".
- `src/components/meetings/CompleteSheet.tsx` — `Dialog` with an outcome `Textarea`
  (placeholder "What was discussed / decided?"). Empty outcome toasts "Please add an outcome note" and sends nothing;
  Confirm sends `PATCH /meetings/:id/status` with `{ status: MEETING_STATUS.COMPLETED, outcome }`. Only offer this sheet
  when `getMeetingTemporalStatus(scheduledAt) === "PAST"`, matching the server's 409 "Cannot mark a future meeting as
  completed".
- Cancel: `Alert.alert` confirm, then `PATCH /meetings/:id/status` with `{ status: MEETING_STATUS.CANCELLED }` and no
  outcome. Toast `json.message` on success ("Meeting cancelled" / "Meeting marked as completed").
- Action gating, ported byte-for-byte: `RESCHEDULE_ROLES = CLOSE_ROLES = [10, 15, 60, 65, 69, 45, 70]`. Reschedule shows
  for 2010/2020 only, Cancel for 2010/2020, Completed for 2010/2020 at PAST. Surface the server's 409 message
  ("Meeting is already closed", "Cannot reschedule a closed meeting") as a toast and refresh the list.
- Meet link: render `MeetingLinkButton` from session 8 when `meetingType === MEETING_TYPE.ONLINE && meetingLink` and the
  meeting is still 2010/2020 — Join via `Linking.openURL`, Copy via the clipboard path that component already has.
- Wire `Meetings` in `MoreStack` over the session 5 placeholder, keeping the `moreItems.ts` role list
  `[10,15,20,30,40,42,45,50,60,65,69,70,80]`.

## Already decided (follow these)
- Plain `fetch` + `useState`/`useEffect` through `src/api/client.ts` (`send`/`sendRaw`, `ApiError`, 401 handling). No
  TanStack Query, no Redux, no URL-driven state — page/search/status/range/entityType live in `useListQuery` state.
- Lists are `useListQuery` + `ListScreen` from session 6; `onEndReached` paging, no numbered pagination component.
- Sheets are session 3's `Dialog`/`SelectSheet` over RN `<Modal>`; `@gorhom/bottom-sheet` and Reanimated arrive in
  session 21, so nothing new is installed here.
- Labels, colours and codes come from the copied `src/constants/meetingStatus.ts`, `meetingTypes.ts` and `entityTypes.ts`
  via their `*_META` maps — never literals, never a renumbered code.
- Reuse `src/components/interactions/MeetingLinkButton.tsx` and `src/components/ui/DateTimeField.tsx` from session 8, and
  `Badge`, `TemporalBadge`, `Card`, `Button`, `Textarea`, `Skeleton`, `TimeAgo`, `AccessDenied`, `notify` from session 3.
- Packages already installed: `@react-navigation/native@^7`, `@react-native-community/datetimepicker@^9.2`,
  `lucide-react-native@^1.49`, `dayjs@^1.11`, `clsx@^2`, `react-native-toast-message@^2.5`. Add nothing new.
- Writes stay server-guarded: no optimistic status flipping, no offline replay. Refetch after every successful PATCH.
- The server code stays untouched this session; any backend wrinkle in the meetings routes belongs to the backend port's
  own plan. Note anything you spot in the summary instead.
- 4-space indent, no semicolons, double quotes, `function` declarations, `@/` imports, default export for components and
  screens, files under 250 lines (the web card is 381 — splitting it into card + two sheets is how it fits).

## Steps
1. Port `src/lib/meetingTemporal.ts` and the `MEETING_ICONS` map, and check `getMeetingTemporalStatus` against the device
   clock on one known meeting.
2. Build `MeetingCardSkeleton`, then `MeetingsListScreen` on `useListQuery` with the `totalPages ?? pages` fallback, and
   confirm 10 real rows from the dev API.
3. Port `MeetingCard` read-only first: badges, entity row, attendees, agenda clamp, history block, outcome block, borders
   and dot.
4. Add the filters: status and entity `SelectSheet`s, the four range chips, Clear filters, and verify each resets paging.
5. Add the role gate and the action row, then `RescheduleSheet` end to end against a scheduled meeting.
6. Add `CompleteSheet` and the cancel `Alert`, including the past-only rule for Completed.
7. Hook up `MeetingLinkButton` and the entity-row navigation, then register `Meetings` in `MoreStack` and walk the screen.

## Definition of done
- [ ] `npm run android` installs and More → Meetings opens the list.
- [ ] The first page shows 10 cards sorted newest `scheduledAt` first; scrolling appends page 2.
- [ ] 5 skeleton cards show on first load; pull-to-refresh refetches page 1.
- [ ] A scheduled meeting today shows the status badge plus a green "Today" badge and a pulsing dot; a rescheduled one
      shows the orange dot and its history rows with the old date struck through.
- [ ] Picking status "Meeting Completed" returns only 2050 rows; picking range "Upcoming" returns only future ones; both
      reset to page 1 and the count matches `pagination.total`.
- [ ] Clear filters restores the unfiltered first page.
- [ ] Reschedule with a future date and a reason succeeds, toasts the server message, and the refreshed card shows the
      new time, the 2020 badge and a new history row.
- [ ] Reschedule with an empty reason toasts "Please provide a reason" and fires no request; a past time toasts
      "New time must be in the future".
- [ ] Completed with an outcome succeeds on a past meeting, and the card then shows the green border and Outcome block.
- [ ] Completed is not offered on a future meeting; Cancel asks for confirmation first and then shows the red border.
- [ ] A second attempt on an already-closed meeting shows the API's 409 message as a toast and the list refreshes.
- [ ] An online meeting's Join opens the Meet link in the browser and Copy puts it on the clipboard.
- [ ] Tapping the entity row opens that lead / client / project detail screen.
- [ ] A role outside `[10,15,60,65,69,45,70]` sees the cards with no Reschedule, Cancel or Completed buttons.
- [ ] `npm run lint` and `npx tsc --noEmit` pass.

## When you are done
Write a short summary: files added or changed, what works on the device, anything deferred, and any blocker. Then stop.

--- FOLLOW-UP (paste only if the session stopped early) ---

Finish the Meetings module. If `@react-native-community/datetimepicker` throws or shows no dialog on this Android image,
drive it imperatively (`DateTimePickerAndroid.open` in date mode, then time mode) inside `DateTimeField` and note the
change, since five screens share it. If `MeetingCard` is over 250 lines, move the history and outcome blocks into
`src/components/meetings/RescheduleHistory.tsx` and `MeetingOutcome.tsx`. If the card and filters work but the write
flows do not, finish `RescheduleSheet.tsx` then `CompleteSheet.tsx`, run the Definition of done list, and stop.
