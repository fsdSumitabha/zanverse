/* eslint-env jest */
// Native modules have no JS fallback under Jest. Each mock returns what the spike checks read.
import "react-native-gesture-handler/jestSetup"

// The NativeWind preset reads this to emit native styles, not web ones. Metro sets it per platform; tests use Android.
process.env.NATIVEWIND_OS = "android"

jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default)

jest.mock("@react-native-community/netinfo", () => require("@react-native-community/netinfo/jest/netinfo-mock.js"))

// An in-memory keystore with the calls src/store/keychain.ts makes, keyed by service as the real module is.
jest.mock("react-native-keychain", () => {
    const entries = new Map()
    return {
        ACCESSIBLE: { AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: "AccessibleAfterFirstUnlockThisDeviceOnly" },
        getSupportedBiometryType: jest.fn(() => Promise.resolve(null)),
        setGenericPassword: jest.fn((username, password, options = {}) => {
            const service = options.service ?? "default"
            entries.set(service, { username, password, service, storage: "KC" })
            return Promise.resolve({ service, storage: "KC" })
        }),
        getGenericPassword: jest.fn((options = {}) =>
            Promise.resolve(entries.get(options.service ?? "default") ?? false),
        ),
        resetGenericPassword: jest.fn((options = {}) => Promise.resolve(entries.delete(options.service ?? "default"))),
    }
})

// Tests that upload or download give `fetch` and `config` their own implementations.
jest.mock("react-native-blob-util", () => ({
    fs: {
        dirs: { CacheDir: "/data/user/0/com.zanverse/cache" },
        exists: jest.fn(() => Promise.resolve(true)),
        readFile: jest.fn(() => Promise.resolve("")),
        unlink: jest.fn(() => Promise.resolve()),
    },
    wrap: jest.fn((path) => `RNFetchBlob-file://${path}`),
    fetch: jest.fn(),
    config: jest.fn(),
    android: { actionViewIntent: jest.fn(() => Promise.resolve(true)) },
    ios: { openDocument: jest.fn(() => Promise.resolve()) },
}))

// The real module calls TurboModuleRegistry.getEnforcing at import time.
jest.mock("@react-native-documents/picker", () => ({
    pick: jest.fn(),
    keepLocalCopy: jest.fn(),
    errorCodes: { OPERATION_CANCELED: "OPERATION_CANCELED" },
    isErrorWithCode: jest.fn(() => false),
}))

// MMKV switches to its own in-memory mock under Jest, but still imports Nitro, which needs its native module.
jest.mock("react-native-nitro-modules", () => ({
    NitroModules: { createHybridObject: jest.fn() },
}))

jest.mock("@react-native-clipboard/clipboard", () =>
    require("@react-native-clipboard/clipboard/jest/clipboard-mock.js"),
)
