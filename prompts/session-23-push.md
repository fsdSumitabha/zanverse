# Session 23 — Push notifications for due callbacks

At the end of this session a due callback reaches the agent's phone when the app is closed: a Notifee reminder fired on the device for certain, and real FCM push the moment the backend's token endpoint and scheduled job are live.

---

Session 23 — Push notifications for due callbacks.

Read docs/OVERVIEW.md §3 (Notifications, Storage, Navigation), §4 (packages), §5 (structure), §10 ("Due-callback reminders") and §11 (risk 8: release builds differ from debug).
Read docs/LEAD_SOURCES.md "Callback scheduling (the feature a phone does best)", the "Status model" lines on `callbackAt` / `callbackDay` / CONVERTED (70), the mobile opportunities "REAL CALLBACK REMINDERS" and "QUICK TRIAGE WIDGET / NOTIFICATION", and the risks "CALLBACK DAY/TIME PAIR" and "NO PUSH / NO SERVER-SIDE REMINDER EXISTS".
Read docs/BACKEND_CHANGES.md "Phase 2 — for push notifications (session 23)" and docs/API_CONTRACT.md rows for the four `/api/notifications` endpoints plus its notes "NAVIGATION TARGETS ARE WEB PATHS" and "POLLING AND BACKGROUND".
Reference (read-only): D:\zan-workspace — `src/lib/notifications/channels/push.ts` (the stub that only `console.log`s today), `src/constants/notificationChannels.ts` (channel 4 "Web Push"), `src/lib/notifications/emit.ts` and `dispatch.ts` (the fan-out the token must join), `src/lib/notifications/render.ts` (`leadUrl` / `clientUrl` / `projectUrl` — the only `url` shapes rows carry today), `src/models/Notification.ts` (`channels: number[]`, the 30-day TTL), `src/models/LeadSource.ts` (`callbackAt`, `assignedTo`, `status`, and the existing `{ callbackAt: 1 }` index), `src/components/admin/operations/lead-sources/callback.ts` (`CALLBACK_PRESETS`, `callbackPayload`, `callbackState`, `formatCallback`), `docs/lead-sources.md` §11.2 (the sentence that says nothing runs on the server at callback time).

## Goal
An agent sets a callback for 3:00 PM, locks the phone, and at 3:00 PM the phone rings a "Call back Priya Sharma now" notification that opens straight onto that lead source. The device-local reminder ships whatever the backend does. On top of it, FCM registration, foreground display, and tap routing are wired so the server's fan-out reaches the phone as soon as the backend half lands.

## Scope
- Packages: `@react-native-firebase/app`, `@react-native-firebase/messaging`, `@notifee/react-native` — install the newest versions whose release notes cover RN 0.87 and the New Architecture, then add the resolved versions to the table in `docs/OVERVIEW.md` §4 so later sessions have them pinned.
- Android wiring: `android/build.gradle` classpath `com.google.gms:google-services`, `apply plugin: "com.google.gms.google-services"` in `android/app/build.gradle`, `android/app/google-services.json` from the Firebase console added to `.gitignore` with a `google-services.json.example` committed in its place, and keep rules for Firebase and Notifee in `android/app/proguard-rules.pro` (session 22 turned R8 on — the release build is the only place a missing rule shows).
- `src/lib/push/channels.ts` — two Notifee Android channels created once at startup: `callbacks` (id `"callbacks"`, name "Callback reminders", `AndroidImportance.HIGH`, sound, vibration) and `crm` (id `"crm"`, name "CRM updates", `AndroidImportance.DEFAULT`).
- `src/lib/push/permission.ts` — `ensureNotificationPermission()` using `notifee.requestPermission()`, called the first time a callback is saved, not at launch; an MMKV flag `push.permissionAsked` keeps it to one ask, and a declined permission leaves every other feature working.
- `src/lib/push/reminders.ts` — the device-local half, built on `notifee.createTriggerNotification` with a `TimestampTrigger`: `scheduleCallbackReminder(row)` with notification id `callback-${row._id}`, title `Call back ${row.name}`, body `${formatPhoneForDisplay(row.phone, phoneCountry)} · ${row.lastNote ?? "no notes yet"}`, channel `callbacks`, and `data: { url: "/admin/operations/lead-sources/" + row._id, local: "1" }`; `cancelCallbackReminder(id)`; and `syncCallbackReminders(rows)` which reconciles the scheduled ids against the rows a fetch returned so a callback cleared on the web disappears from the phone on the next load.
- Reminder sync points, all driven by the `LeadSourceRow` the API already answers mutations with:
  - the status save in `src/components/leadSources/StatusMenuSheet.tsx` — schedule on Call Back, cancel on every other status;
  - the standalone callback sheet from session 12 (`PATCH /:id/callback`) — schedule on set, cancel on `{ callbackAt: null }`;
  - `runBulk()` in `src/lib/leadSourceBulk.ts` — the day and status actions clear `callbackAt` server-side, so cancel every id in the selection;
  - convert — status `CONVERTED` (70) is terminal and clears `callbackAt`, so cancel there too;
  - every `LeadSourcesScreen` load — `syncCallbackReminders(rows)` reconciles the whole page.
