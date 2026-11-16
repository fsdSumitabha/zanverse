import notifee from "@notifee/react-native"
import { getApps } from "@react-native-firebase/app"
import { onMessage } from "@react-native-firebase/messaging"
import ReactTestRenderer from "react-test-renderer"

import { runBulk } from "@/lib/leadSourceBulk"
import { registerPushBackgroundHandlers } from "@/lib/push/background"
import LeadSourceDetailScreen from "@/screens/leadSources/LeadSourceDetailScreen"
import { clearToken, saveToken } from "@/store/keychain"
import { clearAll, getRemindersEnabled, saveActiveRegion, saveRemindersEnabled } from "@/store/mmkv"

import {
    findPressable,
    findPressableByText,
    flush,
    getCalls,
    getTexts,
    installFetchMock,
    press,
    renderApp,
    respond,
    routeFetch,
    unmountApp,
    type FetchMock,
    type FetchRoute,
} from "../jest/appHarness"

// 10:00 local on 6 Oct 2026.
jest.useFakeTimers({ now: new Date(2026, 9, 6, 10, 0, 0) })

const TODAY = "2026-10-06"
const AGENT = { id: "u2", name: "Ravi Kumar", email: "ravi@zan.test", role: 60, regions: ["IN"], activeRegion: "IN" }
const SOURCE_A = "64b7f0c2a1b2c3d4e5f60001"
const SOURCE_B = "64b7f0c2a1b2c3d4e5f60002"
const IN_TWO_HOURS = new Date(2026, 9, 6, 12, 0, 0).toISOString()
const LIST_PATH = /^\/api\/admin\/operations\/lead-sources\?/
const DEVICES = "/api/notifications/devices"

const { scheduledTriggers } = jest.requireMock("@notifee/react-native") as {
    scheduledTriggers: Map<string, { notification: { title?: string; data?: { url?: string } } }>
}
const mockedNotifee = notifee as jest.Mocked<typeof notifee>

function makeRow(id: string, overrides: object = {}) {
    return {
        _id: id,
        name: `Source ${id.slice(-1)}`,
        company: "",
        email: "",
        phone: "+919876543210",
        status: 10,
        region: "IN",
        allottedDay: TODAY,
        callbackAt: null,
        lastNote: "",
        lastNoteAt: null,
        uploadId: null,
        rowNumber: null,
        convertedLeadId: null,
        assignee: null,
        listInfo: [],
        section: 1,
        ...overrides,
    }
}

let fetchMock: FetchMock
let rows: object[]

function routes(extra: FetchRoute[]): FetchRoute[] {
    return [
        ...extra,
        { path: "/api/auth/me", reply: () => respond(200, { success: true, data: AGENT }) },
        {
            path: LIST_PATH,
            reply: () =>
                respond(200, {
                    success: true,
                    data: rows,
                    pagination: { page: 1, limit: 50, total: rows.length, pages: 1 },
                    counts: {
                        today: rows.length,
                        upcoming: 0,
                        unscheduled: 0,
                        closed: 0,
                        all: rows.length,
                        callbacksDue: 0,
                    },
                    progress: { total: rows.length, worked: 0 },
                }),
        },
    ]
}

async function start(extra: FetchRoute[] = []) {
    await saveToken("jwt-1")
    routeFetch(fetchMock, routes(extra))
    return renderApp()
}

// Reminders are set behind the screen, through a few awaits: let them finish.
async function settle() {
    for (let i = 0; i < 5; i += 1) await flush()
}

beforeEach(async () => {
    jest.clearAllMocks()
    fetchMock = installFetchMock()
    scheduledTriggers.clear()
    rows = []
    await clearToken()
    clearAll()
    saveActiveRegion("IN")
    saveRemindersEnabled(true)
})

