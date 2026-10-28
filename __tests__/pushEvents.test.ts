import { AppState, Linking } from "react-native"

import { handleInitialNotification, handleNotificationEvent, setPushAppReady } from "@/lib/push/events"

import { installFetchMock, respond, routeFetch, type FetchMock } from "../jest/appHarness"

const { scheduledTriggers, displayedNotifications } = jest.requireMock("react-native-notify-kit") as {
    scheduledTriggers: Map<string, { notification: { title?: string }; trigger: { timestamp: number } }>
    displayedNotifications: Map<string, unknown>
}

jest.useFakeTimers({ now: new Date(2026, 9, 6, 10, 0, 0) })

const PRESS = 1
const ACTION_PRESS = 2
const SOURCE_URL = "/admin/operations/lead-sources/64b7f0c2a1b2c3d4e5f60001"
const LEAD_ID = "65a1b2c3d4e5f60718293a4b"

const reminder = {
    id: "callback-64b7f0c2a1b2c3d4e5f60001",
    title: "Call back Priya Sharma",
    body: "+91 98765 43210 · no notes yet",
    data: { url: SOURCE_URL, local: "1", name: "Priya Sharma", phone: "+919876543210", region: "IN" },
}

let fetchMock: FetchMock

function setAppState(state: string) {
    Object.defineProperty(AppState, "currentState", { value: state, configurable: true })
}

async function settle() {
    for (let i = 0; i < 5; i += 1) await Promise.resolve()
}

beforeEach(() => {
    jest.clearAllMocks()
    // Each case presses at a new time, so the repeat guard only catches the case that tests it.
    jest.advanceTimersByTime(60_000)
    scheduledTriggers.clear()
    displayedNotifications.clear()
    fetchMock = installFetchMock()
    ;(Linking.openURL as jest.Mock).mockResolvedValue(undefined)
    setAppState("active")
    setPushAppReady(true)
})

describe("handleNotificationEvent", () => {
    it("snoozes a reminder without opening anything or dialing", async () => {
        displayedNotifications.set(reminder.id, reminder)
        await handleNotificationEvent({
            type: ACTION_PRESS,
            detail: { notification: reminder, pressAction: { id: "snooze" } },
        })

        expect(displayedNotifications.has(reminder.id)).toBe(false)
        expect(scheduledTriggers.get(reminder.id)?.trigger.timestamp).toBe(Date.now() + 15 * 60 * 1000)
        expect(Linking.openURL).not.toHaveBeenCalled()
    })

    it("dials a reminder's number from Call, once, even when the press arrives twice", async () => {
        const event = { type: ACTION_PRESS, detail: { notification: reminder, pressAction: { id: "call" } } }
        await handleNotificationEvent(event)
        await handleNotificationEvent(event)

        expect(Linking.openURL).toHaveBeenCalledTimes(1)
        expect(Linking.openURL).toHaveBeenCalledWith("tel:+919876543210")
    })

    it("holds a Call pressed with the app closed until the app is on screen", async () => {
        setAppState("background")
        await handleNotificationEvent({
            type: ACTION_PRESS,
            detail: { notification: reminder, pressAction: { id: "call" } },
        })
        expect(Linking.openURL).not.toHaveBeenCalled()

        setAppState("active")
        setPushAppReady(true)
        expect(Linking.openURL).toHaveBeenCalledWith("tel:+919876543210")
    })

    it("looks up a new lead's number for Call, since a push never carries one", async () => {
        routeFetch(fetchMock, [
            {
                path: `/api/admin/operations/leads/${LEAD_ID}`,
                reply: () =>
                    respond(200, {
                        success: true,
                        data: { lead: { _id: LEAD_ID, name: "Arjun", phone: "+919000012345" } },
                    }),
            },
        ])
        await handleNotificationEvent({
            type: ACTION_PRESS,
            detail: {
                notification: {
                    id: `new_leads-${LEAD_ID}`,
                    title: "New lead from Arjun",
                    data: { url: `/admin/operations/leads/${LEAD_ID}`, channel: "30", entityId: LEAD_ID },
                },
                pressAction: { id: "call" },
            },
        })
        await settle()

        expect(Linking.openURL).toHaveBeenCalledWith("tel:+919000012345")
    })

    it("does nothing for a dismissed notification", async () => {
        await handleNotificationEvent({ type: 0, detail: { notification: reminder } })
        expect(Linking.openURL).not.toHaveBeenCalled()
        expect(scheduledTriggers.size).toBe(0)
    })
})

describe("handleInitialNotification", () => {
    it("treats the press that opened the app like any other: Call still dials", async () => {
        await handleInitialNotification({ notification: reminder, pressAction: { id: "call" } })
        expect(Linking.openURL).toHaveBeenCalledWith("tel:+919876543210")
    })

    it("opens on a plain tap without dialing", async () => {
        await handleInitialNotification({ notification: reminder, pressAction: { id: "default" } })
        await handleNotificationEvent({ type: PRESS, detail: { notification: reminder } })
        expect(Linking.openURL).not.toHaveBeenCalled()
    })
})
