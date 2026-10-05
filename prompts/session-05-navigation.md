# Session 05 — Foundation D: navigation shell

At the end of this session you log in on a device, walk every bottom tab, open every More row, switch region and log out — all screens still placeholders, but the shell is final.

---

Session 05 — Foundation D: navigation shell.

Read docs/OVERVIEW.md §3 (Navigation, Region, Auth), §4 (packages), §5 (project structure), §6 (modules and screens) and §11.6, plus docs/CLIENT_SYSTEMS.md (AuthContext, RegionContext, handleAuthError) and docs/API_CONTRACT.md (Auth flow, Region flow).
Reference (read-only): D:\zan-workspace — `src/components/admin/operations/MobileNav.tsx` (the nav items and their role arrays), `src/components/admin/operations/SideBar.tsx` (the More rows and their role arrays), `src/components/admin/operations/MobileTopBar.tsx` (the profile/more menu), `src/proxy.ts` (the `routePermissions` array), `src/components/admin/operations/AccessDenied.tsx`, `src/constants/leadSourceRoles.ts`, `src/lib/notifications/render.ts` (the three `url` shapes a notification row carries).

## Goal
The app opens on a splash that reads the stored JWT, lands on either the login screen from session 4 or the tab shell, and shows exactly the tabs the signed-in user's role allows. Every tab has its own native stack with a titled placeholder screen. A More tab lists the secondary destinations, the region switcher and Logout. Deep links (`zanverse://`) resolve to real screens, and a screen the role cannot open renders AccessDenied instead of content.

## Scope
- `src/navigation/navItems.ts` — the six items copied verbatim from `MobileNav.tsx`: Dashboard, Leads, **Calls** (that label, not "Lead Sources"), Clients, Projects, Users. Keep the literal role arrays exactly as written, including 65 and 69, and import `LEAD_SOURCE_ACCESS_ROLES` from `src/constants/leadSourceRoles.ts` for the Calls item. Icons from `lucide-react-native`: `Home`, `Target`, `PhoneCall`, `Handshake`, `FolderKanban`, `UserRoundCog`.
- `src/navigation/moreItems.ts` — Meetings `[10,15,20,30,40,42,45,50,60,65,69,70,80]` (`CalendarClock`), Overall Stats `[10,15,20,30,40,42,45,50,60,70,80]` (`BarChart3`), Activity Logs `[10,20]` (`Activity`), Notifications (all roles, `Bell`), Profile (all roles, `UserCircle`). Role arrays come from `SideBar.tsx`.
- `src/navigation/permissions.ts` — `canOpen(screen, role)`, a screen-name → roles map ported from `proxy.ts`'s `routePermissions`: UsersList `[10,45,20,69]`, UserCreate `[10,20,69]`, UserEdit `[10,20]`, LeadCreate `[10,15,45,50,60,69,70]`, LeadEdit `[10,45,60,69,70]`, LeadConvert `[10,45,60,69,70]`, ClientEdit `[10,45,60,69,70]`, ProjectCreate `[10,45,60,70]`, ProjectEdit `[10,45,60,70]`, LeadSourceUploads `LEAD_SOURCE_MANAGE_ROLES`, LeadSources `LEAD_SOURCE_ACCESS_ROLES`. A screen absent from the map is open to any signed-in role.
- `src/navigation/RootNavigator.tsx` — native-stack with `Splash`, `Auth` (the login screen from session 4) and `App` (the tabs), `headerShown: false`.
- `src/navigation/TabNavigator.tsx` — `@react-navigation/bottom-tabs`, tabs rendered from `navItems.filter((i) => i.roles.includes(user.role))` plus the always-present More tab.
- Per-tab native stacks: `DashboardStack`, `LeadsStack`, `CallsStack`, `ClientsStack`, `ProjectsStack`, `UsersStack`, `MoreStack`. Register the screen names the later sessions will fill (LeadsList, LeadDetail, LeadCreate, LeadEdit, LeadConvert, ClientsList, ClientDetail, ClientEdit, ProjectsList, ProjectDetail, ProjectEdit, LeadSources, LeadSourceDetail, LeadSourceUploads, UsersList, UserCreate, UserEdit, Meetings, OverallStats, ActivityLogs, Notifications, Profile) and point each at `PlaceholderScreen`.
- `src/screens/PlaceholderScreen.tsx` — shows the route name and its params so a deep link is verifiable.
- `src/screens/more/MoreScreen.tsx` — the signed-in name and role label, the role-filtered More rows, the region switcher row and a Logout row that calls `logout()` from session 4's auth hook.
- `src/components/ui/AccessDenied.tsx` — the RN port of `AccessDenied.tsx` (ShieldAlert in an amber circle, "Access Denied", `message` prop falling back to "You aren't authorized to perform this action."). A stack screen whose `canOpen` is false renders it in place of content.
- `src/components/ui/OfflineBanner.tsx` — `@react-native-community/netinfo`, a thin bar under the header while offline.
- `src/navigation/linking.ts` — `prefixes: ["zanverse://"]`, and a `resolveNotificationPath(url)` that maps the three notification `url` shapes (`/admin/operations/leads/:id`, `/clients/:id`, `/projects/:id`) to LeadDetail / ClientDetail / ProjectDetail with `{ id }`.
- `src/navigation/navigationRef.ts` (from session 4) gains `resetToLogin()` and `resetToApp()`, and the API client's 401 path calls `resetToLogin()`.

