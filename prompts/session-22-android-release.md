# Session 22 — Android release build and CI

At the end you have a signed, minified release AAB that a tester installs from the Play internal track, built by a GitHub Actions job, with two Maestro flows guarding the journeys the team actually uses.

---

Session 22 — Android release build and CI.

Read docs/OVERVIEW.md §2 (Platforms), §4 (Packages — the version table is authoritative), §10 ("Distribution to staff") and §11 (risk 8: release builds differ from debug).
Reference (read-only): D:\zan-workspace — `src/components/admin/operations/lead-sources/StatusMenu.tsx` and `LeadSourceRow.tsx` (the status save the first Maestro flow drives), `src/components/admin/operations/lead-sources/UploadForm.tsx` and `src/app/admin/operations/lead-sources/uploads/[uploadId]/page.tsx` (the upload → report journey the second flow drives).

## Goal

The app ships. `./gradlew bundleRelease` produces a signed AAB with R8 on, that AAB is smoke-tested on a real device or
emulator before it goes anywhere, and a GitHub Actions workflow builds it on every tag and uploads it to the Play
internal testing track. Two Maestro flows prove the login → status save and manager upload → report journeys still work.

## Scope

- `android/app/` release signing: an upload keystore generated with `keytool` (RSA 2048, 10000 days), stored outside git,
  with `MYAPP_UPLOAD_STORE_FILE`, `MYAPP_UPLOAD_KEY_ALIAS`, `MYAPP_UPLOAD_STORE_PASSWORD`, `MYAPP_UPLOAD_KEY_PASSWORD`
  read from `~/.gradle/gradle.properties` locally and from env/secrets in CI; `.gitignore` covers `*.keystore`,
  `*.jks` and `android/keystore.properties`.
- `android/app/build.gradle`: a `signingConfigs.release` block that falls back to debug signing when the properties are
  absent (so a fresh clone still builds), `buildTypes.release` using it, `minifyEnabled true` + `shrinkResources true`
  with `proguard-android-optimize.txt` and RN's bundled `proguard-rules.pro`.
- `android/app/proguard-rules.pro`: keep rules for every reflective native module in use — Hermes, Keychain, MMKV,
  blob-util, image-picker, documents picker, netinfo, svg, gifted-charts, reanimated/worklets, Sentry — added only where
  the smoke test proves they are needed, each with a one-line comment saying which screen broke without it.
- Versioning: `versionName` read from `package.json` and `versionCode` from `System.getenv("BUILD_NUMBER")` with a local
  fallback of `1`, both in `android/app/build.gradle`.
- `android/app/src/main/AndroidManifest.xml` holds no `usesCleartextTraffic`; the dev-only HTTP exception lives in
  `android/app/src/debug/AndroidManifest.xml` so the release build is HTTPS-only against the production `API_BASE_URL`.
- `android/app/build.gradle` `reactNativeArchitectures` for release limited to `arm64-v8a,armeabi-v7a` (the emulator
  x86 builds stay on the debug path).
- `.github/workflows/android-release.yml`: ubuntu-latest, `actions/checkout`, `actions/setup-node` with npm cache,
  `actions/setup-java@v4` with Temurin JDK 17, `gradle/actions/setup-gradle` for the Gradle cache, `npm ci`,
  `npm run lint`, `npx tsc --noEmit`, keystore decoded from a base64 secret, `./gradlew bundleRelease`, artifact upload,
  then `r0adkll/upload-google-play` to the `internal` track on a `v*` tag.
- `.maestro/login-status-save.yaml` — launch, log in as a WORK-role test user, land on the Lead Sources Today list, open
  a row's `StatusMenu`, pick "Not Reached", type a note, save, assert the badge changed.
- `.maestro/upload-report.yaml` — log in as a MANAGE-role user (role 10/15/45/69), open "Upload sheet", pick a seeded
  `.xlsx`, upload, assert the report screen shows the four tiles (Rows read / Imported / With warnings / Skipped).
- `testID` props added to exactly the elements those two flows need, named after the component
  (`loginEmail`, `loginPassword`, `loginSubmit`, `leadSourceRow`, `statusMenuTrigger`, `statusOption-20`,
  `statusNote`, `statusSave`, `uploadSheetButton`, `uploadSubmit`, `reportTileImported`).
- `prompts/README.md` gets a "Session 22 — release" section: keystore location, the secret names, the Play track, and
  every ProGuard keep rule with its reason.

## Already decided (follow these)

- Android is the only target this session; iOS is session 24 and `react-native-windows` is out (OVERVIEW §2).
- Distribution is the Play Store internal testing track with Play App Signing on — upload key stays local and in CI
  secrets, Google holds the app signing key (OVERVIEW §10).
