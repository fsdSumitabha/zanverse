import { Text, TextInput } from "react-native"
import ReactTestRenderer from "react-test-renderer"

import { navigationRef } from "@/api/navigationRef"
import DateField from "@/components/list/DateField"
import { INTERACTION_TYPE_META } from "@/constants/interactionTypes"
import { LEAD_STATUS_META } from "@/constants/leadStatus"
import ActivityLogsScreen from "@/screens/activityLogs/ActivityLogsScreen"
import ProfileScreen from "@/screens/profile/ProfileScreen"
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

jest.useFakeTimers()

const ADMIN = { id: "u1", name: "Asha Rao", email: "asha@zan.test", role: 10, regions: ["IN"], activeRegion: "IN" }
const AGENT = { id: "u2", name: "Ravi Kumar", email: "ravi@zan.test", role: 60, regions: ["IN"], activeRegion: "IN" }
const ACTIVITY = "/api/admin/operations/activity-logs"
const LEAD_ID = "64b7f0c2a1b2c3d4e5f60718"
const ACTOR = { _id: "u1", name: "Asha Rao" }

function makeRow(id: string, overrides: object) {
    return {
        _id: id,
        entityType: 0,
        entityId: LEAD_ID,
        entityName: "Acme",
        action: null,
        oldData: null,
        newData: null,
        user: ACTOR,
        createdAt: "2026-10-05T08:00:00Z",
        ...overrides,
    }
}

const PAGE_ONE = [
    makeRow("r1", { action: "status", oldData: 10, newData: 20 }),
    makeRow("r2", { entityType: 3, entityName: "Meera", action: "role", oldData: 60, newData: 65 }),
    makeRow("r3", {
        action: "assignedTo",
        oldData: "64b7f0c2a1b2c3d4e5f67f90",
        newData: "64b7f0c2a1b2c3d4e5f6aaaa",
    }),
    makeRow("r4", { action: "CREATE", newData: {} }),
    makeRow("r5", { entityType: 5, entityName: "Kickoff", action: "DELETE", oldData: {} }),
    makeRow("r6", {
        entityType: 4,
        entityName: null,
        action: "CREATE",
        newData: {},
        interaction: {
            type: 2510,
            parentEntityType: 0,
            parentEntityId: LEAD_ID,
            parentEntityName: "Acme",
            title: JSON.stringify({ from: 10, to: 20 }),
            description: "Called twice",
        },
    }),
]

let fetchMock: FetchMock

function routes(user: object, extra: FetchRoute[]): FetchRoute[] {
    return [
        ...extra,
        { path: "/api/auth/me", reply: () => respond(200, { success: true, data: user }) },
        {
            path: /^\/api\/admin\/operations\/activity-logs\?/,
            reply: (_init, path) => {
                const page = Number(new URLSearchParams(path.split("?")[1]).get("page"))
                const data =
                    page === 2
                        ? [
                              makeRow("p2", { action: "CREATE", newData: {} }),
                              makeRow("r1", { action: "status", oldData: 10, newData: 20 }),
                          ]
                        : PAGE_ONE
                return respond(200, {
                    success: true,
                    data,
                    pagination: { page, limit: 15, total: 8, pages: 2 },
                    scope: "all",
                })
            },
        },
        {
            path: "/api/admin/operations/users?limit=100",
            reply: () => respond(200, { success: true, data: [{ _id: "u3", name: "Meera Shah" }] }),
        },
        {
            path: "/api/auth/profile",
            reply: () =>
                respond(200, {
                    success: true,
                    data: {
                        id: "u2",
                        name: "Ravi Kumar",
                        email: "ravi@zan.test",
                        role: 60,
                        isActive: true,
                        avatar: "",
                        lastLoginAt: null,
                        createdAt: null,
                        updatedAt: null,
                        createdBy: null,
                    },
                }),
        },
    ]
}

async function openLogs(user: object = ADMIN, extra: FetchRoute[] = []) {
    await saveToken("jwt-1")
    routeFetch(fetchMock, routes(user, extra))
    const renderer = await renderApp()
    await press(findPressableByText(renderer, "More"))
    await press(findPressable(renderer, "Activity Logs"))
    return renderer
}

function getLogCalls(): string[] {
    return getCalls(fetchMock).filter((call) => call.startsWith(`GET ${ACTIVITY}?`))
}

// The Dashboard tab's feed is mounted too, so the list is looked for inside the screen.
function getLogList(renderer: ReactTestRenderer.ReactTestRenderer) {
    return renderer.root
        .findByType(ActivityLogsScreen)
        .findAll((node) => typeof node.props.onEndReached === "function")[0]
}

/** The last pressable holding this text: the filter sheet's chip, not a row's badge with the same word. */
function findLastPressableByText(renderer: ReactTestRenderer.ReactTestRenderer, text: string) {
    const matches = renderer.root.findAllByType(Text).filter((node) => node.props.children === text)
    for (const textNode of matches.reverse()) {
        let node = textNode.parent
        while (node && typeof node.props.onPress !== "function") node = node.parent
        if (node) return node
    }
    throw new Error(`No pressable holds the text "${text}"`)
}

