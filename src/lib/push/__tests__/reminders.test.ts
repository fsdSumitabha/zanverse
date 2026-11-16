import { Alert, Platform } from "react-native"
import notifee from "react-native-notify-kit"

import {
    cancelAllCallbackReminders,
    cancelCallbackReminder,
    clearPhoneNotifications,
    scheduleCallbackReminder,
    snoozeCallbackReminder,
    syncCallbackReminders,
} from "@/lib/push/reminders"
import { clearAll, saveRemindersEnabled } from "@/store/mmkv"

// The Jest stand-in keeps what is scheduled (jest/notifyKitMock.js).
const { scheduledTriggers, displayedNotifications } = jest.requireMock("react-native-notify-kit") as {
    scheduledTriggers: Map<string, { notification: Record<string, unknown>; trigger: Record<string, unknown> }>
    displayedNotifications: Map<string, unknown>
}
const mocked = notifee as jest.Mocked<typeof notifee>

jest.useFakeTimers({ now: new Date(2026, 9, 6, 10, 0, 0) })

const IN_TWO_HOURS = new Date(2026, 9, 6, 12, 0, 0).toISOString()
const REMINDER_ID = "callback-64b7f0c2a1b2c3d4e5f60001"
const REMINDER_ANDROID = {
    channelId: "callbacks",
    smallIcon: "ic_notification",
    color: "#183668",
    visibility: 1,
    pressAction: { id: "default", launchActivity: "default" },
    actions: [
        { title: "Call", pressAction: { id: "call", launchActivity: "default" } },
        { title: "Snooze 15 min", pressAction: { id: "snooze" } },
    ],
}

function getAndroid(body: string) {
    return { ...REMINDER_ANDROID, style: { type: 1, text: body } }
}

function makeRow(overrides: object = {}) {
    return {
        _id: "64b7f0c2a1b2c3d4e5f60001",
        name: "Priya Sharma",
        phone: "+919876543210",
        region: "IN",
        status: 30,
        callbackAt: IN_TWO_HOURS,
        lastNote: "",
        ...overrides,
    }
}

beforeEach(() => {
    jest.clearAllMocks()
    scheduledTriggers.clear()
    displayedNotifications.clear()
    clearAll()
    saveRemindersEnabled(true)
})

describe("scheduleCallbackReminder", () => {
    it("sets a high-priority reminder at the callback time, with Call and Snooze, that opens the source", async () => {
        await scheduleCallbackReminder(makeRow({ lastNote: "Asked for the owner" }))

        const entry = scheduledTriggers.get(REMINDER_ID)
        expect(entry?.notification).toEqual({
            id: REMINDER_ID,
            title: "Call back Priya Sharma",
            subtitle: "Callback reminders",
            body: "+91 98765 43210 · Asked for the owner",
            data: {
                url: "/admin/operations/lead-sources/64b7f0c2a1b2c3d4e5f60001",
                local: "1",
                name: "Priya Sharma",
                phone: "+919876543210",
                region: "IN",
            },
            android: getAndroid("+91 98765 43210 · Asked for the owner"),
        })
        expect(entry?.trigger).toEqual({
            type: 0,
            timestamp: new Date(IN_TWO_HOURS).getTime(),
            alarmManager: { type: 3 },
        })
        expect(mocked.createChannel).toHaveBeenCalledWith(expect.objectContaining({ id: "callbacks", importance: 4 }))
    })

    it("says no notes yet, and asks for an exact alarm whatever the permission: notify-kit falls back", async () => {
        mocked.getNotificationSettings.mockResolvedValueOnce({ authorizationStatus: 1, android: { alarm: 0 } } as never)
        await scheduleCallbackReminder(makeRow())

        const entry = scheduledTriggers.get(REMINDER_ID)
        expect(entry?.notification.body).toBe("+91 98765 43210 · no notes yet")
        expect(entry?.trigger.alarmManager).toEqual({ type: 3 })
    })

    it("removes the reminder for a cleared, past or converted callback", async () => {
        for (const overrides of [
            { callbackAt: null, status: 40 },
            { callbackAt: new Date(2026, 9, 6, 9, 0).toISOString() },
            { status: 70 },
        ]) {
            await scheduleCallbackReminder(makeRow())
            expect(scheduledTriggers.size).toBe(1)
            await scheduleCallbackReminder(makeRow(overrides))
            expect(scheduledTriggers.size).toBe(0)
        }
    })

    it("asks for the permission once, on the first callback saved", async () => {
        await scheduleCallbackReminder(makeRow(), { askPermission: true })
        await scheduleCallbackReminder(makeRow(), { askPermission: true })
        expect(mocked.requestPermission).toHaveBeenCalledTimes(1)
        await scheduleCallbackReminder(makeRow())
        expect(mocked.requestPermission).toHaveBeenCalledTimes(1)
    })

    it("sets nothing while reminders are off in Profile", async () => {
        saveRemindersEnabled(false)
        await scheduleCallbackReminder(makeRow())
        expect(scheduledTriggers.size).toBe(0)
    })

    it("never throws into the save that called it", async () => {
        mocked.createTriggerNotification.mockRejectedValueOnce(new Error("no alarm access"))
        const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined)
        await expect(scheduleCallbackReminder(makeRow())).resolves.toBeUndefined()
        expect(warn).toHaveBeenCalled()
        warn.mockRestore()
    })
})

