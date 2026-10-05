# Session 04 — Foundation C: API client, auth and region

At the end of this session you can log in on the emulator with a real staff account, stay logged in after a restart, switch region, and log out — every request carrying `Authorization: Bearer` and `X-Active-Region`.

---

Session 04 — Foundation C: API client, auth and region.

Read docs/OVERVIEW.md §3 (Data, Auth, Region, Storage), §4 (packages), §5 (structure) and §11 (risks 3 and 5), plus
docs/API_CONTRACT.md "Auth flow", "Region flow", "What a non-browser client must do differently" and "Error handling",
docs/BACKEND_CHANGES.md (all of it) and docs/CLIENT_SYSTEMS.md (AuthContext, RegionContext, StatusContext,
handleAuthError, the lead-sources fetch wrapper).
Reference (read-only): `D:\zan-workspace` —
`src/components/admin/operations/lead-sources/api.ts` (the `send()` + `ApiError` you are porting),
`src/lib/auth/handleAuthError.ts`, `src/contexts/AuthContext.tsx`, `src/contexts/RegionContext.tsx`,
`src/contexts/StatusContext.tsx`, `src/app/admin/authentication/login/page.tsx`,
`src/app/api/auth/login/route.ts`, `src/app/api/auth/me/route.ts`, `src/app/api/auth/region/route.ts`,
`src/components/admin/operations/AccessDenied.tsx`.

## Goal

One API module that every later screen calls, and a working session: Splash decides logged-in or not, Login signs in,
the JWT lives in Keychain, the active region rides on a header, and a 401 anywhere lands the user back on Login once.
Later sessions add screens on top of this and never touch `fetch` again.

## Scope

- `src/api/endpoints.ts` — `API_BASE_URL` (dev default `http://10.0.2.2:3000` for the Android emulator) and the path
  constants: `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`, `/api/auth/region`, plus
  `LEAD_SOURCES_API = "/api/admin/operations/lead-sources"` as the web file has it.
- `src/api/client.ts` — `class ApiError extends Error { status; field?; details? }` copied field-for-field from the web;
  `send<T>(path, method, body?)` returning `json.data`; `sendRaw<T>()` returning the whole envelope (the lead-sources
  list needs `counts` and `progress`); the `body instanceof FormData` branch that skips the JSON content type and never
  sets a boundary; `Authorization: Bearer <token>` and `X-Active-Region` on every request; `AbortSignal` support.
- The 401 path inside `client.ts`: toast `json.message || "Session expired. Please log in again."` once under the id
  `"auth-401"`, clear the Keychain entry and the MMKV cache, reset navigation to Login — replacing the web's
  `window.location.href`.
- `src/api/handleAuthError.ts` — the ported 403 helper: given an `ApiError` it calls `onForbidden(error.message)` for
  403 and returns `true` so a screen early-returns and renders `AccessDenied` from session 3.
- `src/api/navigationRef.ts` — the navigation ref plus `resetToLogin()`, so `client.ts` never imports a screen.
- `src/store/keychain.ts` — one entry for the JWT via `react-native-keychain`, read once into memory at boot
  (`loadToken`, `getToken`, `saveToken`, `clearToken`). The token goes nowhere else.
- `src/store/mmkv.ts` — region-keyed cache and prefs: the last `/api/auth/me` payload, `activeRegion`, the last login
  email; `clearRegionCache()` and `clearAll()` used by logout and by a region switch.
- `src/contexts/AuthContext.tsx` — same public shape `{ user, loading, isAuthenticated, role, regions, refreshUser,
  logout }`, same `AuthUser` fields `{ id, name, email, role, regions, activeRegion, avatar }`, `fetchUser()` branching
  on `json.data === null` (never on `res.status`), `logout()` = fire-and-forget `POST /api/auth/logout` → clear Keychain
  and MMKV → clear state → toast → navigate immediately.
- `src/contexts/RegionContext.tsx` — `useRegion(): RegionConfig` and `useRegionScope(): { regions, active, setActive,
  switching, isAll, canSwitch, config }` unchanged; `serverActive = user.activeRegion ?? (regions.length === 1 ?
  regions[0] : ALL_REGIONS)`; `setActive` POSTs `{ region }` to `/api/auth/region`, trusts `json.data.active`, persists
  it, drops the region-keyed MMKV entries.
- `src/contexts/StatusContext.tsx` — copied verbatim from the web (`remarks`, `showRemarks`, `nextStatus`, `reset`).
- `src/screens/auth/SplashScreen.tsx` — load the token, call `/api/auth/me`, branch on `data === null`, go to Login or
  Home.
- `src/screens/auth/LoginScreen.tsx` — email + password, eye/eye-off toggle, inline error block, "Signing in..." button
  label, `keyboardType="email-address"`, `autoCapitalize="none"`, `textContentType` email/password,
  `returnKeyType="go"`, `KeyboardAvoidingView`. On 200 it stores `data.token`, calls `refreshUser()`, navigates. Show the
  server's own messages: 400 "Email and password are required", 401 "Invalid credentials", 403 "Account is deactivated".
