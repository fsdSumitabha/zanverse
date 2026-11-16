import type { RemoteMessage } from "@react-native-firebase/messaging"
import { Platform } from "react-native"
import notifee from "react-native-notify-kit"

import { notify } from "@/lib/notify"
import { displayRemoteMessage, showForegroundPush, syncChannelSummaries } from "@/lib/push/remoteMessage"

const { displayedNotifications, createdChannels } = jest.requireMock("react-native-notify-kit") as {
    displayedNotifications: Map<
        string,
        { title?: string; subtitle?: string; body?: string; android: Record<string, unknown> }
    >
    createdChannels: Map<string, unknown>
}
const mocked = notifee as jest.Mocked<typeof notifee>

const LEAD_ID = "65a1b2c3d4e5f60718293a4b"

function makePush(data: Record<string, string>): RemoteMessage {
    return { data, fcmOptions: {} } as RemoteMessage
}

beforeEach(() => {
    jest.clearAllMocks()
    displayedNotifications.clear()
})

afterEach(() => {
    jest.restoreAllMocks()
})

describe("displayRemoteMessage", () => {
    it("shows a new lead on its channel, once per lead, with Call and Open and no picture", async () => {
        await displayRemoteMessage(
            makePush({
                title: "New lead: Arjun Mehta",
                body: "Came in via Facebook",
                url: `/admin/operations/leads/${LEAD_ID}`,
                channel: "30",
                type: "1000",
                entityType: "0",
                entityId: LEAD_ID,
            }),
        )

        expect(createdChannels.has("new_leads")).toBe(true)
        const shown = displayedNotifications.get(`new_leads-${LEAD_ID}`)
        expect(shown?.title).toBe("New lead: Arjun Mehta")
        expect(shown?.subtitle).toBe("New leads")
        expect(shown?.body).toBe("Came in via Facebook")
        expect(shown?.android).toEqual(
            expect.objectContaining({
                channelId: "new_leads",
                groupId: "new_leads",
                smallIcon: "ic_notification",
                visibility: 1,
                pressAction: { id: "default", launchActivity: "default" },
                actions: [
                    { title: "Call", pressAction: { id: "call", launchActivity: "default" } },
                    { title: "Open", pressAction: { id: "default", launchActivity: "default" } },
                ],
            }),
        )
        expect(shown?.android).not.toHaveProperty("largeIcon")
        // Opening it shows the whole body. Without this style Android keeps it to one line.
        expect(shown?.android.style).toEqual({ type: 1, text: "Came in via Facebook" })
        // One notification is its own: no bundle header yet.
        expect(displayedNotifications.has("summary-new_leads")).toBe(false)
    })

    it("replaces the last update about the same record instead of stacking", async () => {
        const push = { channel: "60", entityId: LEAD_ID, url: `/admin/operations/leads/${LEAD_ID}` }
        await displayRemoteMessage(makePush({ ...push, title: "Robin moved Acme to Contacted" }))
        await displayRemoteMessage(makePush({ ...push, title: "Robin moved Acme to Discussion" }))

        expect(displayedNotifications.get(`stage_changes-${LEAD_ID}`)?.title).toBe("Robin moved Acme to Discussion")
        expect(displayedNotifications.get(`stage_changes-${LEAD_ID}`)?.android.actions).toBeUndefined()
        expect(displayedNotifications.has("summary-stage_changes")).toBe(false)
    })

    it("bundles a channel under its name from the second notification, and drops the header when the tray empties", async () => {
        await displayRemoteMessage(makePush({ channel: "70", title: "Robin added a note on Kaveri", entityId: "n1" }))
        await displayRemoteMessage(makePush({ channel: "70", title: "Asha added a note on Delta", entityId: "n2" }))

        // The header is titled with the channel's name and never rings itself.
        const header = displayedNotifications.get("summary-notes")
        expect(header?.title).toBe("Notes")
        expect(header?.android).toEqual(
            expect.objectContaining({
                channelId: "notes",
                groupId: "notes",
                groupSummary: true,
                groupAlertBehavior: 2,
            }),
        )

        displayedNotifications.delete("notes-n1")
        displayedNotifications.delete("notes-n2")
        await syncChannelSummaries()
        expect(displayedNotifications.has("summary-notes")).toBe(false)
    })

    it("shows a picture only when the push carries imageUrl", async () => {
        await displayRemoteMessage(
            makePush({ channel: "100", title: "New team member", entityId: "u1", imageUrl: "https://ik.test/a.png" }),
        )
        expect(displayedNotifications.get("general-u1")?.android).toEqual(
            expect.objectContaining({ largeIcon: "https://ik.test/a.png", circularLargeIcon: true }),
        )
    })

    it("puts a test push, or a channel it does not know, on General", async () => {
        await displayRemoteMessage(makePush({ title: "Test notification" }))
        await displayRemoteMessage(makePush({ title: "From a newer server", channel: "990" }))

        // The two pushes, then General's bundle header once it holds two.
        const channels = mocked.displayNotification.mock.calls.map(([n]) => n.android?.channelId)
        expect(channels).toEqual(["general", "general", "general"])
    })

    it("has no expanded style when a push has no body", async () => {
        await displayRemoteMessage(makePush({ channel: "40", title: "Robin added a client: Acme", entityId: "c1" }))
        expect(displayedNotifications.get("new_records-c1")?.android.style).toBeUndefined()
    })

    it("escapes typed text on Android, which reads it as HTML, so no words are lost", async () => {
        jest.replaceProperty(Platform, "OS", "android")
        await displayRemoteMessage(
            makePush({
                channel: "70",
                title: "Robin added a note on A&B Traders",
                body: "Price<budget for now",
                entityId: "n3",
            }),
        )

        const shown = displayedNotifications.get("notes-n3")
        expect(shown?.title).toBe("Robin added a note on A&amp;B Traders")
        expect(shown?.body).toBe("Price&lt;budget for now")
        expect(shown?.android.style).toEqual({ type: 1, text: "Price&lt;budget for now" })
    })

    it("gives a server callback push the phone reminder's id, so the two never show at once", async () => {
        await displayRemoteMessage(makePush({ channel: "10", title: "Call back Priya", entityId: "s1" }))
        expect(displayedNotifications.has("callback-s1")).toBe(true)
    })
})

