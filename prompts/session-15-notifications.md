# Session 15 — Notifications

At the end of this session the header bell carries a live unseen count, and the Notifications screen is an infinite inbox where a row can be marked read by swipe or tap and taps through to the lead, client or project it is about.

---

Session 15 — Notifications.

Read docs/OVERVIEW.md §3 (Notifications, Data, Storage), §4 (packages) and §5 (project structure), plus docs/SCREENS.md `/admin/operations/notifications` and the two trailing notes "NOTIFICATION BELL POLLING" and the operations-layout note, docs/API_CONTRACT.md rows for the four `/api/notifications` endpoints and its "POLLING AND BACKGROUND" note, docs/CLIENT_SYSTEMS.md "Notification polling", and docs/COMPONENTS.md rows for `NotificationBadge.tsx` and `NotificationBell.tsx`.
Reference (read-only): D:\zan-workspace — `src/app/admin/operations/notifications/page.tsx` (the inbox, the three row states, the optimistic mark-read), `src/components/admin/operations/NotificationBell.tsx` (the poll, `unseen` vs `unread`, the seen call), `src/components/admin/operations/NotificationBadge.tsx` (`BADGE_MAP` + `EMOJI_TO_NAME`), `src/components/admin/operations/dayjs/TimeAgo.tsx`, `src/app/api/notifications/route.ts` (the cursor rules), `src/lib/notifications/render.ts` (`leadUrl` / `clientUrl` / `projectUrl` — the only three `url` shapes a row carries).

## Goal
The Notifications screen (registered in the More stack in session 5) becomes the real inbox: one FlatList that appends older rows as you scroll, an All/Unread toggle, mark-one-read and mark-all-read, and a tap that navigates to the row's entity. The header bell shows the unseen count on every screen, refreshes while the app is in the foreground, and goes quiet in the background.

## Scope
- `src/types/notification.ts` (app-local wire type — the web has none): `NotificationRow` with `_id`, `type`, `title`, `body?`, `url?`, `badge?`, `imageUrl?`, `seenAt: string | null`, `readAt: string | null`, `createdAt`, and `NotificationFeed` with `data`, `unseen`, `unread`, `total`, `nextCursor`.
- `src/api/endpoints.ts` — add `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`, `PATCH /api/notifications/seen`.
- `src/components/notifications/NotificationBadgeIcon.tsx` — the RN port of `NotificationBadge.tsx`. Copy `BADGE_MAP` and `EMOJI_TO_NAME` verbatim (14 keys, 15 emoji aliases, `bell` as the default), swap `lucide-react` for `lucide-react-native`, keep the Tailwind `bg`/`color` strings as NativeWind classes, and turn the `w-4 h-4` sizing into `size={16}` (`size="sm"` → 14 in a 28pt circle, `"md"` → 16 in a 36pt circle).
- `src/components/ui/TimeAgo.tsx` — dayjs `relativeTime`, `d.fromNow()` inline; the hover `title` becomes the full `DD/MM/YYYY hh:mm A` shown on long-press.
- `src/hooks/useNotificationFeed.ts` — cursor paging, not `useListQuery`: `filter: "all" | "unread"`, `rows`, `unread`, `total`, `nextCursor`, `loading`, `refreshing`, `loadingMore`, `refresh()`, `loadMore()`, `markOneRead(id)`, `markAllRead()`. `loadMore` fetches `?limit=15&before=<nextCursor>` and **appends**; changing `filter` or pulling to refresh fetches `?limit=15` with no cursor and **replaces**. Stop when `nextCursor` is null. Keep `limit=15` and the `unread=true` flag exactly as the web sends them.
- `src/screens/notifications/NotificationsScreen.tsx` — header row: Bell icon, "Notifications", an `{unread} unread` pill when `unread > 0`, the All/Unread segmented toggle, and a "Mark all read" button shown only when `unread > 0`. Under it the line "Notifications older than 30 days are automatically removed." Then the FlatList: `keyExtractor={(row) => row._id}`, `onEndReached` → `loadMore`, `RefreshControl` → `refresh`, 5 skeleton rows on the first load, a footer spinner while appending, and `EmptyState` with "No unread notifications" / "No notifications yet" per filter. Fire `PATCH /api/notifications/seen` exactly once per mount behind a `seenFiredRef` guard, same as the web.
- `src/components/notifications/NotificationRow.tsx` — the three states kept exactly: fresh (`!readAt && !seenAt`) = blue left border + blue tint + bold title + the uppercase blue "New" pill; unread-but-seen = amber left border + amber tint + bold title; read = transparent border, normal weight, muted text. Badge icon left, title, `body` clipped to 2 lines, `TimeAgo` under it, and a Check button on the right while unread. Wrap it in `react-native-gesture-handler`'s `Swipeable` with a right action that marks read.
- Tap behaviour, ported: `markOneRead` sets `readAt` optimistically, decrements `unread`, fires the PATCH fire-and-forget, and then — when the row has a `url` — navigates. Add `resolveNotificationPath(url)` use from `src/navigation/linking.ts` (session 5) to turn `/admin/operations/{leads|clients|projects}/:id` into LeadDetail / ClientDetail / ProjectDetail with `{ id }`; a row whose url does not match stays on the screen and is only marked read.
- `src/contexts/NotificationContext.tsx` — one provider mounted above the tabs holding `unseen`, `unread`, `rows` (the 4 newest) and `refreshBadge()`. It polls `GET /api/notifications?limit=4`, gated on `AppState`: poll only while `AppState.currentState === "active"`, clear the timer on background, and fire one immediate fetch on the background→active transition. Interval 30000 ms, backing off to 60000 ms when `@react-native-community/netinfo` reports `type === "cellular"` and nothing has changed since the previous poll.
- `src/components/notifications/HeaderBell.tsx` — the bell in the navigation header (`headerRight`), with a red count bubble when `unseen > 0` (`9+` above 9). Tapping it navigates to the Notifications screen and, when `unseen > 0`, optimistically zeroes `unseen` and fires `PATCH /api/notifications/seen` — the web's dropdown is not ported; the screen is the dropdown.
- Mark-all-read keeps the web's toasts: `react-native-toast-message` success "All notifications marked as read", error "Failed to mark all read". Pass a fixed `id` so a repeated toast replaces rather than stacks, and confirm the same dedupe holds for the API client's 401 toast.

