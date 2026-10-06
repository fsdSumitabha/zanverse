import { AppState, FlatList, Linking } from "react-native"
import ReactTestRenderer from "react-test-renderer"

import { toDayString } from "@/lib/leadSourceDay"
import { notify } from "@/lib/notify"
import { clearToken, saveToken } from "@/store/keychain"
import { saveActiveRegion } from "@/store/mmkv"

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
    typeInto,
    unmountApp,
    type FetchMock,
    type FetchRoute,
} from "../jest/appHarness"

// 10:00 local on 6 Oct 2026.
jest.useFakeTimers({ now: new Date(2026, 9, 6, 10, 0, 0) })

const TODAY = "2026-10-06"
const ADMIN = { id: "u1", name: "Asha Rao", email: "asha@zan.test", role: 10, regions: ["IN"], activeRegion: "IN" }
const AGENT = { id: "u2", name: "Ravi Kumar", email: "ravi@zan.test", role: 60, regions: ["IN"], activeRegion: "IN" }
const LIST_PATH = /^\/api\/admin\/operations\/lead-sources\?/
const COUNTS = { today: 4, upcoming: 2, unscheduled: 7, closed: 1, all: 14, callbacksDue: 1 }

function makeRow(id: string, overrides: object = {}) {
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
        ...overrides,
    }
}

let fetchMock: FetchMock
let rows: object[]

function listReply() {
    return respond(200, {
        success: true,
        data: rows,
        pagination: { page: 1, limit: 50, total: rows.length, pages: 1 },
        counts: COUNTS,
        progress: { total: 10, worked: 3 },
    })
}

function getListCalls(): string[] {
    return getCalls(fetchMock).filter((call) => /^GET \/api\/admin\/operations\/lead-sources\?/.test(call))
}

async function openCalls(extra: FetchRoute[] = [], user: object = AGENT) {
    await saveToken("jwt-1")
    routeFetch(fetchMock, [
        ...extra,
        { path: "/api/auth/me", reply: () => respond(200, { success: true, data: user }) },
        { path: LIST_PATH, reply: listReply },
        {
            path: "/api/admin/operations/lead-sources/assignees?regions=",
            reply: () =>
                respond(200, { success: true, data: [{ _id: "u2", name: "Ravi Kumar", role: 60, regions: ["IN"] }] }),
        },
    ])
    const renderer = await renderApp()
    await press(findPressableByText(renderer, "Calls"))
    return renderer
}

async function advance(ms: number) {
    await ReactTestRenderer.act(async () => {
        jest.advanceTimersByTime(ms)
    })
    await flush()
}

async function longPress(renderer: ReactTestRenderer.ReactTestRenderer, label: string) {
    const node = renderer.root.find(
        (candidate) =>
            candidate.props.accessibilityLabel === label && typeof candidate.props.onLongPress === "function",
    )
    await ReactTestRenderer.act(async () => node.props.onLongPress())
    await flush()
}

beforeEach(async () => {
    jest.clearAllMocks()
    fetchMock = installFetchMock()
    rows = [
        makeRow("a", { section: 0, status: 30, callbackAt: new Date(2026, 9, 6, 9, 0).toISOString() }),
        makeRow("b"),
        makeRow("c", { status: 60 }),
        makeRow("d", { section: 2, status: 20, allottedDay: "2026-10-04" }),
    ]
    await clearToken()
    saveActiveRegion(null)
    Object.defineProperty(AppState, "currentState", { value: "active", configurable: true })
})