describe("showForegroundPush", () => {
    it("shows a toast with Open while the app is on screen, and nothing in the tray", async () => {
        const info = jest.spyOn(notify, "info").mockImplementation(() => undefined)
        await showForegroundPush(
            makePush({
                channel: "20",
                title: "Robin scheduled a meeting with Acme",
                body: "Today at 3:00 PM",
                url: "/x",
            }),
        )

        expect(info).toHaveBeenCalledWith("Robin scheduled a meeting with Acme", {
            description: "Today at 3:00 PM",
            action: { label: "Open", onClick: expect.any(Function) },
        })
        expect(mocked.displayNotification).not.toHaveBeenCalled()
        info.mockRestore()
    })

    it("shows typed text as it is in a toast, which is not HTML", async () => {
        jest.replaceProperty(Platform, "OS", "android")
        const info = jest.spyOn(notify, "info").mockImplementation(() => undefined)
        await showForegroundPush(makePush({ channel: "70", title: "Robin added a note on A&B", body: "x<y" }))

        expect(info).toHaveBeenCalledWith("Robin added a note on A&B", expect.objectContaining({ description: "x<y" }))
        info.mockRestore()
    })

    it("still puts a callback push in the tray", async () => {
        await showForegroundPush(makePush({ channel: "10", title: "Call back Priya", entityId: "s1" }))
        expect(displayedNotifications.has("callback-s1")).toBe(true)
    })
})