- A temporary `src/navigation/RootNavigator.tsx` (Splash → Login → a placeholder Home that prints name, role label,
  regions and the active region with a switcher) — session 5 replaces it with the real tabs.
- Jest tests in `__tests__/api/client.test.ts`: a 401 response clears the token and calls `resetToLogin` once; a
  `{ success: false, message, field: "phone" }` body becomes an `ApiError` carrying `field === "phone"`; a FormData body
  is sent with no `Content-Type` header; `sendRaw` keeps `counts`.

## Already decided (follow these)

- Bearer token, never cookies — Android's fetch cookie jar must not be relied on (OVERVIEW §11 risk 5).
- `react-native-keychain@^10` holds the JWT and nothing else; `react-native-mmkv@^4.3` holds cache and prefs, never the
  token.
- Plain `fetch` + `useState`/`useEffect`. No TanStack Query, no SWR, no Redux.
- Region travels as `X-Active-Region: IN | US | AE | ALL`. It can only narrow to regions the account already holds, so
  the server ignores anything else.
- A region switch remounts the tree (`<NavigationContainer key={activeRegion}>`, wired fully in session 5) and clears
  the region-keyed cache — the web's `window.location.reload()` existed for a reason.
- Drop the web's `setTimeout(..., 500)` before navigating after logout.
- `src/lib/region.ts` (copied in session 2) is the source of `REGION_CODES`, `REGIONS`, `ALL_REGIONS`, `ActiveRegion`
  and `resolveEffectiveRegion`. `USER_ROLE_META` from `src/constants/userRoles.ts` gives role labels.
- NativeWind class strings, `react-native-toast-message@^2.5` with the `toastOnce(id)` helper and the `AccessDenied`
  component from session 3.
- Style: 4-space indent, no semicolons, double quotes, `function` declarations, `@/` imports, one main export per file.

## Steps

1. Verify the backend first, before writing any app code. Against the dev API with curl: `POST /api/auth/login` returns
   `token` in the body; `GET /api/auth/me` answers with the user when given only `Authorization: Bearer <token>` and no
   cookie; the same call with `X-Active-Region: US` comes back with `activeRegion: "US"` for an account holding US;
   `GET /api/admin/operations/leads?limit=1` succeeds with the header alone. If any of these fail, stop and report it —
   this session is blocked on BACKEND_CHANGES.md 1–4.
2. Confirm where `API_BASE_URL` comes from in this repo (session 1's `.env` wiring); if nothing exists, read it in
   `src/api/endpoints.ts` with the emulator default and record it in `.env.example`.
3. Build `src/store/keychain.ts` and `src/store/mmkv.ts`.
4. Build `src/api/navigationRef.ts`, then `src/api/client.ts` (`ApiError`, `send`, `sendRaw`, headers, FormData branch,
   401 path), then `src/api/handleAuthError.ts`.
5. Write the Jest tests from Scope against a mocked `fetch` and get them green before touching any screen.
6. Port `StatusContext`, then `AuthContext`, then `RegionContext`, and mount all three plus the toast host in `App.tsx`.
7. Build `SplashScreen`, `LoginScreen` and the temporary `RootNavigator` with the placeholder Home.
8. Run it on the emulator: log in, kill and relaunch the app, switch region, log out. Then check a forced 401 by
   corrupting the stored token.

## Definition of done

- [ ] The four curl checks in step 1 pass against the dev API.
- [ ] `npm run android` builds and installs; Metro shows no red box.
- [ ] Logging in with a real staff account lands on the placeholder Home showing that user's name, role label, regions
      and active region.
- [ ] Killing and relaunching the app goes Splash → Home with no login prompt; the stored email prefills the email field
      on Login.
- [ ] A request made after corrupting the stored token shows exactly one "Session expired" toast and lands on Login,
      with the Keychain entry gone.
- [ ] Switching region on the placeholder Home updates the badge from the server's `data.active`, and the next request
      carries the new `X-Active-Region` (check in Metro's network log or a temporary `console.log` of the headers).
- [ ] An account holding one region shows a plain badge and `canSwitch === false`.
- [ ] Logout clears Keychain and MMKV and shows Login immediately, with no delay.
- [ ] `npm test` passes, including the four `client.test.ts` cases.
- [ ] `npm run lint` and `npx tsc --noEmit` pass.

## When you are done

Write a short summary: files added or changed, what works on the device, anything deferred, and any blocker. Then stop.

--- FOLLOW-UP (paste only if the session stopped early) ---

If the emulator cannot reach the API: the Android emulator reaches the host as `http://10.0.2.2:<port>`, not
`localhost`, and plain HTTP needs `android:usesCleartextTraffic="true"` on `<application>` in
`android/app/src/debug/AndroidManifest.xml`. Confirm with `adb shell curl` or a one-off fetch logged to Metro, fix
`API_BASE_URL`, then finish the remaining Definition of done items.

If `react-native-keychain` fails to link or throws at runtime on RN 0.87: report the exact error, and keep the session
moving by putting `getToken`/`saveToken`/`clearToken` behind the same `src/store/keychain.ts` interface with an
in-memory implementation, so only that one file changes once the native module works. Do not move the token to MMKV.
