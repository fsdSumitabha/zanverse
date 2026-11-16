import notifee from "@notifee/react-native"

import {
    cancelAllCallbackReminders,
    cancelCallbackReminder,
    scheduleCallbackReminder,
    syncCallbackReminders,
} from "@/lib/push/reminders"
import { clearAll, saveRemindersEnabled } from "@/store/mmkv"

// The Jest stand-in keeps what is scheduled (jest/notifeeMock.js).
const { scheduledTriggers } = jest.requireMock("@notifee/react-native") as {
    scheduledTriggers: Map<string, { notification: Record<string, unknown>; trigger: Record<string, unknown> }>
}
const mocked = notifee as jest.Mocked<typeof notifee>

jest.useFakeTimers({ now: new Date(2026, 9, 6, 10, 0, 0) })

const IN_TWO_HOURS = new Date(2026, 9, 6, 12, 0, 0).toISOString()

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
    clearAll()
    saveRemindersEnabled(true)
})

describe("scheduleCallbackReminder", () => {
    it("sets a high-priority reminder at the callback time that opens the source", async () => {
        await scheduleCallbackReminder(makeRow({ lastNote: "Asked for the owner" }))

        const entry = scheduledTriggers.get("callback-64b7f0c2a1b2c3d4e5f60001")
        expect(entry?.notification).toEqual({
            id: "callback-64b7f0c2a1b2c3d4e5f60001",
            title: "Call back Priya Sharma",
            body: "+91 98765 43210 · Asked for the owner",
            data: { url: "/admin/operations/lead-sources/64b7f0c2a1b2c3d4e5f60001", local: "1" },
            android: { channelId: "callbacks", pressAction: { id: "default" } },
        })
        expect(entry?.trigger).toEqual({
            type: 0,
            timestamp: new Date(IN_TWO_HOURS).getTime(),
            alarmManager: { type: 3 },
        })
        expect(mocked.createChannel).toHaveBeenCalledWith(expect.objectContaining({ id: "callbacks", importance: 4 }))
    })

    it("says no notes yet, and falls back to an inexact idle alarm when exact alarms are off", async () => {
        mocked.getNotificationSettings.mockResolvedValueOnce({ authorizationStatus: 1, android: { alarm: 0 } } as never)
        await scheduleCallbackReminder(makeRow())

        const entry = scheduledTriggers.get("callback-64b7f0c2a1b2c3d4e5f60001")
        expect(entry?.notification.body).toBe("+91 98765 43210 · no notes yet")
        expect(entry?.trigger.alarmManager).toEqual({ type: 1 })
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
