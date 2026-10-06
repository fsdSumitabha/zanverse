import { Alert, Linking, Text } from "react-native"
import ReactTestRenderer from "react-test-renderer"

import DateTimeField from "@/components/ui/DateTimeField"
import { notify } from "@/lib/notify"
import { clearToken, saveToken } from "@/store/keychain"
import { saveActiveRegion } from "@/store/mmkv"

import {
    findPressable,
    findPressableByText,
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

const ADMIN = { id: "u1", name: "Asha Rao", email: "asha@zan.test", role: 10, regions: ["IN"], activeRegion: "IN" }
// 50 can open Meetings but may not reschedule or close.
const MARKETER = { id: "u4", name: "Dev Patel", email: "dev@zan.test", role: 50, regions: ["IN"], activeRegion: "IN" }
const MEETINGS = "/api/admin/operations/meetings"
const LEAD_ID = "64b7f0c2a1b2c3d4e5f60718"

function makeMeeting(id: string, overrides: object = {}) {
    return {
        _id: id,
        entityType: 0,
        entityId: LEAD_ID,
        title: `Meeting ${id}`,
        agenda: "Pricing",
        description: "",
        meetingType: 1,
        meetingLink: undefined as string | undefined,
        attendees: [{ _id: "u2", name: "Ravi Kumar" }],
        scheduledAt: new Date(2026, 9, 6, 15, 0).toISOString(),
        status: 2010,
        rescheduleHistory: [],
        createdAt: "2026-10-01T08:00:00Z",
        updatedAt: "2026-10-01T08:00:00Z",
        entity: { type: 0, label: "Lead", title: "Acme Traders" },
        ...overrides,
    }
}

let fetchMock: FetchMock
let meetings: object[]

function listReply(path: string) {
    const page = Number(new URLSearchParams(path.split("?")[1]).get("page"))
    return respond(200, {
        success: true,
        data: page === 2 ? [makeMeeting("p2")] : meetings,
        pagination: { total: 11, page, limit: 10, totalPages: 2, hasNextPage: page < 2, hasPrevPage: page > 1 },
    })
}

async function openMeetings(user: object = ADMIN, extra: FetchRoute[] = []) {
    await saveToken("jwt-1")
    routeFetch(fetchMock, [
        ...extra,
        { path: "/api/auth/me", reply: () => respond(200, { success: true, data: user }) },
        { path: /^\/api\/admin\/operations\/meetings\?/, reply: (_init, path) => listReply(path) },
    ])
    const renderer = await renderApp()
    await press(findPressableByText(renderer, "More"))
    await press(findPressable(renderer, "Meetings"))
    return renderer
}

function getListCalls(): string[] {
    return getCalls(fetchMock).filter((call) => call.startsWith(`GET ${MEETINGS}?`))
}

beforeEach(async () => {
    jest.clearAllMocks()
    fetchMock = installFetchMock()
    meetings = [
        makeMeeting("m1", {
            meetingType: 0,
            meetingLink: "https://meet.google.com/abc-defg-hij",
            rescheduleHistory: [
                {
                    oldDate: new Date(2026, 9, 5, 11, 0).toISOString(),
                    newDate: new Date(2026, 9, 6, 15, 0).toISOString(),
                    reason: "Client travelling",
                    changedAt: "2026-10-04T08:00:00Z",
                },
            ],
            status: 2020,
        }),
        makeMeeting("m2", {
            scheduledAt: new Date(2026, 9, 2, 11, 0).toISOString(),
            entityType: 1,
            entity: { type: 1, label: "Client", title: "Globex" },
        }),
        makeMeeting("m3", {
            status: 2050,
            outcome: "Signed the quote.",
            scheduledAt: new Date(2026, 9, 1, 11, 0).toISOString(),
        }),
    ]
    await clearToken()
    saveActiveRegion(null)
})

describe("meetings list", () => {
    it("lists meetings with badges, the entity, attendees, history and outcome", async () => {
        const renderer = await openMeetings()
        const texts = getTexts(renderer)

        expect(getListCalls()[0]).toBe(`GET ${MEETINGS}?page=1&limit=10`)
        const expected = [
            "Meeting m1",
            "Meeting Rescheduled",
            "Today",
            "Acme Traders",
            "Ravi Kumar",
            "Agenda: Pricing",
            "Rescheduled",
            "(1)",
            "Oct 5, 2026 11:00 AM",
            "| “Client travelling”",
            "Meeting Scheduled",
            "Past",
            "Globex",
            "Meeting Completed",
            "Outcome",
            "Signed the quote.",
        ]
        expect(expected.filter((text) => !texts.includes(text))).toEqual([])
        expect(
            renderer.root.findAll((node) => node.props.accessibilityLabel === "orange status dot").length,
        ).toBeGreaterThan(0)
        await unmountApp(renderer)
    })

    it("filters by status, entity and range from page 1, and clears them", async () => {
        const renderer = await openMeetings()

        await press(findPressable(renderer, "All statuses"))
        await press(findPressableByText(renderer, "Meeting Completed"))
        expect(getListCalls().at(-1)).toBe(`GET ${MEETINGS}?page=1&limit=10&status=2050`)

        await press(findPressableByText(renderer, "Upcoming"))
        expect(getListCalls().at(-1)).toBe(`GET ${MEETINGS}?page=1&limit=10&status=2050&range=upcoming`)

        await press(findPressable(renderer, "All entities"))
        await press(findPressableByText(renderer, "Client"))
        expect(getListCalls().at(-1)).toBe(`GET ${MEETINGS}?page=1&limit=10&status=2050&range=upcoming&entityType=1`)

        await press(findPressableByText(renderer, "Clear filters"))
        expect(getListCalls().at(-1)).toBe(`GET ${MEETINGS}?page=1&limit=10`)
        await unmountApp(renderer)
    })

    it("reschedules with the client checks first, then the server's message and a reload", async () => {
        const bodies: unknown[] = []
        const error = jest.spyOn(notify, "error")
        const success = jest.spyOn(notify, "success")
        const renderer = await openMeetings(ADMIN, [
            {
                method: "PATCH",
                path: `${MEETINGS}/m1/reschedule`,
                reply: (init) => {
                    bodies.push(JSON.parse(String(init.body)))
                    return respond(200, { success: true, message: "Meeting rescheduled" })
                },
            },
        ])

        await press(findPressableByText(renderer, "Reschedule"))
        await press(findPressableByText(renderer, "Confirm"))
        expect(error).toHaveBeenLastCalledWith("Please provide a reason")

        await typeInto(renderer, "Reason", "Client asked")
        const field = renderer.root.findByType(DateTimeField)
        await ReactTestRenderer.act(async () => field.props.onChange(new Date(2026, 9, 6, 9, 0)))
        await press(findPressableByText(renderer, "Confirm"))
        expect(error).toHaveBeenLastCalledWith("New time must be in the future")
        expect(bodies).toEqual([])

        await ReactTestRenderer.act(async () => field.props.onChange(new Date(2026, 9, 8, 16, 30)))
        const before = getListCalls().length
        await press(findPressableByText(renderer, "Confirm"))
        expect(bodies).toEqual([{ scheduledAt: new Date(2026, 9, 8, 16, 30).toISOString(), reason: "Client asked" }])
        expect(success).toHaveBeenCalledWith("Meeting rescheduled")
        expect(getListCalls().length).toBe(before + 1)
        await unmountApp(renderer)
    })

    it("offers Completed only on a past meeting, needs an outcome, and sends it", async () => {
        const bodies: unknown[] = []
        const error = jest.spyOn(notify, "error")
        const success = jest.spyOn(notify, "success")
        const renderer = await openMeetings(ADMIN, [
            {
                method: "PATCH",
                path: `${MEETINGS}/m2/status`,
                reply: (init) => {
                    bodies.push(JSON.parse(String(init.body)))
                    return respond(200, { success: true, message: "Meeting marked as completed" })
                },
            },
        ])

        // m1 is today and m2 is past: one Completed button, on m2.
        expect(renderer.root.findAllByType(Text).filter((node) => node.props.children === "Completed")).toHaveLength(1)
        await press(findPressableByText(renderer, "Completed"))
        await press(findPressableByText(renderer, "Confirm completed"))
        expect(error).toHaveBeenLastCalledWith("Please add an outcome note")
        expect(bodies).toEqual([])

        await typeInto(renderer, "Outcome", "Agreed on scope")
        await press(findPressableByText(renderer, "Confirm completed"))
        expect(bodies).toEqual([{ status: 2050, outcome: "Agreed on scope" }])
        expect(success).toHaveBeenCalledWith("Meeting marked as completed")
        await unmountApp(renderer)
    })

    it("cancels after the confirm, and shows a 409 as a toast with a reload", async () => {
        const alert = jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
            buttons?.find((button) => button.style === "destructive")?.onPress?.()
        })
        const error = jest.spyOn(notify, "error")
        const bodies: unknown[] = []
        const renderer = await openMeetings(ADMIN, [
            {
                method: "PATCH",
                path: `${MEETINGS}/m1/status`,
                reply: (init) => {
                    bodies.push(JSON.parse(String(init.body)))
                    return respond(409, { success: false, message: "Meeting is already closed" })
                },
            },
        ])

        const before = getListCalls().length
        await press(findPressableByText(renderer, "Cancel"))
        expect(alert).toHaveBeenCalledWith("Cancel this meeting?", expect.any(String), expect.any(Array))
        expect(bodies).toEqual([{ status: 2030 }])
        expect(error).toHaveBeenCalledWith("Meeting is already closed")
        expect(getListCalls().length).toBe(before + 1)
        await unmountApp(renderer)
    })

    it("opens the Meet link, the entity, and the next page", async () => {
        const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined)
        const renderer = await openMeetings(ADMIN, [
            {
                path: `/api/admin/operations/leads/${LEAD_ID}`,
                reply: () =>
                    respond(200, {
                        success: true,
                        data: {
                            lead: {
                                _id: LEAD_ID,
                                name: "Acme Traders",
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

        await press(findPressable(renderer, "Join meeting"))
        expect(open).toHaveBeenCalledWith("https://meet.google.com/abc-defg-hij")

        const list = renderer.root.findAll((node) => typeof node.props.onEndReached === "function")[0]
        await ReactTestRenderer.act(async () => list.props.onEndReached())
        expect(getListCalls().at(-1)).toBe(`GET ${MEETINGS}?page=2&limit=10`)

        await press(findPressableByText(renderer, "Acme Traders"))
        expect(getCalls(fetchMock)).toContain(`GET /api/admin/operations/leads/${LEAD_ID}`)
        await unmountApp(renderer)
    })

    it("shows no actions to a role outside the write roles", async () => {
        const renderer = await openMeetings(MARKETER)
        const texts = getTexts(renderer)
        for (const label of ["Reschedule", "Completed", "Cancel"]) expect(texts).not.toContain(label)
        expect(texts).toContain("Join")
        await unmountApp(renderer)
    })

    it("renders AccessDenied with the server's message on a 403", async () => {
        const renderer = await openMeetings(ADMIN, [
            {
                path: /^\/api\/admin\/operations\/meetings\?/,
                reply: () => respond(403, { success: false, message: "No meetings for you" }),
            },
        ])
        expect(getTexts(renderer)).toEqual(expect.arrayContaining(["Access Denied", "No meetings for you"]))
        await unmountApp(renderer)
    })
})
