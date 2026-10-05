# Session 01 — Native spike and toolchain lock

At the end you have one Android debug build running on RN 0.87.1 with every native package the whole app needs installed, versions pinned exactly, and a throwaway screen proving Tailwind classes, dark mode, lucide icons, tabs and safe-area insets all work.

---

Session 01 — Native spike and toolchain lock.

Read docs/OVERVIEW.md §3 (Styling, Navigation, Storage, Files), §4 (Packages — the version table is authoritative), §5 (project structure) and §11 (risks 1, 2 and 6).
Reference (read-only): D:\zan-workspace — `src/constants/leadStatus.ts` and `src/constants/leadSourceStatus.ts` (the `*_META` Tailwind colour strings), `src/components/admin/operations/lead-sources/LeadSourceRow.tsx` (the hardest class strings in the repo: `dark:bg-emerald-500/15`, `bg-blue-50/80`, `dark:bg-rose-500/[0.07]`), `src/components/admin/operations/StatusBadge.tsx`, `src/components/admin/operations/AccessDenied.tsx` (ShieldAlert icon), `src/components/admin/operations/MobileNav.tsx` (the `navItems` array with its icons and role arrays).

## Goal

Prove the native stack before any real UI exists. New Architecture is mandatory here (`android/gradle.properties` already has `newArchEnabled=true`, `hermesEnabled=true`, `edgeToEdgeEnabled=true`), so a package without Fabric/TurboModule support is a hard blocker, not a slow path — find that out now rather than in session 7.
The app builds, installs and launches on an Android emulator with all of session 2–20's native dependencies already linked, and `package.json` records the exact working versions.

## Scope

- Install, in this order, so a failure is attributable: `react-native-svg` → `nativewind` + `tailwindcss` → `@react-navigation/native` + `@react-navigation/native-stack` + `@react-navigation/bottom-tabs` + `react-native-screens` + `react-native-gesture-handler` → `lucide-react-native` → the rest.
- The rest: `react-native-keychain`, `react-native-mmkv`, `@react-native-community/datetimepicker`, `@react-native-picker/picker`, `react-native-image-picker`, `@react-native-documents/picker`, `react-native-blob-util`, `@react-native-community/netinfo`, `react-native-toast-message`, `dayjs`, `libphonenumber-js`, `clsx`.
- Config files: `babel.config.js` (add `nativewind/babel` alongside the existing `module:@react-native/babel-preset`), `metro.config.js` (wrap the existing `mergeConfig` output in `withNativeWind`), `tailwind.config.js`, `global.css`, `nativewind-env.d.ts`.
- `App.tsx` replaced with `GestureHandlerRootView` → `SafeAreaProvider` → `NavigationContainer` → bottom tabs with two throwaway screens (`SpikeHomeScreen`, `SpikeTabTwoScreen`) under `src/screens/spike/`.
- `SpikeHomeScreen` proves, visibly, on one screen:
  - A badge rendering `LEAD_SOURCE_STATUS_META[40].color` (`"bg-emerald-600 text-white"`) copied verbatim as a `className`.
  - A row using `LeadSourceRow`'s real strings: `bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300` and `border-l-4 border-l-blue-500 bg-blue-50/80 dark:bg-blue-500/10`.
  - `dark:` flipping with the OS theme (toggle the emulator between light and dark; no app restart).
  - `ShieldAlert` from `lucide-react-native` at `size={16}` with an explicit `color` prop, next to one at `size={28}`.
  - `useSafeAreaInsets()` values and `useBottomTabBarHeight()` printed, with a floating button placed at `insets.bottom + tabBarHeight` so it clears the gesture bar under edge-to-edge.
  - One line per native module confirming it loaded: `Keychain.getSupportedBiometryType()`, an MMKV `set`/`getString` round trip, `NetInfo.fetch().isConnected`, a `DateTimePicker` opening, a `Picker` with two options, `dayjs().format("DD MMM YYYY")`, `parsePhoneNumberFromString("9876543210", "IN")`, and a `Toast.show({ type: "success" })`.
- Every version pinned exactly in `package.json` (no `^`, no `~`) once the build is green.
- `prompts/README.md` gets a "Session 1 — toolchain lock" section: the exact version of each package, which NativeWind/Tailwind pair won, and any patch, Gradle or `AndroidManifest.xml` change that was needed.

## Already decided (follow these)

