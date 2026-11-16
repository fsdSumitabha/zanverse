# Keep rules for the release build (R8 on since session 22).
#
# The rule for this file: a rule goes in only after the release walk in prompts/README.md "Session 22 — release"
# crashed without it. Each rule gets one comment line naming the screen that broke, so a later reader knows why it
# exists and can test removing it.
#
# React Native, Hermes and every native library in package.json ship their own consumer rules inside their AARs
# (react-android, hermes-android, keychain, mmkv/nitro, blob-util, image-picker, documents picker, netinfo, svg,
# reanimated/worklets, gesture-handler, screens, Sentry), and R8 applies those on its own. The only rules below are the
# Firebase and Notifee ones at the end, added on the session 23 prompt's request and explained there.
#
# How to find a missing rule: install the release APK with `adb logcat *:E` attached, walk the app, and read the
# ClassNotFoundException or NoSuchMethodException. Add a targeted -keep for that class here, with its screen.

# Add project specific keep options here:

# Session 23 asked for Firebase and Notifee rules up front, because the release build is the only place a gap shows.
# Both libraries also ship consumer rules; these name the classes Android starts by name from the merged manifest
# (the messaging service, Notifee's receivers and its WorkManager workers). Not yet proven by the release walk: if the
# walk shows reminders and pushes working without them, they can go.
-keep class io.invertase.firebase.messaging.** { *; }
-keep class io.invertase.notifee.** { *; }
-keep class app.notifee.core.** { *; }