- Honest labelling: under the callback picker, the line "Reminder on this phone" while no FCM token is registered, swapping to "Reminder on this phone and by push" once one is. The same wording in the summary — a device-only reminder does not follow the agent to another phone.
- `src/lib/push/token.ts` — `registerDeviceToken()` reads `messaging().getToken()` and POSTs it with `{ token, platform: "android" }`; `unregisterDeviceToken()` DELETEs it; `messaging().onTokenRefresh` re-registers. Call register after a successful login and after `GET /api/auth/me` on cold start, and unregister in the logout path before the Keychain and MMKV wipe. Every call is fire-and-forget: a 404 while the backend endpoint does not exist yet logs once and changes nothing on screen.
- `src/contexts/PushContext.tsx` — mounted beside session 15's `NotificationContext`, above the tabs: `messaging().onMessage` displays the payload through Notifee on the `crm` channel (Android shows nothing for a data message in the foreground otherwise) and calls `refreshBadge()` from `NotificationContext` so the bell count follows; `setBackgroundMessageHandler` registered in `index.js` outside the component tree.
- Tap routing through one path: extend `resolveNotificationPath(url)` in `src/navigation/linking.ts` (session 5) with `/admin/operations/lead-sources/:id` → `LeadSourceDetail` with `{ sourceId: id }`, keeping the three existing lead/client/project shapes. Feed it from `notifee.onForegroundEvent` (`EventType.PRESS`), `notifee.onBackgroundEvent`, `messaging().onNotificationOpenedApp`, and `messaging().getInitialNotification` for a cold start, each reading `data.url`.
- `src/screens/profile/ProfileScreen.tsx` gains a "Callback reminders" switch (MMKV `push.remindersEnabled`, default on); off cancels every scheduled trigger.
- `docs/BACKEND_CHANGES.md` "Phase 2" is replaced by the exact spec you hand the backend owner, written in the web repo's own file names while this session is fresh:
  - `src/models/DeviceToken.ts` — `user`, `token` (unique), `platform`, `lastSeenAt`; `POST /api/notifications/devices` to register and `DELETE /api/notifications/devices` to clear, both `requireAuth`;
  - a real `dispatchPush` in `src/lib/notifications/channels/push.ts` (today it only `console.log`s) using firebase-admin `sendEachForMulticast` over the recipients' tokens, pruning rows that come back `UNREGISTERED`, with channel `4` added to the `channels` array the emits pass;
  - a new `EVENT_TYPE` code on the existing step-by-10 scale for a due callback, rendering `url` as `/admin/operations/lead-sources/:id` alongside the three in `render.ts`;
  - a 5-minute job over `LeadSource` — `callbackAt` between the previous run and now, `status` not 70, `deletedAt` null — emitting to `assignedTo`; the `{ callbackAt: 1 }` index it needs already exists on the model.

