import type { RemoteMessage } from "@react-native-firebase/messaging"
import notifee from "react-native-notify-kit"

import { notify } from "@/lib/notify"
import { displayRemoteMessage, showForegroundPush, syncChannelSummaries } from "@/lib/push/remoteMessage"

const { displayedNotifications, createdChannels } = jest.requireMock("react-native-notify-kit") as {
    displayedNotifications: Map<string, { title?: string; body?: string; android: Record<string, unknown> }>
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

describe("displayRemoteMessage", () => {
    it("shows a new lead on its channel, once per lead, with Call and Open and no picture", async () => {
        await displayRemoteMessage(
            makePush({
                title: "New lead from Arjun Mehta",
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
        expect(shown?.title).toBe("New lead from Arjun Mehta")
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
        // One notification is its own: no bundle header yet.
        expect(displayedNotifications.has("summary-new_leads")).toBe(false)
    })

    it("replaces the last update about the same record instead of stacking", async () => {
        const push = { channel: "60", entityId: LEAD_ID, url: `/admin/operations/leads/${LEAD_ID}` }
        await displayRemoteMessage(makePush({ ...push, title: "Acme moved to Contacted" }))
        await displayRemoteMessage(makePush({ ...push, title: "Acme moved to Discussion" }))

        expect(displayedNotifications.get(`stage_changes-${LEAD_ID}`)?.title).toBe("Acme moved to Discussion")
        expect(displayedNotifications.get(`stage_changes-${LEAD_ID}`)?.android.actions).toBeUndefined()
        expect(displayedNotifications.has("summary-stage_changes")).toBe(false)
    })

    it("bundles a channel under its name from the second notification, and drops the header when the tray empties", async () => {
        await displayRemoteMessage(makePush({ channel: "70", title: "Note added for Kaveri Foods", entityId: "n1" }))
        await displayRemoteMessage(makePush({ channel: "70", title: "Note added for Delta Infra", entityId: "n2" }))

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

    it("gives a server callback push the phone reminder's id, so the two never show at once", async () => {
        await displayRemoteMessage(makePush({ channel: "10", title: "Call back Priya", entityId: "s1" }))
        expect(displayedNotifications.has("callback-s1")).toBe(true)
    })
})

describe("showForegroundPush", () => {
    it("shows a toast with Open while the app is on screen, and nothing in the tray", async () => {
        const info = jest.spyOn(notify, "info").mockImplementation(() => undefined)
        await showForegroundPush(
            makePush({ channel: "20", title: "Meeting with Acme", body: "Today at 3:00 PM", url: "/x" }),
        )

        expect(info).toHaveBeenCalledWith("Meeting with Acme", {
            description: "Today at 3:00 PM",
            action: { label: "Open", onClick: expect.any(Function) },
        })
        expect(mocked.displayNotification).not.toHaveBeenCalled()
        info.mockRestore()
    })

    it("still puts a callback push in the tray", async () => {
        await showForegroundPush(makePush({ channel: "10", title: "Call back Priya", entityId: "s1" }))
        expect(displayedNotifications.has("callback-s1")).toBe(true)
    })
})
