import ReactTestRenderer from "react-test-renderer"

import { send } from "@/api/client"
import { navigationRef } from "@/api/navigationRef"
import type { AuthUser } from "@/contexts/AuthContext"
import ActivityLogsScreen from "@/screens/activityLogs/ActivityLogsScreen"
import AddNoteScreen from "@/screens/interactions/AddNoteScreen"
import LeadSourcesScreen from "@/screens/leadSources/LeadSourcesScreen"
import { readCachedMe, readLeadSourcesToday, writeCachedMe, writeLeadSourcesToday } from "@/store/cache"
import { clearToken, getToken, saveToken } from "@/store/keychain"
import { clearAll, getActiveRegion, saveActiveRegion } from "@/store/mmkv"
import type { LeadSourceRow } from "@/types/leadSource"

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
    setNetwork,
    unmountApp,
    type FetchMock,
    type FetchRoute,
} from "../jest/appHarness"

// 10:00 local on 6 Oct 2026.
jest.useFakeTimers({ now: new Date(2026, 9, 6, 10, 0, 0) })

type MockResponse = ReturnType<typeof respond>

const TODAY = "2026-10-06"
const AGENT: AuthUser = {
    id: "u2",
    name: "Ravi Kumar",
    email: "ravi@zan.test",
    role: 60,
    regions: ["IN"],
    activeRegion: "IN",
}
const ADMIN: AuthUser = {
    id: "u1",
    name: "Asha Rao",
    email: "asha@zan.test",
    role: 10,
    regions: ["IN"],
    activeRegion: "IN",
}
const LIST_PATH = /^\/api\/admin\/operations\/lead-sources\?/
const ACTIVITY_PATH = /^\/api\/admin\/operations\/activity-logs\?/
const COUNTS = { today: 1, upcoming: 0, unscheduled: 0, closed: 0, all: 1, callbacksDue: 0 }

function makeRow(id: string): LeadSourceRow {
    return {
        _id: id,
        name: `Source ${id}`,
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
    }
}

function makePage(rows: LeadSourceRow[]) {
    return {
        data: rows,
        pagination: { page: 1, limit: 50, total: rows.length, pages: 1 },
        counts: COUNTS,
        progress: { total: rows.length, worked: 0 },
    }
}

/** An answer the test releases when it chooses, to see what the screen shows before it arrives. */
function holdReply() {
    let release: (response: MockResponse) => void = () => undefined
    const promise = new Promise<MockResponse>((resolve) => {
        release = resolve
    })
    return { promise, release }
}

function failNetwork(): never {
    throw new TypeError("Network request failed")
}

let fetchMock: FetchMock

async function start(user: object, routes: FetchRoute[], meReply?: () => MockResponse | Promise<MockResponse>) {
    await saveToken("jwt-1")
    routeFetch(fetchMock, [
        ...routes,
        { path: "/api/auth/me", reply: meReply ?? (() => respond(200, { success: true, data: user })) },
    ])
    return renderApp()
}

// The Dashboard under the other tabs has a Retry of its own, so Retry is looked for inside one screen.
function findRetry(screen: ReactTestRenderer.ReactTestInstance) {
    return screen.find((node) => node.props.accessibilityLabel === "Retry" && typeof node.props.onPress === "function")
}

function getListCalls(): string[] {
    return getCalls(fetchMock).filter((call) => LIST_PATH.test(call.replace(/^GET /, "")))
}

beforeEach(async () => {
    jest.clearAllMocks()
    fetchMock = installFetchMock()
    await clearToken()
    clearAll()
    saveActiveRegion("IN")
})

describe("cold start from the cache", () => {
    it("opens the app with the cached user at once, then logs out when /me says signed out", async () => {
        writeCachedMe(ADMIN)
        const me = holdReply()
        const renderer = await start(ADMIN, [], () => me.promise)

        expect(getTexts(renderer)).not.toContain("ZAN Services")
        await press(
            renderer.root.findAll(
                (node) => node.props.accessibilityLabel === "Profile menu" && typeof node.props.onPress === "function",
            )[0],
        )
        expect(getTexts(renderer)).toContain("Asha Rao")

        await ReactTestRenderer.act(async () => me.release(respond(200, { success: true, data: null })))
        await flush()
        expect(getTexts(renderer)).toContain("Admin Login")
        expect(getToken()).toBeNull()
        expect(readCachedMe()).toBeNull()
        await unmountApp(renderer)
    })

    it("stays in the app on a cold start with no network", async () => {
        writeCachedMe(ADMIN)
        const renderer = await start(ADMIN, [], failNetwork)

        expect(getTexts(renderer)).not.toContain("Admin Login")
        expect(getToken()).toBe("jwt-1")
        await unmountApp(renderer)
    })
})