- Styling is NativeWind, because the web's Tailwind strings in the `*_META` maps are copied verbatim — that is the whole reason this spike leads with it. Default to `nativewind@^4.1` + `tailwindcss@~3.4`; try `nativewind` v5 + Tailwind 4 first (the web app is on Tailwind 4) and keep it only if it builds and renders clean, otherwise fall back and record why.
- Navigation is React Navigation 7: `@react-navigation/*@^7`, `react-native-screens@^4.28`, `react-native-gesture-handler@^2`.
- `react-native-svg@^15.15` is the keystone — `lucide-react-native@^1.49` and session 20's charts both ride on it.
- `react-native-keychain@^10` (JWT only), `react-native-mmkv@^4.3` (cache and prefs), `@react-native-community/datetimepicker@^9.2`, `@react-native-picker/picker@^2`, `react-native-image-picker@^8.2`, `@react-native-documents/picker@^12`, `react-native-blob-util@^0.25`, `@react-native-community/netinfo@^12`, `react-native-toast-message@^2.5`, `libphonenumber-js@^1.13`, `dayjs@^1.11`, `clsx@^2`.
- Deferred on purpose so they cannot block this gate: `react-native-reanimated`, `react-native-worklets`, `@gorhom/bottom-sheet`, `react-native-gifted-charts`, `react-native-linear-gradient`, `@sentry/react-native`.
- `react-native-safe-area-context@^5.5.2` is already installed — use it, do not replace it.
- Style per docs/CODING_STYLE.md: 4 spaces, no semicolons, double quotes, `function` declarations, screen files end with `Screen`, default export for screens.
- Keep the `@/` path alias and `src/constants` copying for session 2; the spike screens may import by relative path.

## Steps

1. Record the baseline: `npm run android` on a clean checkout, confirm the stock `@react-native/new-app-screen` launches on the emulator. Note the emulator API level and the Gradle/JDK versions in your notes.
2. Install `react-native-svg`, rebuild, and render one `<Svg><Circle/></Svg>` in `App.tsx`. Do not continue until that draws.
3. Install `nativewind` + `tailwindcss`, write `tailwind.config.js` (content globs `./App.tsx` and `./src/**/*.{ts,tsx}`, `presets: [require("nativewind/preset")]`, `darkMode: "media"`), `global.css` with the three `@tailwind` directives, `nativewind-env.d.ts` with the types reference, then patch `babel.config.js` and `metro.config.js`. Clear Metro cache and rebuild.
4. Render the real class strings from §Scope. Toggle the emulator theme and confirm `dark:` follows it. If v5/Tailwind 4 fails on any of them, fall back to `nativewind@4.1.x` + `tailwindcss@3.4.x` and repeat this step.
5. Install the navigation set, add `GestureHandlerRootView` at the app root and `import "react-native-gesture-handler"` as the first line of `index.js`, then build the two-tab navigator with `createBottomTabNavigator` inside a `createNativeStackNavigator` root, mirroring the shape of `MobileNav.tsx`'s `navItems` (name, icon, roles) without the role filtering.
6. Install `lucide-react-native`, put `Home` and `PhoneCall` in the tab bar icons and `ShieldAlert` on the screen at two sizes with explicit colours.
7. Install the remaining packages in one pass, rebuild, and add the per-module proof lines. Any package that fails the Fabric/TurboModule build gets a note in `prompts/README.md` with the error and the fallback you chose.
8. Add the safe-area block: printed insets, and a floating button positioned with `useSafeAreaInsets().bottom + useBottomTabBarHeight()`.
9. Pin every version exactly in `package.json`, delete `node_modules` and `package-lock.json`, reinstall, and rebuild once more from cold to prove the pinned set works.
10. Write the `prompts/README.md` section.

## Definition of done

- [ ] `npm run android` builds and installs on the emulator from a cold `node_modules` with every version pinned exactly (no range specifiers in `package.json`).
- [ ] An SVG circle draws, and `ShieldAlert` renders at `size={16}` and `size={28}` with the colour passed as a prop.
- [ ] `LEAD_SOURCE_STATUS_META[40].color` pasted unchanged as a `className` renders a green pill with white text.
- [ ] `dark:bg-emerald-500/15`, `bg-blue-50/80` and `dark:bg-rose-500/[0.07]` all render, and switching the emulator to dark mode flips them with no reload.
- [ ] Both tabs navigate, the tab bar shows lucide icons, and the back gesture works.
- [ ] The floating button sits clear of the gesture bar; the printed `insets` are non-zero at the top.
- [ ] Each of keychain, MMKV, NetInfo, datetimepicker, picker, image-picker, documents-picker, blob-util, toast-message, dayjs and libphonenumber-js reports success on screen with no red box.
- [ ] `npm run lint` and `npx tsc --noEmit` pass.
- [ ] `prompts/README.md` lists every pinned version and the NativeWind/Tailwind pair that won.

## When you are done

Write a short summary: files added or changed, what works on the device, anything deferred, and any blocker. Then stop.

--- FOLLOW-UP (paste only if the session stopped early) ---

A package failed the New Architecture build. Name the package and paste the Gradle or Metro error. Then: check its repo for a release that declares RN 0.87 / Fabric support and pin that; if none exists, record the blocker in `prompts/README.md` with the sessions it affects, remove the package so the rest of the build goes green, and finish the remaining Definition-of-done items without it. For `nativewind` v5 or Tailwind 4 failures, fall back to `nativewind@4.1.x` + `tailwindcss@3.4.x`, clear the Metro cache (`npx react-native start --reset-cache`), rebuild, and re-run the class-string checks.