- New Architecture, Hermes and edge-to-edge stay on (`android/gradle.properties`: `newArchEnabled=true`,
  `hermesEnabled=true`, `edgeToEdgeEnabled=true`). Nothing in this session turns one off to make a build pass.
- `@sentry/react-native@^7` is already wired in session 21 — this session only adds its Gradle source-map upload and
  keeps the `SENTRY_AUTH_TOKEN` in CI secrets.
- The JWT lives in `react-native-keychain@^10` and MMKV holds the region-keyed cache — both are reflective and are the
  first suspects if release behaves differently from debug.
- `API_BASE_URL` comes from `src/api/endpoints.ts` (session 4); release points at the production HTTPS host, debug keeps
  `http://10.0.2.2:3000`.
- 4-space indent, no semicolons, double quotes in TypeScript; Gradle and YAML follow their own conventions.

## Steps

1. Generate the upload keystore with `keytool -genkeypair -v -storetype PKCS12 -keystore zanverse-upload.keystore
   -alias zanverse-upload -keyalg RSA -keysize 2048 -validity 10000`, store it outside the repo, and put the four
   properties in `~/.gradle/gradle.properties`.
2. Add `signingConfigs.release` and point `buildTypes.release` at it. Run `./gradlew assembleRelease` with R8 still off
   and install the APK — this isolates signing from minification.
3. Turn on `minifyEnabled` and `shrinkResources`, rebuild, install, and **walk the app**: login, Lead Sources Today,
   status save, callback picker, lead detail, notifications, overall-stats charts, profile avatar upload, an xlsx
   download. Every crash here is a missing keep rule — read the stack trace, add the rule, rebuild.
4. Move the HTTP exception to `android/app/src/debug/AndroidManifest.xml`, confirm the release build talks to the
   production host over HTTPS and that `npm run android` (debug) still reaches `10.0.2.2`.
5. Wire `versionCode`/`versionName` from env + `package.json`, limit release ABIs to arm64-v8a and armeabi-v7a, and run
   `./gradlew bundleRelease`. Note the AAB size before and after the ABI change.
6. Upload that AAB by hand once to the Play Console internal track, accept Play App Signing, and install it on a device
   from the tester link — this proves the key and the track before CI touches them.
7. Write `.github/workflows/android-release.yml`, add the secrets (`ANDROID_KEYSTORE_BASE64`, the four signing values,
   `PLAY_SERVICE_ACCOUNT_JSON`, `SENTRY_AUTH_TOKEN`), then tell me to push a tag so it builds and uploads.
8. Install Maestro, add the `testID`s, write the two flows, and run `maestro test .maestro/` against a release build on
   a device.

## Definition of done

- [ ] `./gradlew bundleRelease` produces `android/app/build/outputs/bundle/release/app-release.aab`, signed with the
      upload key (`jarsigner -verify` or `bundletool` confirms the signer).
- [ ] No keystore, `.jks` or password appears in `git status` or in the repo history for this session's commits.
- [ ] The minified release build installs and the full walk in step 3 completes with no crash and no blank screen; the
      status save, the charts and the xlsx download all work.
- [ ] `adb shell dumpsys package com.zanverse | grep versionCode` shows the CI build number on a CI-built artifact and
      `1` locally; `versionName` matches `package.json`.
- [ ] The release build fails to reach `http://` endpoints and succeeds against the production HTTPS API; the debug
      build still reaches `http://10.0.2.2:3000`.
- [ ] A tester installs the internal-track build from Play and logs in.
- [ ] The GitHub Actions run on a `v*` tag is green end to end: lint, `tsc --noEmit`, `bundleRelease`, Play upload.
- [ ] `maestro test .maestro/login-status-save.yaml` and `maestro test .maestro/upload-report.yaml` both pass against
      the release build.
- [ ] `npm run lint` and `npx tsc --noEmit` pass.

## When you are done

Write a short summary: files added or changed, what works on the device, anything deferred, and any blocker. Then stop.

--- FOLLOW-UP (paste only if the session stopped early) ---

Finish the Android release build. If the release APK crashes where debug does not, it is R8: run
`npx react-native run-android --mode=release` with `adb logcat *:E` attached, read the `ClassNotFoundException` or
`NoSuchMethodException`, add a targeted `-keep` rule in `android/app/proguard-rules.pro` with a comment naming the
screen, and rebuild — keep `minifyEnabled true` rather than switching it off. If the Play upload step fails, check the
service-account JSON has the "Release to testing tracks" permission and that `versionCode` is higher than the last
upload. If Maestro cannot find an element, add the missing `testID` rather than matching on visible text. Report what is
left.
