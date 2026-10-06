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
