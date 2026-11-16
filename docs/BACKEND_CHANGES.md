# Backend changes needed for the mobile app

> These happen in the **web app repo** (`github.com/fsdSumitabha/zan-workspace`), not in this repo. Make them there,
> then deploy to the dev API.
> The required ones are small — six one-line reads and one response field — but **session 4 of the mobile app is
> blocked until they are live on the dev API**, and everything after session 4 depends on session 4.

## Why

The API authenticates from an httpOnly cookie. A React Native app cannot read or reliably manage one: Android's `fetch`
happens to have a cookie jar, so a cookie login may look like it works and then fail on iOS, after a reinstall, or when
the jar is cleared. The app therefore sends the JWT as a header, which the API does not accept yet.

## Required

| # | Change | Where |
|---|---|---|
| 1 | Accept `Authorization: Bearer <jwt>` as a fallback when the `auth_token` cookie is absent | `src/lib/auth/getUserFromRequest.ts` — step 1 reads only `req.cookies.get("auth_token")?.value` |
| 2 | The same fallback in the four routes that read the cookie directly instead of using that helper | `/api/auth/me`, `/api/auth/profile`, `/api/auth/profile/avatar`, `/api/auth/profile/password` |
| 3 | Return the signed JWT in the login response body | `/api/auth/login` — it already returns `{ id, name, email, role, regions }` and the web ignores the body, so adding `token` breaks nothing |
| 4 | Accept the active region as `X-Active-Region` when the `active_region` cookie is absent | wherever `narrowToActiveRegion(...)` reads the cookie. Safe by construction: the value can only narrow to regions the user already holds, and unknown values are ignored |
| 5 | Confirm the two `.xlsx` routes authenticate through the helper, so they inherit the Bearer fallback | `GET /api/admin/operations/lead-sources/template` and `GET /api/admin/operations/lead-sources/uploads/:id/download` |

| 6 | Add `GET /api/admin/operations/lead-sources/columns`, returning `{ success: true, data: { columns: [{ key, label, headers, required }], rules: { maxFileMb, maxRows } } }` read from `LEAD_SOURCE_COLUMNS` and `LEAD_SOURCE_SHEET_RULES` in `src/config/leadSourceSheet.ts`, behind `requireRole(req, LEAD_SOURCE_MANAGE_ROLES)` | a new `src/app/api/admin/operations/lead-sources/columns/route.ts` |

Without 1–3 the app cannot log in at all. Without 4 every list silently shows the wrong region's data. Without 5 the app
can upload a sheet but never download the report it produced. Without 6 the upload screen cannot show the expected
header row (the web reads it from its own config file, which the phone cannot import); it shows "Download the template
to see the expected header row." instead, and checks the file size against a local copy of the 5 MB limit.

