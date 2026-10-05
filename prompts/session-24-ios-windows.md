# Session 24 — iOS build and the Windows decision

At the end the same `src/` runs on an iPhone — dialer, WhatsApp, pickers, downloads, charts — and `docs/WINDOWS.md` records, with reasons, that Windows is the existing web app.

---

Session 24 — iOS build and the Windows decision.

Read docs/OVERVIEW.md §2 (Platforms — the iOS and Windows rows), §3 (Files, Dialer, Charts, Storage, Auth), §4 (the package table is authoritative), §5 (structure) and §11 (risks 2 and 6).
Read docs/CLIENT_SYSTEMS.md on the web-only browser APIs (the `whatsapp://` vs `web.whatsapp.com` branch, clipboard, `URL.createObjectURL`) and on `country-flag-icons` (flag emoji render correctly on iOS).
Read docs/API_CONTRACT.md "BINARY DOWNLOADS" — the lead-source template and upload report must be fetched with the auth header, never opened as a link.
Read docs/SCREENS.md the "WINDOWS/iOS FROM THE SAME REPO" note (the two places to watch: the tab + FAB layout, and anything touching file system, pickers or secure storage).
Reference (read-only): D:\zan-workspace — `src/components/admin/operations/button/WhatsAppLink.tsx` and `src/components/admin/operations/lead-sources/dialer.ts` (the contact actions iOS must reproduce), `src/app/api/admin/lead-sources/template/route.ts` and `uploads/[id]/download/route.ts` (the two `.xlsx` downloads).

## Goal
`npm run ios` installs and runs the whole app on an iOS simulator and one real device from the same `src/`, with no
Android-only code paths left in screens. The two Maestro journeys from session 22 pass on iOS. A new `docs/WINDOWS.md`
states the Windows decision and the evidence for it, and `docs/OVERVIEW.md` points at it.

## Scope
- `ios/Podfile` + `bundle install` + `bundle exec pod install` against the existing `ios/` folder (`zanverse.xcodeproj`,
  `zanverse/AppDelegate.swift`, `Info.plist`, `PrivacyInfo.xcprivacy`) — no re-init, no Expo prebuild. New Architecture
  stays on.
- `ios/zanverse/Info.plist` gains: `NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription` (the avatar picker in
  session 17), `NSPhotoLibraryAddUsageDescription` if an image is ever saved, `NSMicrophoneUsageDescription` only if a
  recording file is captured rather than picked, and `LSApplicationQueriesSchemes` with `tel`, `telprompt`, `whatsapp`
  and `mailto` so `Linking.canOpenURL` in `src/lib/contact.ts` returns true instead of silently failing.
- Keychain: the `zanverse` target gets the Keychain Sharing capability with one access group, and `src/store/keychain.ts`
  passes `accessGroup` plus `ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY` so the JWT survives backgrounding and never
  syncs to iCloud. Token read at boot, login and logout all verified on device.
- Native build pass over the pods that carry real native code: `react-native-svg` (icons and charts both ride on it),
  `react-native-gifted-charts` + `react-native-linear-gradient`, `react-native-keychain`, `react-native-mmkv`,
  `react-native-blob-util`, `react-native-image-picker`, `@react-native-documents/picker`,
  `@react-native-community/netinfo`, `@react-native-community/datetimepicker`, `@react-native-picker/picker`,
  `react-native-reanimated` + `react-native-worklets`, `@gorhom/bottom-sheet`, `@sentry/react-native`.
- The Android-assumption audit, each one checked on the simulator:
  - `src/lib/contact.ts` — `tel:` opens the iOS call sheet, `whatsapp://send?phone=` opens WhatsApp, `mailto:` opens Mail,
    and each falls back to the toast when the app is absent.
  - `src/lib/leadSourceUpload.ts` — `@react-native-documents/picker` returns a `file://` URL on iOS, not a `content://`
    URI, so the FormData/blob-util path needs the iOS branch to read it directly.
  - `src/lib/downloadFile.ts` — there is no MediaStore and no Downloads folder: write into
    `ReactNativeBlobUtil.fs.dirs.DocumentDir`, then present the file with `ios.openDocument` or the system share sheet
    instead of the Android download notification.
  - Avatar picking — PHPicker is the iOS surface for `react-native-image-picker`; the returned asset `uri` and `fileName`
    differ from Android's, so the multipart field the profile screen sends must still match the web's.
  - `Platform.OS` lives only in `src/components/ui/` and `src/lib/`, never in `src/screens/` — this is also the Windows
    precondition below.
- Safe areas and edge-to-edge: the bottom tab bar, the floating action buttons and the sheets all respect the home
  indicator via `react-native-safe-area-context@^5.5.2` insets on a notched device.
- `NSAppTransportSecurity` carries no blanket `NSAllowsArbitraryLoads`; any dev HTTP exception is scoped to the dev host
  and documented, with the release build talking HTTPS to `API_BASE_URL`.