function findText(renderer: ReactTestRenderer.ReactTestRenderer, text: string) {
    return renderer.root.findAllByType(Text).find((node) => node.props.children === text)
}

beforeEach(async () => {
    jest.clearAllMocks()
    fetchMock = installFetchMock()
    await clearToken()
    saveActiveRegion(null)
})

describe("activity logs", () => {
    it("renders diffs, markers and interaction rows the way the web does", async () => {
        const renderer = await openLogs()
        const texts = getTexts(renderer)

        expect(getLogCalls()[0]).toBe(`GET ${ACTIVITY}?page=1&limit=15`)
        const expected = [
            "Activity Log",
            "8 entries",
            "New Lead",
            "Contacted",
            "Business Development Executive",
            "US Sales Agent",
            "64b7f0…7f90",
            "Created",
            "Deleted",
            INTERACTION_TYPE_META[2510].label,
            "on",
            "Lead — Acme",
            "Remarks: ",
            "Status",
        ]
        expect(expected.filter((text) => !texts.includes(text))).toEqual([])
        // A status change uses the status's own colour.
        expect(findText(renderer, "Contacted")?.props.className).toContain(LEAD_STATUS_META[20].color)
        await unmountApp(renderer)
    })

    it("appends page 2 without repeating a row", async () => {
        const renderer = await openLogs()
        const list = getLogList(renderer)
        await ReactTestRenderer.act(async () => list.props.onEndReached())
        await flush()
        expect(getLogCalls().at(-1)).toBe(`GET ${ACTIVITY}?page=2&limit=15`)
        const data = getLogList(renderer).props.data as {
            _id: string
        }[]
        expect(data.map((row) => row._id)).toEqual(["r1", "r2", "r3", "r4", "r5", "r6", "p2"])
        await unmountApp(renderer)
    })

    it("opens a lead from its badge, and leaves a meeting badge a plain pill", async () => {
        const renderer = await openLogs(ADMIN, [
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

        const meeting = renderer.root.find(
            (node) => node.props.accessibilityLabel === "Meeting" && "disabled" in node.props,
        )
        expect(meeting.props.disabled).toBe(true)
        await press(
            renderer.root.findAll(
                (node) =>
                    node.props.accessibilityLabel === "Open lead detail" && typeof node.props.onPress === "function",
            )[0],
        )
        expect(getCalls(fetchMock)).toContain(`GET /api/admin/operations/leads/${LEAD_ID}`)
        await unmountApp(renderer)
    })

    it("filters by Lead (code 0), an inclusive To date and a user, each from page 1", async () => {
        const renderer = await openLogs()

        await press(findPressable(renderer, "Filters"))
        await press(findLastPressableByText(renderer, "Lead"))
        expect(getLogCalls().at(-1)).toBe(`GET ${ACTIVITY}?page=1&limit=15&entityType=0`)

        const to = renderer.root.findAllByType(DateField).find((field) => field.props.label === "To")!
        await ReactTestRenderer.act(async () => to.props.onChange("2026-10-06"))
        await flush()
        const toIso = new Date(2026, 9, 6, 23, 59, 59, 999).toISOString()
        expect(getLogCalls().at(-1)).toBe(
            `GET ${ACTIVITY}?page=1&limit=15&entityType=0&to=${encodeURIComponent(toIso)}`,
        )

        const search = () =>
            renderer.root
                .findAllByType(TextInput)
                .find((node) => node.props.accessibilityLabel === "Search by user name")!
        expect(search().props.editable).toBe(true)
        await press(findPressable(renderer, "User: All users"))
        await press(findPressableByText(renderer, "Meera Shah"))
        expect(getLogCalls().at(-1)).toContain("userId=u3")
        expect(search().props.editable).toBe(false)
        await press(findPressable(renderer, "User: Meera Shah"))
        await press(findPressableByText(renderer, "All users"))
        expect(search().props.editable).toBe(true)
        expect(getLogCalls().at(-1)).not.toContain("userId")
        await unmountApp(renderer)
    })

    it("shows a role-60 account the Restricted area card, whose button opens the profile", async () => {
        // Role 60 has no Activity Logs row in More, as on the web's menu; a deep link still lands on the screen.
        await saveToken("jwt-1")
        routeFetch(fetchMock, routes(AGENT, []))
        const renderer = await renderApp()
        await ReactTestRenderer.act(async () => {
            navigationRef.navigate("App", { screen: "MoreTab", params: { screen: "ActivityLogs", initial: false } })
        })
        await flush()
        expect(getTexts(renderer)).toEqual(expect.arrayContaining(["Restricted area"]))
        expect(getLogCalls()).toEqual([])

        await press(findPressableByText(renderer, "Open my profile"))
        expect(renderer.root.findAllByType(ProfileScreen)).toHaveLength(1)
        expect(getLogCalls().at(-1)).toBe(`GET ${ACTIVITY}?page=1&limit=15&userId=u2`)
        expect(renderer.root.findAll((node) => node.props.accessibilityLabel === "User: All users")).toHaveLength(0)
        await unmountApp(renderer)
    })
})
