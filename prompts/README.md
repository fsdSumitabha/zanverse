# Session prompts

One file per session, in order. **Open the file, copy everything below its title line, paste it into a new session in
`D:\zanverse`.** Nothing else is needed — each prompt is self-contained.

## How a session runs

- **One session per file.** Start a fresh session for each; don't continue a finished one.
- **Each prompt ends itself.** Every file has a Definition of Done. When those items are true, the session writes a
  summary and stops. That is the rule that keeps a session from drifting into "what next?" forever.
- **Some files have a second prompt** under `--- FOLLOW-UP ---`. Paste it only if the first part stops early or the
  file says to.
- **You commit.** Sessions leave changes in the working tree and summarize them; review and commit yourself.
- **Blocked is a valid ending.** If a session reports a blocker (a missing backend change, a package that won't build),
  fix that first; don't push the session to work around it.

## Before you start

1. `docs/BACKEND_CHANGES.md` lists five small changes to the web API. **Session 4 and everything after it is blocked
   until they are live on the dev API.** Sessions 1–3 can run before that.
2. Put the dev API base URL in `.env` as session 1 sets up (`API_BASE_URL`).
3. Have an Android emulator or a device with USB debugging ready.

## The sessions

| # | File | What it delivers | Size |
|---|---|---|---|
| 1 | `session-01-native-spike.md` | The native stack proven on RN 0.87 and versions locked | M |
| 2 | `session-02-shared-core.md` | Constants, types and pure helpers copied from the web | M |
| 3 | `session-03-design-system.md` | Buttons, cards, pills, inputs, sheets, skeletons | M |
| 4 | `session-04-api-auth-region.md` | API client, login, token storage, region header | L |
| 5 | `session-05-navigation.md` | Tabs, stacks, role-filtered menu, splash | M |
| 6 | `session-06-list-kit.md` | The list pattern every module reuses | M |
| 7 | `session-07-leads.md` | Leads: list, create, detail, edit, convert | L |
| 8 | `session-08-timeline.md` | The interaction timeline and its entry forms | L |
| 9 | `session-09-clients.md` | Clients and their projects | M |
| 10 | `session-10-projects.md` | Projects | M |
| 11 | `session-11-lead-sources-list.md` | Cold-calling list and Today view | L |
| 12 | `session-12-lead-sources-dialing.md` | Real dialing, detail, convert to lead | M |
| 13 | `session-13-lead-sources-uploads.md` | Sheet upload, reports, downloads | L |
| 14 | `session-14-meetings.md` | Meetings and their actions | M |
| 15 | `session-15-notifications.md` | Inbox, badge, polling | M |
| 16 | `session-16-users.md` | Staff directory and user forms | M |
| 17 | `session-17-profile.md` | Own profile, avatar, password | S |
| 18 | `session-18-activity-logs.md` | Audit feed and heatmap | M |
| 19 | `session-19-dashboard-search.md` | Dashboard feed, stats panels, search | M |
| 20 | `session-20-stats-charts.md` | Overall stats with charts | M |
| 21 | `session-21-polish.md` | Bottom sheets, caching, offline, Sentry | M |
| 22 | `session-22-android-release.md` | Signed release build | M |
| 23 | `session-23-push.md` | Push notifications for due callbacks | L |
| 24 | `session-24-ios-windows.md` | iOS build and the Windows decision | M |

## Decisions recorded as you go

Session 1 settles the NativeWind version; write the outcome into `docs/OVERVIEW.md` §3 so later sessions don't
re-open it. The same goes for any decision from §10 you make along the way.

## Session 1 — toolchain lock

**Status: the JS side is verified. The native build and the on-device checks are not done.** Session 1 ran in a cloud
container on 2026-10-05. That container could not reach `dl.google.com` (network policy, HTTP 403). That host serves
the Android SDK, the NDK, build-tools and the Android Gradle Plugin. The container also had no `/dev/kvm`, so no
emulator. Run the device checklist below before you start session 2.

### NativeWind and Tailwind: `nativewind@4.2.7` + `tailwindcss@3.4.19`

- **v5 was tried first and rejected.** Tried: `nativewind@5.0.0-rc.0` + `react-native-css@3.1.0-rc.0` +
  `tailwindcss@4.3.3` + `@tailwindcss/postcss`. Metro could not start:
  `Failed to construct transformer: Error: Cannot find module 'expo/package.json'`. The cause:
  `react-native-css/metro` replaces Metro's transformer with the one from `@expo/metro-config`, for every file.
  That transformer needs the `expo` package. Its Babel preset also adds `react-native-worklets/plugin`. So v5 needs
  Expo inside a bare React Native CLI app, and v5 is still a release candidate.
- **Why 4.2.7 and not 4.1.x.** `nativewind@4.1.23` is from November 2024. It is older than Reanimated 4 and RN 0.81.
  4.2.x is the maintained v4 line (4.2.7 came out 2026-09-14). It still satisfies the planned `^4.1`.
- **Every class string compiles.** These are the values in the Android production Metro bundle:

| Class | Compiled style |
|---|---|
| `bg-emerald-600 text-white` (`LEAD_SOURCE_STATUS_META[40].color`) | `backgroundColor #059669`, `color #ffffff` |
| `bg-emerald-100 text-emerald-800` | `#d1fae5`, `#065f46` |
| `dark:bg-emerald-500/15 dark:text-emerald-300` | `#10b98126`, `#6ee7b7`, under `prefers-color-scheme: dark` |
| `border-l-4 border-l-blue-500 bg-blue-50/80` | `borderLeftWidth 4`, `#3b82f6`, `#eff6ffcc` |
| `dark:bg-blue-500/10` | `#3b82f61a`, under `prefers-color-scheme: dark` |
| `bg-rose-50/60 dark:bg-rose-500/[0.07]` | `#fff1f299`, `#f43f5e12` (dark) |
| `active:bg-rose-50 dark:active:bg-rose-500/10` | pressed state, light and dark |
| `text-[10px]`, `min-h-[44px]` | `fontSize 10`, `minHeight 44` |

### Pinned versions

Every dependency in `package.json` is exact. The only range left is `engines.node` (`>= 22.11.0`). That is the
supported Node range, not a package version.

| Package | Version | Note |
|---|---|---|
| `react-native` | 0.87.1 | already installed |
| `react` | 19.2.3 | already installed |
| `react-native-safe-area-context` | 5.10.1 | already installed; the lockfile had resolved `^5.5.2` to 5.10.1 |
| `react-native-svg` | 15.15.5 | |
| `nativewind` | 4.2.7 | pulls `react-native-css-interop` 0.2.7 |
| `tailwindcss` | 3.4.19 | |
| `react-native-reanimated` | 4.7.1 | **moved here from session 21** (see below) |
| `react-native-worklets` | 0.13.0 | **moved here from session 21** (see below) |
| `@react-navigation/native` | 7.5.0 | |
| `@react-navigation/native-stack` | 7.20.0 | |
| `@react-navigation/bottom-tabs` | 7.20.0 | pulls `@react-navigation/elements` 2.9.44 |
| `react-native-screens` | 4.28.0 | |
| `react-native-gesture-handler` | 2.33.0 | the `^2` line (npm tag `legacy`); `latest` is 3.3.0 |
| `lucide-react-native` | 1.52.0 | |
| `react-native-keychain` | 10.0.0 | |
| `react-native-mmkv` | 4.3.2 | |
| `react-native-nitro-modules` | 0.37.1 | **added**: required peer of MMKV 4 |
| `@react-native-community/datetimepicker` | 9.2.1 | |
| `@react-native-picker/picker` | 2.11.4 | |
| `react-native-image-picker` | 8.2.1 | |
| `@react-native-documents/picker` | 12.0.2 | |
| `react-native-blob-util` | 0.25.1 | |
| `@react-native-community/netinfo` | 12.0.1 | |
| `react-native-toast-message` | 2.5.2 | |
| `dayjs` | 1.11.23 | |
| `libphonenumber-js` | 1.13.14 | |
| `clsx` | 2.1.1 | |

Dev dependencies were pinned to the versions the old lockfile had installed: `@babel/core`, `@babel/preset-env` and
`@babel/runtime` 7.29.7, `@types/jest` 29.5.14, `@types/react` 19.3.0, `@types/react-test-renderer` 19.3.0, `eslint`
8.57.1, `jest` 29.7.0, `typescript` 6.0.3. The rest were already exact.

### Changes from the plan

1. **Reanimated 4.7.1 and Worklets 0.13.0 are installed now, not in session 21.** `nativewind/babel` loads
   `react-native-reanimated/plugin`. In Reanimated 4 that plugin forwards to `react-native-worklets/plugin`. Babel
   fails without both packages. `react-native-css-interop` also lists Reanimated as a required peer, so npm installs
   it anyway. Both packages declare support for RN 0.86–0.88. Do not add `react-native-worklets/plugin` to
   `babel.config.js` by hand: the NativeWind preset already adds it. `@gorhom/bottom-sheet` stays in session 21.
2. **`react-native-nitro-modules` 0.37.1 is added.** MMKV 4 needs it as a peer.
3. **`@react-native/new-app-screen` is removed.** `App.tsx` no longer uses it.

### Config changes

- `babel.config.js`: presets `module:@react-native/babel-preset` and `nativewind/babel`.
- `metro.config.js`: the existing `mergeConfig` output wrapped in `withNativeWind(…, { input: "./global.css" })`.
- `tailwind.config.js`: content `./App.tsx` and `./src/**/*.{ts,tsx}`, `presets: [require("nativewind/preset")]`,
  `darkMode: "media"`.
- `global.css`: the three `@tailwind` directives.
- `nativewind-env.d.ts`: the NativeWind types reference, plus `declare module "*.css"`. TypeScript 6 checks
  side-effect imports by default, so `import "./global.css"` fails `tsc` without that line.
- `tsconfig.json`: excludes `reference`, and lists `nativewind-env.d.ts` in `include`. Without the exclude, `tsc`
  type-checks the whole web app clone and fails. NativeWind's Metro wrapper adds the `include` entry itself if it is
  missing, which would rewrite `tsconfig.json` on the first Metro start.
- `.eslintrc.js`: `ignorePatterns: ["reference/"]`. Without it, `eslint .` lints the web app clone and fails.
- `.prettierrc.js`: changed to match `docs/CODING_STYLE.md` (4 spaces, no semicolons, double quotes, `arrowParens:
  "always"`). ESLint does not run Prettier, so this only changes editor formatting.
- `index.js`: `import "react-native-gesture-handler"` is the first line.
- `jest.config.js`, `jest/setup.js`, `jest/cssStub.js`: mocks for modules that need native code at import time
  (documents picker, blob-util, Nitro, keychain), the shipped mocks for safe-area-context, NetInfo and gesture-handler,
  a `.mjs` transform for lucide, and `react-native-*` packages added to `transformIgnorePatterns`.
- **Gradle, `AndroidManifest.xml`, patches:** none were needed for the JS side. The native side is unknown until
  the build runs.

### What was verified, and how

- A cold `npm install` (no `node_modules`, no `package-lock.json`) with the exact pins: clean, no peer errors.
- `npx react-native config` and Gradle's own settings-phase autolinking both find all 15 native packages.
- RN 0.87's codegen succeeds for the 14 libraries that use it. This is the same two scripts Gradle runs:
  `combine-js-to-schema-cli.js`, then `generate-specs-cli.js`. MMKV uses Nitro's pre-generated code instead.
- Every `com.facebook.react.*` import in the 15 libraries' Android sources exists, either in RN 0.87.1's
  `ReactAndroid` sources or in the codegen output. This does not prove the Kotlin, Java or C++ compiles.
- `npx react-native bundle --platform android --dev false` builds the whole app.
- `npm run lint`, `npx tsc --noEmit` and `npm test` pass. The test renders the app, checks the MMKV and phone lines,
  and switches tabs.

### Not verified (blocked)

- `npm run android` did not run. Gradle compiled RN's settings plugin, ran autolinking, then failed at
  `Could not resolve com.android.tools.build:gradle:9.2.1 … dl.google.com … 403 Forbidden`. Gradle's `google()`
  repository is `dl.google.com`.
- So these are unverified: the native compile, the APK install, and every on-device item in the Definition of done.

### Risks to watch when the native build runs

- **`react-native-keychain` 10.0.0** (March 2025) has no TurboModule spec. It is a classic bridge module
  (`NativeModules.RNKeychainManager`), so it relies on RN's interop layer for legacy modules. RN 0.87 still ships
  that layer (`TurboModuleInteropUtils`, the `useTurboModuleInterop` flag). The spike line checks that the module is
  linked, not only that the promise resolves.
- **`react-native-image-picker` 8.2.1** (May 2025) and **`@react-native-picker/picker` 2.11.4** (October 2025) are
  older than RN 0.87. Their specs and imports pass the checks above.
- **`react-native-svg`** imports `react-native/src/private/featureflags/ReactNativeFeatureFlags`. Metro warns and
  falls back to the file. It works today. It will break if RN closes that path.
- **Reanimated and Worklets** are the largest C++ builds in the set.

### Device checklist

Run on the emulator. Toggle the emulator's dark theme while the app is open.

- [ ] `npm run android` builds and installs from a cold `node_modules`.
- [ ] The green SVG circle draws. `ShieldAlert` shows at 16 and 28, amber.
- [ ] The "Interested" pill is green with white text.
- [ ] The selected row (blue left border) and the callback-due row (rose left border) render, and flip in dark mode
      with no reload.
- [ ] Both tabs switch. The tab bar shows the Home and PhoneCall icons. "Push a stack screen" on tab two, then the
      back gesture, returns to the tabs.
- [ ] The insets line shows a non-zero top. The floating button sits above the tab bar and the gesture bar.
- [ ] Every native module line shows OK after tapping its button: date picker, image library, pick a file. Cancelling
      a picker counts as OK. No red box.
- [ ] Record the emulator API level here.

### Finding for session 6: floating buttons

`useBottomTabBarHeight()` already includes `insets.bottom`. In `@react-navigation/bottom-tabs` 7.20.0,
`getTabBarHeight` returns `49 + insets.bottom` (`src/views/BottomTabBar.tsx`). The tab bar also sits below the screen
in a flex column, so a tab screen already ends at the tab bar's top edge. The spike places the button at
`insets.bottom + tabBarHeight`, as the session 1 prompt says. That lifts the button `insets.bottom + tabBarHeight`
above the tab bar, which counts the inset twice. Compare the printed numbers on the device. Recommendation for
session 6: inside a tab screen, use only a margin (`bottom: 16`). Over content that draws under an absolute tab bar,
use `tabBarHeight + 16`.

### Toolchain record

- Container: Node 22.22.0, npm 10.9.4, JDK 21 for Gradle. RN's Gradle plugin also needs a **JDK 17 toolchain**:
  without one, Gradle tries to download it from foojay and fails. Install a JDK 17 on the build machine.
- `android/`: Gradle wrapper 9.4.1, AGP 9.2.1 (from RN's Gradle plugin), compileSdk 37, targetSdk 36, minSdk 24,
  build-tools 37.0.0, NDK 27.1.12297006, Kotlin 2.2.0.
- `android/gradlew` has no execute bit in git. On macOS or Linux, run it as `bash ./gradlew` or `chmod +x` it.
- Emulator API level: not recorded (no emulator in the session).
- `.env` / `API_BASE_URL` was not set up. The session 1 prompt does not cover it. Session 4 has the fallback: it reads
  `API_BASE_URL` in `src/api/endpoints.ts` with the emulator default. "Before you start" item 2 above is out of date
  on this point.

## Session 2 — shared core

**Status: done, except `npm run android`.** The cloud container still cannot reach `dl.google.com` (HTTP 403), so the
Android build did not run. This session adds no native code. Run `npm run android` once on your machine.

Copied from the web at commit `6858fb8`. 26 files are byte-identical to the web. The rest carry the edits below.

### Deliberate differences from the web

Redo these edits whenever you copy one of these files again. Everything else is verbatim.

| RN file | Web file | Edit |
|---|---|---|
| `src/constants/callStatus.ts` | `src/constants/callStatus.ts` | Line 1 is `import type * as Icons from "lucide-react-native"`. No runtime import. |
| `src/constants/notificationChannels.ts` | same | Data only: codes 2, 3, 4 with labels. The `dispatch*` imports and `channel` fields stay on the server. |
| `src/types/notification.ts` | same | Mongoose `Types.ObjectId` fields are `string`. The mongoose import is gone. |
| `src/types/quotation.ts` | same | Same as `notification.ts`. |
| `src/types/interaction.ts` | same | Legacy header. The `@/config/interactionTypes` string union is inlined, because RN has no `src/config`. |
| `src/types/contact.ts` | same | Legacy header. The `@/config/services` and `@/config/statuses` string unions are inlined. |
| `src/lib/region.ts` | `src/lib/region.ts` | `getRegion()` is replaced by a comment. Session 4 supplies the region from the user's `regions[]`. |
| `src/lib/leadSourceDay.ts` | `src/lib/lead-sources/day.ts` | None. Only the file name and folder differ. |
| `src/lib/callback.ts` | `src/components/admin/operations/lead-sources/callback.ts` | The import points at `@/lib/leadSourceDay`. |
| `src/hooks/useNow.ts` | `src/components/admin/operations/lead-sources/useNow.ts` | The `"use client"` line is gone. |

`src/lib/phone.ts` is byte-identical. Its `HIDDEN_MARKS` regex keeps all four invisible ranges (U+200B–U+200F,
U+202A–U+202E, U+2066–U+2069, U+FEFF). `.prettierignore` lists every copy, so a format-on-save cannot rewrite them.

To check the copies against a fresh `reference/` clone, run `cmp` per file, for example
`cmp reference/zan-workspace/src/constants/leadStatus.ts src/constants/leadStatus.ts`.

### Where this session differs from `docs/SHARED_CODE.md`

SHARED_CODE.md is an analysis of the web, and it marks some files "do not port". The session 2 prompt copies all of
them anyway, with the edits above: `labels.ts`, `notificationRules.ts`, `statusMetaByEntity.ts`, `contact.ts`,
`interaction.ts`, `notification.ts`, `quotation.ts` and `facebook-leads.ts`. SHARED_CODE.md also says to fix
`types/user.ts`. It is copied unchanged, so it still has a required `password` and no `regions`. Session 16 should
use a password-less user row with `regions` when it builds the user screens.

### New tooling

- `@/` resolves in all three toolchains: `paths` in `tsconfig.json`, `babel-plugin-module-resolver` in
  `babel.config.js` (pinned at 5.0.3, the only new package), and `moduleNameMapper` in `jest.config.js`. The Babel
  alias key `"@"` only matches `@/…`, so scoped packages such as `@react-navigation/native` are not affected.
- `src/lib/format.ts` replaces the web's `toLocaleString()` calls and `TimeAgo.tsx`. Each function names the web call
  sites it replaces. Two choices beyond the prompt: a missing or unreadable value returns `"—"`, because
  `dayjs(undefined)` is the current time and would show a missing date as "now"; and `formatAmount` has no `₹` sign,
  because the web adds it in the JSX.
- The spike screen and `App.tsx` now import `LEAD_SOURCE_STATUS_META` and `LEAD_SOURCE_ACCESS_ROLES` from
  `src/constants` instead of holding their own copies.

### Findings

- **`"9876543210"` with `US` is `INVALID`, not an accepted US number.** It is read in the US plan (+1 987 654 3210),
  and 987 is not a US area code. With `IN` it is `+919876543210`. The test asserts this real behaviour.
- **Two numbers in one cell give `NOT_A_NUMBER` only when a comma separates them.** With `/` or a space, the digits run
  together and `validatePhone` returns `TOO_LONG`. This is the web's behaviour, copied as is.
- **The `\p{Nd}` regex in `checkPastedPhone` is safe on Hermes.** The RN Babel preset rewrites it into plain character
  ranges, and RN's own `hermesc` compiles a bundle of every new module with no warnings.
- **`callback.ts` formats times with `toLocaleTimeString`**, so its clock text follows the phone's locale. That is
  the web's behaviour. `format.ts` uses fixed formats instead.

### What was verified

- `npm test`: 8 suites, 95 tests. The `src` suites also pass with `TZ` set to UTC, Asia/Kolkata,
  America/Los_Angeles, Pacific/Kiritimati, Pacific/Pago_Pago, America/St_Johns and Australia/Lord_Howe.
- `npx tsc --noEmit` and `npm run lint` pass.
- A Metro production bundle of the app, and one of a probe that imports every new module, both build. Metro resolves
  `libphonenumber-js/mobile/examples`. `hermesc` compiles both.
- The type-file count: the web has 11 type files plus `facebook/facebook-leads.ts`, 12 in all, and all 12 are
  copied. The Definition of done's "12 files plus facebook" counts the facebook file twice.

## Session 3 — design system primitives

**Status: built and tested in Jest. The on-device checks are not done.** The cloud container still cannot reach
`dl.google.com` (HTTP 403) and has no emulator. Run the device checklist below on your machine.

### What is in `src/components/ui/`

`Badge`, `TemporalBadge`, `NotificationBadge`, `Button`, `Card`, `Field`, `Input`, `Textarea`, `Sheet`,
`SelectSheet`, `Dialog`, `SkeletonBlock` and `SkeletonList`, `EmptyState`, `AccessDenied`, `Avatar`,
`SectionHeader`, `InlineValue`, `TimeAgo`, `Fab`, `Pagination`, and `Toast.tsx` (the `ToastHost`). `index.ts`
re-exports all of them by name. Supporting files: `src/theme.ts`, `src/lib/notify.ts`, `src/lib/imagekitUrl.ts`,
`src/lib/nativeClasses.ts`, `src/lib/iconClassName.ts`. `Field` (label, required mark, error line) and `Sheet`
(the bottom sheet under SelectSheet and Dialog) are two extra primitives the listed ones share.

`App.tsx` renders `src/screens/dev/KitchenSinkScreen.tsx` directly, with no navigator. The session 1 spike tabs
are no longer mounted. Their native module checks are the last kitchen-sink section, so the session 1 device
checklist can still be run. The spike files stay in `src/screens/spike` until that checklist is done.

### How the web's class strings are used

- **Verbatim strings, split at load time.** Button, Pagination and the FIELD style keep the web's class string as
  written. `toNativeClasses` drops what has no phone meaning (`hover:`, `focus:`, `disabled:`, transitions,
  cursors, shadows) and splits the rest between the Pressable and its `<Text>`, because text classes on a View do not
  reach the Text. A re-copy from the web is one paste.
- **Icons take colour classes.** A lucide icon ignores `className` and draws with its `color` prop.
  `enableIconClassNames` registers an icon with NativeWind's `cssInterop`, which moves the class's colour into that
  prop. That is how NotificationBadge's `BADGE_MAP` stays verbatim. Icons whose colour is not a web class string get
  a plain `color` from `PALETTE` in `src/theme.ts`.
- **Shadows are elevation.** Card and the soft button get `elevation: 1` (the web's `shadow-sm`), Fab and toasts 6.
- **Hover becomes pressed.** Buttons scale with `active:scale-[0.98]` and show the Android ripple. Rows use
  `active:` background classes.

### Deliberate differences from the web

| Where | Web | App | Why |
|---|---|---|---|
| AccessDenied title | `dark:text-orange-800` | `dark:text-neutral-100` | about 2.7:1 contrast on neutral-950, unreadable |
| TimeAgo | `text-neutral-500` | adds `dark:text-neutral-400` | contrast on dark cards |
| Badge fallback | ServiceBadge used `bg-gray-500/20 text-gray-400` | `bg-gray-500 text-white` everywhere | the session prompt fixes one fallback, StatusBadge's |
| Buttons, Pagination, rows | 28–36 px tall | `min-h-[44px]` | the style guide's 44 dp touch target |
| Toasts | sonner, `theme="dark" richColors` | dark tinted cards (Tailwind 950 / 900 / 300) | same look in both schemes, as on the web |
| Navigation dark primary | — | blue-400, not `#183668` | `#183668` on a neutral-900 tab bar is about 1.5:1 |

### notify

`notify.success / error / info / warning(message, { id, description, action, duration })`, plus `notify.dismiss()`.
react-native-toast-message shows one toast at a time and replaces it in place. With an `id`, an identical toast
while the first is showing is ignored, and new content updates it in place, as sonner does. So `"auth-401"` fired
three times shows one toast. There is no `toast.promise`; the web never uses it.

### Testing

- `jest/tailwindStyles.ts` compiles the app's real stylesheet (tailwind.config.js and the NativeWind preset) and
  registers it with NativeWind's runtime, as Metro does for `global.css`. Component tests then check the real styles:
  badge colours including status 60's grey Unknown pill, the button's container/text split, card and field surfaces
  in light and dark mode, and lucide icon colours. One test proves a mounted icon recolours when the colour scheme
  changes, with no remount.
- That test found a real bug, now fixed: Input passed `borderColor: undefined` in `style`, which wiped out the
  field's border colour class.
- Behaviour tests: SelectSheet opens, selects and closes; SelectSheet and Dialog close on the back button
  (`onRequestClose`) and on a backdrop tap; Dialog wraps its sheet in an enabled KeyboardAvoidingView; the same toast
  id three times calls the toast library once; the toast host renders a toast's description and action button;
  Avatar builds the ImageKit URL and falls back on error; TimeAgo toggles; Fab adds the bottom inset; Pagination
  disables at the ends.
- `npm test`: 15 suites, 142 tests. `npx tsc --noEmit` and `npm run lint` pass. A Metro production bundle builds, all
  the new classes are in its compiled stylesheet, and `hermesc` compiles it.

### Not verified (needs the device)

- The `npm run android` build itself, and everything visual: colours, the dark mode flip and the status bar, the sheet
  slide-in, the keyboard over the Dialog field, the ripple, the Fab's position over the gesture bar.
- The ImageKit avatar. `ik.imagekit.io` is blocked here too, so the demo URL in the kitchen sink
  (`https://ik.imagekit.io/demo/default-image.jpg`) is unconfirmed. If it shows the User icon, swap in a real user's
  avatar URL from the database.

### Device checklist

- [ ] `npm run android` builds, installs and opens the kitchen sink.
- [ ] Badges show the web's colours for all five META maps, and status 60 is a grey Unknown pill.
- [ ] Dark mode (`adb shell "cmd uimode night yes"`): every section recolours, the status bar icons turn light, and
      no text is unreadable. `"cmd uimode night no"` switches back.
- [ ] SelectSheet and Dialog close on the back button and on a tap outside.
- [ ] In the Dialog, the Note field stays above the keyboard while typing.
- [ ] "auth-401 x3" shows one toast.
- [ ] The long InlineValue and the long SectionHeader title are cut to one line.
- [ ] The Fab sits clear of the gesture bar.
- [ ] The first Avatar shows the image and the others show the User icon.

### Notes for later sessions

- **Session 4:** `Avatar` takes a `baseUrl` for legacy relative paths. Make `API_BASE_URL` its default, or pass it.
- **Session 5:** hand `NAVIGATION_THEME` (or `useNavigationTheme()`) to `NavigationContainer`. For `Fab`'s
  `extraBottom` on tab screens, check the session 1 floating-button finding first.
- **Session 12:** the dialer toast's "Copy number" action needs a clipboard package, which is not installed.

## Session 4 — API client, auth and region

**Status: the app code is done and tested against a mocked API. It is blocked on the backend.** The web source on
`main` (commit `6858fb8`) has none of `docs/BACKEND_CHANGES.md` items 1–4: `getUserFromRequest` reads only the cookie,
the login response has no `token`, and nothing reads `X-Active-Region`. So step 1's curl checks cannot pass, and a real
login on the device will stop with "The server did not return a sign-in token". `docs/backend-patch/mobile-auth.patch`
makes items 1–4 in the web repo; `git apply --check` passes against `6858fb8`. Item 5 needs no change (both `.xlsx`
routes go through `requireRole` → `requireAuth` → `getUserFromRequest`). Apply it, deploy it, then run the device
checklist below. The cloud container also has no Android SDK, so `npm run android` did not run.

### What is in it

- `src/api/endpoints.ts` — `API_BASE_URL` (`http://10.0.2.2:3000`), `AUTH_API`, `OPERATIONS_API`, `LEAD_SOURCES_API`,
  `resolveApiUrl()`. No env loader exists, so `.env.example` only records the value.
- `src/api/client.ts` — `ApiError` (the web's fields), `send()`, `sendRaw()`, `isAbortError()`, `isNetworkError()`,
  `setUnauthorizedListener()`. Every request carries `Authorization: Bearer` and `X-Active-Region`.
- `src/api/handleAuthError.ts` — `handleAuthError(error, onForbidden)`: 403 → `onForbidden(message)`, 401 → handled
  already, both return `true`.
- `src/api/navigationRef.ts` — `navigationRef`, `resetToLogin()`, `resetToApp()`, `handleNavigationReady()`.
- `src/store/keychain.ts` (the JWT only) and `src/store/mmkv.ts` (me payload, region pin, last email, region-keyed
  cache with `getRegionCache` / `saveRegionCache`, `clearRegionCache()`, `clearAll()`).
- `src/contexts/AuthContext.tsx`, `RegionContext.tsx`, `StatusContext.tsx` (verbatim, in `.prettierignore`).
- `src/components/region/` — `RegionSwitcher`, `RegionBadges` / `RegionBadge`, `tone.ts` (verbatim web colours).
- `src/screens/auth/SplashScreen.tsx`, `LoginScreen.tsx`; `src/screens/dev/HomePlaceholderScreen.tsx`;
  `src/navigation/RootNavigator.tsx` (temporary) and `types.ts`.
- `Avatar`'s `baseUrl` now defaults to `API_BASE_URL`, as session 3 asked.

### Decisions

- **Which 401 ends the session.** Only a 401 for a request that carried the current token. A login attempt carries no
  token, so its 401 "Invalid credentials" stays a plain error. Parallel 401s share one token: the first clears it, so
  the rest do nothing and `resetToLogin()` runs once. A late 401 for a token already replaced is ignored.
- **The last login email survives logout.** `clearAll()` drops the session (me payload, region pin) and every cached
  list, and keeps `prefs.lastEmail`, because the Definition of done wants Login prefilled. Everything else goes.
- **Login clears the session before storing the token**, so user B never inherits user A's region pin. Then
  `/api/auth/me` with no region header returns the account's default, which is stored.
- **`refreshUser()` resolves to the user** (or `null`). The web's returns nothing. Callers that ignore the value are
  unaffected; Login uses it to stop on "The server did not accept the sign-in token".
- **`/api/auth/me` is skipped with no token.** The server would answer `data: null` anyway. With a token it is always
  called and the branch is on `data === null`, which also clears the dead token.
- **A start with no network** uses the cached me payload, if a token exists. Any other failure means signed out, as on
  the web.
- **A failed connection** becomes `ApiError("No connection. Check your network and try again.", 0)`. An AbortError
  passes through untouched.
- **Error text** is `json.message`, then `json.error` (the quotations route), then a fallback by status: 401 "Session
  expired. Please log in again.", 403 the web's "You aren't authorized to perform this action.", else "Something went
  wrong. Try again."
- **Login's error block.** The web declares an inline error block but never fills it, and toasts instead. The app
  fills the block with the server's message (400 / 401 / 403 text as sent). Success still toasts "Login successful".
- **Region switch.** `setActive` posts, stores `data.active` in MMKV, updates the cached me payload, drops the
  region-keyed cache, and sets the override. `NavigationContainer` is keyed on `active`, so every screen remounts. The
  initial route is picked from the session (`Splash` while loading, else `App` or `Auth`), so a remount never shows
  Splash. The override is tied to the user id, so it never leaks to the next account.
- **Region switcher.** A plain badge for one region, a pill that opens a sheet for more. The web's SVG flags are left
  out; "All regions" shows a globe and the web's label, "Planet". It renders nothing until `/api/auth/me` answers.
- **Root route names are session 5's already:** `Splash`, `Auth`, `App`, plus a dev `KitchenSink` route opened from
  the placeholder Home, so the session 1–3 device checklists stay reachable.
- **`navigationRef` lives in `src/api/`**, as this prompt and OVERVIEW §5 say. The session 5 prompt calls it
  `src/navigation/navigationRef.ts`; it means this file.
- **Keychain entry:** service `com.zanverse.auth`, `ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` (the token is not
  restored onto another device from a backup).
- **Plain HTTP in debug** needs no manifest change: RN's Gradle plugin sets `usesCleartextTraffic="true"` for debug
  builds and `false` for release.

### What was verified

- `__tests__/api/client.test.ts` (16 tests, mocked `fetch`): the four required cases — a 401 clears the token and the
  MMKV session and calls `resetToLogin` once (two parallel 401s), `field: "phone"` becomes an ApiError with that field,
  FormData goes out with no `Content-Type`, `sendRaw` keeps `counts` and `progress` — plus the Bearer and region
  headers, the login 401 that must not log out, the quotations `error` field, AbortError, network errors and
  `handleAuthError`.
- `__tests__/App.test.tsx` (6 tests, the whole app mounted): no token → Login with the last email prefilled and no
  request; a valid token → Splash → Home with the region seeded from `/api/auth/me`; `data: null` → Login and the token
  gone; a region switch posts `{ region }`, trusts `data.active`, remounts, and the next request carries the new
  header; one region → plain badge, `canSwitch: false`; logout posts, clears Keychain and MMKV and shows Login at once.
- `npm test`: 17 suites, 164 tests. `npx tsc --noEmit`, `npm run lint` and Prettier pass. A Metro production bundle
  builds, the new classes are in its compiled stylesheet, and `hermesc` compiles it.

### Not verified

- The four curl checks (blocked: the backend changes are not in the web source, and no dev API is reachable from the
  cloud container).
- Everything on the device.

### Device checklist (after the backend patch is deployed)

- [ ] The four curl checks in `docs/BACKEND_CHANGES.md` ("A ready patch") pass.
- [ ] `npm run android` builds and installs; no red box. Splash → Login on a fresh install.
- [ ] A real login lands on Home with the right name, role label, regions and active region.
- [ ] Kill and relaunch: Splash → Home, no login. After logout, Login shows the last email.
- [ ] Corrupt the token (or wait for expiry): the next request ("Send a test request") shows one "Session expired"
      toast and lands on Login; relaunching stays on Login.
- [ ] Switch region on a multi-region account: the pill shows the server's answer, and "Send a test request" reports
      the new `X-Active-Region` in its toast.
- [ ] A one-region account shows a plain badge with nothing to press.
- [ ] Logout shows Login at once, and the "Logged out successfully" toast is still visible over it.
- [ ] Wrong password shows "Invalid credentials" in the red block; a deactivated account shows "Account is
      deactivated".

## Session 5 — navigation shell

**Status: done, except the device checks.** The shell is built and tested with the whole app mounted in Jest. The
cloud container has no Android SDK, so `npm run android` and the `adb` deep-link check did not run. Signing in on a
device also needs the session 4 backend patch.

### What is in it

- `src/navigation/navItems.ts` (the six MobileNav items, literal role arrays, `getNavItemsForRole`),
  `moreItems.ts` (SideBar's Meetings, Overall Stats, Activity Logs, plus Notifications and Profile for every role),
  `permissions.ts` (`SCREEN_ROLES`, `canOpen`), `screenTitles.ts`, `stackOptions.ts`.
- `src/navigation/RootNavigator.tsx` — `Splash`, `Auth`, `App` (the tabs), and the dev `KitchenSink` route.
- `src/navigation/TabNavigator.tsx` and `src/navigation/stacks/*Stack.tsx` — one native stack per tab, every screen
  name from the prompt registered and pointing at `PlaceholderScreen`.
- `src/navigation/ScreenLayout.tsx` — every stack's `screenLayout`: the offline bar, then the screen or
  `AccessDenied` when `canOpen` is false.
- `src/navigation/linking.ts` — `zanverse://` deep links, `resolveNotificationPath()`, `getTargetNavigation()`.
- `src/screens/PlaceholderScreen.tsx` (route name and params), `src/screens/more/MoreScreen.tsx`,
  `src/components/ui/OfflineBanner.tsx`.
- `android/app/src/main/AndroidManifest.xml` — a `VIEW` intent filter for the `zanverse` scheme. iOS needs the same
  URL type in session 24.
- `AccessDenied` was already ported in session 3, so this session only uses it.

### Decisions

- **The tabs remount on a region switch, not the `NavigationContainer`.** `App` renders `<TabNavigator
  key={active} />`. Every tab and screen remounts and fetches again, which is what the prompt's
  `<NavigationContainer key={activeRegion}>` is for. Remounting the container itself would also re-run deep-link
  handling: the link that opened the app would open again after every switch, or be lost during boot. React
  Navigation restores the tab and stack you were on, so the person stays on the same screen, as the web's reload
  keeps the URL.
- **Deep links wait for the session.** `getInitialURL` waits for the first `/api/auth/me` answer (`waitForAuthBoot()`
  in AuthContext). Signed out, the link is dropped and Login opens. While it waits, the container shows the splash
  view. Links that arrive while the app runs are followed only with a token. Each tab's config sets
  `initialRouteName`, so `zanverse://leads/<id>` opens LeadDetail with LeadsList under it.
- **Deep link paths** are the web's paths without `/admin/operations`: `leads/:id`, `leads/:id/edit`,
  `clients/:clientId/projects/create`, `lead-sources/uploads`, `activity-logs`, and so on (see `linking.ts`).
- **Role lists follow the prompt, which differ from the web in two places.** The web proxy uses the first matching
  pattern, and `users(\/|$)` comes before `users/create` and `users/:id/edit`, so on the web those pages are really
  gated by `[10, 45, 20, 69]`. The app uses the intended lists: UserCreate `[10, 20, 69]`, UserEdit `[10, 20]`.
  `LeadSourceDetail` is gated by `LEAD_SOURCE_ACCESS_ROLES`, as the proxy's `lead-sources(\/|$)` pattern does.
- **Role 15 sees a Users tab that shows AccessDenied.** MobileNav gives Users to `[10, 15, 20, 69]`, but the proxy
  allows UsersList for `[10, 45, 20, 69]`. The web does the same: the item shows, the page redirects. Kept as is.
- **More** shows the user's avatar, name and role label, the region switcher, the role-filtered rows and Logout. In
  debug builds it also has "Send a test request" (shows the `X-Active-Region` it sent) and "Kitchen sink".
- **Tab labels are 10 pt**, so seven tabs fit a 360 dp phone. The More tab uses lucide's `Ellipsis` icon.
- **`navigationRef` stays in `src/api/`** (see session 4). `resetToLogin()` and `resetToApp()` were already there.

### What was verified

- `__tests__/App.test.tsx` (11 tests, the whole app): boot to Login / tabs / Login-on-dead-token; an Admin sees six
  tabs plus More and a role 65 account sees Dashboard, Leads, Calls and More; More shows Activity Logs for role 10
  and hides it for role 50; the region switch posts, remounts on the same tab, and the next request carries the
  header; a one-region badge; logout; UserEdit as role 69 renders AccessDenied with the fallback message; LeadDetail
  as Admin shows the placeholder with its `id`.
- `__tests__/navigation/navigation.test.ts` (11 tests): tab and More filters for several roles, `canOpen`,
  `resolveNotificationPath` and `getTargetNavigation`, and `getStateFromPath` for `leads/<id>` (LeadsList under
  LeadDetail), the static paths over `:id`, and the More destinations.
- `OfflineBanner` shows offline, hides online and while unknown.
- `npm test`: 19 suites, 182 tests. `npx tsc --noEmit`, `npm run lint` and Prettier pass. The Metro production bundle
  builds, the new classes are compiled, and `hermesc` compiles it.

### Device checklist

- [ ] `npm run android` installs and launches with no red box.
- [ ] An Admin sees six tabs plus More; a role 65 account sees Dashboard, Leads, Calls and More.
- [ ] Every tab opens its placeholder, and the placeholder prints its route name.
- [ ] More shows Activity Logs for role 10 and hides it for role 50.
- [ ] `adb shell am start -a android.intent.action.VIEW -d "zanverse://leads/<objectId>"` lands on LeadDetail with
      that id; Back goes to Leads.
- [ ] UserEdit as role 69 (`zanverse://users/<id>/edit`) shows AccessDenied.
- [ ] A region switch on a multi-region account remounts the tabs, and the new region is still selected after a
      restart.
- [ ] Logout returns to Login, and a relaunch stays on Login.
- [ ] Airplane mode shows the offline bar under the header; turning it off hides it.
- [ ] The seven tab labels fit without clipping on a small phone.

## Session 6 — shared list kit

**Status: done, except the device checks.** The kit is tested against a mocked API, both as units and inside the
whole app. The demo screen needs the session 4 backend patch to show real leads, and the cloud container has no
Android SDK.

### What is in it

- `src/hooks/useListQuery.ts` — `{ query, searchText, setSearch, setPage, setFilters, resetFilters, items, setItems,
  envelope, total, pages, loading, refreshing, loadingMore, accessError, error, refresh, loadMore }`. Options: `path`,
  `pageSize` (10), `extraParams`, `initialQuery`, `selectItems`.
- `src/components/list/ListScreen.tsx` — the FlatList scaffold. Props: `query`, `renderItem`, `SkeletonComponent`,
  `emptyText`, `getCountLabel`, `searchPlaceholder`, `statusMeta`, `hideDateFilters`, `headerRight`, `headerExtra`,
  `bottomInset`.
- `src/components/list/ListFilters.tsx`, `DateField.tsx`, `SearchField.tsx`; `src/lib/dates.ts` (`MIN_DATE`,
  `todayLocal`, `clampDate` verbatim, plus `parseLocalDate` / `formatLocalDate`).
- `src/screens/dev/ListKitDemoScreen.tsx` — More → "List kit demo" (debug builds), on
  `GET /api/admin/operations/leads`.
- `FIELD_BOX_CLASSES`, `FIELD_CLASSES` and `FIELD_TEXT_CLASSES` are now exported from `@/components/ui`.

### Decisions

- **Four loading states, one at a time.** `loading` (first page after mount or a filter or search change: five
  skeletons), `refreshing` (pull-to-refresh: the spinner), `loadingMore` (one skeleton under the rows), and a quiet
  reload on focus that shows nothing. The mode of the next page-1 fetch is kept in a ref, so a search that ends where
  it started fetches nothing.
- **Newest request wins.** Every fetch aborts the one before it, and an aborted fetch never writes state. That also
  covers unmounting.
- **Errors.** 403 → `accessError` and AccessDenied in place of the list. 401 → nothing here (the client already went
  to Login). Anything else → `error`: an empty list shows "Could not load the list" with "Try again"; a list with rows
  keeps them and shows a toast.
- **Appended pages are merged by `_id`**, so a row that moved pages between requests is not shown twice.
- **The query string is built by hand**, not with `URLSearchParams`, because React Native's `URLSearchParams` is
  incomplete. The param order is the web's: `page`, `limit`, then `search`, `status`, `from`, `to`, `view`, `sort`, then
  any `extraParams`.
- **Search** waits 300 ms and fires only at 0 or 2+ characters, as the prompt says. (The web's list search has no
  minimum; only its dashboard search does.)
- **Filters are a draft until the sheet closes**, by Done, Back or a tap outside, and then `setFilters` runs once. The
  same values again fetch nothing. Statuses are chips: "All statuses", then each label of the META map.
- **Dates.** Android opens the system dialog through `DateTimePickerAndroid.open`, limited to `min` and `max` (From:
  `2026-01-01`..To, To: From..today). iOS opens a sheet with the inline calendar. Both show the short date ("Mar 10"),
  muted until chosen, as the web shows its default range.
- **`useFocusEffect`** skips the first focus (the mount is already loading) and reloads page 1 quietly on later ones.
  A reload on focus drops the appended pages, back to page 1.
- **Rows are spaced by the content container's `gap`**, not a separator component.

### What was verified

- `src/hooks/__tests__/useListQuery.test.tsx` (11 tests, a fetch mock that honours AbortSignal): page 1 with the web's
  param names; loadMore appends and stops at the last page; a second loadMore while loading does nothing; filters reset
  to page 1 and replace the rows; search at 1 character fires nothing and at 2 fires once after exactly 300 ms; refresh
  keeps filters and search; the first focus does not refetch and a later one reloads quietly; an aborted stale response
  writes nothing; 403 → `accessError`; `pagination.totalPages`; `setPage` is stable.
- `src/components/list/__tests__/list.test.tsx` (14 tests): five skeletons on first load, rows and the count, the
  footer skeleton, the empty text, the error with retry, AccessDenied with the server's message, `onEndReached` and
  pull-to-refresh wiring, the filter count; ListFilters lists the META labels, applies once on close, and shows "Clear
  filters" only while something is set; DateField on Android passes min and max and returns `YYYY-MM-DD`;
  `clampDate` and `todayLocal`.
- `__tests__/App.test.tsx`: the demo opens from More, requests `leads?page=1&limit=10` and shows the rows and "2 leads
  found"; a 403 shows AccessDenied.
- `npm test`: 21 suites, 209 tests. `npx tsc --noEmit`, `npm run lint` and Prettier pass. The bundle builds, the new
  classes are compiled, and `hermesc` compiles it.

### Device checklist

- [ ] The demo opens from More; the first page shows 10 rows.
- [ ] Scrolling to the bottom appends page 2 with the footer skeleton; past the last page no request goes out.
- [ ] Pull-to-refresh returns to page 1 and keeps the status, dates and search.
- [ ] A status from the filter sheet resets to page 1, and the count line matches `pagination.total`.
- [ ] From cannot go before 2026-01-01 or after To; To cannot go after today.
- [ ] One typed character sends nothing; two send one request after 300 ms.
- [ ] Leaving the tab and coming back reloads page 1 with no spinner, and no warning appears in Metro.
- [ ] A role outside the leads list's roles sees AccessDenied with the API's message.
- [ ] A search with no match shows "No leads found".

## Session 7 — leads module

**Status: done, except the device checks.** All five lead screens are built and tested inside the whole app against a
mocked API. Real data needs the session 4 backend patch, and the cloud container has no Android SDK.

### What is in it

- Screens (`src/screens/leads/`): `LeadsListScreen`, `LeadDetailScreen`, `LeadCreateScreen`, `LeadEditScreen`,
  `LeadConvertScreen`, wired into `LeadsStack`. The session 6 demo screen is removed; the Leads tab replaces it.
- Lead components (`src/components/leads/`): `LeadCard`, `LeadCardSkeleton`, `LeadDetailsSkeleton`, `LeadDetailsCard`,
  `LeadStatusSheet`, `ConvertedClientBlock`, `LeadInteractionActions` (buttons only; session 8 wires them),
  `ConvertButton`, `LeadForm`, `LeadInfoCard`.
- Phone (`src/components/phone/`): `useEditablePhone`, `PhoneField`, `CountrySheet`, `PhoneHint`, `PhoneText`,
  `WhatsAppLink`.
- Shared: `src/hooks/useDetailQuery.ts` (one record with loading / refreshing / accessError / not-found and a quiet
  reload on focus — sessions 9 and 10 reuse it), `src/hooks/useWriteRegion.ts`,
  `src/components/region/WriteRegionField.tsx`, `src/components/ui/FormScrollView.tsx`, and
  `src/navigation/openRecord.ts` (`openClient`, `openProject`, `openLead`: open a record in the tab that owns it).
- `Fab` gained `isAboveTabBar`: on a tab screen it adds no bottom inset (the session 1 finding).
- New dependency: `@react-navigation/elements@2.9.44`, pinned. It was already installed under native-stack; it is now
  declared, because `FormScrollView` imports `useHeaderHeight` from it.

### Decisions

- **The status sheet** is two steps in one bottom sheet, driven by `StatusContext`. "Remarks are required" shows under
  the remarks box (the web toasts it). The PATCH body is `{ status, remarks }`; on success it toasts "Status updated",
  calls `reset()`, and the screen refetches quietly. Converted is never an option; the button is inert at 60 and 70.
- **Edit link roles.** The prompt's `LEAD_EDIT_ROLES = [10, 15, 60, 69, 45, 70]`, narrowed by `canOpen("LeadEdit")`.
  So role 15 does not see a link that would only lead to AccessDenied. On the web, 15 sees it and the proxy redirects.
- **Convert** shows on the card and on the header card at status 50, and only for roles that may open LeadConvert.
  After a convert, the convert screen closes and the new client opens in the Clients tab at once. The lead reloads at
  status 60 when the person goes back to the Leads tab.
- **Cross-tab links.** "View client" and the convert landing open `ClientDetail` in the Clients tab, with the client
  list under it. A role with no Clients tab (65) gets the web's 403 line as a toast instead of a jump that does
  nothing.
- **Delete** (role 10 only, as the web) asks with `Alert.alert("Delete this lead?")`, toasts the server's message, and
  goes back with `popTo("LeadsList")`, which reloads the list on focus. React Navigation 7's `navigate` pushes a new
  screen; `popTo` returns to the existing one. After an edit, `popTo("LeadDetail")`; after a create,
  `replace("LeadDetail")`, so Back returns to the list.
- **Not found.** Any failure but 401 and 403 shows "Lead not found", as the web.
- **Phone field.** The typed text is kept in state (the web reads the `<input>`). A saved valid number shows in national
  format (`9876543210` → `098765 43210`), and both saved-value rules hold: an unchanged number sends the saved text,
  and an invalid saved value with an empty box sends it unchanged. A change of more than one character at once is
  treated as a paste and checked with `checkPastedPhone`; a typed `+` shows `HAS_COUNTRY_CODE`; no length limit.
- **Country sheet.** The three regions first, then every other country by name, each with its calling code, and a
  search box. Names come from `Intl.DisplayNames` when Hermes has it, else the code.
- **WhatsApp** opens `https://wa.me/<number>`, which opens the app or the browser. An invalid number is grey text.
- **The region field** on create shows the full region name (the web shows a flag and the code). Pinned, it is fixed,
  with "To save in another region, switch region in More."
- **Keyboard.** Form screens use `FormScrollView`: `KeyboardAvoidingView` with `behavior="padding"` and the header
  height as the offset, plus `keyboardShouldPersistTaps="handled"`.
- **Session 8 hook-in.** `LeadInteractionActions` keeps the web's `onAction(type)` and `activeType` props; today a
  press shows "Available in the next session".

### What was verified

- `src/components/phone/__tests__/phone.test.tsx` (12 tests): both saved-value rules, E.164 for a changed number, the
  library's error messages, `setError` and clearing on typing; typed digits, the `+` refusal, a paste with text around
  the number refused, a pasted full number for the country put in as national, another country's number refused, an
  extra digit kept and refused by the check.
- `__tests__/leads.test.tsx` (13 tests, the whole app): the list with the count ("1 lead found" singular), Create New
  Lead, and Convert only on the status-50 card; detail with WhatsApp and the four buttons; the status flow (blank
  remarks refused, one PATCH with the right body, the new badge); inert at Converted; the converted block and "View
  client" opening ClientDetail; Admin delete through the Alert; no Delete or Edit for role 50; "Lead not found" and
  AccessDenied; the create body (with region `IN`) and the server's phone error under the field; create landing on the
  new lead; an edit sending the legacy phone `9876543210` unchanged; convert landing on ClientDetail.
- `npm test`: 23 suites, 232 tests. `npx tsc --noEmit`, `npm run lint` and Prettier pass. The bundle builds, the new
  classes are compiled, and `hermesc` compiles it. Every new file is under 250 lines.

### Device checklist

- [ ] The Leads tab lists 10 leads, appends on scroll and refreshes on pull.
- [ ] A status filter and a 2-character search reset to page 1; the count matches `pagination.total`.
- [ ] A status-50 card shows "Convert To Client" on its own row with no overlap at 360 dp.
- [ ] The detail screen shows name, source, phone, email and the created date; the phone row opens WhatsApp.
- [ ] A status change asks for remarks, refuses blank, PATCHes once, toasts "Status updated" and updates the badge.
- [ ] Status 60 or 70: the button is inert; "Converted" is never an option.
- [ ] Create with an invalid phone shows the server's message under the phone field; a valid one opens the new lead.
- [ ] Editing a lead saved as `9876543210` saves other fields with no phone error.
- [ ] Converting a status-50 lead opens the client at once; the lead then shows status 60 and the converted block.
- [ ] Role 10 sees Delete and the Alert; the list no longer shows the lead. Role 50 sees neither Delete nor Edit.
- [ ] A role outside the lead roles sees AccessDenied; an unknown id shows "Lead not found".
- [ ] The four interaction buttons show their colours. The Fab sits 16 dp above the tab bar.
- [ ] The country sheet scrolls and searches; on Hermes, check whether country names show or only codes.

## Session 8 — interactions and timeline

**Status: done, except the device checks.** The lead screen now has its timeline and all four forms, tested inside
the whole app against a mocked API. Real data needs the session 4 backend patch, and the cloud container has no
Android SDK. **New native package:** `@react-native-clipboard/clipboard@1.16.3` (pinned; it has a codegen config, so it
is a TurboModule). Run `npm run android` once to link it.

### What is in it

- `src/hooks/useInteractions.ts` — a timeline for `{ entityType, entityId }` (lead 0, client 1, project 2) through
  `sendRaw`, reading `json.interactions`; reloads quietly on focus. `getTimelinePath()` maps the three routes.
- `src/components/interactions/` — `InteractionTimeline` (the screen as one FlatList: header, rows, pull-to-refresh,
  skeletons, "No interactions yet", an error with "Try again"), `InteractionItem` (the type switch),
  `types/NoteItem | CallItem | MeetingItem | QuotationItem | StatusChangeItem | DocumentItem`, `InteractionRowFrame`,
  `RowHeader`, `InteractionEditor`, `EditHistory`, `MeetingLinkButton`, `InteractionActions`,
  `InteractionItemSkeleton`, `FormActions`, `canEditInteraction`, `timelineTypes`.
- `src/screens/interactions/` — `AddNoteScreen`, `LogCallScreen`, `ScheduleMeetingScreen`, `SendQuotationScreen`,
  `AttendeePickerScreen`.
- `src/components/ui/DateTimeField.tsx`, `src/components/ui/FilePickerField.tsx` (with `getFileRejection`),
  `src/lib/toastPromise.ts`.
- `LeadDetailScreen` now renders through `InteractionTimeline`. `components/leads/LeadInteractionActions.tsx` is
  replaced by `components/interactions/InteractionActions.tsx`.

### Decisions

- **The forms are modals in the root stack, not in the Leads stack.** Sessions 9 and 10 need the same forms from the
  Clients and Projects tabs. Registered once at the root (`presentation: "modal"`, with a header), they open from any
  tab and cover the tab bar. A form calls `goBack()` on success; the timeline screen regains focus and reloads, so
  the new row appears with no manual refresh.
- **The attendee list is its own screen.** It returns `{ _id, name }[]` to the meeting form with
  `popTo("ScheduleMeeting", { attendees }, { merge: true })`, so the form shows the names and "N selected".
- **The timeline is the screen's list.** The header card, the converted block, the add buttons and Delete are the
  FlatList header, so the whole screen scrolls as one list and rows stay virtualized. The vertical line is one
  segment per row. The web's staggered fade-in is dropped.
- **A 2050 meeting row** reads every `meeting` field through optional chaining. The web reads `meeting.description`
  unguarded and would crash on it.
- **New 2310 document row:** title, description, the document's title and an Open link. The web renders nothing.
- **Recordings and documents** are relative paths; they open at `API_BASE_URL + path` with `Linking.openURL`, in place
  of the web's `<audio>` player. Quotation files are absolute ImageKit URLs and open as they are.
- **Amounts** use `formatAmount` (Indian grouping, as the web's `toLocaleString()` shows in India): `₹1,00,000 + 18%
  GST`, `Amount Inclusive GST : ₹1,18,000`. Call times use `formatDateTime`.
- **The pencil** is always visible, 44 dp, for `[10, 15, 60, 69, 45, 50, 70]`. The editor's PATCH sends only the keys
  that changed, as the web.
- **Files.** The picker is filtered to the allowed types, and the web's react-dropzone checks run again on the result
  with the same messages ("File type must be one of …", "File is larger than N bytes"). Quotations: PDF, DOC, DOCX up
  to 10 MB, as the web. Recordings: `audio/*`; the web and the route set no size limit, and the app caps it at 50 MB.
  File parts are `{ uri, name, type }`; `Content-Type` is never set by hand.
- **Dates** go out as ISO strings (`callTime`, `scheduledAt`). The web sends the `datetime-local` text. A call's time
  starts at now; a meeting's starts empty and cannot be in the past.
- **Required fields on Log Call.** The web's inputs are `required`, which the browser enforces. The app shows "Please
  fill required fields" for a blank contact name, duration, title or notes. The `status` part stays `"0"`.
- **Messages** are the web's: "Description cannot be empty", "Title is required", "Amount is required", and the eight
  `toast.promise` strings through `toastPromise` (one toast that turns from loading into success or error).
- **The "Created by" tooltip** becomes a visible last line on every row.

### What was verified

- `src/components/interactions/__tests__/rows.test.tsx` (16 tests): every row type, including the 2050 row with
  `meeting: null`, the status pills from `STATUS_META_BY_ENTITY[0]`, Join and Copy ("Copied" for 1.5 s), the recording
  opening on the API host, the GST total, the document row; no pencil for role 30; the editor's disabled Save and
  partial PATCH; EditHistory's "once / twice / thrice / N times", "Someone", and the previous value; the file rules;
  `toastPromise`; `getTimelinePath`.
- `__tests__/timeline.test.tsx` (9 tests, the whole app): "No interactions yet"; rows newest first; Add Note refusing
  an empty note, posting the web's body and showing the new row on return; a quotation as multipart with the web's
  eight part names, `gst_percentage` 18, `status` 2410, the PDF part and no Content-Type; a `.txt` refused before
  upload; Log Call with the twelve part names, E.164 phone, `status` "0", a recording, and a `field: "phone"` error
  under the field; a meeting with two attendees from the picker; an in-place note edit sending only `description`
  and then showing "Edited once"; no pencils for role 30.
- `npm test`: 25 suites, 257 tests. `npx tsc --noEmit`, `npm run lint` and Prettier pass. The bundle builds with the
  clipboard module in it, the new classes are compiled, and `hermesc` compiles it.

### Device checklist

- [ ] `npm run android` builds with the clipboard module; no red box.
- [ ] A lead's timeline shows note, call, meeting, quotation and status rows with badges and times; an empty lead
      shows "No interactions yet". A 2050 row does not crash.
- [ ] A 2510 row shows both pills and the remarks.
- [ ] A new note appears at the top on return, with no manual refresh.
- [ ] A call with a recording saves, and Open plays the recording from the row.
- [ ] A quotation with a PDF saves; a `.txt` cannot be picked or is refused with the allowlist message.
- [ ] An online meeting with two attendees saves; its row shows Join (once the server added a link). Copy says
      "Copied".
- [ ] Editing a note and a 2510 remark both survive pull-to-refresh; EditHistory says "Edited once" with the old value.
- [ ] A role outside the edit roles sees no pencil.
- [ ] Android date and time dialogs open one after the other; the keyboard never covers a form field.