- Maestro: run `.maestro/login-status-save.yaml` and `.maestro/upload-report.yaml` from session 22 against the iOS build,
  adding only `testID`s where a selector does not resolve.
- `docs/WINDOWS.md` — the decision record: `react-native-windows` has no 0.87 line (0.84 stable, 0.85 preview, pinned to
  RN 0.84.1), `D:\zanverse` has no `windows/` folder and will not get one this phase, so the Windows surface is the
  existing Next.js app at `D:\zan-workspace` in a browser — the same API, the same JWT auth, the same region header. A
  Tauri or Electron wrapper of that web app is the only sensible route to a taskbar icon, and it buys packaging, not
  features. Close with the re-open conditions: RNW shipping an 0.87-compatible release, and the audit result proving
  `src/` stayed platform-agnostic.
- `docs/OVERVIEW.md` §2 Windows row and §10 link to `docs/WINDOWS.md`; the session 24 row in §9 is ticked.

## Already decided (follow these)
- Same `src/` for both platforms. iOS gets no parallel screen tree; divergence lives behind `Platform.select` inside
  `src/components/ui/` or `src/lib/`.
- Styling stays NativeWind (`nativewind@^4.1` + `tailwindcss@~3.4`) with the web's class strings; navigation stays React
  Navigation 7 on `react-native-screens@^4.28`.
- Auth is the Bearer JWT in `react-native-keychain@^10` with `X-Active-Region` on every request through
  `src/api/client.ts`. Cookies are not a fallback on iOS either.
- Files keep their owners: `react-native-image-picker@^8.2` for avatars, `@react-native-documents/picker@^12` for
  xlsx/csv and recordings, `react-native-blob-util@^0.25` for both authenticated downloads.
- Windows is a decision, not a build. No `react-native-windows` dependency enters `package.json`.
- Style per docs/CODING_STYLE.md: 4-space indent, no semicolons, double quotes, `function` declarations, `@/` imports,
  files under 250 lines.

## Steps
1. On the Mac: `bundle install`, then `cd ios && bundle exec pod install`. Fix pod resolution one package at a time,
   starting with `react-native-svg` — nothing renders without it.
2. `npm run ios` on a simulator and get to the Login screen. Log in against the dev API and confirm the Keychain entry
   survives a cold restart.
3. Add the `Info.plist` usage strings and `LSApplicationQueriesSchemes`, rebuild, and walk the Lead Sources Today list:
   tap Call, tap the WhatsApp phone row, tap the email row.
4. Walk the file paths: pick an avatar through PHPicker and save it; upload a seeded `.xlsx` sheet; download the blank
   template and one upload report, and confirm both open in Numbers or Files rather than showing a JSON error body.
5. Open the charts screen from session 20 and the sheets from session 21 — gifted-charts and `@gorhom/bottom-sheet` are
   the two most likely native failures.
6. Check safe areas on a notched device: tab bar, FABs, sheets and the notification inbox.
7. `grep -rn "Platform.OS" src/` and move every hit out of `src/screens/` into `src/components/ui/` or `src/lib/`;
   record the final list in `docs/WINDOWS.md`.
8. Run both Maestro flows on iOS, then `npm run lint` and `npx tsc --noEmit`.
9. Write `docs/WINDOWS.md` and update `docs/OVERVIEW.md` §2, §9 and §10.

## Definition of done
- [ ] `bundle exec pod install` completes with no unresolved pods, and `npm run ios` installs and launches the app.
- [ ] Login against the dev API works, the JWT is read from Keychain after a cold restart, and logout clears it.
- [ ] Tapping Call opens the iOS dialer with the formatted number; the phone row opens WhatsApp; the email row opens Mail.
- [ ] The avatar picker returns an image from PHPicker and the profile screen shows the new avatar after save.
- [ ] A sheet upload completes and both `.xlsx` downloads land in Documents and open through the share sheet.
- [ ] The overall-stats charts and at least one bottom sheet render correctly on the simulator.
- [ ] Tab bar, FABs and sheets clear the home indicator on a notched device.
- [ ] `grep -rn "Platform.OS" src/screens/` returns nothing.
- [ ] Both `.maestro` flows pass against the iOS build.
- [ ] `npm run lint` and `npx tsc --noEmit` pass.
- [ ] `docs/WINDOWS.md` exists with the RNW version evidence, the web-app decision, the Tauri/Electron note and the
      re-open conditions, and `docs/OVERVIEW.md` links to it.

## When you are done
Write a short summary: files added or changed, what works on the device, anything deferred, and any blocker. Then stop.

--- FOLLOW-UP (paste only if the session stopped early) ---

Continue session 24. If a pod fails to build on RN 0.87's New Architecture, name the package and the exact compiler
error, try the package's latest release, and if it still fails isolate it behind a `Platform.select` stub in
`src/components/ui/` so the rest of the app runs on iOS while that one feature stays Android-only — then record it in
the summary. If no Mac is available, do the Windows half first: write `docs/WINDOWS.md`, run the `Platform.OS` audit,
update `docs/OVERVIEW.md`, and list the exact iOS steps left.
