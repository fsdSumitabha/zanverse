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