describe("the saved Today page", () => {
    it("shows the saved rows before the network answers, then replaces and re-saves them", async () => {
        writeLeadSourcesToday(makePage([makeRow("a")]), TODAY)
        const list = holdReply()
        const renderer = await start(AGENT, [{ path: LIST_PATH, reply: () => list.promise }])

        await press(findPressableByText(renderer, "Calls"))
        expect(getTexts(renderer)).toContain("Source a")
        expect(getListCalls()).toHaveLength(1)

        await ReactTestRenderer.act(async () =>
            list.release(respond(200, { success: true, ...makePage([makeRow("b")]) })),
        )
        await flush()
        const texts = getTexts(renderer)
        expect(texts).toContain("Source b")
        expect(texts).not.toContain("Source a")
        expect(readLeadSourcesToday(TODAY)?.data.map((row) => row._id)).toEqual(["b"])
        await unmountApp(renderer)
    })

    it("keeps the saved page under the offline line when the network is down", async () => {
        writeLeadSourcesToday(makePage([makeRow("a")]), TODAY)
        const renderer = await start(AGENT, [{ path: LIST_PATH, reply: failNetwork }])

        await press(findPressableByText(renderer, "Calls"))
        const texts = getTexts(renderer)
        expect(texts).toEqual(expect.arrayContaining(["Source a", "Showing saved data — you're offline"]))
        await unmountApp(renderer)
    })

    it("says offline with a Retry when nothing is saved, and Retry loads once the network is back", async () => {
        let isDown = true
        const renderer = await start(AGENT, [
            {
                path: LIST_PATH,
                reply: () => (isDown ? failNetwork() : respond(200, { success: true, ...makePage([makeRow("c")]) })),
            },
        ])

        await press(findPressableByText(renderer, "Calls"))
        expect(getTexts(renderer)).toEqual(expect.arrayContaining(["You're offline", "Connect to load this screen."]))
        isDown = false
        await press(findRetry(renderer.root.findByType(LeadSourcesScreen)))
        expect(getTexts(renderer)).toContain("Source c")
        await unmountApp(renderer)
    })
})

describe("offline", () => {
    it("shows the Activity Logs offline state, whose Retry works once the radio is back", async () => {
        let isDown = true
        const renderer = await start(ADMIN, [
            {
                path: ACTIVITY_PATH,
                reply: () =>
                    isDown
                        ? failNetwork()
                        : respond(200, {
                              success: true,
                              data: [],
                              pagination: { page: 1, limit: 15, total: 0, pages: 0 },
                          }),
            },
        ])
        await setNetwork(false)
        await press(findPressableByText(renderer, "More"))
        await press(findPressable(renderer, "Activity Logs"))
        expect(getTexts(renderer)).toEqual(expect.arrayContaining(["You're offline", "You are offline"]))

        await setNetwork(true)
        isDown = false
        await press(findRetry(renderer.root.findByType(ActivityLogsScreen)))
        expect(getTexts(renderer)).toContain("No activity matches the current filters.")
        await unmountApp(renderer)
    })

    it("disables the status save and says why, while the list still reads", async () => {
        const renderer = await start(AGENT, [
            { path: LIST_PATH, reply: () => respond(200, { success: true, ...makePage([makeRow("a")]) }) },
        ])
        await press(findPressableByText(renderer, "Calls"))
        await setNetwork(false)

        expect(renderer.root.findAllByType(LeadSourcesScreen)).toHaveLength(1)
        expect(getTexts(renderer)).toContain("Source a")
        await press(findPressable(renderer, "Status: New. Press to change."))
        const save = findPressable(renderer, "Save, Offline")
        expect(save.props.disabled).toBe(true)
        expect(getTexts(renderer)).toContain("Save · Offline")
        await unmountApp(renderer)
    })

    it("words a failed request while offline plainly", async () => {
        const renderer = await start(ADMIN, [{ path: "/api/x", reply: failNetwork }])
        await setNetwork(false)

        await expect(send("/api/x", "GET")).rejects.toThrow("You're offline. Connect and try again.")
        await setNetwork(true)
        await expect(send("/api/x", "GET")).rejects.toThrow("No connection. Check your network and try again.")
        await unmountApp(renderer)
    })
})

describe("the form sheet", () => {
    it("shows a timeline form as a sheet whose close leaves the route", async () => {
        const renderer = await start(ADMIN, [])
        await ReactTestRenderer.act(async () => {
            navigationRef.navigate("AddNote", { entityType: 0, entityId: "64b7f0c2a1b2c3d4e5f60001" })
        })
        await flush()
        expect(renderer.root.findAllByType(AddNoteScreen)).toHaveLength(1)
        expect(getTexts(renderer)).toEqual(expect.arrayContaining(["Add Note", "Save Note"]))

        await setNetwork(false)
        expect(getTexts(renderer)).toContain("Save Note · Offline")

        const closeButtons = renderer.root.findAll(
            (node) => node.props.accessibilityLabel === "Close" && typeof node.props.onPress === "function",
        )
        await press(closeButtons[closeButtons.length - 1])
        expect(renderer.root.findAllByType(AddNoteScreen)).toHaveLength(0)
        await unmountApp(renderer)
    })
})

describe("logout", () => {
    it("leaves no session or cache in MMKV", async () => {
        writeLeadSourcesToday(makePage([makeRow("a")]), TODAY)
        const renderer = await start(ADMIN, [
            { method: "POST", path: "/api/auth/logout", reply: () => respond(200, { success: true }) },
        ])
        expect(readCachedMe()).not.toBeNull()

        await press(findPressableByText(renderer, "More"))
        await press(findPressable(renderer, "Logout"))
        expect(readCachedMe()).toBeNull()
        expect(readLeadSourcesToday(TODAY)).toBeNull()
        expect(getActiveRegion()).toBeNull()
        await unmountApp(renderer)
    })
})
