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
