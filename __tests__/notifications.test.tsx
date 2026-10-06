import NetInfo from "@react-native-community/netinfo"
import { AppState, FlatList } from "react-native"
import Swipeable from "react-native-gesture-handler/Swipeable"
import ReactTestRenderer from "react-test-renderer"

import { notify } from "@/lib/notify"
import NotificationsScreen from "@/screens/notifications/NotificationsScreen"
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
    unmountApp,
    type FetchMock,
    type FetchRoute,
} from "../jest/appHarness"

jest.useFakeTimers({ now: new Date(2026, 9, 6, 10, 0, 0) })

const ADMIN = { id: "u1", name: "Asha Rao", email: "asha@zan.test", role: 10, regions: ["IN"], activeRegion: "IN" }
const LEAD_ID = "64b7f0c2a1b2c3d4e5f60718"
const FEED = "/api/notifications"

function makeRow(id: string, overrides: object = {}) {
    return {
        _id: id,
        type: 10,
        title: `Note ${id}`,
        body: "Body text",
        badge: "calendar",
        seenAt: "2026-10-05T08:00:00Z",
        readAt: "2026-10-05T09:00:00Z",
        createdAt: "2026-10-05T08:00:00Z",
        ...overrides,
    }
}

let fetchMock: FetchMock
let bell: { unseen: number; unread: number; firstId: string }

function feedRoutes(extra: FetchRoute[]): FetchRoute[] {
    return [
        ...extra,
        { path: "/api/auth/me", reply: () => respond(200, { success: true, data: ADMIN }) },
        {
            path: `${FEED}?limit=4`,
            reply: () =>
                respond(200, {
                    success: true,
                    data: [makeRow(bell.firstId)],
                    unseen: bell.unseen,
                    unread: bell.unread,
                }),
        },
        {
            path: `${FEED}?limit=15`,
            reply: () =>
                respond(200, {
                    success: true,
                    data: [
                        makeRow("fresh", {
                            title: "New lead",
                            seenAt: null,
                            readAt: null,
                            url: `/admin/operations/leads/${LEAD_ID}`,
                        }),
                        makeRow("seen", { title: "Meeting moved", readAt: null }),
                        makeRow("plain", { title: "Old note" }),
                        ...Array.from({ length: 12 }, (_, i) => makeRow(`r${i}`)),
                    ],
                    unseen: 1,
                    unread: 2,
                    total: 28,
                    nextCursor: "cursor-1",
                }),
        },
        {
            path: `${FEED}?limit=15&before=cursor-1`,
            reply: () =>
                respond(200, {
                    success: true,
                    // r11 repeats from page one; the list must not show it twice.
                    data: [makeRow("r11"), ...Array.from({ length: 13 }, (_, i) => makeRow(`s${i}`))],
                    unread: 2,
                    total: 28,
                    nextCursor: null,
                }),
        },
        {
            path: `${FEED}?limit=15&unread=true`,
            reply: () =>
                respond(200, {
                    success: true,
                    data: [makeRow("seen", { title: "Meeting moved", readAt: null })],
                    unread: 1,
                    total: 1,
                    nextCursor: null,
                }),
        },
        { method: "PATCH", path: `${FEED}/seen`, reply: () => respond(200, { success: true }) },
        { method: "PATCH", path: `${FEED}/read-all`, reply: () => respond(200, { success: true }) },
        {
            method: "PATCH",
            path: /^\/api\/notifications\/[a-z0-9]+\/read$/,
            reply: () => respond(200, { success: true }),
        },
    ]
}

async function signIn(extra: FetchRoute[] = []) {
    await saveToken("jwt-1")
    routeFetch(fetchMock, feedRoutes(extra))
    return renderApp()
}

async function openInbox(extra: FetchRoute[] = []) {
    const renderer = await signIn(extra)
    await press(findPressableByText(renderer, "More"))
    await press(findPressable(renderer, "Notifications"))
    return renderer
}