describe("callback reminders", () => {
    it("matches the phone's reminders to each list load", async () => {
        scheduledTriggers.set(`callback-${SOURCE_B}`, { notification: {} })
        rows = [makeRow(SOURCE_A, { status: 30, callbackAt: IN_TWO_HOURS }), makeRow(SOURCE_B)]
        const renderer = await start()

        await press(findPressableByText(renderer, "Calls"))
        await settle()
        expect([...scheduledTriggers.keys()]).toEqual([`callback-${SOURCE_A}`])
        expect(scheduledTriggers.get(`callback-${SOURCE_A}`)?.notification.title).toBe("Call back Source 1")
        await unmountApp(renderer)
    })

    it("cancels the reminder when the status moves away from Call Back", async () => {
        rows = [makeRow(SOURCE_A, { status: 30, callbackAt: IN_TWO_HOURS })]
        const renderer = await start([
            {
                method: "PATCH",
                path: `/api/admin/operations/lead-sources/${SOURCE_A}/status`,
                reply: () => respond(200, { success: true, data: makeRow(SOURCE_A, { status: 50 }) }),
            },
        ])
        await press(findPressableByText(renderer, "Calls"))
        await settle()
        expect(scheduledTriggers.has(`callback-${SOURCE_A}`)).toBe(true)

        await press(findPressable(renderer, "Status: Call Back. Press to change."))
        await press(findPressable(renderer, "Not Interested"))
        await press(findPressableByText(renderer, "Save"))
        await settle()
        expect(scheduledTriggers.has(`callback-${SOURCE_A}`)).toBe(false)
        await unmountApp(renderer)
    })

    it("says where the reminder rings under the callback picker", async () => {
        rows = [makeRow(SOURCE_A)]
        const renderer = await start()
        await press(findPressableByText(renderer, "Calls"))
        await press(findPressable(renderer, "Status: New. Press to change."))
        await press(findPressable(renderer, "Call Back"))

        expect(getTexts(renderer)).toContain("Reminder on this phone")
        await unmountApp(renderer)
    })

    it("clears every reminder in a bulk day change", async () => {
        scheduledTriggers.set(`callback-${SOURCE_A}`, { notification: {} })
        scheduledTriggers.set(`callback-${SOURCE_B}`, { notification: {} })
        routeFetch(fetchMock, [
            {
                method: "POST",
                path: "/api/admin/operations/lead-sources/bulk",
                reply: () => respond(200, { success: true, data: { updated: 2, unchanged: 0, skipped: 0 } }),
            },
        ])

        await runBulk("day", [SOURCE_A, SOURCE_B], { day: "2026-10-07" })
        await settle()
        expect(scheduledTriggers.size).toBe(0)
    })

    it("turns reminders off and on from Profile", async () => {
        scheduledTriggers.set(`callback-${SOURCE_A}`, { notification: {} })
        const renderer = await start([
            {
                path: "/api/auth/profile",
                reply: () =>
                    respond(200, {
                        success: true,
                        data: {
                            ...AGENT,
                            isActive: true,
                            avatar: "",
                            lastLoginAt: null,
                            createdAt: null,
                            updatedAt: null,
                        },
                    }),
            },
        ])
        await press(findPressableByText(renderer, "More"))
        await press(findPressable(renderer, "Profile"))

        const toggle = () =>
            renderer.root.find(
                (node) =>
                    node.props.accessibilityLabel === "Callback reminders" &&
                    typeof node.props.onValueChange === "function",
            )
        await ReactTestRenderer.act(async () => toggle().props.onValueChange(false))
        await settle()
        expect(getRemindersEnabled()).toBe(false)
        expect(scheduledTriggers.size).toBe(0)
        expect(getTexts(renderer)).toContain("Off: no reminders ring on this phone.")

        await ReactTestRenderer.act(async () => toggle().props.onValueChange(true))
        expect(getRemindersEnabled()).toBe(true)
        await unmountApp(renderer)
    })
})

describe("taps", () => {
    const detailRoutes: FetchRoute[] = [
        { path: `/api/admin/operations/lead-sources/${SOURCE_A}`, reply: () => respond(404, { success: false }) },
    ]

    it("opens the source when a reminder is tapped with the app open", async () => {
        const renderer = await start(detailRoutes)
        const onEvent = mockedNotifee.onForegroundEvent.mock.calls[0][0]

        await ReactTestRenderer.act(async () =>
            onEvent({
                type: 1,
                detail: { notification: { data: { url: `/admin/operations/lead-sources/${SOURCE_A}` } } },
            }),
        )
        await flush()
        expect(renderer.root.findAllByType(LeadSourceDetailScreen)).toHaveLength(1)
        expect(getCalls(fetchMock)).toContain(`GET /api/admin/operations/lead-sources/${SOURCE_A}`)
        await unmountApp(renderer)
    })

    it("holds a tap from the background until the app can navigate", async () => {
        registerPushBackgroundHandlers()
        const onBackground = mockedNotifee.onBackgroundEvent.mock.calls[0][0]
        await onBackground({
            type: 1,
            detail: { notification: { data: { url: `/admin/operations/lead-sources/${SOURCE_A}` } } },
        })

        const renderer = await start(detailRoutes)
        await flush()
        expect(renderer.root.findAllByType(LeadSourceDetailScreen)).toHaveLength(1)
        await unmountApp(renderer)
    })
})

describe("push token", () => {
    beforeEach(() => {
        ;(getApps as jest.Mock).mockReturnValue([{ name: "[DEFAULT]" }])
    })

    afterEach(() => {
        ;(getApps as jest.Mock).mockReturnValue([])
    })

    it("registers after sign-in, shows push in the picker line, shows a push in front, and unregisters on logout", async () => {
        rows = [makeRow(SOURCE_A)]
        const bodies: { method: string; body: unknown }[] = []
        const deviceRoute = (method: string): FetchRoute => ({
            method,
            path: DEVICES,
            reply: (init) => {
                bodies.push({ method, body: JSON.parse(String(init.body)) })
                return respond(200, { success: true })
            },
        })
        const renderer = await start([
            deviceRoute("POST"),
            deviceRoute("DELETE"),
            { method: "POST", path: "/api/auth/logout", reply: () => respond(200, { success: true }) },
        ])
        await settle()
        expect(bodies).toEqual([{ method: "POST", body: { token: "fcm-token", platform: "ios" } }])

        await press(findPressableByText(renderer, "Calls"))
        await press(findPressable(renderer, "Status: New. Press to change."))
        await press(findPressable(renderer, "Call Back"))
        expect(getTexts(renderer)).toContain("Reminder on this phone and by push")
        await press(findPressableByText(renderer, "Cancel"))

        // A push while the app is open is shown on the CRM channel.
        const onPush = (onMessage as jest.Mock).mock.calls[0][1]
        await ReactTestRenderer.act(async () =>
            onPush({
                notification: { title: "New lead assigned", body: "Acme" },
                data: { url: "/admin/operations/leads/x" },
            }),
        )
        expect(mockedNotifee.displayNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "New lead assigned",
                android: expect.objectContaining({ channelId: "crm" }),
            }),
        )

        await press(findPressableByText(renderer, "More"))
        await press(findPressable(renderer, "Logout"))
        await settle()
        expect(bodies.at(-1)).toEqual({ method: "DELETE", body: { token: "fcm-token" } })
        await unmountApp(renderer)
    })
})