## Already decided (follow these)
- Polling stays. Session 15's `NotificationContext` keeps its AppState-gated 30 s poll; push is additive, and the bell count still comes from `GET /api/notifications?limit=4`.
- The local Notifee reminder is the deliverable that cannot slip (OVERVIEW §10, "Due-callback reminders"). If the backend half is not live, ship it labelled as a device reminder and finish the session.
- The JWT lives in `react-native-keychain@^10` and is sent as `Authorization: Bearer` through `src/api/client.ts`; the device token is just another authenticated POST through `send`.
- `callbackAt` is an ISO instant and `callbackDay` is the local day, both sent by the client — reminders schedule off `new Date(callbackAt).getTime()` and never re-derive a day.
- NativeWind `className` with the web's Tailwind strings, session 3 primitives, `react-native-toast-message@^2.5` with a fixed `id` per toast, `react-native-mmkv@^4.3` for the two flags.
- New Architecture, Hermes and edge-to-edge stay on; R8 and the release signing from session 22 stay as they are.
- 4-space indent, no semicolons, double quotes, `function` declarations, `@/` imports, default export for components and screens, files under 250 lines.

## Steps
1. Install the three packages, record the resolved versions in `docs/OVERVIEW.md` §4, and run `npm run android` before writing any feature code — a Firebase Gradle plugin that will not build is the one blocker worth finding in minute five.
2. Create `google-services.json` from a Firebase Android app registered with the real `applicationId`, gitignore it, commit the example, and confirm a debug build still launches.
3. Build `src/lib/push/channels.ts` and `permission.ts`; call the channel creation once at app start and prove the permission dialog appears on an Android 13+ emulator after the first callback save, not at launch.
4. Build `src/lib/push/reminders.ts` and wire `scheduleCallbackReminder` into the status sheet and callback sheet. Set a callback two minutes out, background the app, and watch it fire.
5. Wire the cancel paths: clearing a callback, picking another status, a bulk day change, and convert. Re-open the list and let `syncCallbackReminders` reconcile.
6. Add the tap route: extend `resolveNotificationPath`, handle the Notifee foreground and background events, and land on `LeadSourceDetail` from a locked screen and from a cold start.
7. Add `token.ts`, the login/logout calls and `onTokenRefresh`; log the token and send yourself a test message from the Firebase console to prove foreground display through Notifee and the `crm` channel.
8. Rewrite the Phase 2 section of `docs/BACKEND_CHANGES.md` as the backend spec above, and say in the summary whether the server half is scheduled or still open.
9. Run `./gradlew bundleRelease` from session 22 and install the AAB's APK on a device — R8 strips Firebase and Notifee reflection unless the keep rules are right, and debug will never show it.

## Definition of done
- `npm run android` installs and launches with no red box, and the Gradle build succeeds with the google-services plugin applied.
- Setting a callback 2 minutes ahead, then closing the app from the recents list, produces a high-priority notification at that time with the source's name and number.
- Tapping that notification opens the app on `LeadSourceDetail` for the right `sourceId`, from both a locked screen and a cold start.
- Clearing the callback, changing the status to Not Interested, running a bulk day change, and converting the source each cancel the pending reminder — `adb shell dumpsys alarm | findstr zanverse` shows no leftover alarm.
- The permission dialog appears the first time a callback is saved and never again, and declining it leaves the list, dialer and status saves working.
- A test message sent from the Firebase console appears while the app is in the foreground, on the "CRM updates" channel, and the bell count refreshes with it.
- The callback picker reads "Reminder on this phone" while no token is registered.
- Turning off "Callback reminders" on the Profile screen cancels the pending triggers, and turning it back on reschedules from the next list load.
- A release build installed from the session 22 AAB fires a scheduled reminder and opens the right screen.
- `npm run lint` and `npx tsc --noEmit` pass.

## When you are done
Write a short summary: files added or changed, what works on the device, anything deferred, and any blocker. Then stop.

--- FOLLOW-UP (paste only if the session stopped early) ---

Most likely sticking point: `@react-native-firebase` or `@notifee/react-native` failing to build against RN 0.87 with the New Architecture. Report the exact package versions and the Gradle error rather than turning `newArchEnabled` off. Notifee's trigger notifications need no Firebase at all, so ship the local reminder path end to end — schedule, cancel, sync, tap routing — leave `token.ts` and `PushContext.tsx` out of the tree, and finish the Definition of done items that do not mention FCM. If instead the device reminder works but it never fires when the phone is idle, request `SCHEDULE_EXACT_ALARM` / `USE_EXACT_ALARM` in `AndroidManifest.xml`, set `alarmManager: { allowWhileIdle: true }` on the trigger, and point the agent at the OS battery-optimisation exemption for the app.