describe("lead sources list", () => {
    it("loads Today with today's day, three sticky sections, the counts, the progress and Unknown for code 60", async () => {
        const renderer = await openCalls()
        const texts = getTexts(renderer)

        expect(getListCalls()[0]).toBe(
            `GET /api/admin/operations/lead-sources?view=today&today=${TODAY}&page=1&limit=50`,
        )
        expect(texts).toEqual(
            expect.arrayContaining([
                "Lead Sources",
                "Numbers to call, assigned to you",
                "1 callback is due.",
                "Callbacks due now",
                "Left over from earlier days",
                "3 of 10 for today called",
                "Unknown",
                "7",
            ]),
        )
        // Header, section 0, a, section 1, b, c, section 2, d: the list header counts as item 0.
        expect(renderer.root.findByType(FlatList).props.stickyHeaderIndices).toEqual([1, 3, 6])
        await unmountApp(renderer)
    })

    it("hides the manager pieces from a role-60 account", async () => {
        const renderer = await openCalls()

        expect(getTexts(renderer)).not.toContain("Uploads")
        expect(renderer.root.findAll((node) => node.props.accessibilityLabel === "Not assigned")).toHaveLength(0)
        await longPress(renderer, "Source b")
        expect(getTexts(renderer)).toContain("1 selected")
        expect(renderer.root.findAll((node) => node.props.accessibilityLabel === "Assign")).toHaveLength(0)
        expect(findPressable(renderer, "Status")).toBeTruthy()
        await unmountApp(renderer)
    })

    it("shows managers the filters, the people from /assignees and the bulk actions", async () => {
        const renderer = await openCalls([], ADMIN)

        expect(getTexts(renderer)).toEqual(expect.arrayContaining(["Cold-calling lists for the whole team", "Uploads"]))
        expect(getCalls(fetchMock)).toContain("GET /api/admin/operations/lead-sources/assignees?regions=")
        await press(findPressable(renderer, "Person: Everyone"))
        expect(getTexts(renderer)).toEqual(expect.arrayContaining(["Assigned to me", "Not assigned", "Ravi Kumar"]))
        await press(findPressableByText(renderer, "Not assigned"))
        expect(getListCalls().at(-1)).toContain("assignee=none")

        await longPress(renderer, "Source b")
        for (const label of ["Status", "Assign", "Day", "Delete"]) expect(findPressable(renderer, label)).toBeTruthy()
        await unmountApp(renderer)
    })

    it("saves a status with a note and today, swaps the badge at once and re-sorts 900 ms later", async () => {
        const bodies: unknown[] = []
        const success = jest.spyOn(notify, "success")
        const renderer = await openCalls([
            {
                method: "PATCH",
                path: "/api/admin/operations/lead-sources/b/status",
                reply: (init) => {
                    bodies.push(JSON.parse(String(init.body)))
                    return respond(200, { success: true, data: makeRow("b", { status: 40, lastNote: "Owner keen" }) })
                },
            },
        ])

        await press(findPressable(renderer, "Status: New. Press to change."))
        expect(getTexts(renderer)).toContain("Result of the call")
        await press(findPressable(renderer, "Interested"))
        await typeInto(renderer, "Note", "Owner keen")
        await press(findPressableByText(renderer, "Save"))

        expect(bodies).toEqual([{ status: 40, note: "Owner keen", today: TODAY }])
        expect(success).toHaveBeenCalledWith("Source b: Interested")
        expect(findPressable(renderer, "Status: Interested. Press to change.")).toBeTruthy()

        const before = getListCalls().length
        await advance(900)
        expect(getListCalls()).toHaveLength(before + 1)
        await unmountApp(renderer)
    })

    it("needs a time for Call Back, then sends callbackAt and callbackDay that agree", async () => {
        const bodies: { callbackAt: string; callbackDay: string }[] = []
        const renderer = await openCalls([
            {
                method: "PATCH",
                path: "/api/admin/operations/lead-sources/b/status",
                reply: (init) => {
                    const body = JSON.parse(String(init.body))
                    bodies.push(body)
                    return respond(200, {
                        success: true,
                        data: makeRow("b", { status: 30, callbackAt: body.callbackAt }),
                    })
                },
            },
        ])

        await press(findPressable(renderer, "Status: New. Press to change."))
        await press(findPressable(renderer, "Call Back"))
        expect(getTexts(renderer)).toContain("Pick when to call back.")
        expect(findPressableByText(renderer, "Save").props.accessibilityState).toMatchObject({ disabled: true })

        await press(findPressableByText(renderer, "2 hours"))
        await press(findPressableByText(renderer, "Save"))

        expect(bodies).toHaveLength(1)
        const at = new Date(bodies[0].callbackAt)
        expect(Math.abs(at.getTime() - Date.now() - 2 * 60 * 60_000)).toBeLessThan(1000)
        expect(bodies[0].callbackDay).toBe(toDayString(at))
        await unmountApp(renderer)
    })

    it("greys out and disables the call button for a Not Interested row", async () => {
        const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined)
        rows = [makeRow("b"), makeRow("x", { status: 50 })]
        const renderer = await openCalls()

        const blocked = findPressable(renderer, "Do not call Source x")
        expect(blocked.props.disabled).toBe(true)
        expect(renderer.root.findAll((node) => node.props.accessibilityLabel === "Call Source x")).toHaveLength(0)
        await press(findPressable(renderer, "Call Source b"))
        expect(open).toHaveBeenCalledWith("tel:+919876543210")
        expect(open).toHaveBeenCalledTimes(1)
        await unmountApp(renderer)
    })

    it("opens the callback sheet from a row's clock chip", async () => {
        const renderer = await openCalls()

        await press(findPressable(renderer, /^Callback /))
        expect(getTexts(renderer)).toEqual(
            expect.arrayContaining(["Callback reminder", "Clear callback", "Change time"]),
        )
        await unmountApp(renderer)
    })

    it("keeps the sheet and the note open on a 409, shows the message and reloads", async () => {
        const message = "This lead source changed while you were saving. Reload it and try again."
        const renderer = await openCalls([
            {
                method: "PATCH",
                path: "/api/admin/operations/lead-sources/b/status",
                reply: () => respond(409, { success: false, message }),
            },
        ])

        await press(findPressable(renderer, "Status: New. Press to change."))
        await press(findPressable(renderer, "Interested"))
        await typeInto(renderer, "Note", "Owner keen")
        const before = getListCalls().length
        await press(findPressableByText(renderer, "Save"))

        expect(getTexts(renderer)).toEqual(expect.arrayContaining([message, "Result of the call"]))
        const note = renderer.root.find(
            (node) => node.props.accessibilityLabel === "Note" && typeof node.props.onChangeText === "function",
        )
        expect(note.props.value).toBe("Owner keen")
        expect(getListCalls().length).toBe(before + 1)
        await unmountApp(renderer)
    })

    it("polls every minute only while nothing is open, and reloads when the app comes back", async () => {
        const renderer = await openCalls()
        let count = getListCalls().length

        await advance(60_000)
        expect(getListCalls().length).toBe(count + 1)

        // A sheet is open: no poll.
        await press(findPressable(renderer, "Status: New. Press to change."))
        count = getListCalls().length
        await advance(60_000)
        expect(getListCalls().length).toBe(count)
        await press(findPressableByText(renderer, "Cancel"))

        // Rows are selected: no poll.
        await longPress(renderer, "Source b")
        await advance(60_000)
        expect(getListCalls().length).toBe(count)
        await press(findPressable(renderer, "Clear the selection"))

        // Background, then back to the front: one reload at once.
        const handlers = (AppState.addEventListener as jest.Mock).mock.calls
            .filter(([type]) => type === "change")
            .map(([, handler]) => handler as (state: string) => void)
        await ReactTestRenderer.act(async () => handlers.forEach((handler) => handler("background")))
        await ReactTestRenderer.act(async () => handlers.forEach((handler) => handler("active")))
        await flush()
        expect(getListCalls().length).toBe(count + 1)
        await unmountApp(renderer)
    })

    it("sets one status on the selected rows and reports the counts", async () => {
        const bodies: unknown[] = []
        const success = jest.spyOn(notify, "success")
        const renderer = await openCalls([
            {
                method: "POST",
                path: "/api/admin/operations/lead-sources/bulk",
                reply: (init) => {
                    bodies.push(JSON.parse(String(init.body)))
                    return respond(200, { success: true, data: { updated: 1, unchanged: 1, skipped: 1 } })
                },
            },
        ])

        await longPress(renderer, "Source b")
        await press(findPressable(renderer, "Source d"))
        await press(findPressable(renderer, "Source a"))
        expect(getTexts(renderer)).toContain("3 selected")

        await press(findPressable(renderer, "Status"))
        expect(getTexts(renderer)).toEqual(
            expect.arrayContaining([
                "Set the status of 3 lead sources",
                "To set Call Back, open each one, so each gets its own time.",
            ]),
        )
        const sheetTexts = getTexts(renderer).slice(getTexts(renderer).indexOf("Set the status of 3 lead sources"))
        expect(sheetTexts).toEqual(expect.arrayContaining(["New", "Not Reached", "Interested", "Not Interested"]))
        expect(sheetTexts).not.toContain("Call Back")
        await press(findPressableByText(renderer, "Save"))

        expect(bodies).toEqual([{ status: 20, action: "status", ids: ["b", "d", "a"], today: TODAY }])
        expect(success).toHaveBeenCalledWith("1 lead source marked Not Reached. 1 already set. 1 skipped.")
        expect(getTexts(renderer)).not.toContain("3 selected")
        await unmountApp(renderer)
    })

    it("resets to page 1 and clears the selection on a new tab", async () => {
        const renderer = await openCalls()
        await longPress(renderer, "Source b")

        await press(findPressableByText(renderer, "Upcoming"))
        expect(getListCalls().at(-1)).toBe(
            `GET /api/admin/operations/lead-sources?view=upcoming&today=${TODAY}&page=1&limit=50`,
        )
        expect(getTexts(renderer)).not.toContain("1 selected")
        expect(getTexts(renderer)).toContain("Show them")

        await press(findPressableByText(renderer, "Show them"))
        expect(getListCalls().at(-1)).toContain("view=today")
        await unmountApp(renderer)
    })

    it("shows each empty view in the web's words", async () => {
        rows = []
        const renderer = await openCalls()
        expect(getTexts(renderer)).toEqual(
            expect.arrayContaining([
                "Nothing to call today",
                "Sources show up here when a manager gives them to you for today.",
            ]),
        )

        await typeInto(renderer, "Search lead sources", "zz")
        await advance(300)
        expect(getListCalls().at(-1)).toContain("search=zz")
        expect(getTexts(renderer)).toEqual(
            expect.arrayContaining(["No lead sources match", "Change the search or the filters."]),
        )
        await unmountApp(renderer)
    })

    it("renders AccessDenied with the server's message on a 403", async () => {
        const renderer = await openCalls([
            { path: LIST_PATH, reply: () => respond(403, { success: false, message: "No access to lead sources" }) },
        ])

        expect(getTexts(renderer)).toEqual(expect.arrayContaining(["Access Denied", "No access to lead sources"]))
        await unmountApp(renderer)
    })
})
