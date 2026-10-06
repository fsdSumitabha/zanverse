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

## Session 9 — clients module

**Status: done, except the device checks.** Five client screens are built and tested inside the whole app against a
mocked API. Real data needs the session 4 backend patch; the cloud container has no Android SDK. No new package.

### What is in it

- Screens (`src/screens/clients/`): `ClientsListScreen`, `ClientDetailScreen`, `ClientEditScreen`,
  `ClientProjectsScreen`, `ProjectCreateScreen`, wired into `ClientsStack`. A new route `ClientProjects`
  (`{ clientId }`, deep link `zanverse://clients/:clientId/projects`).
- Components (`src/components/clients/`): `ClientCard`, `ClientHeaderCard`, `ClientStatusSheet`,
  `ConvertedFromLeadBlock`, `ClientProjectPreviewCard`, `ClientProjectsSection`, `ClientForm`, `ClientInfoCard`.
- Shared: `src/components/status/StatusSheet.tsx` (the generic two-step status sheet; `LeadStatusSheet` and
  `ClientStatusSheet` are thin wrappers, and projects reuse it in session 10), `src/components/ui/SegmentedControl.tsx`,
  `src/hooks/useDeleteRecord.ts` (Alert → DELETE → toast; the lead screen uses it too).

### Decisions

- **The detail screen has three sections**: Overview (header card, the source lead, Delete), Timeline (the session 8
  kit at entityType 1 with the four add buttons) and Projects (three cards and View All). Each section is its own
  scroll view, with pull-to-refresh reloading the client and the timeline.
- **A status change reloads both the client and the timeline**, so the new pill and the 2510 row appear together. The
  web reloads only the client. The sheet shows the server's message on failure (the web shows "Failed to update
  status" for every failure). At Completed the pill is read-only.
- **Delete** shows only for `[10, 15, 45]`, the DELETE route's roles (the web shows it to everyone). The Alert asks
  "Delete this client?" (the web's confirm says "lead" by mistake).
- **Edit link roles**: the web's `[10, 15, 60, 69, 45, 70]`, narrowed by `canOpen("ClientEdit")`, as for leads.
- **One floating button**, "Create New Project", for roles that may open ProjectCreate (`[10, 45, 60, 70]`). It sits 16
  dp above the tab bar (`isAboveTabBar`): the prompt's `useBottomTabBarHeight() + insets.bottom` would lift it twice
  (the session 1 finding).
- **Project create** loads the client for the read-only card, so no id is typed. Its option labels are the web's (the
  enum keys with spaces: "WEB DEVELOPMENT", "PROPOSAL SENT"). The body is `{ clientId, title, description,
  serviceType, status, budget }`, with no region. Title, description and budget are required, as the web's `required`
  inputs. On success the form closes and the new project opens in the Projects tab at once (the web waits 3 s and
  goes to the project list).
- **Project cards** open the project in the Projects tab (session 10 builds the screen). The service pill shows its
  SERVICE_META label where the web prints the code.
- **The client's projects list** is one FlatList over the full array; the web's slices of five are dropped.
- **The list** keeps the kit's count line ("1 client found"), which the web's clients page does not show.

### What was verified

- `__tests__/clients.test.tsx` (12 tests, the whole app): the list with no create button; the header and the
  Converted from Lead block opening the lead; no block for a direct client; the status flow (blank remarks refused,
  one PATCH, the new pill, the timeline reloaded with the 2510 row); read-only at Completed; a note from the Timeline
  section at entityType 1; three project cards with the service label and Indian budget format, and View All listing
  all four; Delete for role 15 through the Alert, none for role 60; AccessDenied on a 403; an edit with a server phone
  error under the field, then the saved body; a project created from the floating button with the right body, landing
  on ProjectDetail.
- The lead tests now check the real client screen after "View client" and after a convert.
- `npm test`: 26 suites, 269 tests. `npx tsc --noEmit`, `npm run lint` and Prettier pass. The bundle builds, the new
  classes are compiled, and `hermesc` compiles it.

### Device checklist

- [ ] The Clients tab lists 10 clients, appends on scroll; a status and date filter resets to page 1.
- [ ] A converted client shows the Converted from Lead block; a direct client does not.
- [ ] A status change asks for remarks, refuses blank, and shows the new pill and the 2510 row with no reload.
- [ ] A Completed client's pill does not open.
- [ ] A note added from the Timeline section appears at once.
- [ ] Projects shows at most three cards; View All lists every project in one list.
- [ ] Editing saves; a duplicate phone shows the server's message under the phone field.
- [ ] Create New Project needs no typed id and opens the new project at once.
- [ ] Roles 10, 15 and 45 see Delete; others do not. Delete returns to the list.
- [ ] A 403 shows AccessDenied with the server's message.

## Session 10 — projects module

**Status: done, except the device checks.** The three project screens are built and tested inside the whole app
against a mocked API. Real data needs the session 4 backend patch; the cloud container has no Android SDK. No new
package.

### What is in it

- Screens (`src/screens/projects/`): `ProjectsListScreen`, `ProjectDetailScreen`, `ProjectEditScreen`, wired into
  `ProjectsStack`. No standalone create screen: projects are created from their client (session 9).
- Components (`src/components/projects/`): `ProjectCard`, `ProjectCardSkeleton`, `ProjectDetailCard`,
  `ProjectStatusSheet` (on the shared `StatusSheet`), `ProjectEditForm`.
- `ClientProjectPreviewCard` now formats the budget with `formatAmount`, like every other amount in the app.

### Decisions

- **Amounts** use `formatAmount` (`Intl.NumberFormat("en-IN")`, so `₹2,50,000`) instead of `toLocaleString`, in one
  place. If Hermes on the device prints plain digits, only `src/lib/format.ts` changes.
- **The detail card is the timeline's header**, with the four add buttons and Delete, as on the lead screen. A status
  change reloads the project and the timeline, so the 2510 row appears at once. At Closed the status is a plain badge.
- **Delete** shows only for `[10, 15, 60, 45, 70]`, the DELETE route's roles (the web shows it to everyone). The toast
  is the server's message, with the web's "Projects deleted successfully" as the fallback. Afterwards
  `popTo("ProjectsList")`.
- **Edit** shows the client as a read-only row ("Acme Pvt • Acme") and sends its id back unchanged, so no id is typed.
  The body is the web's: `{ clientId, title, description?, serviceType?, status, companyName?, budget? }`. An empty
  title shows "Client ID and project title are required". The Edit button uses the web's `[10, 15, 60, 45, 70]`,
  narrowed by `canOpen("ProjectEdit")` (`[10, 45, 60, 70]`), so role 15 sees no button that leads to AccessDenied.
