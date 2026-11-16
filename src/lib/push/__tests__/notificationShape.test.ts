import type { RemoteMessage } from "@react-native-firebase/messaging"
import { Platform } from "react-native"
import notifee, { type Notification } from "react-native-notify-kit"

import { displayRemoteMessage } from "@/lib/push/remoteMessage"
import { scheduleCallbackReminder, snoozeCallbackReminder } from "@/lib/push/reminders"
import { clearAll, saveRemindersEnabled } from "@/store/mmkv"

// The stand-in (jest/notifyKitMock.js) accepts anything. These tests give what the app builds to notify-kit's own
// validators, which reject a wrong shape on the phone: an undefined groupId, a bad style, a repeated action id.
jest.replaceProperty(Platform, "OS", "android")
const { default: validateNotification } = jest.requireActual(
    "react-native-notify-kit/dist/validators/validateNotification",
) as { default: (notification: Notification) => Notification & { android: Record<string, unknown> } }

const { displayedNotifications } = jest.requireMock("react-native-notify-kit") as {
    displayedNotifications: Map<string, unknown>
}
const mocked = notifee as jest.Mocked<typeof notifee>
const CHANNELS = ["20", "30", "40", "50", "60", "70", "80", "90", "100", "990"]

function makePush(data: Record<string, string>): RemoteMessage {
    return { data, fcmOptions: {} } as RemoteMessage
}

beforeEach(() => {
    jest.clearAllMocks()
    displayedNotifications.clear()
    clearAll()
    saveRemindersEnabled(true)
})

describe("what notify-kit's validators accept", () => {
    it.each(CHANNELS)("a push on channel %s, with and without a body", async (channel) => {
        await displayRemoteMessage(
            makePush({ channel, title: "Robin added a lead: Arjun", body: "Came in via Facebook", entityId: "x1" }),
        )
        await displayRemoteMessage(makePush({ channel, title: "Robin added a lead: Arjun" }))

        for (const [notification] of mocked.displayNotification.mock.calls) {
            expect(() => validateNotification(notification)).not.toThrow()
        }
    })

    it("keeps the channel name, the whole body and the buttons of a new lead", async () => {
        await displayRemoteMessage(makePush({ channel: "30", title: "New lead: A&B", body: "x<y", entityId: "x1" }))

        const valid = validateNotification(mocked.displayNotification.mock.calls[0][0])
        expect(valid.subtitle).toBe("New leads")
        expect(valid.body).toBe("x&lt;y")
        expect(valid.android.style).toEqual({ type: 1, text: "x&lt;y" })
        expect((valid.android.actions as { title: string }[]).map((action) => action.title)).toEqual(["Call", "Open"])
    })

    it("a picture, when a push has one", async () => {
        await displayRemoteMessage(
            makePush({ channel: "100", title: "New team member", entityId: "u1", imageUrl: "https://ik.test/a.png" }),
        )
        const valid = validateNotification(mocked.displayNotification.mock.calls[0][0])
        expect(valid.android.largeIcon).toBe("https://ik.test/a.png")
        expect(valid.android.circularLargeIcon).toBe(true)
    })

    it("a bundle header", async () => {
        await displayRemoteMessage(makePush({ channel: "70", title: "One", entityId: "n1" }))
        await displayRemoteMessage(makePush({ channel: "70", title: "Two", entityId: "n2" }))

        const header = mocked.displayNotification.mock.calls
            .map(([notification]) => notification)
            .at(-1) as Notification
        expect(header.id).toBe("summary-notes")
        expect(() => validateNotification(header)).not.toThrow()
    })

    it("a callback reminder, and the same reminder after a snooze", async () => {
        await scheduleCallbackReminder({
            _id: "64b7f0c2a1b2c3d4e5f60001",
            name: "Priya Sharma",
            phone: "+919876543210",
            region: "IN",
            status: 30,
            callbackAt: new Date(Date.now() + 3_600_000).toISOString(),
            lastNote: "Asked for the owner",
        })
        const reminder = mocked.createTriggerNotification.mock.calls[0][0]
        expect(validateNotification(reminder).android.style).toEqual({
            type: 1,
            text: "+91 98765 43210 · Asked for the owner",
        })

        await snoozeCallbackReminder(reminder)
        expect(() => validateNotification(mocked.createTriggerNotification.mock.calls[1][0])).not.toThrow()
    })
})