**Not needed:** CORS (native `fetch` is not bound by the browser's same-origin policy) and any change to
`POST /api/auth/logout` (it clears a cookie the app never had; the app calls it anyway and then clears its own storage).

## A ready patch for items 1–4

`docs/backend-patch/mobile-auth.patch` makes items 1–4 in the web repo. It was written in session 4 against
`zan-workspace` `main` at commit `6858fb8`, and `git apply --check` passes there. It adds one helper,
`src/lib/auth/requestCredentials.ts` (`readAuthToken`, `readActiveRegion`), and uses it in the seven places that read the
cookies today. The cookie always wins when it is present, so the web app behaves exactly as before.

```
cd zan-workspace
git apply /path/to/zanverse/docs/backend-patch/mobile-auth.patch
npx tsc --noEmit && npm run lint
```

Item 5 needs no change: both `.xlsx` routes call `requireRole`, which calls `requireAuth`, which calls
`getUserFromRequest`. They inherit the Bearer fallback from the patch. The page proxy (`src/proxy.ts`) only guards
`/admin` pages, not `/api` routes, so it needs no change either.

Then run the four curl checks from session 4, step 1:

```
API=http://localhost:3000
TOKEN=$(curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' \
    -d '{"email":"<staff email>","password":"<password>"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.token')
curl -s $API/api/auth/me -H "Authorization: Bearer $TOKEN"
curl -s $API/api/auth/me -H "Authorization: Bearer $TOKEN" -H "X-Active-Region: US"   # activeRegion "US" if held
curl -s "$API/api/admin/operations/leads?limit=1" -H "Authorization: Bearer $TOKEN"
```

## Strongly recommended

**Paginate the dashboard feed.** `GET /api/admin/operations` returns every lead, client and project that has a
timeline entry, in one response, and the web renders all of them. On a phone that is the landing screen. Add
`page`/`limit` with the same `pagination: { page, limit, total, pages }` envelope every other list route already uses.
Virtualizing the list on the client helps the rendering, not the payload.

**Decide the token lifetime.** The JWT lasts 7 days and there is no refresh route, so after expiry every call returns
401. On the web that is a redirect to login; on a phone it is a silent logout in the middle of a calling shift. Either
add `POST /api/auth/renew`, or accept the weekly re-login deliberately.

## Phase 2 — for push notifications (session 23)

**State:** not started on the backend. The app's half is built (session 23). The app already has a device-only
reminder that does not depend on this. Below is the exact change for the web repo, in its own file names. Every path is
relative to `github.com/fsdSumitabha/zan-workspace`.

### 1. Device tokens

- **New model `src/models/DeviceToken.ts`.**
  - Fields: `user` (ObjectId → User, required, indexed), `token` (string, required, **unique**), `platform`
    (`"android"` | `"ios"`), `lastSeenAt` (Date), and timestamps.
  - A token belongs to one user at a time. Registering a token that already exists moves it to the new user, because
    the phone changed hands.
- **New route `src/app/api/notifications/devices/route.ts`:**
  - `POST` takes `{ token, platform }`. It runs `requireAuth`, upserts by `token` with `user` set to the caller, and
    sets `lastSeenAt` to now. It answers `{ success: true }`.
  - `DELETE` takes `{ token }`. It runs `requireAuth` and deletes the row only when it belongs to the caller. It answers
    `{ success: true }`, also when there was nothing to delete.
  - The app calls `POST` after login and on every cold start, and again when Firebase rotates the token. It calls
    `DELETE` on logout, before it clears the session. A 404 from either is logged once on the phone and changes
    nothing on screen.

### 2. A real `dispatchPush`

- **`src/lib/notifications/channels/push.ts`.** Replace the `console.log` stub. Look up the `DeviceToken` rows of
  `ctx.recipients`, then send with firebase-admin `getMessaging().sendEachForMulticast`:
  - `notification: { title: ctx.message.title, body: ctx.message.body }`
  - `data: { url: ctx.message.url }`. The app routes a tap by this web path.
  - `android: { priority: "high", notification: { channelId: "crm" } }`. A due callback uses `"callbacks"` instead.
  - Delete every row whose result is `messaging/registration-token-not-registered` or `messaging/invalid-argument`.
- **firebase-admin** starts from a service-account JSON in the environment (for example `FIREBASE_SERVICE_ACCOUNT`).
  It is never committed.
- **Channel 4.** Add `4` to the `channels` array that each `emitNotification` call passes, for the events that should
  push. `src/constants/notificationChannels.ts` already maps `4` to `dispatchPush`. Its label "Web Push" can become
  "Push".

### 3. A due-callback event

- **`src/constants/eventTypes.ts`:** add `1300: "LEAD_SOURCE_CALLBACK_DUE"`. The 13xx family is unused, and the scale
  steps by 10 inside a family, so the next lead-source event takes 1310.
- **`src/lib/notifications/render.ts`:**
  - Add `leadSourceUrl(id)`, which returns `/admin/operations/lead-sources/${id}`, beside `leadUrl`, `clientUrl` and
    `projectUrl`.
  - Render 1300 as title `Call back ${source.name}`, body `${phone} · ${lastNote || "no notes yet"}`, and
    `url: leadSourceUrl(source._id)`. These match the phone's own reminder, so the two read the same.
- The app already opens that path on `LeadSourceDetail` (`resolveNotificationPath` in `src/navigation/linking.ts`).

### 4. The scheduled job

- **Every 5 minutes**, for example a Vercel Cron hitting `src/app/api/cron/callbacks/route.ts`, protected by a
  `CRON_SECRET` header. It finds `LeadSource` rows where:
  - `callbackAt` is greater than the previous run's time and at most now;
  - `status` is not `70` (CONVERTED);
  - `deletedAt` is `null`;
  - `assignedTo` is not `null`.
- For each row it emits 1300 to `assignedTo` with channel `4` in its `channels`. `dispatchNotification` always saves
  the in-app row for the bell, and then runs push.
- The `{ callbackAt: 1 }` index the query needs already exists on the model.
- Store the previous run's time, for example in a one-document `CronState` collection, so a late or skipped run
  neither drops nor repeats a callback.
- Today nothing runs on the server when a callback falls due (`docs/lead-sources.md` §11.2). This job is that missing
  piece.

### Order and checks

1 → 2 → 3 → 4. To check it: register a token with curl, emit any existing event with channel 4, and see it arrive on
a phone with `google-services.json`. Then set a callback two minutes ahead with the app closed: the push and the
phone's own reminder should both arrive. Android shows them as separate notifications, under the `callbacks` channel
and Notifee's id `callback-<id>`.

## Suggested prompt for the web repo

```
Add header-based auth to the API so a React Native client can authenticate. Keep cookie auth working exactly as it is.

1. src/lib/auth/getUserFromRequest.ts: if the auth_token cookie is absent, read the JWT from the
   Authorization: Bearer header.
2. The same fallback in /api/auth/me, /api/auth/profile, /api/auth/profile/avatar and /api/auth/profile/password,
   which read the cookie directly.
3. /api/auth/login: include the signed token in the response body.
4. Active region: if the active_region cookie is absent, accept an X-Active-Region header, narrowed exactly as the
   cookie is today.
5. Check that GET /lead-sources/template and GET /lead-sources/uploads/:id/download authenticate through
   getUserFromRequest so they inherit the fallback.

Verify with curl: login returns a token; /api/auth/me works with the Bearer header and no cookie; a region header
narrows the same way the cookie does; both xlsx routes return their file with the Bearer header.
Leave the changes uncommitted and summarize what changed.
```