## Already decided (follow these)
- Plain `fetch` + `useState`/`useEffect` through `src/api/client.ts` (`send`, `ApiError`, the 401 path). No TanStack Query.
- Polling first; push (FCM + Notifee) is session 23 and needs backend work — do not add a push dependency here.
- NativeWind `className` with the web's Tailwind strings copied verbatim, `dark:` variants included; reuse the session 3 primitives (`Card`, `Skeleton`, `EmptyState`, `Button`, `StatusPill`) and session 5's `AccessDenied`.
- Packages already installed: `lucide-react-native@^1.49` on `react-native-svg@^15.15`, `dayjs@^1.11`, `clsx@^2`, `react-native-toast-message@^2.5`, `react-native-gesture-handler@^2`, `@react-native-community/netinfo@^12`, `react-native-mmkv@^4.3`. Add nothing new.
- `@gorhom/bottom-sheet` and Reanimated land in session 21 — the swipe action uses plain gesture-handler `Swipeable`.
- No role gate: `GET /api/notifications` is `requireAuth` and scoped to `recipient = authUser.id`, so every signed-in role sees only their own rows.
- 4-space indent, no semicolons, double quotes, `function` declarations, `@/` imports, default export for components and screens, files under 250 lines.

## Steps
1. Write `src/types/notification.ts` and add the four endpoints to `src/api/endpoints.ts`.
2. Port `NotificationBadgeIcon` and `TimeAgo`, and render both in a throwaway list of hard-coded rows to check every badge key resolves to a real icon.
3. Write `useNotificationFeed` with the two fetch modes (replace vs append) and the three mutations.
4. Build `NotificationRow` with the three states, then `NotificationsScreen` with the header, the toggle, the 30-day line and the FlatList. Verify the `seenFiredRef` guard fires `PATCH /seen` once per mount.
5. Wire tap → `markOneRead` → `resolveNotificationPath` → `navigation.navigate`, and check all three url shapes against real rows.
6. Add the `Swipeable` right action for mark-read, and mark-all-read with the deduped toast.
7. Build `NotificationContext` with the AppState-gated poll and the cellular backoff, mount it above the tab navigator, and add `HeaderBell` as `headerRight`.
8. Test on the emulator with an account that has unread rows: background the app for a minute, foreground it, and confirm one immediate fetch and no polling in between (log each poll while testing).

## Definition of done
- `npm run android` installs and launches with no red box.
- The inbox loads 15 rows and appends the next 15 on scroll; the list stops growing when `nextCursor` comes back null, with no duplicate `_id`.
- A fresh row shows the blue border and the "New" pill, a seen-but-unread row shows amber, a read row is plain.
- The Unread toggle shows only unread rows; switching back to All replaces the list and resets to page one.
- Tapping a notification with a lead url marks it read and lands on LeadDetail for that id; a client and a project row land on ClientDetail and ProjectDetail.
- Swiping a row left reveals the mark-read action, and the row turns plain without a refetch.
- "Mark all read" clears every bold row, shows one success toast, and `unread` drops to 0; tapping it twice does not stack two toasts.
- The header bell shows the unseen count on every tab, and opening the screen clears the bubble.
- `adb shell am start -W -a android.intent.action.MAIN -c android.intent.category.HOME` then reopening the app produces exactly one immediate notification fetch, and the poll log is silent while the app is backgrounded.
- `npm run lint` and `npx tsc --noEmit` pass.

## When you are done
Write a short summary: files added or changed, what works on the device, anything deferred, and any blocker. Then stop.

--- FOLLOW-UP (paste only if the session stopped early) ---

Most likely sticking point: the AppState-gated poll. If the interval keeps firing after backgrounding, move the timer id into a ref, clear it inside the `AppState` `change` listener, and restart it only on the `background`/`inactive` → `active` transition — not on every render. If instead `Swipeable` misbehaves under RN 0.87 New Architecture, ship the inbox with tap and the Check button only, note it for session 21 where Reanimated arrives, and finish the Definition of done list.
