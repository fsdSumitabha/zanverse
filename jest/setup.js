/* eslint-env jest */
// Native modules have no JS fallback under Jest. Each mock returns what the spike checks read.
import "react-native-gesture-handler/jestSetup"

// The NativeWind preset reads this to emit native styles, not web ones. Metro sets it per platform; tests use Android.
process.env.NATIVEWIND_OS = "android"

jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default)

jest.mock("@react-native-community/netinfo", () => require("@react-native-community/netinfo/jest/netinfo-mock.js"))

jest.mock("react-native-keychain", () => ({
    getSupportedBiometryType: jest.fn(() => Promise.resolve(null)),
}))

jest.mock("react-native-blob-util", () => ({
    fs: {
        dirs: { CacheDir: "/data/user/0/com.zanverse/cache" },
        exists: jest.fn(() => Promise.resolve(true)),
    },
}))

// The real module calls TurboModuleRegistry.getEnforcing at import time.
jest.mock("@react-native-documents/picker", () => ({
    pick: jest.fn(),
    errorCodes: { OPERATION_CANCELED: "OPERATION_CANCELED" },
    isErrorWithCode: jest.fn(() => false),
}))

// MMKV switches to its own in-memory mock under Jest, but still imports Nitro, which needs its native module.
jest.mock("react-native-nitro-modules", () => ({
    NitroModules: { createHybridObject: jest.fn() },
}))