## Already decided (follow these)
- React Navigation 7: `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs` all `^7`, on `react-native-screens@^4.28` and `react-native-gesture-handler@^2`.
- NativeWind for styling; copy the web's Tailwind class strings verbatim, including the `dark:` variants.
- Icons are `lucide-react-native@^1.49` on `react-native-svg@^15.15`, same icon names as the web.
- Auth and region come from session 4: the JWT in `react-native-keychain`, sent as `Authorization: Bearer`; the active region sent as `X-Active-Region`; MMKV for cache and prefs.
- Region switching does not reload: `POST /api/auth/region` with `{ region }`, trust `json.data.active`, wipe the MMKV cache, then remount the tree with `<NavigationContainer key={activeRegion}>`. Show the switcher as a plain badge when `regions.length === 1` and a picker otherwise, and render nothing until `GET /api/auth/me` has answered.
- Logout: `POST /api/auth/logout`, clear the keychain, clear MMKV including the region pin, `resetToLogin()`. No 500 ms delay.
- Edge-to-edge is on: use `react-native-safe-area-context` insets, and `useBottomTabBarHeight() + insets.bottom` for anything floating.
- Data stays plain `fetch` + `useState`/`useEffect` through `src/api/client.ts`. No navigation state library.

## Steps
1. Install the four navigation packages at the versions above, add the `react-native-gesture-handler` import as the first line of `index.js`, and rebuild (`npm run android`) before writing any screens.
2. Write `navItems.ts`, `moreItems.ts` and `permissions.ts` straight from the reference files. Copy the arrays; do not retype them from memory.
3. Build `SplashScreen`: read the keychain, call `GET /api/auth/me`, branch on `json.data === null` (not on status), then `resetToLogin()` or `resetToApp()`, seeding the region from `data.activeRegion`.
4. Build `RootNavigator` with `linking` wired into `NavigationContainer`, keyed on the active region.
5. Build `TabNavigator` with the role filter, then one stack file per tab with its screen names pointing at `PlaceholderScreen`.
6. Build `MoreScreen` with the role-filtered rows, the region switcher and Logout.
7. Port `AccessDenied`, add the `canOpen` guard to the stack screens listed in `permissions.ts`, and port `OfflineBanner`.
8. Verify on the emulator with at least two accounts of different roles — one in `LEAD_SOURCE_ROLES.WORK` (50/60/65/70) and one Admin (10) — and check the tab set differs.

## Definition of done
- `npm run android` installs and launches with no red box.
- An Admin (role 10) sees all six tabs plus More; a role-65 account sees Dashboard, Leads, Calls and More, and no Clients, Projects or Users tab.
- Every tab opens its placeholder, and the placeholder prints its route name.
- The More tab shows Activity Logs for role 10 and hides it for role 50.
- `npx uri-scheme open "zanverse://leads/<objectId>" --android` (or `adb shell am start -a android.intent.action.VIEW -d "zanverse://leads/<id>"`) lands on LeadDetail with that id in params.
- Opening a screen whose `canOpen` is false — e.g. UserEdit as role 69 — renders AccessDenied with the fallback message instead of the placeholder.
- Switching region on a multi-region account calls `POST /api/auth/region`, remounts the tree, and the new region shows in the switcher after an app restart.
- Logout returns to the login screen, and relaunching the app stays on login.
- Turning airplane mode on shows the offline banner; turning it off hides it.
- `npm run lint` and `npx tsc --noEmit` pass.

## When you are done
Write a short summary: files added or changed, what works on the device, anything deferred, and any blocker. Then stop.

--- FOLLOW-UP (paste only if the session stopped early) ---

The navigation shell is partly built. Most likely sticking point: `react-native-screens@^4.28` or `react-native-gesture-handler` failing to link under RN 0.87 New Architecture — run `cd android && ./gradlew clean`, confirm the gesture-handler import is the first line of `index.js`, and if a package genuinely does not support 0.87, report the exact version and error rather than downgrading React Navigation. If instead the stacks are done but deep linking or the region remount is unfinished, finish `src/navigation/linking.ts` and the `<NavigationContainer key={activeRegion}>` remount, then run the Definition of done list and stop.