- **Service and status selects** use the session 3 `SelectSheet` (the prompt names `@react-native-picker/picker`; the
  sheet matches every other select in the app and was the follow-up's fallback). Option labels are the web's.
- **A deleted client** shows "Deleted client" and "N/A" on the card, the detail card and the edit form.
- **The card** shows the description on two lines and the budget on its own row only when it is set and above 0.
- **The filter sheet** shows all eight statuses as chips in its scroll view.

### What was verified

- `__tests__/projects.test.tsx` (11 tests, the whole app): the card fields (client, company, title, status, Indian
  budget, service label, Created by); the deleted-client fallback; all eight statuses in the filter sheet and
  `status=150` from page 1; AccessDenied on a 403; the detail card above "No interactions yet", and the client row
  opening the client; the status flow (empty remarks refused with no request, one PATCH, the new pill and the 2510 row);
  a plain badge at Closed; a note at entityType 2; Delete for role 70 through the Alert, and neither Delete nor Edit
  for role 50; an edit with the read-only client row sending the web's body and showing the new title and budget; an
  empty title refused with no request.
- The client test for "Create New Project" now lands on the real project screen.
- `npm test`: 27 suites, 280 tests. `npx tsc --noEmit`, `npm run lint` and Prettier pass. The bundle builds, the new
  classes are compiled, and `hermesc` compiles it. Every source file is under 250 lines.

### Device checklist

- [ ] The Projects tab lists 10 cards and appends on scroll with the footer skeleton.
- [ ] Each card shows client, company, title, status, two description lines, the budget and "Created by".
- [ ] The filter sheet shows all eight statuses; "In Progress" shows only 150 projects and the count matches.
- [ ] A card opens the workspace with the detail card above the timeline.
- [ ] A status change with remarks shows the new 2510 row at once; empty remarks send nothing.
- [ ] A Closed project shows a plain badge.
- [ ] A note from the workspace appears in the timeline.
- [ ] The client row opens the client.
- [ ] Edit shows the client read-only and saves a new title and budget; the list and the workspace show them.
- [ ] Amounts show Indian grouping (`₹2,50,000`) under Hermes, not plain digits.

## Session 11 — lead sources list and Today

**Status: done, except the device checks.** The Calls tab now opens the lead sources list. It is built and tested
inside the whole app against a mocked API. Real data needs the session 4 backend patch; the cloud container has no
Android SDK. No new package.

### What is in it

- Screen: `src/screens/leadSources/LeadSourcesScreen.tsx`, registered as `LeadSources` in `CallsStack`. The detail
  and uploads screens stay placeholders until sessions 12 and 13.
- Hooks: `useLeadSourceList` (filters, rows, counts, progress, paging, the request id, the quiet reloads, the 900 ms
  re-sort) and `useAssignees` (+ `roleLabel`).
- Components (`src/components/leadSources/`): `LeadSourcesHeader`, `ViewTabs`, `LeadSourceFilters`, `AssigneeSelect`,
  `LeadSourceRow` (+ skeleton), `StatusMenuSheet` (+ `StatusBadgeButton`), `CallbackPicker`, `NoteBox`, `CallButton`,
  `BulkBar`, `DayChoice`, `LeadSourcesEmpty`, `rowLayout.ts`, `listItems.ts`, and `bulk/` with the Status, Assign,
  Day and Delete sheets on one `useBulkSave`.
- Libs: `src/lib/dialer.ts` (`startCall`, a toast with a Copy action for now), `src/lib/leadSourceBulk.ts` (`runBulk`,
  `reportBulkResult`, `BULK_MAX`), `src/lib/pickDateTime.ts` (the Android date-then-time dialogs, shared with
  `DateTimeField`).

### Decisions

- **Sections without a SectionList.** On Today the rows are flattened into section and row items, exactly where the
  web draws a header. `stickyHeaderIndices` gets each header's data index + 1, because the list header is item 0.
  `getItemLayout` adds the measured list-header height to each item's offset.
- **Two row heights, not one.** A row is 64 dp, or 88 dp when it has a callback chip or a day chip. Both come from the
  data, so `getItemLayout` still needs no measuring. One fixed height could not hold the chips on a phone.
- **Infinite scroll instead of pages.** Scrolling appends page n + 1. A quiet reload re-reads page 1 with
  `limit = rows on screen` (50 to 100, the route's cap), so the rows already scrolled to stay.
- **The quiet reload** runs every 60 s while `AppState.currentState === "active"`, at once on background → active,
  and on a later focus of the tab. It skips while a sheet is open, rows are selected or `menusOpen > 0`. The 900 ms
  re-sort after a write runs even then, as on the web. `today` is worked out at each request.
- **One status sheet for the screen**, not one per row. A row calls `onOpenStatus(row, status)`; the callback chip
  opens it on Call Back. A 409 keeps the sheet open with the note, shows the server's message and reloads the list.
- **The bulk bar** sits 16 dp above the tab bar. The prompt's `useBottomTabBarHeight() + insets.bottom` would count
  the gesture inset twice (session 1 finding). As on the web at phone width, its buttons show icons only, each with
  its label for screen readers.
- **"Show them"** shows when the view is not Today. With infinite scroll there is no page 2 to jump back from, so it
  also scrolls to the top.
- **The "Upload sheet" button** waits for session 13, which adds the `LeadSourceUpload` route. The "Uploads" row in
  the manager filters opens the `LeadSourceUploads` placeholder now.
- **The one-day filter and "Other day"** use the session 6 `DateField`. With no day chosen it shows today muted.
- **Callback preset pills** are 36 dp tall with a 4 dp `hitSlop`, so the touch target is 44 dp.

### What was verified

- `__tests__/leadSources.test.tsx` (11 tests, the whole app): the first request is
  `view=today&today=2026-10-06&page=1&limit=50`; the three section titles, the sticky indices `[1, 3, 6]`, the tab
  counts, "3 of 10 for today called", "1 callback is due." and "Unknown" for code 60; no filters, no assignee chips
  and no Assign / Day / Delete for role 60; the filters, people from `/assignees`, `assignee=none` and all four bulk
  buttons for role 10; a status save sending `{ status, note, today }`, the badge changing at once, the toast, and one
  reload 900 ms later; Call Back keeping Save disabled with "Pick when to call back." until "2 hours" is picked, then
  `callbackAt` two hours ahead and a `callbackDay` that matches it; a 409 keeping the sheet and the note, with the
  message and a reload; the 60 s poll firing once, not while a sheet is open or rows are selected, and once on
  background → active; a bulk Status on three rows sending the web's body and toasting
  "1 lead source marked Not Reached. 1 already set. 1 skipped."; a new tab going back to page 1 and clearing the
  selection; "Show them"; the Today and filtered empty states; AccessDenied with the server's message on a 403.
- `src/components/leadSources/__tests__/leadSourceList.test.ts` (10 tests): the query string and its order, the
  one-day view, the bulk report text, the 200-id limit, the day chip rules, the row heights, the section flattening
  and offsets, and `resolveChoice`.
- `npm test`: 29 suites, 301 tests. `npx tsc --noEmit`, `npm run lint` and Prettier pass. The bundle builds, the new
  classes are compiled, and `hermesc` compiles it. Every source file is under 250 lines.

### Device checklist

- [ ] The Calls tab opens the list on the dev API; Today shows up to 50 rows and appends the next page on scroll.
- [ ] The section headers stick while scrolling, and rows do not jump (check `getItemLayout` against real heights).
- [ ] The tab counts match `counts`; a tab or status change goes back to the top of page 1.
- [ ] A status save changes the badge at once; about a second later the row moves and the counts change.
- [ ] Call Back with "2 hours" shows a violet chip; it turns amber inside 15 minutes, then rose with a rose left edge.
- [ ] "or at" opens the date dialog, then the time dialog, on RN 0.87.
- [ ] Backgrounding for two minutes and returning refetches once; no poll fires while a sheet is open or rows are
      selected (Metro network log).
- [ ] Long-press selects, a tap toggles, the X clears; the bulk bar clears the tab bar and the gesture bar.
- [ ] A role-60 account sees no filters, avatars or Assign / Day / Delete; a role-10 account sees them all.

## Session 12 — lead sources dialing, detail, convert

**Status: done, except the device checks.** The call button now opens the phone's dialer, and the lead source detail
screen works end to end in the whole-app tests against a mocked API. Real data needs the session 4 backend patch; the
cloud container has no Android SDK. No new package.

### What is in it

- `src/lib/contact.ts`: `startCall` (`tel:` through `Linking.openURL`, and the web's toast with "Copy number" only
  when no dialer opens), `openWhatsApp` (`https://wa.me/<digits>?text=`, nothing for an invalid number) and
  `openEmail` (`mailto:`). `src/lib/dialer.ts` re-exports `startCall`, so session 11's imports are unchanged.
- `AndroidManifest.xml`: a `<queries>` block inside `<manifest>` for DIAL + `tel`, VIEW + `https`, SENDTO + `mailto`,
  `com.whatsapp` and `com.whatsapp.w4b`. The `mailto` intent is one more than the prompt lists; without it Android 11+
  may not see the mail app.
- `src/components/ui/ContactRow.tsx`: the tappable phone (WhatsApp green, grey for an invalid number) or email (blue,
  Mail icon) line. `WhatsAppLink` now renders it. The email lines on the lead detail card and both client cards use it.
- Screen: `src/screens/leadSources/LeadSourceDetailScreen.tsx` (route param `sourceId`), on `useDetailQuery`.
- Components (`src/components/leadSources/`): `LeadSourceHeaderCard`, `CallbackButton`, `CallbackSheet`
  (`PATCH /:id/callback` set / change / clear), `AddNote`, `ImportNotes`, `SheetData`, `ActivityTimeline`,
  `ConvertSheet`. `StatusBadgeButton` and `CallButton` take `size="md"`.
- `src/constants/leadSourceColumns.ts`: key, label and kind from the web's `src/config/leadSourceSheet.ts`.
- Navigation: `LeadSourceDetail` takes `{ sourceId }` (deep link `lead-sources/:sourceId`). `LeadSourceUpload` and
  `LeadSourceReport { uploadId }` are registered as placeholders, with MANAGE roles, so the detail screen's file line
  can link to the report now. Session 13 builds them.

### Decisions

- **The row's clock chip** now opens `CallbackSheet`, as the web's chip opens its CallbackMenu. Session 11 opened the
  status sheet on Call Back as a stand-in. The sheet also pauses the list's quiet reload.
- **NoteBox stays the plain box** (session 11's status sheet uses it). `AddNote` wraps it with the web NoteBox's
  `POST /:id/notes`, the "What did you learn on the call?" placeholder and the "Add note" button.
- **Convert** lands on the lead through `openLead(leadId, role)`, in the Leads tab. The source reloads behind it, so
  going back to the Calls tab shows it converted. A failure toasts the server's message and closes the sheet.
- **Delete** goes back with `popTo("LeadSources")`; the list reloads on focus. Assign and Set day reload the source.
- **The activity sentences** are the web's words. A status change is a wrapping row of words and pills, because a
  pill cannot sit inside a `<Text>` on Android. `TimeAgo` follows the sentence.
- **The source file line** links to the report only for managers, as on the web.

### What was verified

- `__tests__/leadSourceDetail.test.tsx` (10 tests, the whole app): every card's content (header, list info, status,
  phone, email, assignee, "Sun 4 Oct" with "left over", "leads.xlsx, row 7", upload warnings, sheet values with a date
  as "3 Apr 2021" and an "(extra column)", the activity); call → `tel:+919876543210`, WhatsApp →
  `https://wa.me/919876543210?text=`, email → `mailto:`; a note posting `{ text }` trimmed, clearing the box, "Note
  added" and a reload; a callback set from "1 hour" with today's `callbackDay`, then cleared with `{ callbackAt: null }`
  and "Callback cleared"; Assign / Set day / Delete for a manager, and Delete posting `{ action, ids: ["s1"], today }`
  and returning to the list; no manager row for role 60 and no Convert for role 65; convert posting to `/convert`,
  "Lead created" and the lead screen; a 409 toasting the server's message and closing the sheet; the converted banner,
  the locked "Converted to a lead" badge and no call, callback or note; the not-found card on a 404.
- `src/lib/__tests__/contact.test.ts` (4) and `src/components/leadSources/__tests__/SheetData.test.tsx` (2). The
  list test opens the callback sheet from a row's chip; the lead and client tests tap the email line.
- `npm test`: 32 suites, 319 tests. `npx tsc --noEmit`, `npm run lint` and Prettier pass. The bundle builds, and
  `hermesc` compiles it. Every source file is under 250 lines.

### Open question: do-not-call

One-tap dialing now exists. The status list still has no distinct "Do not call": it is folded into Not Interested.
Under TCPA-style rules a number that asked not to be called must never be dialed again. Whether to add a DNC status
(and block the call button for it) is a backend decision. Nothing on the phone changes until the web adds it.

**Decided after session 15:** the phone disables calling for Not Interested (50), the status whose definition covers
"do not call". The button turns grey with a crossed-out phone (`PhoneOff`), reads "Do not call" on the detail screen,
and does nothing when pressed. `isCallBlocked(status)` in `src/lib/dialer.ts` holds the one list; a real do-not-call
code from the backend goes there. Changing the status back re-enables the button.

### Device checklist

- [ ] The call button on a list row and on the detail screen opens the dialer with the number filled in.
- [ ] The WhatsApp line opens a chat when WhatsApp is installed, and the browser when it is not.
- [ ] The email line on the lead source, lead and client screens opens the mail app.
- [ ] A source with sheet data and several activity entries shows all seven cards, with no clipped text at 360 dp.
- [ ] A note saves, clears, toasts "Note added" and appears in the activity.
- [ ] Set callback, Change time and Clear callback all work from the header button and from a row's chip.
- [ ] A manager can Assign, Set day and Delete; Delete returns to the list and the row is gone.
- [ ] Convert creates the lead and opens it; the source then shows the blue banner with the controls hidden.
- [ ] Converting an already converted source toasts the server's 409 message.
- [ ] A source assigned to someone else shows "Lead source not found".

## Session 13 — lead sources uploads and reports

**Status: done, except the device checks.** The three upload screens are built and tested inside the whole app against
a mocked API, with the document picker and react-native-blob-util mocked. Real data needs the session 4 backend patch;
the cloud container has no Android SDK. No new package.

### What is in it

- Screens (`src/screens/leadSources/`): `LeadSourceUploadScreen`, `LeadSourceUploadsScreen`, `LeadSourceReportScreen`,
  registered in `CallsStack` (the session 12 placeholders are gone).
- Components (`src/components/leadSources/`): `FilePickRow`, `SheetHeaderChips`, `UploadProblem`, `UploadSummaryRow`
  (+ skeleton), `ReportHeaderCard`, `ReportRows` (the FlatList with the chips and search), `ReportRowCard`,
  `ListSectionHeader` (moved out of the list screen to keep it under 250 lines).
- Libs: `src/lib/leadSourceUpload.ts` (`sizeText`, `getSheetRejection`, `pickSheetFile`, `uploadSheet`) and
  `src/lib/downloadFile.ts` (`downloadXlsx`).
- `src/hooks/useSheetColumns.ts` and `src/constants/leadSourceSheet.ts` (the 5 MB / 5,000-row fallback).
- `src/api/client.ts` exports `readApiResult` (the 401 and ApiError rules) and `getApiHeaders`, so the blob-util
  upload and downloads behave like every other request. `request()` now uses `readApiResult` itself.
- `src/api/endpoints.ts`: `LEAD_SOURCE_UPLOADS_API`, `LEAD_SOURCE_TEMPLATE_API`, `LEAD_SOURCE_COLUMNS_API`.
- `ListScreen` takes `isSearchable={false}` for a route with no search (the uploads list).
- The list screen: an "Upload sheet" button for managers, and `LeadSources` route params `{ view, upload }`.
- `docs/BACKEND_CHANGES.md` item 6: `GET /lead-sources/columns`.

### Decisions

- **The picked file is copied first.** `keepLocalCopy({ destination: "cachesDirectory" })` turns the `content://` uri
  into a plain cache path before the upload, so the grant cannot expire mid-upload. Nothing is parsed on the phone.
- **The local checks** use the server's words: an `.xls` (or any other type) → "Choose an .xlsx or a .csv file. For an
  old .xls file, save it as .xlsx first."; 0 bytes → "The file is empty."; over the limit → "The file is larger than
  5 MB. Split it into smaller files." No request is sent.
- **The upload sends `Content-Type: multipart/form-data`.** The prompt says no Content-Type, which is right for
  `fetch`. blob-util is different: it builds a multipart body only when this header says so, and writes the boundary
  into it itself (its README requires the header).
- **The back block** uses a ref inside one `beforeRemove` listener, not the state. With the state, the replace to the
  report straight after the upload would be blocked by the listener from the render before.
- **The header chips** come from `GET /lead-sources/columns`. The dev API has no such route, so the screen shows
  "Download the template to see the expected header row." until item 6 ships.
- **Downloads** save into the cache directory under the web's file names (`lead-source-template.xlsx`,
  `<file>-report.xlsx`, `<file>-report-skipped.xlsx`) and open with `actionViewIntent`. A refusal reads the JSON the
  server wrote into the file, deletes it, and toasts the message. With no app for .xlsx, a toast gives the saved path.
- **Report rows** are cards in one FlatList with the header card on top: 50 at a time on scroll, the four chips, and a
  search over the row number, the cells and the messages. A tap expands a card to every non-empty cell. A card with a
  `sourceId` has an "Open this lead source" link, because the tap is taken by the expansion.
- **"Open the N imported sources"** goes back to the list with `popTo("LeadSources", { view: "all", upload })`. The
  list replaces its filters and search with those, as the web's link does, then clears the params, so the same link
  works again later.

### What was verified

- `__tests__/leadSourceUploads.test.tsx` (9 tests, the whole app): the upload from the list's "Upload sheet" button
  (the template fallback line, the picked file's name and "3 KB", "Checking and importing...", "50%", the stay line,
  back blocked mid-upload, "3 imported." and the report screen); an `.xls` refused with no request; a 400 showing the
  message, "name, mobile no" and the "Nothing was saved" line with the file still picked; the uploads list with the
  counters and a Failed chip; the report tiles, file notes, missing-columns line and the skipped-rows download path and
  URL; no "Skipped rows only" at 0 skipped; 50 row cards, then 60 on scroll, the Skipped / With warnings / All chips, a
  search for "pune", and a card opening its source; "Open the 57 imported sources" asking for `view=all&…&upload=up1`
  and showing "Showing one upload only."; no entry points and AccessDenied for role 60.
- `src/lib/__tests__/leadSourceUpload.test.ts` (8 tests): sizes, the refusals, the cache copy and its path, the
  multipart parts and headers with progress, the ApiError with `details`, the download path and headers with the
  Android viewer, and a refused download toasting the server's message.
- `npm test`: 34 suites, 336 tests. `npx tsc --noEmit`, `npm run lint` and Prettier pass. The bundle builds, the new
  classes are compiled, and `hermesc` compiles it. Every source file is under 250 lines.

### Device checklist

- [ ] The Uploads screen lists real uploads with region badges, counters and TimeAgo.
- [ ] "Download template" saves `lead-source-template.xlsx` and opens it as a real workbook (not a JSON body).
- [ ] Choosing a file shows its real name and size; the X clears it; an `.xls` or an over-5 MB file is refused.
- [ ] A 3-row sheet uploads with a bar that reaches 100%, toasts "3 imported." and lands on the report.
- [ ] The back button does nothing during the upload and works again after it.
- [ ] A sheet missing a required column shows the rose card with the headers found; the file stays picked.
- [ ] The report's four tiles match the web for the same upload, with the file notes and the missing-columns line.
- [ ] The row cards page past 50; the chips and search narrow them; "Open this lead source" opens it.
- [ ] "Skipped rows only" appears only when rows were skipped and opens a workbook with just those rows.
- [ ] "Open the N imported sources" shows the list filtered by that upload, and the count matches.
- [ ] A role-60 account sees no "Upload sheet" or "Uploads", and AccessDenied on the three screens.

## Session 14 — meetings module

**Status: done, except the device checks.** More → Meetings opens the meetings list, built and tested inside the
whole app against a mocked API. Real data needs the session 4 backend patch; the cloud container has no Android SDK.
No new package.

### What is in it

- Screen: `src/screens/meetings/MeetingsListScreen.tsx` on `useListQuery` + `ListScreen` (10 a page), registered as
  `Meetings` in `MoreStack`. The `moreItems.ts` role list is unchanged.
- Components (`src/components/meetings/`): `MeetingCard` (+ the `MeetingListItem` type with the route's `entity`),
  `MeetingCardSkeleton`, `MeetingFilters`, `MeetingActions`, `RescheduleSheet`, `CompleteSheet`, `RescheduleHistory`,
  `MeetingOutcome`, `PulseDot`, `meetingIcons.ts` (`getMeetingIcon`).
- `src/lib/meetingTemporal.ts`: `getMeetingTemporalStatus`, ported from the web's utils.
- `useListQuery` carries `range` and `entityType` as filters (sent after `status`, in the web's order), and reads
  `totalPages ?? pages`. `MEETINGS_API` moved into `src/api/endpoints.ts`; the schedule-meeting form uses it too.

### Decisions

- **Filters sit in the list header**, not in the session 6 filter sheet: status and entity are `SelectSheet`s, the four
  ranges a chip row, and "Clear filters" shows when any is set. Every change goes back to page 1. The entity select
  lists every `ENTITY_TYPE_META` entry, as the web does, although only Lead, Client and Project ever hold a meeting.
- **Icons** come from an explicit map of the `icon` names in `MEETING_STATUS_META` (Calendar fallback), in place of the
  web's dynamic lookup.
- **The entity row** opens the lead, client or project in its own tab through `openLead` / `openClient` /
  `openProject`. The web's `entityHref` builds `/admin//operations/...` with a double slash.
- **Cancel asks first** with an `Alert` ("Cancel this meeting?"). The web cancels on one click.
- **Writes refetch, never flip state locally.** Reschedule and Completed close their sheet and refresh after a save.
  A 409 ("Meeting is already closed", "Cannot reschedule a closed meeting") toasts the server's message, closes the
  sheet and refreshes; other refusals keep the sheet open with the typed text. Cancel refreshes after any answer.
- **The pulsing dot** is an `Animated` loop (scale 1→2, opacity 0.75→0, one second), the web's `animate-ping`.
- **Join and Copy** reuse the session 8 `MeetingLinkButton`, shown for an online meeting still 2010 / 2020.

### Backend notes (not changed)

- `GET /api/admin/operations/meetings` checks only `requireAuth`, not a role list. The phone gates the screen with
  the More item's roles, as the web's menu does; any signed-in user could still call the route.
- The reschedule route accepts any future time, with no upper bound.

### What was verified

- `__tests__/meetings.test.tsx` (8 tests, the whole app): the first request `?page=1&limit=10`; the badges ("Meeting
  Rescheduled" + "Today", "Meeting Scheduled" + "Past", "Meeting Completed"), the entity title, attendee chips, agenda,
  the history block with "(1)", the old date struck through and the reason, the outcome block, and the orange dot;
  status, range and entity filters each sending page 1 in the web's order, and Clear filters; reschedule refusing an
  empty reason and a past time with no request, then sending `{ scheduledAt, reason }`, toasting "Meeting
  rescheduled" and reloading; Completed offered only on the past meeting, refusing an empty outcome, then sending
  `{ status: 2050, outcome }`; Cancel asking first, sending `{ status: 2030 }`, and a 409 toast with a reload; Join
  opening the Meet link, scrolling to page 2, and the entity row opening the lead; no actions for role 50; AccessDenied
  on a 403.
- `src/lib/__tests__/meetingTemporal.test.ts` (4 tests): TODAY / UPCOMING / PAST at the day edges and the icon map.
- `npm test`: 36 suites, 347 tests. `npx tsc --noEmit`, `npm run lint` and Prettier pass. The bundle builds, the new
  classes are compiled, and `hermesc` compiles it. Every source file is under 250 lines.

### Device checklist

- [ ] More → Meetings opens the list; 10 cards newest first; scrolling appends page 2.
- [ ] 5 skeleton cards on first load; pull-to-refresh reloads page 1.
- [ ] A meeting today shows the green "Today" badge and a pulsing dot; a rescheduled one the orange dot and history.
- [ ] Status "Meeting Completed" shows only 2050 rows; range "Upcoming" only future ones; the count matches.
- [ ] Clear filters restores the first page.
- [ ] Reschedule with a future time and a reason updates the card (new time, 2020 badge, new history row).
- [ ] An empty reason and a past time are refused with the web's messages.
- [ ] Completed on a past meeting shows the green border and the Outcome block; it is not offered on a future one.
- [ ] Cancel asks first, then shows the red border.
- [ ] A second attempt on a closed meeting toasts the 409 message and refreshes.
- [ ] Join opens the Meet link; Copy puts it on the clipboard.
- [ ] The entity row opens that lead, client or project.
- [ ] A role outside `[10, 15, 60, 65, 69, 45, 70]` sees no Reschedule, Cancel or Completed.

## Session 15 — notifications

**Status: done, except the device checks.** The header bell and the inbox are built and tested inside the whole app
against a mocked API. Real data needs the session 4 backend patch; the cloud container has no Android SDK. No new
package.

### What is in it

- `src/types/notification.ts`: `NotificationRow` and `NotificationFeed` (app-local; the web has no shared type).
- `src/api/endpoints.ts`: `NOTIFICATIONS_API` (`FEED`, `READ_ALL`, `SEEN`, `read(id)`).
- `src/hooks/useNotificationFeed.ts`: cursor pages of 15 (`limit=15`, `before=<cursor>`, `unread=true`), append on
  scroll, replace on a new filter or pull-to-refresh, `markOneRead`, `markAllRead`.
- `src/screens/notifications/NotificationsScreen.tsx`, registered as `Notifications` in `MoreStack`.
- `src/components/notifications/NotificationRow.tsx` (three states, `Swipeable` right action, Check button) and
  `HeaderBell.tsx`.
- `src/contexts/NotificationContext.tsx`: `NotificationProvider` around the tab navigator, and `useNotifications`
  (`unseen`, `unread`, the 4 newest `rows`, `refreshBadge`, `markSeen`).
- `src/navigation/stackOptions.ts`: every tab stack's header shows the bell on the right.

### Decisions

- **The badge icon** is the session 3 `src/components/ui/NotificationBadge.tsx`, already a verbatim port of the web's
  `BADGE_MAP` and `EMOJI_TO_NAME` with the same sizes. No second copy was made.
- **TimeAgo** stays the session 3 component: a press shows the full `DD/MM/YYYY hh:mm A`. The prompt says long-press;
  changing it here would change every screen that uses it.
- **The poll** is a `setTimeout` chain, not an interval: 30 s, or 60 s when NetInfo reports `cellular` and the last poll
  found the same counts and the same newest row. It schedules only while `AppState.currentState === "active"`, stops
  on any change away from active, and fetches at once on the change back. It lives in the tab navigator, so it runs
  only while signed in, and stops on logout or a region switch remount.
- **Seen**: the bell zeroes `unseen` and sends `PATCH /seen` when it has a count, then opens the inbox. The inbox sends
  `PATCH /seen` once per mount behind `seenFiredRef`, as the web's page does. Opened from the bell, that is two calls,
  as on the web (dropdown, then page).
- **Mark one read** does nothing for a row already read. The web's page lowers the count even then, when a read row
  with a url is clicked.
- **A tap** marks the row read, then opens its lead, client or project through `resolveNotificationPath` and
  `openRecord` (a role without that tab gets the web's 403 toast). A row with no matching url is only marked read.
- **Row tints are opaque** (`bg-blue-50`, `bg-amber-50`) where the web uses `/60` and `/40`: behind a swiped row sits
  the blue action, which would show through a see-through tint.
- **Mark all read** keeps the web's toasts with the fixed id `notifications-read-all`, so a second tap replaces the
  toast instead of stacking a new one. The 401 toast already uses its own fixed id (`auth-401`).
- Two App tests read fetch calls by position; the bell's poll shifted them, so they now find calls by URL.

### What was verified

- `__tests__/notifications.test.tsx` (9 tests, the whole app): the bell shows "9+" for 12 unseen on a tab, and a tap
  clears it, sends `PATCH /seen` and opens the inbox; the poll fires every 30 s, never while backgrounded (two minutes
  with no request), and once at once on return; on mobile data an unchanged feed waits 60 s; the inbox loads 15 rows
  with "New" on the fresh row, "2 unread", the 30-day line, a swipe action on the two unread rows only, and one
  `PATCH /seen`; scrolling appends to 28 rows with no repeated id and stops at `nextCursor: null`; Unread replaces the
  list and All brings it back; a tap marks a lead row read and opens the lead; the Check button and a swipe each mark
  one row read with no refetch; Mark all read sends one PATCH, toasts with the fixed id, and clears the pill.
- `npm test`: 37 suites, 356 tests. `npx tsc --noEmit`, `npm run lint` and Prettier pass. The bundle builds, the new
  classes are compiled, and `hermesc` compiles it. Every source file is under 250 lines.

### Device checklist

- [ ] The inbox loads 15 rows and appends the next 15 on scroll, stopping at the end with no repeated row.
- [ ] Fresh rows show the blue edge and "New"; seen-but-unread rows amber; read rows plain.
- [ ] Unread shows only unread rows; All replaces the list from the top.
- [ ] A lead, a client and a project row each open their detail screen and turn read.
- [ ] A swipe left reveals "Mark read" and the row turns plain (legacy `Swipeable` on RN 0.87 New Architecture).
- [ ] Mark all read clears every bold row with one toast; two taps do not stack two toasts.
- [ ] The bell shows the unseen count on every tab, and opening the inbox clears it.
- [ ] Home button, then back into the app: exactly one immediate fetch, and no poll while in the background.

## Session 16 — users module

**Status: done, except the device checks.** The Users tab, the create form and the edit form are built and tested
inside the whole app against a mocked API, with the image picker mocked. Real data needs the session 4 backend patch;
the cloud container has no Android SDK. No new package.

### What is in it

- Screens (`src/screens/users/`): `UsersListScreen`, `UserCreateScreen`, `UserEditScreen`, registered in `UsersStack`.
- Components (`src/components/users/`): `UserCard` (+ `UserListItem`), `UserCardSkeleton`, `UserForm`, `RegionSelect`,
  `AvatarField`.
- `src/lib/userDiff.ts`: `getUserFormEntries` (the web's create fields and edit diff) and `buildUserFormData`.
- `src/lib/pickAvatar.ts`: `pickAvatarImage`, `getAvatarRejection`, `formatSize`. In `src/lib/` because session 17's
  profile avatar uses it too.
- `jest/setup.js` mocks `react-native-image-picker`.
- The App test that opened a placeholder now opens the real lead source detail screen with its params, since the
  placeholders are going away.

### Decisions

- **RegionBadge** already existed (`src/components/region/RegionBadges.tsx`, session 4); it is reused.
- **UserPickerSheet is not built.** Session 8's `AttendeePickerScreen` already lists `GET /users/picker` with a search
  for the meeting form. A second picker would be unused.
- **The edit pencil** is a 44 dp button in the card's header, shown when `canOpen("UserEdit", role)` (10, 20). The
  create button and the floating button show for `canOpen("UserCreate", role)` (10, 20, 69), the web's own list.
- **The card's avatar** falls back to the first letter of the name, as on the web, not the generic person icon.
- **The edit diff** is the web's, kept exactly: regions go only when the sorted set changed. An empty diff toasts
  "Nothing changed yet" with no request.
- **Create asks first** ("Create this account? The password is emailed to them."). The server does email the
  password (`sendRegistrationMail`). The toast chain runs on one id: "Creating user..." → "<name> has been created"
  with the email, or "Failed to create user" with the reason.
- **"Email already exists"** comes back as a 409 with no `field`, so the screen routes it to the email box. Other errors
  with a `field` go under that field. A 403 ("You cannot change your own role") is a toast; the form stays.
- **Client checks** are the ones the browser does on the web: empty name or email → "Please fill out this field.";
  a password under 6 characters (or none on create) → the server's "Password must be at least 6 characters"; no region
  → "Pick at least one region".
- **The avatar** is checked in the app with the server's words: "Invalid file type" (not JPEG or PNG) and "File too
  large (max 5MB)". The MIME type falls back to the file extension when the picker gives none.
- Known gap, unchanged: `GET /users` allows role 15, which `permissions.ts` does not list, and role 45 is listed but
  the API refuses it with a 403 (shown as AccessDenied).

### What was verified

- `__tests__/users.test.tsx` (9 tests, the whole app): the list request `?page=1&limit=10`, "2 users found", the
  Active / Inactive pills, "Disabled", the red "No region", "No login yet", "Created by", the pencil and both create
  entry points; no pencil and AccessDenied on the edit screen for role 69; a create with a region and a JPEG avatar
  sending the web's parts in order, after the confirm, with the success toast and the list again; "Pick at least one
  region" with no dialog, then "Email already exists" on the field; a 6 MB image and a GIF refused in the app; a
  single-region manager with US preselected and IN / AE disabled; "Nothing changed yet" with no PATCH; your own
  account with the locked regions line, sending only `name`; the could-not-load card and "Back to users".
- `__tests__/userDiff.test.ts` (7 tests): the edit diff and the create fields.
- `npm test`: 39 suites, 374 tests. `npx tsc --noEmit`, `npm run lint` and Prettier pass. The bundle builds, the new
  classes are compiled, and `hermesc` compiles it. Every source file is under 250 lines.

### Device checklist

- [ ] The Users tab lists users, appends on scroll and refreshes on pull; a 2-character search goes back to page 1.
- [ ] An inactive user's card is dimmed with "Inactive" and "Disabled", and real region badges.
- [ ] The floating button clears the tab bar at 360 dp and is absent outside roles 10, 20, 69.
- [ ] Creating a user with a JPEG avatar from the gallery works, and the new row appears.
- [ ] A duplicate email shows "Email already exists" and creates nothing.
- [ ] A 6 MB image or a non-JPEG/PNG file is refused with no request.
- [ ] Saving an untouched edit shows "Nothing changed yet" with no request (Metro network log).
- [ ] Editing only your own name sends `name` and no `regions`; your regions row is locked with the web's text.
- [ ] A region the edited account holds that you cannot grant is ticked, locked and not removable.
- [ ] The image picker returns `type` and `fileSize` on Android 13+ (the photo picker); if not, the extension
      fallback covers the type.

## Session 17 — profile

**Status: done, except the device checks.** Profile and Edit profile are built and tested inside the whole app against
a mocked API, with the image picker mocked. Step 1 (the curl check of the Bearer fallback on the dev API) cannot run:
the dev API still lacks BACKEND_CHANGES rows 1–2, which these three routes depend on. No new package.

### What is in it

- Screens (`src/screens/profile/`): `ProfileScreen` and `ProfileEditScreen`, in `MoreStack` (`ProfileEdit` is new,
  deep link `profile/edit`).
- Components: `src/components/profile/` `ProfileCard` (+ `getRoleLabel`), `ProfileFacts` (+ `formatFactDate`),
  `PasswordField`, `PhotoSourceSheet`, `HeaderAvatar`; `src/components/activityLog/` `MyActivityList` and a short
  `ActivityLogItem` (session 18 replaces its body).
- Types: `src/types/authProfile.ts` (copied unchanged) and `src/types/activityLog.ts` (copied from the web's
  `activityLog/types.ts`, the only place the web keeps them).
- `src/api/endpoints.ts`: `AUTH_API.PROFILE`, `PROFILE_AVATAR`, `PROFILE_PASSWORD`, and `ACTIVITY_LOGS_API`.
- `src/api/client.ts`: `SendOptions.keepSessionOn401Message`. A 401 with exactly that message is an ordinary error.
- `src/lib/pickAvatar.ts`: takes `{ source: "library" | "camera", invalidTypeMessage }`.
- Every stack header now shows the bell and the profile photo; the photo opens the web top bar's menu (Signed in,
  Profile, Edit profile, Logout).

### Decisions

- **A wrong current password keeps the session.** The password route answers "Old password is incorrect" with 401,
  which the client's global handler would treat as an expired session. The edit screen passes
  `keepSessionOn401Message: "Old password is incorrect"`; a 401 "Unauthorized" there still logs out as usual.
- **Profile layout**: one FlatList of activity rows with the profile card in the list header, so the profile scrolls
  away and pull-to-refresh reloads the profile and the first activity page together.
- **"My activity"** uses `useListQuery` with `userId=<signed-in id>` and 15 a page, appended on scroll. No filters, as on
  the web's profile page.
- **Dates** use dayjs `D MMM YYYY, h:mm A`, with "—" for null, in place of the web's `toLocaleString`.
- **The photo** comes from the camera or the gallery through a three-row sheet. JPEG and PNG up to 5 MB are checked in
  the app with this route's words ("Invalid file type (JPEG or PNG only)", "File too large (max 5MB)"). After the
  upload the profile reloads and `refreshUser()` updates the header photo.
- **No CAMERA permission is declared.** react-native-image-picker opens the camera app through an intent, which needs
  no permission; declaring CAMERA would make the intent fail until the person grants it.
- **The avatar on the profile card** is the session 3 `Avatar` inside the web's rounded emerald square, with the
  person icon when there is no photo.

### What was verified

- `__tests__/profile.test.tsx` (8 tests, the whole app): the card (name, email, "Admin", "Active"), the facts as
  "1 Sep 2026, 3:07 PM", "—" for no login, "Created by Root Admin", and "My activity" from `?page=1&limit=15&userId=u1`
  with "Created" and "Updated Status" rows; "Nothing yet."; the header menu opening Profile; the three password checks
  with the web's toasts and no request; a wrong current password toasting "Old password is incorrect" with the token
  kept and the screen still open, then a correct one sending `{ oldPassword, newPassword }`, toasting "Password updated
  successfully" and going back; each eye toggle showing only its own field; a gallery photo posting one `avatarFile`
  part, asking `/api/auth/me` again and toasting the server's message; a 6 MB camera photo and a GIF refused with no
  request.
- `npm test`: 40 suites, 382 tests. `npx tsc --noEmit`, `npm run lint` and Prettier pass. The bundle builds, the new
  classes are compiled, and `hermesc` compiles it. Every source file is under 250 lines.

### Device checklist

- [ ] With the backend patch on the dev API: `GET /api/auth/profile` with only the Bearer header returns the profile,
      and a bad token returns 401 "Unauthorized" (step 1).
- [ ] The header photo opens the menu, and Profile shows the real avatar, name, email, role and dates.
- [ ] "My activity" lists 15 rows and appends on scroll; pull-to-refresh reloads the profile and the list.
- [ ] A camera photo and a gallery JPEG both upload; the new photo shows on Profile and in the header at once.
- [ ] The camera opens on a device where the camera permission was never granted.
- [ ] A wrong current password does not log out; a correct one returns to Profile.
- [ ] The keyboard never covers "Update password".

## Session 18 — activity logs

**Status: done, except the device checks.** Activity Logs is built and tested inside the whole app against a mocked
API, and the Profile screen's "My activity" now uses the same list. Real data needs the session 4 backend patch; the
cloud container has no Android SDK. No new package.

### What is in it

- Screen: `src/screens/activityLogs/ActivityLogsScreen.tsx`, as `ActivityLogs` in `MoreStack`.
- Components (`src/components/activityLog/`): `ActivityLogList`, `ActivityLogItem` (the row shell, replacing session
  17's short one), `ActivityDiff`, `InteractionLine` (+ `InteractionDetailBlock`), `entityTarget.ts` (`ENTITY_BADGE`,
  `getEntityTarget`, `getInteractionParentTarget`, `openActivityTarget`), `ActivityLogFilterSheet`
  (+ `hasActiveFilters`), `UserPickerModal`, `FilterButton`, `RestrictedArea`. Session 17's `MyActivityList` is gone.
- Libs (`src/lib/activityLog/`): `formatActivityValue.ts` (copied, dates through dayjs `DD MMM YYYY, hh:mm A`) and
  `buildActivityParams.ts` (the web `buildQuery` rules).
- `useListQuery` takes `params`: sent after everything else in their own order, and a change goes back to page 1.

### Decisions

- **A status change shows the status's own colour** from `STATUS_META_BY_ENTITY` (the comment in that constants file
  says the activity log uses it this way). The web's diff pills are red and green with the label; every other field
  change keeps those red and green tones.
- **The filter sheet** applies each change at once, as the web's filters do. The entity picker is a wrap of chips
  ("All entities" first) rather than a second sheet, so only the user picker opens on top of the sheet. The name search
  is debounced 300 ms; the other filters fire at once. The search box is disabled while a user is chosen.
- **The profile list** has a filter button too, with entity and dates only, as the web passes `isAdmin={false}` there.
  Its empty text is now the web list's "No activity matches the current filters." (session 17 said "Nothing yet.").
- **Badges navigate** through `openActivityTarget`: Lead, Client, Project, User (to UserEdit), Lead Source and Lead
  Source Upload (to the report) open in their tab; a role without that tab or screen gets the web's 403 toast.
  Interaction, Meeting and the rest stay plain pills.
- **The admin gate** is `[10, 20]` from the auth context. Everyone else sees the Restricted-area card with an "Open my
  profile" button; no request is sent. More shows the row only to its own role list, as before.
- `ActivityHeatmap.tsx` is not ported, as the prompt says.

### What was verified

- `__tests__/activityLogs.test.tsx` (5 tests, the whole app): the first request `?page=1&limit=15`; "8 entries"; a
  status change as "New Lead" → "Contacted" with the Contacted pill in LEAD_STATUS_META's colour; a role change as
  labels; an ObjectId shortened; Created and Deleted chips; an interaction row with "Status Changed", "on", "Lead —
  Acme", the status pills and "Remarks: "; page 2 appended with the repeated row dropped; a Lead badge opening the lead
  and a Meeting badge disabled; entity Lead sending `entityType=0`, a To date sent as that day's 23:59:59.999 in ISO,
  and the user picker sending `userId` while the name search is disabled, then cleared; role 60 seeing the Restricted
  area with no request, and its button opening Profile with `userId=u2` and no user picker.
- `src/lib/activityLog/__tests__/activityLog.test.ts` (6 tests): the formatter cases from the prompt and the param
  rules. The profile test now expects the shared list.
- `npm test`: 42 suites, 393 tests. `npx tsc --noEmit`, `npm run lint` and Prettier pass. The bundle builds, the new
  classes are compiled, and `hermesc` compiles it. Every source file is under 250 lines.

### Device checklist

- [ ] More → Activity Logs shows 15 rows newest first and appends the next 15, with no repeated row.
- [ ] Status rows show coloured pills; role, ObjectId and date values read as the web shows them.
- [ ] An interaction row shows its type chip, "on Lead — <name>", and for a 2510 row the pills and the remarks.
- [ ] Lead, Client, Project and Lead Source badges open their screens; Interaction and Meeting badges do nothing.
- [ ] Entity "Lead" filters; a To date includes that day; a user disables the name search.
- [ ] A role-60 account sees the Restricted-area card, and its button opens Profile.
- [ ] Profile's "My activity" shows only that user's rows, with no user picker.

## Session 19 — dashboard and search

**Status: done, except the device checks.** The Dashboard tab is a real screen: four counters, the next four meetings
and the Lead / Client / Project feed in one list. A search icon in its header opens a global Search screen. It is
built and tested inside the whole app against a mocked API. Real data needs the session 4 backend patch; the cloud
container has no Android SDK. No new package.

### What is in it

- Screens: `src/screens/dashboard/DashboardScreen.tsx` and `SearchScreen.tsx`, as `Dashboard` and `Search` in
  `DashboardStack` (the placeholder is gone there). `DASHBOARD_SCREEN_OPTIONS` in `stackOptions.ts` puts the search
  icon before the bell and the profile menu on the Dashboard only.
- Components (`src/components/dashboard/`): `EntityCard`, `LastInteraction`, `EntityCardSkeleton`, `StatsCards`,
  `UpcomingMeetingsCard` (+ `smartDate`), `SearchResultRow`, `HeaderSearchButton`.
- Hooks: `useDashboardFeed.ts` (the feed, both paging branches) and `useRouteFilterParams.ts` (applies a list filter
  from route params once, then clears them).
- `src/lib/entityNav.ts`: `navigateToEntity`, `openTabScreen` and `hrefToScreen`. `hrefToScreen` reuses
  `resolveNotificationPath` for leads, clients and projects, and sends `/admin/operations/meetings` to Meetings.
- `src/types/search.ts` copied from the web. `endpoints.ts` gains `DASHBOARD_API`, `STATS_API` and `SEARCH_API`.
- Route params: `ClientsList` takes `{ status }` and `Meetings` takes `{ range }`. `SearchField` takes `autoFocus`.

### Decisions

- **Paging.** The hook sends `?page=<n>&limit=20`. When the reply has `pagination`, it appends the next page and drops
  a row it already has. When it has no `pagination` (the backend change has not landed), it keeps the whole array and
  shows it 20 rows at a time behind the same `loadMore`. No second request is sent in that case.
- **403.** `AccessDenied` with the API's message takes the feed's place. The counters and the meetings card stay above
  it and stay silent: a failed `/stats` shows "—", as on the web.
- **Errors.** The web's red box ("Failed to load data", the message, Retry) and its toast "Failed to load operations
  data" are kept. Retry repeats the request that failed. With rows already on screen, the box shows under them instead
  of replacing them.
- **Meetings card.** It asks for `range=upcoming&limit=20`, sorts soonest first and keeps 4, as the web does. A row
  with a lead, client or project opens it; "View all" opens Meetings on the upcoming range; "View pipeline overview"
  opens Overall stats.
- **Stat tiles** open the Leads, Clients (status 1), Projects and Meetings lists. A role without that tab gets the
  web's 403 toast.
- **Search** sends `&limit=10`, as the prompt says (the web sends no limit, so the route's default of 5 applies there).
  A hit clears the box, as the web does. An href the app does not know is logged and ignored. A short query also
  drops any answer still on its way, so old results never come back after the box is cleared.
- **Bottom padding.** The feed uses the same `p-4` as every other list. The session 1 finding applies: a tab screen
  already ends at the tab bar, so `useBottomTabBarHeight() + insets.bottom` would count the inset twice.
- **Older tests.** The Dashboard now fetches on app start, so four suites look for calls by URL and for lists inside
  their own screen. No behaviour changed.

### What was verified

- `__tests__/dashboard.test.tsx` (14 tests, the whole app): lead, client and project cards with phone, email, source,
  company and description; a 2510 row as "Status Changed" with "New Lead" → "Contacted" and the META underline; a
  2110 row with its label; each card opening its own detail screen; 25 rows shown as 20 then 25 with one request; page
  2 asked for when `pagination` is present, with the repeated row dropped; one pull re-asking for the feed, `/stats`
  and the meetings; the error box, the toast and Retry; "No data found"; role 20 seeing "Access Denied" with the API's
  message and "—" with no feed toast; the four tiles, and Active Clients opening clients with `status=1`; the meetings
  card as "Today, 3:00 PM · Acme Lead", "Tomorrow, 9:00 AM", "Fri, 2:30 PM" and "Oct 21, 11:00 AM", soonest first,
  with the fifth left out, and a row opening its lead; View all opening Meetings with `range=upcoming`; search with one
  character sending nothing, two characters sending `?search=ac&limit=10`, Leads / Clients / Meetings sections with no
  empty Projects section, and a hit opening its lead; "No results for “zz”"; the server's message on a failure.
- `npm test`: 43 suites, 407 tests. `npx tsc --noEmit`, `npm run lint` and Prettier pass. The bundle builds, the new
  classes are compiled, and `hermesc` compiles it. Every source file is under 250 lines.

### Device checklist

- [ ] The Dashboard opens on the four counters, the meetings card and the feed from the dev API.
- [ ] Lead, Client and Project cards open their detail screens in their own tabs.
- [ ] Scrolling to the end adds 20 rows; the Metro log shows one feed request per page, or one in total without
      the backend change. Record the payload size and the row count of `GET /api/admin/operations`.
- [ ] One pull reloads the feed, the counters and the meetings.
- [ ] Active Clients opens the clients list on status 1.
- [ ] The meetings card shows at most four, soonest first, and each opens its parent.
- [ ] Search: two characters show grouped hits, one character sends nothing, a hit opens its screen, no match says
      "No results for …", and a failure shows the server's message.
- [ ] A role-20 account sees Access Denied in place of the feed.
- [ ] After a region switch, the feed, the counters, the meetings and the search use the new region.