function countCalls(call: string): number {
    return getCalls(fetchMock).filter((made) => made === call).length
}

async function advance(ms: number) {
    await ReactTestRenderer.act(async () => {
        jest.advanceTimersByTime(ms)
    })
    await flush()
}

function inboxList(renderer: ReactTestRenderer.ReactTestRenderer) {
    return renderer.root.findByType(NotificationsScreen).findByType(FlatList)
}

beforeEach(async () => {
    jest.clearAllMocks()
    fetchMock = installFetchMock()
    bell = { unseen: 12, unread: 3, firstId: "b1" }
    await clearToken()
    saveActiveRegion(null)
    Object.defineProperty(AppState, "currentState", { value: "active", configurable: true })
})

/** Sends a network state to every NetInfo listener: the bell's back-off and the app's online state both listen. */
async function sendNetwork(state: { type: string }) {
    const listeners = (NetInfo.addEventListener as jest.Mock).mock.calls.map(([listener]) => listener)
    await ReactTestRenderer.act(async () => listeners.forEach((listener) => listener(state)))
}

describe("header bell", () => {
    it("shows the unseen count on a tab, and a tap marks it seen and opens the inbox", async () => {
        const renderer = await signIn()

        expect(countCalls(`GET ${FEED}?limit=4`)).toBe(1)
        expect(getTexts(renderer)).toContain("9+")
        await press(findPressable(renderer, "Notifications, 12 new"))

        expect(getTexts(renderer)).not.toContain("9+")
        expect(countCalls(`PATCH ${FEED}/seen`)).toBeGreaterThanOrEqual(1)
        expect(renderer.root.findAllByType(NotificationsScreen)).toHaveLength(1)
        await unmountApp(renderer)
    })

    it("polls every 30 s in front, never in the background, and once at once on return", async () => {
        const renderer = await signIn()
        // Wi-Fi, so no cellular back-off.
        await sendNetwork({ type: "wifi" })

        await advance(30_000)
        expect(countCalls(`GET ${FEED}?limit=4`)).toBe(2)

        const handlers = (AppState.addEventListener as jest.Mock).mock.calls
            .filter(([type]) => type === "change")
            .map(([, handler]) => handler as (state: string) => void)
        Object.defineProperty(AppState, "currentState", { value: "background", configurable: true })
        await ReactTestRenderer.act(async () => handlers.forEach((handler) => handler("background")))
        await advance(120_000)
        expect(countCalls(`GET ${FEED}?limit=4`)).toBe(2)

        Object.defineProperty(AppState, "currentState", { value: "active", configurable: true })
        await ReactTestRenderer.act(async () => handlers.forEach((handler) => handler("active")))
        await flush()
        expect(countCalls(`GET ${FEED}?limit=4`)).toBe(3)
        await unmountApp(renderer)
    })

    it("backs off to 60 s on mobile data while nothing changes", async () => {
        const renderer = await signIn()
        await sendNetwork({ type: "cellular" })

        // The first 30 s poll finds the same feed, so the next one waits 60 s.
        await advance(30_000)
        expect(countCalls(`GET ${FEED}?limit=4`)).toBe(2)
        await advance(30_000)
        expect(countCalls(`GET ${FEED}?limit=4`)).toBe(2)
        await advance(30_000)
        expect(countCalls(`GET ${FEED}?limit=4`)).toBe(3)
        await unmountApp(renderer)
    })
})

