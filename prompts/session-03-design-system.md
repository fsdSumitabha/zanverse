# Session 03 — Foundation B: design system primitives

At the end you can open the app on the emulator and see every shared UI primitive rendered in light and dark mode, built from the web app's own Tailwind class strings.

---

Session 03 — Foundation B: design system primitives.

Read docs/OVERVIEW.md §3 (styling, forms, storage), §4 (packages), §5 (project structure), §8 (shared code rule) and §11 (risks 2 and 6), plus docs/COMPONENTS.md "design-system primitives" and "skeletons", docs/CLIENT_SYSTEMS.md on sonner and @imagekit/next, and docs/SHARED_CODE.md on the `*_META` maps.
Reference (read-only): D:\zan-workspace — `src/components/admin/operations/StatusBadge.tsx`, `ServiceBadge.tsx`, `TemporalBadge .tsx`, `NotificationBadge.tsx`, `AccessDenied.tsx`, `AvatarPreview.tsx`, `CreateActionButton.tsx`, `Pagination.tsx`, `dayjs/TimeAgo.tsx`, `tooltip/Tooltip.tsx`, `skeletons/*`, `lead-sources/Dialog.tsx` (its `BUTTON_PRIMARY` / `BUTTON_DANGER` / `BUTTON_QUIET` / `FIELD` class strings), `lead-sources/StatusPill.tsx`, `lead-sources/Popover.tsx`, `lead-sources/dialer.ts` (the `id: "lead-source-call"` toast), `src/lib/api/handleAuthError.ts` (the `"auth-401"` toast id), `src/app/layout.tsx` (themeColor `#4A6FA5` light / `#183668` dark).

## Goal
`src/components/ui/` holds every primitive the module sessions will import, each one carrying the web's Tailwind classes through NativeWind so the `*_META` colour maps copied in session 2 keep working untouched. A kitchen-sink screen renders all of them, and switching the device between light and dark changes nothing but the colours.