describe("syncCallbackReminders", () => {
    it("matches the reminders to a load, leaving sources outside it alone", async () => {
        await scheduleCallbackReminder(makeRow({ _id: "64b7f0c2a1b2c3d4e5f60002" }))
        await scheduleCallbackReminder(makeRow({ _id: "64b7f0c2a1b2c3d4e5f60009" }))

        await syncCallbackReminders([
            makeRow(),
            makeRow({ _id: "64b7f0c2a1b2c3d4e5f60002", callbackAt: null, status: 20 }),
        ])

        expect([...scheduledTriggers.keys()].sort()).toEqual([
            "callback-64b7f0c2a1b2c3d4e5f60001",
            "callback-64b7f0c2a1b2c3d4e5f60009",
        ])
    })
})

describe("cancelling", () => {
    it("cancels one, or every callback reminder and nothing else", async () => {
        await scheduleCallbackReminder(makeRow())
        await scheduleCallbackReminder(makeRow({ _id: "64b7f0c2a1b2c3d4e5f60002" }))
        scheduledTriggers.set("other", { notification: {}, trigger: {} })

        await cancelCallbackReminder("64b7f0c2a1b2c3d4e5f60001")
        expect([...scheduledTriggers.keys()].sort()).toEqual(["callback-64b7f0c2a1b2c3d4e5f60002", "other"])
        await cancelAllCallbackReminders()
        expect([...scheduledTriggers.keys()]).toEqual(["other"])
    })
})

describe("snooze", () => {
    it("takes the reminder out of the tray and rings it again in 15 minutes, buttons and all", async () => {
        displayedNotifications.set(REMINDER_ID, {})
        await snoozeCallbackReminder({
            id: REMINDER_ID,
            title: "Call back Priya Sharma",
            body: "+91 98765 43210 · no notes yet",
            data: {
                url: "/admin/operations/lead-sources/64b7f0c2a1b2c3d4e5f60001",
                local: "1",
                phone: "+919876543210",
            },
        })

        expect(displayedNotifications.has(REMINDER_ID)).toBe(false)
        const entry = scheduledTriggers.get(REMINDER_ID)
        expect(entry?.notification).toEqual(
            expect.objectContaining({
                title: "Call back Priya Sharma",
                android: getAndroid("+91 98765 43210 · no notes yet"),
            }),
        )
        expect(entry?.trigger).toEqual({ type: 0, timestamp: Date.now() + 15 * 60 * 1000, alarmManager: { type: 3 } })
    })
})

describe("exact alarms on Android", () => {
    it("asks once, after the reminder is set, and only when notifications can show", async () => {
        const os = jest.replaceProperty(Platform, "OS", "android")
        const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined)
        const exactOff = { authorizationStatus: 1, android: { alarm: 0 } } as never
        const denied = { authorizationStatus: 0, android: { alarm: 0 } } as never

        // Notifications are off, so a late ring is not the problem yet.
        mocked.getNotificationSettings.mockResolvedValue(denied)
        mocked.requestPermission.mockResolvedValue(denied)
        await scheduleCallbackReminder(makeRow(), { askPermission: true })
        expect(alert).not.toHaveBeenCalled()

        // A reminder set by a list load, not by the person saving a callback, never asks.
        mocked.getNotificationSettings.mockResolvedValue(exactOff)
        await scheduleCallbackReminder(makeRow())
        expect(alert).not.toHaveBeenCalled()

        await scheduleCallbackReminder(makeRow(), { askPermission: true })
        expect(scheduledTriggers.has(REMINDER_ID)).toBe(true)
        expect(alert).toHaveBeenCalledTimes(1)
        expect(alert).toHaveBeenCalledWith("Ring callbacks on time?", expect.any(String), expect.any(Array))

        await scheduleCallbackReminder(makeRow(), { askPermission: true })
        expect(alert).toHaveBeenCalledTimes(1)

        mocked.getNotificationSettings.mockReset()
        mocked.getNotificationSettings.mockResolvedValue({ authorizationStatus: 1, android: { alarm: 1 } } as never)
        mocked.requestPermission.mockReset()
        mocked.requestPermission.mockResolvedValue({ authorizationStatus: 1 } as never)
        alert.mockRestore()
        os.restore()
    })
})

describe("typed text on Android", () => {
    it("escapes a reminder once, and a snooze does not escape it again", async () => {
        const os = jest.replaceProperty(Platform, "OS", "android")
        await scheduleCallbackReminder(makeRow({ name: "A&B Traders", lastNote: "Price<budget" }))

        const first = scheduledTriggers.get(REMINDER_ID)?.notification as { title: string; body: string; data: object }
        expect(first.title).toBe("Call back A&amp;B Traders")
        expect(first.body).toBe("+91 98765 43210 · Price&lt;budget")

        // A press hands back the text the reminder was built with.
        await snoozeCallbackReminder({
            id: REMINDER_ID,
            title: first.title,
            body: first.body,
            data: first.data as never,
        })
        expect(scheduledTriggers.get(REMINDER_ID)?.notification.title).toBe("Call back A&amp;B Traders")
        os.restore()
    })
})

describe("logout", () => {
    it("clears the tray and every reminder still to ring", async () => {
        await scheduleCallbackReminder(makeRow())
        displayedNotifications.set("new_leads-1", {})

        await clearPhoneNotifications()
        expect(scheduledTriggers.size).toBe(0)
        expect(displayedNotifications.size).toBe(0)
    })
})
