# Windows: the decision

**Decision: on Windows, staff use the existing web app in a browser.** There is no Windows build of this app in this
phase, and no `react-native-windows` dependency enters `package.json`. Recorded in session 24, 2026-10-06.

## Why

1. **No React Native for Windows release matches this app's React Native.** The app is on React Native 0.87.1. On npm
   on 2026-10-06:
   - The newest stable `react-native-windows` is **0.84.0**, and it declares a peer dependency of
     `react-native: 0.84.1`.
   - The newest preview is **0.85.0-preview.2**.
   - There is no 0.86 or 0.87 line.
   - A Windows build would mean either moving the whole app back three React Native versions, or running an
     unsupported pairing. Neither is worth it for this phase.
2. **The Windows surface already exists.** The web app (`github.com/fsdSumitabha/zan-workspace`, read here at
   `reference/zan-workspace`) is the CRM itself. It runs in any Windows browser against the same API, with the same
   region rules, the same role rules and the same screens.
   - The mobile app is a second client of that API, not a replacement for it.
   - The one thing a phone adds, tap-to-dial, has no meaning on a desktop.
3. **This repo has no `windows/` folder, and it will not get one this phase.**

## If a taskbar icon is wanted

Wrap the web app, not this one. A **Tauri** shell (small, uses the system WebView2) or an **Electron** shell around
the deployed web app gives:
- a taskbar icon;
- a window that remembers its size;
- a single sign-on cookie.

It buys packaging, not features. It needs no change to the API and no code from this repo.

## The precondition this repo keeps

If Windows is reopened, the shared `src/` must not need a rewrite. So every platform branch lives in
`src/components/ui/` or `src/lib/`, and none in `src/screens/`. The audit on 2026-10-06
(`grep -rn "Platform.OS" src/`):

| File | What branches |
|---|---|
| `src/components/ui/DateTimeField.tsx` | Android system dialogs, or the iOS inline picker in a sheet |
| `src/lib/pickDateTime.ts` | `hasSystemDateDialogs()`: the one question `CallbackPicker` and `DateField` ask |
| `src/lib/downloadFile.ts` | Android: cache + open-with intent. iOS: Documents + the preview with Share |
| `src/lib/push/token.ts` | the `platform` sent with the push token |
| `src/api/endpoints.ts` | the dev host: `10.0.2.2` from the Android emulator, `localhost` from the iOS simulator |

`grep -rn "Platform.OS" src/screens/` returns nothing. Session 24 moved the last two branches outside `ui/` and
`lib/`: the date-dialog checks in `src/components/leadSources/CallbackPicker.tsx` and
`src/components/list/DateField.tsx` moved into `src/lib/pickDateTime.ts`.

## When to reopen

Reopen this decision when both hold:

1. **React Native for Windows ships a stable release for the React Native version this app is on** (0.87 today, or
   whatever it is by then). Check `npm view react-native-windows dist-tags` and the release's peer dependency on
   `react-native`.
2. **The audit above still holds.** No `Platform.OS` in `src/screens/`, and every native library the app uses has a
   Windows implementation. The likely gaps are Keychain, MMKV, the document picker, blob-util and Notifee.

Until then, the answer for a Windows desk is the web app.
