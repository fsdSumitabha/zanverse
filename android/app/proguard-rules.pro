# Keep rules for the release build (R8 on since session 22).
#
# The rule for this file: a rule goes in only after the release walk in prompts/README.md "Session 22 — release"
# crashed without it. Each rule gets one comment line naming the screen that broke, so a later reader knows why it
# exists and can test removing it.
#
# React Native, Hermes and every native library in package.json ship their own consumer rules inside their AARs
# (react-android, hermes-android, keychain, mmkv/nitro, blob-util, image-picker, documents picker, netinfo, svg,
# reanimated/worklets, gesture-handler, screens, Sentry), and R8 applies those on its own. Nothing is listed below
# until the walk proves a gap.
#
# How to find a missing rule: install the release APK with `adb logcat *:E` attached, walk the app, and read the
# ClassNotFoundException or NoSuchMethodException. Add a targeted -keep for that class here, with its screen.

# Add project specific keep options here:
