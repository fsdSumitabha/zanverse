import { RefreshControl, Text } from "react-native"
import ReactTestRenderer from "react-test-renderer"

import { INTERACTION_TYPE_META } from "@/constants/interactionTypes"
import { LEAD_STATUS_META } from "@/constants/leadStatus"
import { notify } from "@/lib/notify"
import DashboardScreen from "@/screens/dashboard/DashboardScreen"
import SearchScreen from "@/screens/dashboard/SearchScreen"
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

jest.useFakeTimers()

const ADMIN = { id: "u1", name: "Asha Rao", email: "asha@zan.test", role: 10, regions: ["IN"], activeRegion: "IN" }
const FEED = "/api/admin/operations"
const STATS = "/api/admin/operations/stats"
const UPCOMING = "/api/admin/operations/meetings?range=upcoming&limit=20"
const SEARCH = "/api/admin/operations/search"
const SEARCH_LABEL = "Search leads, clients, projects, meetings…"
const LEAD_ID = "64b7f0c2a1b2c3d4e5f60001"
const CLIENT_ID = "64b7f0c2a1b2c3d4e5f60002"
const PROJECT_ID = "64b7f0c2a1b2c3d4e5f60003"
const NOW = new Date(2026, 9, 6, 10, 0)

const LEAD_ROW = {
    _id: LEAD_ID,
    entityType: 0,
    name: "Acme Lead",
    phone: "+919876543210",
    email: "owner@acme.test",
    source: "Website",
    status: 20,
    lastInteractionAt: "2026-10-06T08:00:00Z",
    lastInteraction: { type: 2510, title: JSON.stringify({ from: 10, to: 20 }), createdAt: "2026-10-06T08:00:00Z" },
}
const CLIENT_ROW = {
    _id: CLIENT_ID,
    entityType: 1,
    name: "Beta Client",
    company: "Beta Co",
    status: 1,
    lastInteractionAt: "2026-10-05T08:00:00Z",
    lastInteraction: { type: 2110, title: "Sent the brochure", createdAt: "2026-10-05T08:00:00Z" },
}
const PROJECT_ROW = {
    _id: PROJECT_ID,
    entityType: 2,
    name: "Gamma Build",
    title: "Gamma Build",
    companyName: "Gamma Ltd",
    description: "Warehouse fit-out",
    lastInteractionAt: "2026-10-04T08:00:00Z",
    lastInteraction: null,
}

let fetchMock: FetchMock
let feedRows: object[]

function at(day: number, hour: number, minute = 0) {
    return new Date(2026, 9, day, hour, minute).toISOString()
}

// Newest first, as the route sorts them.
const MEETINGS = [
    { _id: "m5", title: "Late review", scheduledAt: at(30, 9), entityType: 0, entityId: LEAD_ID },
    { _id: "m4", title: "Site visit", scheduledAt: at(21, 11), entityType: 2, entityId: PROJECT_ID },
    { _id: "m3", title: "Pricing call", scheduledAt: at(9, 14, 30), entityType: 1, entityId: CLIENT_ID },
    { _id: "m2", title: "Kickoff", scheduledAt: at(7, 9), entityType: 1, entityId: CLIENT_ID },
    {
        _id: "m1",
        title: "Demo",
        scheduledAt: at(6, 15),
        entityType: 0,
        entityId: LEAD_ID,
        entity: { type: 0, label: "Lead", title: "Acme Lead" },
    },
]

function detailRoutes(): FetchRoute[] {
    return [
        {
            path: `/api/admin/operations/leads/${LEAD_ID}`,
            reply: () =>
                respond(200, {
                    success: true,
                    data: { lead: { ...LEAD_ROW, createdAt: "2026-10-01T08:00:00Z" }, client: null },
                }),
        },
        { path: /\/interactions/, reply: () => respond(200, { success: true, interactions: [] }) },
    ]
}

function routes(user: object, extra: FetchRoute[]): FetchRoute[] {
    return [
        ...extra,
        { path: "/api/auth/me", reply: () => respond(200, { success: true, data: user }) },
        { path: `${FEED}?page=1&limit=20`, reply: () => respond(200, { success: true, data: feedRows }) },
        {
            path: STATS,
            reply: () =>
                respond(200, {
                    success: true,
                    data: { leads: 12, activeClients: 5, projectsRunning: 3, meetingsThisWeek: 2 },
                }),
        },
        { path: UPCOMING, reply: () => respond(200, { success: true, data: MEETINGS }) },
        ...detailRoutes(),
    ]
}

async function openDashboard(user: object = ADMIN, extra: FetchRoute[] = []) {
    await saveToken("jwt-1")
    routeFetch(fetchMock, routes(user, extra))
    return renderApp()
}

function countCalls(prefix: string): number {
    return getCalls(fetchMock).filter((call) => call.startsWith(`GET ${prefix}`)).length
}

function getFeedList(renderer: ReactTestRenderer.ReactTestRenderer) {
    return renderer.root.findByType(DashboardScreen).findAll((node) => typeof node.props.onEndReached === "function")[0]
}

function findText(renderer: ReactTestRenderer.ReactTestRenderer, text: string) {
    return renderer.root.findAllByType(Text).find((node) => node.props.children === text)
}

async function advance(ms: number) {
    await ReactTestRenderer.act(async () => {
        jest.advanceTimersByTime(ms)
    })
    await flush()
}

beforeEach(async () => {
    jest.clearAllMocks()
    jest.setSystemTime(NOW)
    fetchMock = installFetchMock()
    feedRows = [LEAD_ROW, CLIENT_ROW, PROJECT_ROW]
    await clearToken()
    saveActiveRegion(null)
})

describe("dashboard feed", () => {
    it("renders lead, client and project cards with their last interaction", async () => {
        const renderer = await openDashboard()
        const texts = getTexts(renderer)

        const expected = [
            "Acme Lead",
            "owner@acme.test",
            "Website",
            "Status Changed",
            LEAD_STATUS_META[10].label,
            LEAD_STATUS_META[20].label,
            "Beta Client",
            "Beta Co",
            "Sent the brochure",
            INTERACTION_TYPE_META[2110].label,
            "Gamma Build",
            "Gamma Ltd",
            "Warehouse fit-out",
        ]
        expect(expected.filter((text) => !texts.includes(text))).toEqual([])
        // The to-status keeps its META underline colour.
        expect(findText(renderer, LEAD_STATUS_META[20].label)?.props.className).toContain(
            LEAD_STATUS_META[20].decoration,
        )
        await unmountApp(renderer)
    })

    it("opens a lead, a client and a project in their own tabs", async () => {
        const renderer = await openDashboard()

        await press(findPressable(renderer, "Acme Lead"))
        expect(getCalls(fetchMock)).toContain(`GET /api/admin/operations/leads/${LEAD_ID}`)
        await press(findPressableByText(renderer, "Dashboard"))
        await press(findPressable(renderer, "Beta Client"))
        expect(getCalls(fetchMock)).toContain(`GET /api/admin/operations/clients/${CLIENT_ID}`)
        await press(findPressableByText(renderer, "Dashboard"))
        await press(findPressable(renderer, "Gamma Build"))
        expect(getCalls(fetchMock)).toContain(`GET /api/admin/operations/projects/${PROJECT_ID}`)
        await unmountApp(renderer)
    })

    it("shows 20 rows of a full array, then the next slice with no second request", async () => {
        feedRows = Array.from({ length: 25 }, (_, index) => ({
            ...LEAD_ROW,
            _id: `64b7f0c2a1b2c3d4e5f7${String(index).padStart(4, "0")}`,
            name: `Lead ${index}`,
        }))
        const renderer = await openDashboard()

        expect(getFeedList(renderer).props.data).toHaveLength(20)
        await ReactTestRenderer.act(async () => getFeedList(renderer).props.onEndReached())
        expect(getFeedList(renderer).props.data).toHaveLength(25)
        await ReactTestRenderer.act(async () => getFeedList(renderer).props.onEndReached())
        expect(countCalls(`${FEED}?`)).toBe(1)
        await unmountApp(renderer)
    })

    it("asks for page 2 when the route sends pagination", async () => {
        const renderer = await openDashboard(ADMIN, [
            {
                path: new RegExp(`^${FEED}\\?page=\\d+&limit=20$`),
                reply: (_init, path) => {
                    const page = Number(new URLSearchParams(path.split("?")[1]).get("page"))
                    const data = page === 1 ? [LEAD_ROW, CLIENT_ROW] : [CLIENT_ROW, PROJECT_ROW]
                    return respond(200, { success: true, data, pagination: { page, limit: 20, total: 3, pages: 2 } })
                },
            },
        ])

        await ReactTestRenderer.act(async () => getFeedList(renderer).props.onEndReached())
        await flush()
        expect(getCalls(fetchMock).filter((call) => call.startsWith(`GET ${FEED}?`))).toEqual([
            `GET ${FEED}?page=1&limit=20`,
            `GET ${FEED}?page=2&limit=20`,
        ])
        const ids = (getFeedList(renderer).props.data as { _id: string }[]).map((row) => row._id)
        expect(ids).toEqual([LEAD_ID, CLIENT_ID, PROJECT_ID])
        await unmountApp(renderer)
    })

    it("reloads the feed, the counters and the meetings in one pull", async () => {
        const renderer = await openDashboard()
        const before = [countCalls(`${FEED}?`), countCalls(STATS), countCalls(UPCOMING)]

        const refresh = renderer.root.findByType(DashboardScreen).findByType(RefreshControl)
        await ReactTestRenderer.act(async () => refresh.props.onRefresh())
        await flush()
        expect([countCalls(`${FEED}?`), countCalls(STATS), countCalls(UPCOMING)]).toEqual(before.map((n) => n + 1))
        await unmountApp(renderer)
    })

    it("shows the web's error box, and Retry asks again", async () => {
        const error = jest.spyOn(notify, "error")
        let isDown = true
        const renderer = await openDashboard(ADMIN, [
            {
                path: `${FEED}?page=1&limit=20`,
                reply: () =>
                    isDown
                        ? respond(500, { success: false, message: "Internal server error" })
                        : respond(200, { success: true, data: feedRows }),
            },
        ])

        expect(getTexts(renderer)).toEqual(expect.arrayContaining(["Failed to load data", "Internal server error"]))
        expect(error).toHaveBeenCalledWith("Failed to load operations data", { id: "dashboard-feed" })
        isDown = false
        await press(findPressableByText(renderer, "Retry"))
        expect(getTexts(renderer)).toContain("Acme Lead")
        await unmountApp(renderer)
    })

    it("says No data found for an empty feed", async () => {
        feedRows = []
        const renderer = await openDashboard()
        expect(getTexts(renderer)).toContain("No data found")
        await unmountApp(renderer)
    })

    it("shows AccessDenied with the API's message to a role outside the feed's list", async () => {
        const error = jest.spyOn(notify, "error")
        const message = "Forbidden: insufficient permissions"
        const renderer = await openDashboard({ ...ADMIN, role: 20 }, [
            { path: `${FEED}?page=1&limit=20`, reply: () => respond(403, { success: false, message }) },
            { path: STATS, reply: () => respond(403, { success: false, message }) },
        ])

        expect(getTexts(renderer)).toEqual(expect.arrayContaining(["Access Denied", message, "—"]))
        expect(error).not.toHaveBeenCalledWith("Failed to load operations data", expect.anything())
        await unmountApp(renderer)
    })
})

describe("dashboard panels", () => {
    it("shows the four counters, and Active Clients opens the clients list on status 1", async () => {
        const renderer = await openDashboard()

        expect(getTexts(renderer)).toEqual(
            expect.arrayContaining(["Leads", "Active Clients", "Projects Running", "Meetings This Week"]),
        )
        await press(findPressable(renderer, "Active Clients: 5"))
        const clientCalls = getCalls(fetchMock).filter((call) => call.startsWith("GET /api/admin/operations/clients?"))
        expect(clientCalls.at(-1)).toContain("status=1")
        await unmountApp(renderer)
    })

    it("lists the next four meetings soonest first, each opening its parent", async () => {
        const renderer = await openDashboard()
        const texts = getTexts(renderer)

        const lines = ["Today, 3:00 PM · Acme Lead", "Tomorrow, 9:00 AM", "Fri, 2:30 PM", "Oct 21, 11:00 AM"]
        expect(lines.filter((line) => !texts.includes(line))).toEqual([])
        const titles = texts.filter((text) => ["Demo", "Kickoff", "Pricing call", "Site visit"].includes(text))
        expect(titles).toEqual(["Demo", "Kickoff", "Pricing call", "Site visit"])
        expect(texts).not.toContain("Late review")

        await press(findPressableByText(renderer, "Demo"))
        expect(getCalls(fetchMock)).toContain(`GET /api/admin/operations/leads/${LEAD_ID}`)
        await unmountApp(renderer)
    })

    it("opens the Meetings list on the upcoming range from View all", async () => {
        const renderer = await openDashboard()

        await press(findPressableByText(renderer, "View all"))
        expect(getCalls(fetchMock)).toContain("GET /api/admin/operations/meetings?page=1&limit=10&range=upcoming")
        await unmountApp(renderer)
    })
})

describe("search", () => {
    function searchReply(data: object): FetchRoute {
        return { path: new RegExp(`^${SEARCH}\\?`), reply: () => respond(200, { success: true, data }) }
    }

    function getSearchCalls(): string[] {
        return getCalls(fetchMock).filter((call) => call.startsWith(`GET ${SEARCH}?`))
    }

    async function openSearch(extra: FetchRoute[]) {
        const renderer = await openDashboard(ADMIN, extra)
        await press(findPressable(renderer, "Search"))
        return renderer
    }

    it("asks from two characters on, groups the hits, and opens one", async () => {
        const hit = (id: string, type: string, title: string, href: string) => ({ id, type, title, href })
        const renderer = await openSearch([
            searchReply({
                leads: [hit(LEAD_ID, "LEAD", "Acme Lead", `/admin/operations/leads/${LEAD_ID}`)],
                clients: [hit(CLIENT_ID, "CLIENT", "Acme Holdings", `/admin/operations/clients/${CLIENT_ID}`)],
                projects: [],
                meetings: [hit("m1", "MEETING", "Acme demo", "/admin/operations/meetings")],
                users: [],
                total: 3,
            }),
        ])

        await typeInto(renderer, SEARCH_LABEL, "a")
        await advance(300)
        expect(getSearchCalls()).toEqual([])

        await typeInto(renderer, SEARCH_LABEL, "ac")
        await advance(300)
        expect(getSearchCalls()).toEqual([`GET ${SEARCH}?search=ac&limit=10`])
        // Inside the screen: the tab bar has its own "Projects", and the feed under it its own "Acme Lead".
        const screen = renderer.root.findByType(SearchScreen)
        const texts = screen.findAllByType(Text).map((node) => String(node.props.children))
        expect(texts).toEqual(["Leads", "Acme Lead", "Clients", "Acme Holdings", "Meetings", "Acme demo"])

        await press(
            screen.find(
                (node) => node.props.accessibilityLabel === "Acme Lead" && typeof node.props.onPress === "function",
            ),
        )
        expect(getCalls(fetchMock)).toContain(`GET /api/admin/operations/leads/${LEAD_ID}`)
        await unmountApp(renderer)
    })

    it("says No results for the query", async () => {
        const renderer = await openSearch([
            searchReply({ leads: [], clients: [], projects: [], meetings: [], users: [], total: 0 }),
        ])

        await typeInto(renderer, SEARCH_LABEL, "zz")
        await advance(300)
        expect(getTexts(renderer)).toContain("No results for “zz”")
        await unmountApp(renderer)
    })

    it("shows the server's message when the search fails", async () => {
        const renderer = await openSearch([
            {
                path: new RegExp(`^${SEARCH}\\?`),
                reply: () => respond(500, { success: false, message: "Search index unavailable" }),
            },
        ])

        await typeInto(renderer, SEARCH_LABEL, "acme")
        await advance(300)
        expect(getTexts(renderer)).toContain("Search index unavailable")
        await unmountApp(renderer)
    })
})