## Scope
Build these files in `src/components/ui/`, one main export per file:
- `Badge.tsx` — one generic `<Badge meta status>` replacing StatusBadge, ServiceBadge and lead-sources/StatusPill. Keep the missing-code fallback exactly: `bg-gray-500 text-white` with the label `Unknown` (retired code 60 in `LEAD_SOURCE_STATUS_META` must render that way, not crash).
- `TemporalBadge.tsx` — UPCOMING / TODAY / PAST variants (rename off the web's trailing-space filename).
- `NotificationBadge.tsx` — copy `BADGE_MAP` and `EMOJI_TO_NAME` verbatim, icons from `lucide-react-native`.
- `Button.tsx` — variants `primary`, `danger`, `quiet`, `soft`, each the web class string; `loading` and `disabled` states, `icon` prop, `android_ripple` plus `active:scale-[0.98]` pressed feel.
- `Card.tsx` — the shared surface (`bg-white dark:bg-neutral-900`, `rounded-xl`, `border-gray-200 dark:border-neutral-800`) with `elevation` for the web's `shadow-sm`.
- `Input.tsx` and `Textarea.tsx` — the `FIELD` class string, plus `label`, `error` (the server's `{ field, message }` text under the field) and `required`.
- `SelectSheet.tsx` — a labelled trigger that opens an RN `<Modal transparent>` bottom sheet of options with a check mark on the current value; hardware back and a backdrop `Pressable` close it. This replaces every web dropdown/`Popover.tsx`.
- `Dialog.tsx` — `<Modal transparent animationType="slide">` bottom sheet with title, description, body and a footer button row; `KeyboardAvoidingView` so a field is never under the keyboard.
- `Skeleton.tsx` — one `<SkeletonBlock width height rounded>` pulsing with `Animated.loop`, and a `SkeletonList` helper the 11 web skeletons will be rebuilt from later.
- `EmptyState.tsx` — icon + title + message + optional action button.
- `AccessDenied.tsx` — the 403 view: amber circle, `ShieldAlert`, "Access Denied", the API message, default "You aren't authorized to perform this action."
- `Avatar.tsx` — `<Image>` on an ImageKit URL built by `src/lib/imagekitUrl.ts` as `?tr=w-<n>,h-<n>,f-auto` at 2x the rendered size; `onError` falls back to the lucide `User` icon on a neutral circle; relative legacy URLs get the API base prefixed.
- `SectionHeader.tsx` — title, optional count and right-hand action slot.
- `InlineValue.tsx` — the Tooltip replacement: render the value inline as a second `<Text>` line. Apply this policy everywhere and delete nothing else.
- `TimeAgo.tsx` — dayjs `relativeTime`, with press toggling to the absolute date (the web's `title` attribute).
- `Fab.tsx` — bottom-right floating button, `bottom: insets.bottom + (extraBottom ?? 0) + 16` from `useSafeAreaInsets()`; `extraBottom` is the prop session 5 fills with `useBottomTabBarHeight()`.
- `Pagination.tsx` — the prev / "Page x of y" / next pair, props-driven, kept as the fallback for lists that do not use `onEndReached`.
Plus:
- `src/components/ui/Toast.tsx` — the `react-native-toast-message` host, and `src/lib/notify.ts` exporting `notify.success/error/info/warning(message, { id, action })` with sonner's signature and dedupe-by-id, so `"auth-401"` and `"lead-source-call"` never stack.
- `src/theme.ts` — `#4A6FA5` light / `#183668` dark brand colours, the light/dark `navigationTheme` objects session 5 will hand to `NavigationContainer`, and a `<ThemedStatusBar>` that sets `barStyle` from `useColorScheme()`.
- `src/components/ui/index.ts` — named re-exports of every primitive.
- `src/screens/dev/KitchenSinkScreen.tsx` — a `ScrollView` section per primitive, rendered directly from `App.tsx` until session 5 adds the navigator.

## Already decided (follow these)
- NativeWind `^4.1` with `tailwindcss@~3.4` (or the v5 pair if session 1 locked it); copy the web's class strings verbatim rather than reinventing tokens.
- Icons: `lucide-react-native@^1.49` on `react-native-svg@^15.15`, same icon names as the web.
- Toasts: `react-native-toast-message@^2.5`. Dates: `dayjs@^1.11`. Class merging: `clsx@^2`.
- No Reanimated and no `@gorhom/bottom-sheet` this session — they arrive in session 21. Sheets use RN `<Modal>`, the pulse uses `Animated`.
- `src/constants/` and `src/types/` are the session 2 verbatim copies; read them, never edit them.
- No API calls, no auth, no navigation in this session — the client lands in session 4 and the navigator in session 5.
- Naming per docs/CODING_STYLE.md: PascalCase components, `function` declarations, 4-space indent, no semicolons, double quotes, `@/` imports.

## Steps
1. Confirm NativeWind is wired (`tailwind.config.js` content globs include `src/**/*.{ts,tsx}`, `babel.config.js` has the preset, `nativewind-env.d.ts` present) with a throwaway `className="bg-red-500"` view, then remove it.
2. Write `src/theme.ts` and `ThemedStatusBar`, and mount the status bar plus the Toast host in `App.tsx`.
3. Build `Badge.tsx` first — everything downstream depends on it. Render it against `LEAD_STATUS_META`, `CLIENT_STATUS_META`, `PROJECT_STATUS_META`, `SERVICE_META` and `LEAD_SOURCE_STATUS_META`, including status `60`.
4. Add `Card`, `SectionHeader`, `Button`, `EmptyState`, `AccessDenied`, `Skeleton`, `Pagination`.
5. Add `Input`, `Textarea`, `SelectSheet`, `Dialog` — check the keyboard behaviour with the emulator keyboard open.
6. Add `Avatar` + `src/lib/imagekitUrl.ts`, `TimeAgo`, `InlineValue`, `TemporalBadge`, `NotificationBadge`, `Fab`.
7. Write `src/lib/notify.ts` and prove the dedupe by firing the same `id` three times in a row from the kitchen sink.
8. Build `KitchenSinkScreen.tsx` with one labelled section per primitive, and a row of buttons firing each toast variant.
9. Audit pass across every file written: each `truncate`/`line-clamp-N` is a `numberOfLines`, each `hover:`/`group-hover:` affordance is permanently visible or a `onLongPress`, each `shadow-sm` has an Android `elevation`, each `title=` attribute is inline text.
10. Export everything from `src/components/ui/index.ts` and run lint plus `tsc`.

## Definition of done
- [ ] `npm run android` builds, installs and opens the kitchen sink on the emulator.
- [ ] Every primitive in Scope appears on the kitchen-sink screen with a label.
- [ ] Badges rendered from all five `*_META` maps show the web's colours; status `60` shows a grey `Unknown` pill.
- [ ] Switching the emulator to dark mode (Settings → Display, or `adb shell "cmd uimode night yes"`) recolours every section and flips the status bar, with no unreadable text.
- [ ] `SelectSheet` and `Dialog` both close on the Android back button and on a backdrop tap; a `Dialog` text field stays visible with the keyboard open.
- [ ] Firing the same toast `id` three times shows one toast.
- [ ] A long text value truncates on one line instead of wrapping off-screen, and no component shows a hover-only affordance.
- [ ] The `Fab` sits clear of the gesture bar in edge-to-edge mode.
- [ ] `Avatar` shows the ImageKit image for a valid URL and the `User` icon fallback for a broken one.
- [ ] `npm run lint` and `npx tsc --noEmit` pass clean.

## When you are done
Write a short summary: files added or changed, what works on the device, anything deferred, and any blocker. Then stop.

--- FOLLOW-UP (paste only if the session stopped early) ---

Continue session 03. If NativeWind class names are not applying, check the babel preset, the `content` globs and `nativewind-env.d.ts`, rebuild with `npx react-native start --reset-cache`, and if the v5 pair is the problem fall back to `nativewind@^4.1` + `tailwindcss@~3.4` and note it. If icons fail to render, confirm `react-native-svg@^15.15` is autolinked (`npm run android` after `cd android && ./gradlew clean`). Otherwise name the primitives still missing from `src/components/ui/`, build those, finish the audit pass in step 9, and re-run the Definition of done.
