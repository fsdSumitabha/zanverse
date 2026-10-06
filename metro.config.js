const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config")
const { withSentryConfig } = require("@sentry/react-native/metro")
const { withNativeWind } = require("nativewind/metro")

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {}

// Sentry adds a debug ID to every bundle and source map, so an uploaded map matches the release it came from.
// NativeWind stays the outer wrapper, as its docs ask.
module.exports = withNativeWind(withSentryConfig(mergeConfig(getDefaultConfig(__dirname), config)), {
    input: "./global.css",
})
