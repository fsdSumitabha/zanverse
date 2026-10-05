# ZAN Mobile (zanverse) — Project Overview

> **Read this first in every session.** It explains the app, the architecture decisions that are already made, and
> where the details live. Each session builds ONE part; this file gives you everything you need about the rest.

## 1. What we are building

A React Native app for ZAN Services staff: the same CRM the team uses on the web, shaped for a phone. The highest-value
screen is **Lead Sources** — the cold-calling list an agent works through all day, where the phone can do something the
web never could: tap a row and the dialer opens.

- **This repo (`D:\zanverse`)** — the mobile app. React Native 0.87.1, React 19.2.3, TypeScript, New Architecture on.
- **The web app** — the live backend, and the read-only reference for every screen. Source:
  `github.com/fsdSumitabha/zan-workspace`, branch `main`, read locally at `reference/zan-workspace` (cloned on first
  use, gitignored). Its Next.js API routes stay exactly as they are; the mobile app is another client of them.

## 2. Platforms

| Platform | Decision |
|---|---|
| **Android** | The target. Everything ships here first. |
| **iOS** | Same `src/`, built in session 24. Needs a Mac. |
| **Windows** | **Use the existing web app.** `react-native-windows` is at 0.84 (0.85 preview) and requires RN 0.84.1, so it cannot build against 0.87. Session 24 records this decision; it is not a build. |

## 3. Architecture (already decided)

| Area | Decision |
|---|---|
| **Styling** | **NativeWind** — the web's Tailwind class strings are copied verbatim, so all `*_META` colour maps keep working. **Settled in session 1: `nativewind@4.2.7` + `tailwindcss@3.4.19`.** v5 (5.0.0-rc.0) failed: its Metro transformer is Expo's and needs the `expo` package. Do not re-open this until v5 is stable and works without Expo. Details in `prompts/README.md`. |
| **Navigation** | React Navigation 7: native-stack root (Splash → Auth → App), bottom tabs built from the web's `MobileNav` items with the same role arrays. |
| **Data** | Plain `fetch` + `useState`/`useEffect`, like the web. One `src/api/client.ts` (ported from the web's `lead-sources/api.ts` + `handleAuthError.ts`), one `useListQuery` hook for every list. No TanStack Query, no Redux. |
| **Auth** | JWT in `react-native-keychain`, sent as `Authorization: Bearer`. Needs the backend changes in `BACKEND_CHANGES.md` — **session 4 is blocked until they are on the dev API**. |
| **Region** | Active region sent as `X-Active-Region`; switching clears caches and refetches instead of the web's `location.reload()`. |
| **Forms** | Plain `useState` with the server's `{ field, message }` errors routed back to the field, exactly as the web does. `src/lib/phone.ts` (libphonenumber-js) copies across unchanged. |
| **Files** | `react-native-image-picker` (avatars), `@react-native-documents/picker` (xlsx/csv, recordings), `react-native-blob-util` (authenticated downloads). FormData over the same endpoints. |
| **Charts** | Only `overall-stats` charts. `react-native-gifted-charts` on `react-native-svg`, built last. |
| **Dialer** | `Linking.openURL("tel:…")` inside the web's existing `dialer.ts` `startCall()` — a one-function change that unlocks the whole module. |
| **Notifications** | Polling first, gated on `AppState`. Push (FCM + Notifee) is session 23 and needs backend work. |
| **Storage** | Keychain (JWT only), MMKV (cache + prefs, region-keyed, wiped on logout and region switch), blob-util cache dir (downloads). |
| **Offline** | Read-only: show cached lists, disable write buttons, no replay queue. Writes are guarded server-side and must not be replayed blindly. |

## 4. Packages (versions verified on npm, 2026-10-01)

The exact pinned versions are in `prompts/README.md`, section "Session 1 — toolchain lock".

Already installed: `react-native@0.87.1`, `react@19.2.3`, `typescript@^6.0.3`, `react-native-safe-area-context@^5.5.2`.

| Package | Version | For |
|---|---|---|
| `nativewind` + `tailwindcss` | `4.2.7` + `3.4.19` | styling (v5 + Tailwind 4 spiked in session 1 and rejected) |
| `@react-navigation/native`, `native-stack`, `bottom-tabs` | `^7` | navigation |
| `react-native-screens` | `^4.28` | navigation |
| `react-native-gesture-handler` | `^2` (2.33.0, npm tag `legacy`) | navigation, swipe actions |
| `react-native-svg` | `^15.15` | **keystone** — icons and charts both need it |
| `lucide-react-native` | `^1.49` | same icon names as the web |
| `react-native-keychain` | `^10` | the JWT, nothing else |
| `react-native-mmkv` | `^4.3` | cache and preferences (New Arch required, which is on) |
| `libphonenumber-js`, `dayjs`, `clsx` | `^1.13`, `^1.11`, `^2` | copied straight from the web |
| `react-native-toast-message` | `^2.5` | toasts (keep the web's `id` dedupe behaviour) |
| `@react-native-community/datetimepicker` | `^9.2` | dates and times |
| `@react-native-picker/picker` | `^2` | short selects; longer ones use a sheet |
| `react-native-image-picker` | `^8.2` | avatars |
| `@react-native-documents/picker` | `^12` | xlsx/csv and recordings |
| `react-native-blob-util` | `^0.25` | authenticated downloads |
| `@react-native-community/netinfo` | `^12` | offline banner |
| `@sentry/react-native` | `^7` | crash reporting |
| `react-native-gifted-charts` + `react-native-linear-gradient` | `^1.4` | session 20 only |
| `react-native-reanimated` + `react-native-worklets` + `@gorhom/bottom-sheet` | `^4.7` + `^0.13` + `^5` | Reanimated + Worklets are installed in session 1, because `nativewind/babel` loads their Babel plugin. Bottom sheet stays session 21. |

**Deliberately not used:** TanStack Query, react-hook-form, client-side zod, Redux/Zustand, react-native-windows, Skia,
react-phone-number-input (its logic already lives in `lib/phone.ts`), react-dropzone, chart.js, recharts, framer-motion.

## 5. Project structure

```
D:\zanverse\
├── CLAUDE.md                  project instructions (loads this file and the style guide)
├── prompts/                   one file per session — paste them in order
├── docs/                      this file + the reference docs in §7
└── src/
    ├── api/                   client.ts (send, sendRaw, ApiError, 401 handling), endpoints.ts, navigationRef.ts
    ├── constants/             COPIED VERBATIM from the web's src/constants (18 files)
    ├── types/                 copied from the web's src/types
    ├── lib/                   phone.ts and other pure helpers copied from the web
    ├── components/ui/         design-system primitives (Button, Card, StatusPill, Input, Sheet, Skeleton, …)
    ├── components/<module>/   module-specific components
    ├── hooks/                 useListQuery, useAuth, useRegion, …
    ├── navigation/            RootNavigator, tabs, navItems.ts
    ├── screens/<module>/      one folder per module, one file per screen
    └── store/                 keychain + mmkv wrappers
```

## 6. Modules and screens

31 web screens map to the mobile app. Four are retired: the public `/book` funnel, the marketing landing page,
`/admin/authentication/unauthorized` (becomes a component) and the standalone `projects/create` (it needs a pasted
ObjectId). Everything else ports.

| Module | Screens | Session |
|---|---|---|
| Leads | list, create, detail, edit, convert | 7 |
| Interactions / timeline | shared timeline + note, call, quotation, meeting entries | 8 |
| Clients | list, detail, edit, projects under client | 9 |
| Projects | list, detail, edit | 10 |
| Lead sources | list + Today view, detail, dialing, uploads, reports | 11–13 |
| Meetings | list, reschedule, status | 14 |
| Notifications | inbox, badge | 15 |
| Users | list, create, edit, picker | 16 |
| Profile | view, edit, avatar, password | 17 |
| Activity logs | feed, filters, heatmap | 18 |
| Dashboard + search | feed, stats panels, global search | 19 |
| Overall stats | charts | 20 |

## 7. Reference docs (read the section you need, not the whole file)

| File | What's in it |
|---|---|
| `SCREENS.md` | Every web screen: purpose, API calls, state, role gates, components, and what changes on a phone |
| `LEAD_SOURCES.md` | The cold-calling module in depth: statuses, roles, flows, screens, risks |
| `COMPONENTS.md` | All ~92 web components with their React Native approach and size |
| `CLIENT_SYSTEMS.md` | Contexts, hooks, polling, region switching, and every library with its RN replacement |
| `API_CONTRACT.md` | 69 endpoints, the auth flow, the region flow, and what a non-browser client must do differently |
| `SHARED_CODE.md` | The constants and types to copy, and the numeric code system |
| `BACKEND_CHANGES.md` | The changes required in the web repo before session 4 |

## 8. Shared code rule

`src/constants/` and `src/types/` are **copied from the web app, unchanged**. That makes every status colour and label
correct on day one — and it means two copies now exist. When a code or label changes in the web app, copy the file
again. A silent drift here makes the app and the web disagree with no error anywhere.

## 9. Session plan

Each session is one prompt file in `prompts/`, ends with a working app, and finishes when its Definition of Done is met.

| # | Session | Size | Depends on |
|---|---|---|---|
| 1 | Native spike and toolchain lock | M | — |
| 2 | Foundation A — shared core copied verbatim | M | 1 |
| 3 | Foundation B — design system primitives | M | 2 |
| 4 | Foundation C — API client, auth, region | L | 3 + backend changes deployed |
| 5 | Foundation D — navigation shell | M | 4 |
| 6 | Shared list kit | M | 5 |
| 7 | Leads module | L | 6 |
| 8 | Interactions and timeline kit | L | 7 |
| 9 | Clients module | M | 8 |
| 10 | Projects module | M | 9 |
| 11 | Lead sources A — list and Today view | L | 6 |
| 12 | Lead sources B — dialing, detail, convert | M | 11 |
| 13 | Lead sources C — sheet uploads and reports | L | 12 |
| 14 | Meetings module | M | 8 |
| 15 | Notifications | M | 5 |
| 16 | Users module | M | 6 |
| 17 | Profile | S | 16 |
| 18 | Activity logs | M | 6 |
| 19 | Dashboard feed, stats and search | M | 6 |
| 20 | Overall stats and charts | M | 19 |
| 21 | Polish — sheets, caching, offline, Sentry | M | 20 |
| 22 | Android release build | M | 21 |
| 23 | Push notifications for due callbacks | L | 22 + backend work |
| 24 | iOS build and the Windows decision | M | 22 |

## 10. Decisions still open

| Question | Recommendation |
|---|---|
| Who makes the backend auth changes, and where? | Do them in the Next.js app first (see `BACKEND_CHANGES.md`). Session 4 is blocked until they are on the dev API. |
| JWT lifetime on a phone (7 days, no refresh) | Add a refresh endpoint. An agent being logged out mid-shift is the worst case; if it slips, ship the 7-day expiry deliberately with the login screen remembering the email. |
| Call recordings from mobile | Upload to ImageKit rather than the API server, or ship call logging without an attachment first. |
| Automatic call logging on Android | Ship the manual "log this call" sheet first. Never attempt in-app call recording: Android 10+ blocks it and Play removes apps that work around it. |
| Distribution to staff | Play Store internal testing track — automatic updates, Play App Signing, no review wait. Decide before session 22. |
| Due-callback reminders | Local notification first (no backend work), real push in session 23 once the scheduled job exists. |

## 11. Top risks

1. **RN 0.87 is very new and New Architecture is mandatory.** Session 1 proves the native stack before any UI exists.
2. **`react-native-svg` is a single point of failure** — icons and charts both ride on it. Validate it first.
3. **The backend auth changes are a hard dependency**, not a nice-to-have. Nothing authenticated works without them.
4. **The dashboard feed is unpaginated** — it returns every lead, client and project with a timeline. Paginate it
   server-side, and virtualize the list regardless.
5. **Cookies may appear to work** on Android because `fetch` has a cookie jar. Do not build on that; use the Bearer token.
6. **Edge-to-edge is on** — content draws under the status and gesture bars. Floating buttons need
   `useBottomTabBarHeight() + insets.bottom`. **Session 1 finding:** `useBottomTabBarHeight()` already includes
   `insets.bottom`, and a tab screen already ends at the tab bar's top edge, so that sum counts the inset twice.
   Check the spike screen's printed numbers on a device before session 6 (see `prompts/README.md`).
7. **Constants drift** between the two copies (see §8).
8. **Release builds differ from debug** — R8 minification breaks reflection-based native modules. Test a release build
   in session 22, not at launch.
