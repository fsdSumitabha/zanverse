import { RefreshControl, Text, View } from "react-native"
import { LineChart, PieChart } from "react-native-gifted-charts"
import ReactTestRenderer from "react-test-renderer"

import BudgetCard from "@/components/stats/BudgetCard"
import LeadsOverTimeCard from "@/components/stats/LeadsOverTimeCard"
import RoleCountsCard from "@/components/stats/RoleCountsCard"
import StatusPieCard from "@/components/stats/StatusPieCard"
import OverallStatsScreen from "@/screens/stats/OverallStatsScreen"
import { clearToken, saveToken } from "@/store/keychain"
import { saveActiveRegion } from "@/store/mmkv"

import {
    findPressable,
    findPressableByText,
    flush,
    getCalls,
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

const AGENT = { id: "u2", name: "Ravi Kumar", email: "ravi@zan.test", role: 60, regions: ["IN"], activeRegion: "IN" }
const OVERALL = "/api/admin/operations/overall-stats"
const NOW = new Date(2026, 9, 6, 10, 0)

type Node = ReactTestRenderer.ReactTestInstance

function makeStats() {
    return {
        leads: {
            total: 20,
            byStatus: { new: 8, contacted: 5, meeting: 0, discussion: 2, negotiation: 1, converted: 3, lost: 1 },
            active: 16,
            converted: 3,
            lost: 1,
            conversionRate: 0.75 as number | null,
            overTime: [
                { year: 2025, leads: 6, converted: 1, months: [{ month: 11, leads: 6, converted: 1 }] },
                {
                    year: 2026,
                    leads: 14,
                    converted: 2,
                    months: [
                        { month: 3, leads: 10, converted: 2 },
                        { month: 9, leads: 4, converted: 0 },
                    ],
                },
            ],
        },
        clients: { total: 7, byStatus: { active: 4, inactive: 1, onHold: 0, completed: 2 } },
        projects: {
            total: 9,
            byStatus: {
                discussion: 1,
                proposalSent: 1,
                negotiation: 1,
                confirmed: 2,
                inProgress: 1,
                deployed: 0,
                maintenance: 1,
                closed: 2,
            },
            pipeline: 3,
            running: 4,
            closed: 2,
            totalBudgetRunning: 12_50_000,
        },
        meetings: {
            total: 12,
            byStatus: { scheduled: 5, rescheduled: 1, cancelled: 2, missed: 1, completed: 3 },
            today: 1,
            thisWeek: 2,
            upcoming: 5,
        },
        users: { total: 10, active: 8, inactive: 2, byRole: { "10": 1, "60": 6, "25": 1, "65": 2 } },
        updatedAt: new Date(NOW.getTime() - 2 * 60_000).toISOString(),
    }
}

let fetchMock: FetchMock
let stats: ReturnType<typeof makeStats>

function routes(extra: FetchRoute[]): FetchRoute[] {
    return [
        ...extra,
        { path: "/api/auth/me", reply: () => respond(200, { success: true, data: AGENT }) },
        { path: OVERALL, reply: () => respond(200, { success: true, data: stats }) },
    ]
}

async function openStats(extra: FetchRoute[] = []) {
    await saveToken("jwt-1")
    routeFetch(fetchMock, routes(extra))
    const renderer = await renderApp()
    await press(findPressableByText(renderer, "More"))
    await press(findPressable(renderer, "Overall Stats"))
    return renderer
}

function textsIn(node: Node): string[] {
    return node.findAllByType(Text).map((text) => {
        const children = text.props.children
        return Array.isArray(children) ? children.join("") : String(children)
    })
}

function getScreen(renderer: ReactTestRenderer.ReactTestRenderer) {
    return renderer.root.findByType(OverallStatsScreen)
}

function getPieCard(renderer: ReactTestRenderer.ReactTestRenderer, label: string) {
    return getScreen(renderer)
        .findAllByType(StatusPieCard)
        .find((card) => card.props.label === label)!
}

// The pie's own Pressable, which maps the touch point to a slice.
function getPiePress(pie: Node) {
    return pie.findAll((node) => typeof node.props.onPress === "function")[0].props.onPress
}

function countStatsCalls() {
    return getCalls(fetchMock).filter((call) => call === `GET ${OVERALL}`).length
}

beforeEach(async () => {
    jest.clearAllMocks()
    jest.setSystemTime(NOW)
    fetchMock = installFetchMock()
    stats = makeStats()
    await clearToken()
    saveActiveRegion(null)
})

describe("overall stats", () => {
    it("opens from More for a non-admin, with the title, the stamp and the four KPIs", async () => {
        const renderer = await openStats()
        const texts = textsIn(getScreen(renderer))

        expect(countStatsCalls()).toBe(1)
        const expected = [
            "Pipeline overview",
            "Status distribution across leads, clients, projects and meetings.",
            "Updated",
            "2 minutes ago",
            "Conversion",
            "75%",
            "3 of 20 leads",
            "Active budget",
            "₹12.50 L",
            "4 projects running",
            "Upcoming",
            "2 this week · 1 today",
            "Active team",
            "10 total · 2 inactive",
        ]
        expect(expected.filter((text) => !texts.includes(text))).toEqual([])
        await unmountApp(renderer)
    })

    it("shows — and no NaN% while nothing is converted or lost", async () => {
        stats.leads.conversionRate = null
        const renderer = await openStats()
        const texts = textsIn(getScreen(renderer))

        expect(texts).toContain("—")
        expect(texts.some((text) => text.includes("NaN"))).toBe(false)
        expect(textsIn(getPieCard(renderer, "Leads"))).not.toContain("— converted")
        await unmountApp(renderer)
    })

    it("draws each card's slices in its legend's colours, and No activity yet for all zeros", async () => {
        stats.clients.byStatus = { active: 0, inactive: 0, onHold: 0, completed: 0 }
        const renderer = await openStats()

        for (const label of ["Leads", "Projects", "Meetings"]) {
            const card = getPieCard(renderer, label)
            const sliceColors = (card.findByType(PieChart).props.data as { color: string }[]).map(
                (slice) => slice.color,
            )
            const swatches = card
                .findAllByType(View)
                .filter((node) => node.props.className === "h-2.5 w-2.5 rounded-sm")
                .map((node) => node.props.style.backgroundColor)
            expect(swatches).toEqual(sliceColors)
        }
        const leads = textsIn(getPieCard(renderer, "Leads"))
        expect(leads).toEqual(expect.arrayContaining(["New", "40%", "Contacted", "25%", "75% converted"]))
        expect(leads).not.toContain("Meeting")
        expect(textsIn(getPieCard(renderer, "Projects"))).toEqual(expect.arrayContaining(["Maintenance", "₹12.50 L"]))
        expect(textsIn(getPieCard(renderer, "Clients"))).toContain("No activity yet")
        await unmountApp(renderer)
    })

    it("names a tapped donut slice in the centre, and a second tap restores the conversion", async () => {
        const renderer = await openStats()
        const donut = () => getPieCard(renderer, "Leads").findByType(PieChart)
        // The first slice ("New", 40%) starts at the top and runs clockwise. The tap lands inside the ring.
        const tap = { nativeEvent: { locationX: 64 + 20 + 6.4, locationY: 64 - 50 + 6.4 } }

        expect(textsIn(donut())).toEqual(expect.arrayContaining(["75%", "conversion"]))
        await ReactTestRenderer.act(async () => getPiePress(donut())(tap))
        expect(textsIn(donut())).toEqual(expect.arrayContaining(["8", "New · 40%"]))
        await ReactTestRenderer.act(async () => getPiePress(donut())(tap))
        expect(textsIn(donut())).toEqual(expect.arrayContaining(["75%", "conversion"]))
        await unmountApp(renderer)
    })

    it("shows the budget, and the team by role with a fallback name", async () => {
        const renderer = await openStats()

        const budget = textsIn(getScreen(renderer).findByType(BudgetCard))
        expect(budget).toEqual([
            "Running budget",
            "₹12.50 L",
            expect.any(String),
            "3",
            "Pipeline",
            "4",
            "Running",
            "2",
            "Closed",
        ])
        const team = textsIn(getScreen(renderer).findByType(RoleCountsCard))
        expect(team).toEqual([
            "Team",
            "10",
            "8 active · 2 inactive",
            "Business Development Executive",
            "6",
            "US Sales Agent",
            "2",
            "Admin",
            "1",
            "Role 25",
            "1",
        ])
        await unmountApp(renderer)
    })

    it("opens the latest year with 12 months, toggles years, and reads a month from the chart", async () => {
        const renderer = await openStats()
        const card = () => getScreen(renderer).findByType(LeadsOverTimeCard)

        let texts = textsIn(card())
        expect(texts.indexOf("2026")).toBeLessThan(texts.indexOf("2025"))
        expect(["Jan", "Feb", "Mar", "Dec"].filter((month) => !texts.includes(month))).toEqual([])
        expect(texts.filter((text) => text === "—")).toHaveLength(20)
        expect(texts).toEqual(expect.arrayContaining(["14", "leads", "2 conv · 14%", "6", "1 conv · 17%"]))

        // The chart draws once its width is known.
        const frame = card().find((node) => node.props.accessibilityLabel === "Leads per month, total and converted")
        await ReactTestRenderer.act(async () => frame.props.onLayout({ nativeEvent: { layout: { width: 280 } } }))
        const chart = card().findByType(LineChart)
        expect(chart.props.data.map((point: { label: string }) => point.label).join("")).toBe("JFMAMJJASOND")
        async function readout(index: number) {
            let view: ReactTestRenderer.ReactTestRenderer | undefined
            await ReactTestRenderer.act(async () => {
                view = ReactTestRenderer.create(chart.props.pointerConfig.pointerLabelComponent([], [], index))
            })
            return textsIn(view!.root)
        }
        expect(await readout(2)).toEqual(["Mar", "10 leads · 2 converted", "20% converted"])
        expect(await readout(0)).toEqual(["Jan", "0 leads · 0 converted", "No leads"])

        await press(findPressable(renderer, "2026: 14 leads, 2 converted, 14%"))
        texts = textsIn(card())
        expect(texts).not.toContain("Mar")
        await press(findPressable(renderer, "2025: 6 leads, 1 converted, 17%"))
        texts = textsIn(card())
        expect(texts).toContain("Nov")
        expect(texts.filter((text) => text === "—")).toHaveLength(22)
        await unmountApp(renderer)
    })

    it("reloads once on pull-to-refresh", async () => {
        const renderer = await openStats()

        const refresh = getScreen(renderer).findByType(RefreshControl)
        await ReactTestRenderer.act(async () => refresh.props.onRefresh())
        await flush()
        expect(countStatsCalls()).toBe(2)
        await unmountApp(renderer)
    })

    it("opens the Clients list from the card title", async () => {
        const renderer = await openStats()

        await press(findPressable(renderer, "Open Clients"))
        expect(getCalls(fetchMock).some((call) => call.startsWith("GET /api/admin/operations/clients?"))).toBe(true)
        await unmountApp(renderer)
    })

    it("shows the server's message on a failure, and Try again loads it", async () => {
        let isDown = true
        const renderer = await openStats([
            {
                path: OVERALL,
                reply: () =>
                    isDown
                        ? respond(500, { success: false, message: "Failed to compute stats" })
                        : respond(200, { success: true, data: stats }),
            },
        ])

        expect(textsIn(getScreen(renderer))).toEqual(
            expect.arrayContaining(["Could not load the overview", "Failed to compute stats"]),
        )
        isDown = false
        await press(findPressableByText(renderer, "Try again"))
        expect(textsIn(getScreen(renderer))).toContain("3 of 20 leads")
        await unmountApp(renderer)
    })
})
