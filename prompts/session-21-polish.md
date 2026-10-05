# Session 21 — Polish: sheets, caching, offline, Sentry

The app opens with real content instead of skeletons, every sheet drags and snaps like a native one, offline is a stated condition rather than a wall of errors, and crashes arrive in Sentry with readable stack traces.

---

Session 21 — Polish: sheets, caching, offline, Sentry.

Read docs/OVERVIEW.md §3 (Styling, Data, Auth, Region, Storage, Offline), §4 (packages), §5 (structure), §11 risks 1, 5 and 8.
Read docs/CLIENT_SYSTEMS.md "AuthContext", "RegionContext" and the polling note; docs/API_CONTRACT.md rows for
`GET /api/auth/me`, `GET /api/admin/operations/lead-sources` and its "POLLING AND BACKGROUND" and "CLIENT-LOCAL DAY" notes;
docs/LEAD_SOURCES.md §"Screens" (StatusMenu, CallbackPicker) and docs/COMPONENTS.md rows for `ListFilters.tsx` and
`InteractionModal/*`.

Reference (read-only): reference/zan-workspace —
`src/components/admin/operations/lead-sources/StatusMenu.tsx`, `CallbackPicker.tsx`, `Popover.tsx`, `Dialog.tsx`,
`src/components/admin/operations/ListFilters.tsx`,
`src/components/admin/operations/InteractionModal/{NoteForm,CallForm,MeetingForm,QuotationForm}.tsx`,
`src/contexts/AuthContext.tsx`, `src/contexts/RegionContext.tsx`,
`src/components/admin/operations/lead-sources/LeadSourcesClient.tsx` (the 60 s quiet reload and the `today` query param).

## Goal
Real bottom sheets with drag, snap points and a keyboard-aware body replace the `<Modal>` sheets from sessions 3, 6, 8 and 11.
Launching the app shows the last known user and the last known Lead Sources "Today" page immediately, then refreshes behind it.
With the radio off, cached screens still read, uncached screens say so with a Retry, and every write button is disabled with
the reason printed on it. Crashes and unhandled rejections land in Sentry with symbolicated frames.

## Scope
- Install `react-native-reanimated@^4`, `react-native-worklets@^0.13`, `@gorhom/bottom-sheet@^5`,
  `@react-native-community/netinfo@^12`, `@sentry/react-native@^7`. Reanimated 4 needs `react-native-worklets/plugin` in
  `babel.config.js` as the last plugin, and `GestureHandlerRootView` must already wrap the app from session 5.
- `src/components/ui/Sheet.tsx` — one `BottomSheetModal` wrapper: `snapPoints`, `enablePanDownToClose`,
  `enableDynamicSizing` where the content is short, `BottomSheetBackdrop` with `pressBehavior="close"`,
  `keyboardBehavior="interactive"` + `android_keyboardInputMode="adjustResize"`, and a `SheetProvider`
  (`BottomSheetModalProvider`) mounted once in `App.tsx`.
- Re-implement `src/components/ui/Dialog.tsx` and `src/components/ui/SelectSheet.tsx` (session 3) on top of `Sheet.tsx`,
  keeping their existing props so nothing that uses them changes. That upgrades, in one move:
  `src/components/leadSources/StatusMenuSheet.tsx`, `CallbackPicker.tsx`, `bulk/{StatusSheet,AssignSheet,DaySheet,DeleteSheet}.tsx`,
  `src/components/list/ListFilters.tsx`, `src/components/activityLog/ActivityLogFilterSheet.tsx`,
  `src/components/meetings/{RescheduleSheet,CompleteSheet}.tsx`, `src/components/users/UserPickerSheet.tsx`.
- `src/components/ui/FormSheet.tsx` — a 90 % snap point over `BottomSheetScrollView` for the four interaction forms
  (`AddNoteScreen`, `LogCallScreen`, `ScheduleMeetingScreen`, `SendQuotationScreen`): same route names, same submit code,
  text inputs swapped to `BottomSheetTextInput` so the keyboard pushes the sheet instead of covering it.
- `src/store/cache.ts` — two read-through MMKV caches over `src/store/mmkv.ts`, both keyed
  `` `${activeRegion}:${key}` ``: `me` (the `GET /api/auth/me` `data` object) and `leadSourcesToday`
  (`{ data, pagination, counts, progress, today, savedAt }` for `view=today&page=1`). Each entry stores `savedAt`;
  a read older than 24 h, or whose `today` is no longer `todayLocal()`, is ignored. `clearRegionCache()` on a region
  switch and `clearAll()` on logout already exist — call them and keep them the only way these die.
- `src/screens/auth/SplashScreen.tsx` + `src/contexts/AuthContext.tsx` — when a token exists and `me` is cached, set the
  user from cache and navigate straight to the app, then still run `GET /api/auth/me` and branch on `json.data === null`
  to log out if it came back empty.
- `src/screens/leadSources/LeadSourcesScreen.tsx` — render the cached page 1 under the existing quiet reload; the
  refresh replaces it and rewrites the cache. Only `view=today`, `page=1`, no search or filters, is ever cached.
- `src/hooks/useIsOnline.ts` — `NetInfo.addEventListener`, `isConnected && isInternetReachable !== false`, with the
  current value exported for `src/api/client.ts`.
- `src/components/ui/OfflineNotice.tsx` — the amber "Showing saved data — you're offline" line above a list fed from
  cache, and the `EmptyState` variant (`WifiOff` icon, "You're offline", "Connect to load this screen.", Retry button)
  for an uncached screen.
- `src/components/ui/Button.tsx` — a `disabledReason` prop: when offline, write buttons (status change, callback, note,
  bulk actions, convert, upload, every form submit) render disabled with "Offline" as the label suffix. Reads keep working.