describe("inbox", () => {
    it("loads 15 rows in three states and marks them seen once", async () => {
        const renderer = await openInbox()
        const texts = getTexts(renderer)

        expect(countCalls(`GET ${FEED}?limit=15`)).toBe(1)
        expect(countCalls(`PATCH ${FEED}/seen`)).toBe(1)
        expect(texts).toEqual(
            expect.arrayContaining([
                "New lead",
                "New",
                "Meeting moved",
                "Old note",
                "2 unread",
                "Notifications older than 30 days are automatically removed.",
            ]),
        )
        expect(inboxList(renderer).props.data).toHaveLength(15)
        // Only the two unread rows can be swiped.
        expect(renderer.root.findAllByType(Swipeable)).toHaveLength(2)
        await unmountApp(renderer)
    })

    it("appends the next page on scroll, skips a repeated row, and stops at the end", async () => {
        const renderer = await openInbox()

        await ReactTestRenderer.act(async () => inboxList(renderer).props.onEndReached())
        await flush()
        const ids = inboxList(renderer).props.data.map((row: { _id: string }) => row._id)
        expect(ids).toHaveLength(28)
        expect(new Set(ids).size).toBe(28)

        await ReactTestRenderer.act(async () => inboxList(renderer).props.onEndReached())
        expect(getCalls(fetchMock).filter((call) => call.includes("before=")).length).toBe(1)
        await unmountApp(renderer)
    })

    it("replaces the list with the unread rows, and back", async () => {
        const renderer = await openInbox()

        await press(findPressableByText(renderer, "Unread"))
        expect(inboxList(renderer).props.data.map((row: { _id: string }) => row._id)).toEqual(["seen"])
        await press(findPressableByText(renderer, "All"))
        expect(inboxList(renderer).props.data).toHaveLength(15)
        expect(countCalls(`GET ${FEED}?limit=15`)).toBe(2)
        await unmountApp(renderer)
    })

    it("a tap marks a lead row read and opens the lead", async () => {
        const renderer = await openInbox([
            {
                path: `/api/admin/operations/leads/${LEAD_ID}`,
                reply: () =>
                    respond(200, {
                        success: true,
                        data: {
                            lead: {
                                _id: LEAD_ID,
                                name: "Acme",
                                phone: "+919876543210",
                                source: "Web",
                                status: 10,
                                createdAt: "2026-10-01T08:00:00Z",
                            },
                            client: null,
                        },
                    }),
            },
            {
                path: `/api/admin/operations/leads/${LEAD_ID}/interactions`,
                reply: () => respond(200, { success: true, interactions: [] }),
            },
        ])

        await press(findPressable(renderer, "New lead, unread"))
        expect(countCalls(`PATCH ${FEED}/fresh/read`)).toBe(1)
        expect(getCalls(fetchMock)).toContain(`GET /api/admin/operations/leads/${LEAD_ID}`)
        await unmountApp(renderer)
    })

    it("marks one row read with the Check button or a swipe, with no refetch", async () => {
        const renderer = await openInbox()

        // Two unread rows have a Check button; the first is the fresh one.
        const checks = renderer.root.findAll(
            (node) => node.props.accessibilityLabel === "Mark as read" && typeof node.props.onPress === "function",
        )
        await press(checks[0])
        expect(countCalls(`PATCH ${FEED}/fresh/read`)).toBe(1)
        expect(getTexts(renderer)).toContain("1 unread")

        const swipe = renderer.root.findByType(Swipeable)
        await ReactTestRenderer.act(async () => swipe.props.onSwipeableOpen("right"))
        await flush()
        expect(countCalls(`PATCH ${FEED}/seen/read`)).toBe(1)
        expect(getTexts(renderer)).not.toContain("1 unread")
        expect(renderer.root.findAllByType(Swipeable)).toHaveLength(0)
        expect(countCalls(`GET ${FEED}?limit=15`)).toBe(1)
        await unmountApp(renderer)
    })

    it("marks all read with one toast, deduped by id", async () => {
        const success = jest.spyOn(notify, "success")
        const renderer = await openInbox()

        await press(findPressableByText(renderer, "Mark all read"))
        expect(countCalls(`PATCH ${FEED}/read-all`)).toBe(1)
        expect(success).toHaveBeenCalledWith("All notifications marked as read", { id: "notifications-read-all" })
        expect(getTexts(renderer)).not.toContain("2 unread")
        expect(getTexts(renderer)).not.toContain("Mark all read")
        await unmountApp(renderer)
    })
})
