import type * as Permission from "@/lib/push/permission"

interface Loaded {
    permission: typeof Permission
    notifee: Record<string, jest.Mock>
    request: jest.SpyInstance
}

const DENIED = { authorizationStatus: 0, android: { alarm: 0 } }
const GRANTED = { authorizationStatus: 1, android: { alarm: 1 } }

// The push flags in MMKV ("asked", "blocked") outlive a session by design, so each test loads fresh modules: a fresh
// store, a fresh notify-kit stand-in, and a Platform set to the Android version under test.
function load(androidVersion: number | null, answer: string = "denied"): Loaded {
    jest.resetModules()
    const { Platform, PermissionsAndroid } = require("react-native")
    if (androidVersion !== null) {
        jest.replaceProperty(Platform, "OS", "android")
        jest.spyOn(Platform, "Version", "get").mockReturnValue(androidVersion)
    }
    const request = jest.spyOn(PermissionsAndroid, "request").mockResolvedValue(answer)
    return {
        permission: require("@/lib/push/permission"),
        notifee: require("react-native-notify-kit").default,
        request,
    }
}

afterEach(() => {
    jest.restoreAllMocks()
})

describe("on Android 13 and later", () => {
    it("can ask while Android still shows the dialog, and reads granted afterwards", async () => {
        const { permission, notifee, request } = load(34, "granted")
        notifee.getNotificationSettings.mockResolvedValue(DENIED)

        expect(await permission.getNotificationPermission()).toBe("can-ask")
        expect(await permission.requestNotificationPermission()).toBe("granted")
        expect(request).toHaveBeenCalledWith("android.permission.POST_NOTIFICATIONS")
    })

    it("turns the button into Open Settings once Android says never ask again", async () => {
        const { permission, notifee } = load(34, "never_ask_again")
        notifee.getNotificationSettings.mockResolvedValue(DENIED)

        expect(await permission.requestNotificationPermission()).toBe("blocked")
        expect(notifee.openNotificationSettings).not.toHaveBeenCalled()

        expect(await permission.requestNotificationPermission()).toBe("blocked")
        expect(notifee.openNotificationSettings).toHaveBeenCalledTimes(1)
    })

    it("asks at the first callback save only once, whatever the answer", async () => {
        const { permission, notifee, request } = load(34, "denied")
        notifee.getNotificationSettings.mockResolvedValue(DENIED)

        expect(await permission.ensureNotificationPermission()).toBe(false)
        expect(await permission.ensureNotificationPermission()).toBe(false)
        expect(request).toHaveBeenCalledTimes(1)
    })
})

describe("on Android 12 and older", () => {
    it("has no dialog, so notifications turned off come back only from Settings", async () => {
        const { permission, notifee, request } = load(31)
        notifee.getNotificationSettings.mockResolvedValue(DENIED)

        expect(await permission.getNotificationPermission()).toBe("blocked")
        await permission.requestNotificationPermission()
        expect(notifee.openNotificationSettings).toHaveBeenCalledTimes(1)
        expect(request).not.toHaveBeenCalled()
    })
})

describe("exact alarms", () => {
    it("reads Android's Alarms & reminders permission", async () => {
        const { permission, notifee } = load(34)
        notifee.getNotificationSettings.mockResolvedValueOnce(DENIED)
        expect(await permission.hasExactAlarms()).toBe(false)
        notifee.getNotificationSettings.mockResolvedValueOnce(GRANTED)
        expect(await permission.hasExactAlarms()).toBe(true)
    })
})