- `src/api/client.ts` — a `TypeError: Network request failed` while offline becomes an `ApiError` with
  `message: "You're offline. Connect and try again."` instead of the generic failure toast.
- `src/lib/sentry.ts` + `index.js` — `Sentry.init({ dsn, tracesSampleRate: 0.2, sendDefaultPii: false })` before the app
  renders, `Sentry.wrap(App)`, `reactNavigationIntegration` on the session-5 navigation ref, and a `beforeSend` that
  strips the `Authorization` header and any `token` field. Metro source maps via `@sentry/react-native/metro`, Android
  source maps via `apply from: "../../node_modules/@sentry/react-native/sentry.gradle"` and `sentry.properties`
  (auth token out of git, from the environment).
- Sweep pass: grep `src/` for `hover:`, `group-hover:`, `cursor-`, `transition-` left in copied Tailwind strings and
  replace them with `Pressable` `android_ripple` / pressed opacity; add `numberOfLines={1}` + `ellipsizeMode="tail"` to
  every name, company, email and title in a list row, and `numberOfLines={2}` to note and description previews.

## Already decided (follow these)
- NativeWind `className` with the web's Tailwind strings; status colours stay in the copied `*_META` maps.
- Plain `fetch` + `useState`/`useEffect` through `src/api/client.ts` and `useListQuery` — caching here is MMKV read-through,
  not a query library. No TanStack Query, no Redux.
- Keychain holds the JWT and nothing else; MMKV holds cache and prefs, region-keyed, wiped on logout and region switch.
- Offline is read-only: cached reads, disabled writes, no replay queue. Writes are guarded server-side.
- Lead Sources always sends `today` as the device's local `YYYY-MM-DD`; a cached page from yesterday is not reusable.
- Versions: `react-native-reanimated@^4`, `react-native-worklets@^0.13`, `@gorhom/bottom-sheet@^5`,
  `@react-native-community/netinfo@^12`, `@sentry/react-native@^7`, `react-native-mmkv@^4.3`,
  `react-native-gesture-handler@^2`, `lucide-react-native@^1.49`.
- If any of Reanimated 4 / worklets / bottom-sheet fails on RN 0.87 New Architecture, revert that package and keep the
  session 3 `<Modal>` sheets. The caching, offline and Sentry work is independent and ships either way.
- 4-space indent, no semicolons, double quotes, `function` declarations, `@/` imports, default export for components,
  files under 250 lines.

## Steps
1. Install Reanimated + worklets alone, add the Babel plugin, rebuild with `npm run android` and confirm the app still
   starts. Pause there for review before touching anything else.
2. Add `@gorhom/bottom-sheet`, mount `BottomSheetModalProvider`, and build `Sheet.tsx`. Prove it on `StatusMenuSheet`
   first — it is the sheet an agent opens hundreds of times a day.
3. Re-point `Dialog.tsx` and `SelectSheet.tsx` at `Sheet.tsx` and walk every consumer listed in Scope on the emulator.
4. Build `FormSheet.tsx` and move the four interaction forms onto it, checking the keyboard against the longest one
   (`LogCallScreen`).
5. Write `src/store/cache.ts` with the `savedAt` and `today` guards, then wire the `me` cache into Splash/AuthContext and
   verify a cold start with airplane mode on lands on the app, not the login screen.
6. Wire the Lead Sources Today cache, then switch region and confirm the cached page disappears.
7. Add `useIsOnline`, `OfflineNotice`, the `disabledReason` buttons and the `client.ts` offline error.
8. Wire Sentry, send one test error from a debug-only button, and confirm the Android release-mapped frames upload.
9. Run the hover / `numberOfLines` sweep and fix what it finds.

## Definition of done
- [ ] `npm run android` builds and installs with Reanimated 4, worklets and bottom-sheet in the bundle.
- [ ] The Lead Sources status sheet drags, snaps, closes on backdrop tap and on the Android back button, and saves a
      status change with the same payload as before.
- [ ] The callback picker's six presets and the exact date/time entry all still produce `callbackAt` + `callbackDay`.
- [ ] Typing in `LogCallScreen`'s notes field keeps the submit button visible with the keyboard open.
- [ ] Killing and reopening the app shows the user's name in the header with no skeleton flash, and the Today list
      renders its cached first page before the network call returns.
- [ ] With airplane mode on, Lead Sources shows the saved page under "Showing saved data — you're offline", and the
      Activity Logs screen shows the offline empty state whose Retry works once the radio is back.
- [ ] With airplane mode on, the status, callback, note, bulk and convert buttons are disabled and say why; scrolling
      and reading cached screens still work.
- [ ] Switching region clears both caches and refetches; logging out leaves nothing in MMKV.
- [ ] A deliberate test error appears in Sentry with file and line numbers, and its request headers carry no token.
- [ ] `grep -r "hover:\|group-hover:\|cursor-" src/` returns nothing, and no list row clips mid-word without an ellipsis.
- [ ] `npm run lint` and `npx tsc --noEmit` pass.

## When you are done
Write a short summary: files added or changed, what works on the device, anything deferred, and any blocker. Then stop.

--- FOLLOW-UP (paste only if the session stopped early) ---

Finish session 21. If Reanimated 4, `react-native-worklets` or `@gorhom/bottom-sheet@^5` fails to build on RN 0.87 New
Architecture, uninstall those three, restore the session 3 `<Modal>`-based `Dialog.tsx` / `SelectSheet.tsx`, record the
failure and the exact error in docs/OVERVIEW.md §11, and move on — the sheets are optional. Then complete, in this order:
the two MMKV caches, the offline behaviour, Sentry, and the hover / `numberOfLines` sweep. Report what is left.
