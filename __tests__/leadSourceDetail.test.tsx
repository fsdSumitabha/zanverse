import { Linking, Text } from "react-native"
import type ReactTestRenderer from "react-test-renderer"

import { notify } from "@/lib/notify"
import { clearToken, saveToken } from "@/store/keychain"
import LeadSourceDetailScreen from "@/screens/leadSources/LeadSourceDetailScreen"
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

const TODAY = "2026-10-06"
const ADMIN = { id: "u1", name: "Asha Rao", email: "asha@zan.test", role: 10, regions: ["IN"], activeRegion: "IN" }
const AGENT = { id: "u2", name: "Ravi Kumar", email: "ravi@zan.test", role: 60, regions: ["IN"], activeRegion: "IN" }
// 65 is in ACCESS but not in CONVERT.
const VIEWER = { id: "u3", name: "Meera Shah", email: "meera@zan.test", role: 65, regions: ["IN"], activeRegion: "IN" }
const DETAIL_PATH = "/api/admin/operations/lead-sources/s1"
const LEAD_ID = "64b7f0c2a1b2c3d4e5f60718"

function makeRow(overrides: object = {}) {
    return {
        _id: "s1",
        name: "Acme Traders",
        company: "Acme",
        email: "hello@acme.test",
        phone: "+919876543210",
        status: 20,
        region: "IN",
        allottedDay: "2026-10-04",
        callbackAt: null,
        lastNote: "",
        lastNoteAt: null,
        uploadId: "up1",
        rowNumber: 7,
        convertedLeadId: null,
        assignee: { _id: "u2", name: "Ravi Kumar", avatar: "" },
        listInfo: ["Acme", "acme.test"],
        section: 2,
        ...overrides,
    }
}

function makeDetail(overrides: object = {}) {
    return {
        ...makeRow(),
        data: { create_date: "2021-04-03", city: "Pune", website_url: "acme.test" },
        importNotes: ["The phone had no country code. +91 was assumed."],
        activity: [
            {
                _id: "a2",
                type: 30,
                from: 10,
                to: 20,
                text: "No answer",
                byName: "Ravi Kumar",
                at: "2026-10-06T08:00:00Z",
            },
            {
                _id: "a1",
                type: 10,
                text: "leads.xlsx",
                to: { assignee: "Ravi Kumar", day: TODAY },
                byName: "Asha Rao",
                at: "2026-10-01T08:00:00Z",
            },
        ],
        upload: { _id: "up1", fileName: "leads.xlsx", createdAt: "2026-10-01T08:00:00Z" },
        convertedLead: null,
        createdAt: "2026-10-01T08:00:00Z",
        updatedAt: "2026-10-06T08:00:00Z",
        ...overrides,
    }
}

let fetchMock: FetchMock
let detail: object | null

async function openSource(user: object = AGENT, extra: FetchRoute[] = []) {
    await saveToken("jwt-1")
    routeFetch(fetchMock, [
        ...extra,
        { path: "/api/auth/me", reply: () => respond(200, { success: true, data: user }) },
        {
            path: /^\/api\/admin\/operations\/lead-sources\?/,
            reply: () =>
                respond(200, {
                    success: true,
                    data: [makeRow()],
                    pagination: { page: 1, limit: 50, total: 1, pages: 1 },
                    counts: { today: 1, upcoming: 0, unscheduled: 0, closed: 0, all: 1, callbacksDue: 0 },
                    progress: { total: 0, worked: 0 },
                }),
        },
        {
            path: /^\/api\/admin\/operations\/lead-sources\/assignees/,
            reply: () => respond(200, { success: true, data: [] }),
        },
        {
            path: DETAIL_PATH,
            reply: () =>
                detail
                    ? respond(200, { success: true, data: detail })
                    : respond(404, { success: false, message: "Not found" }),
        },
    ])
    const renderer = await renderApp()
    await press(findPressableByText(renderer, "Calls"))
    await press(findPressable(renderer, "Acme Traders"))
    return renderer
}

type Renderer = ReactTestRenderer.ReactTestRenderer

/** The detail screen alone. The list stays mounted under it in the stack, with the same name and call button. */
function detailOf(renderer: Renderer): Renderer {
    return { root: renderer.root.findByType(LeadSourceDetailScreen) } as unknown as Renderer
}

/** The last pressable holding this text: a sheet's button, not the header button with the same words. */
function findLastPressableByText(renderer: Renderer, text: string) {
    const matches = renderer.root.findAllByType(Text).filter((node) => node.props.children === text)
    for (const textNode of matches.reverse()) {
        let node = textNode.parent
        while (node && typeof node.props.onPress !== "function") node = node.parent
        if (node) return node
    }
    throw new Error(`No pressable holds the text "${text}"`)
}

function getDetailCalls(): string[] {
    return getCalls(fetchMock).filter((call) => call === `GET ${DETAIL_PATH}`)
}

beforeEach(async () => {
    jest.clearAllMocks()
    fetchMock = installFetchMock()
    detail = makeDetail()
    await clearToken()
    saveActiveRegion(null)
})

describe("lead source detail", () => {
    it("shows the header, the grid, the upload warnings, the sheet data and the activity", async () => {
        const app = await openSource()
        const texts = getTexts(detailOf(app))

        expect(getDetailCalls()).toHaveLength(1)
        const expected = [
            "Acme Traders",
            "Acme · acme.test",
            "Not Reached",
            "+91 98765 43210",
            "hello@acme.test",
            "Ravi Kumar",
            "Sun 4 Oct",
            "left over",
            "leads.xlsx, row 7",
            "Add a note",
            "Notes from the upload check",
            "The phone had no country code. +91 was assumed.",
            "From the sheet",
            "3 Apr 2021",
            "Pune",
            " (extra column)",
            "Activity",
            "changed",
            "No answer",
            "leads.xlsx",
            "to call today",
            "Set callback",
        ]
        expect(expected.filter((text) => !texts.includes(text))).toEqual([])
        await unmountApp(app)
    })

    it("dials, opens WhatsApp and opens the mail app", async () => {
        const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined)
        const app = await openSource()

        await press(findPressable(detailOf(app), "Call Acme Traders"))
        await press(findPressable(detailOf(app), "WhatsApp +91 98765 43210"))
        await press(findPressable(detailOf(app), "Email hello@acme.test"))
        expect(open.mock.calls.map(([url]) => url)).toEqual([
            "tel:+919876543210",
            "https://wa.me/919876543210?text=",
            "mailto:hello@acme.test",
        ])
        await unmountApp(app)
    })

    it("adds a note, clears the box, toasts and reloads", async () => {
        const bodies: unknown[] = []
        const success = jest.spyOn(notify, "success")
        const app = await openSource(AGENT, [
            {
                method: "POST",
                path: `${DETAIL_PATH}/notes`,
                reply: (init) => {
                    bodies.push(JSON.parse(String(init.body)))
                    return respond(201, { success: true, data: makeRow({ lastNote: "Owner on leave" }) })
                },
            },
        ])

        await typeInto(detailOf(app), "Note", "  Owner on leave ")
        await press(findPressableByText(detailOf(app), "Add note"))

        expect(bodies).toEqual([{ text: "Owner on leave" }])
        expect(success).toHaveBeenCalledWith("Note added")
        const note = detailOf(app).root.find(
            (node) => node.props.accessibilityLabel === "Note" && typeof node.props.onChangeText === "function",
        )
        expect(note.props.value).toBe("")
        expect(getDetailCalls()).toHaveLength(2)
        await unmountApp(app)
    })

    it("sets a callback from the header button, then clears it", async () => {
        const bodies: Record<string, unknown>[] = []
        const success = jest.spyOn(notify, "success")
        const app = await openSource(AGENT, [
            {
                method: "PATCH",
                path: `${DETAIL_PATH}/callback`,
                reply: (init) => {
                    const body = JSON.parse(String(init.body))
                    bodies.push(body)
                    detail = makeDetail({ status: 30, callbackAt: body.callbackAt })
                    return respond(200, { success: true, data: makeRow({ status: 30, callbackAt: body.callbackAt }) })
                },
            },
        ])

        await press(findPressableByText(detailOf(app), "Set callback"))
        expect(getTexts(detailOf(app))).toContain("Callback reminder")
        await press(findPressableByText(detailOf(app), "1 hour"))
        await press(findLastPressableByText(detailOf(app), "Set callback"))

        expect(bodies[0].callbackDay).toBe(TODAY)
        expect(success).toHaveBeenCalledWith(expect.stringMatching(/^Callback set for /))
        const button = findPressable(detailOf(app), /^Callback .*, in 1 hr?/)
        await press(button)
        await press(findPressableByText(detailOf(app), "Clear callback"))
        expect(bodies[1]).toEqual({ callbackAt: null })
        expect(success).toHaveBeenCalledWith("Callback cleared")
        await unmountApp(app)
    })

    it("gives managers Assign, Set day and Delete, and Delete returns to the list", async () => {
        const bodies: unknown[] = []
        const app = await openSource(ADMIN, [
            {
                method: "POST",
                path: "/api/admin/operations/lead-sources/bulk",
                reply: (init) => {
                    bodies.push(JSON.parse(String(init.body)))
                    return respond(200, { success: true, data: { updated: 1, unchanged: 0, skipped: 0 } })
                },
            },
        ])

        for (const label of ["Assign", "Set day", "Delete", "Convert to lead"]) {
            expect(findPressableByText(detailOf(app), label)).toBeTruthy()
        }
        await press(findPressableByText(detailOf(app), "Delete"))
        expect(getTexts(detailOf(app))).toContain("Delete 1 lead source?")
        await press(findLastPressableByText(detailOf(app), "Delete"))

        expect(bodies).toEqual([{ action: "delete", ids: ["s1"], today: TODAY }])
        expect(app.root.findAllByType(LeadSourceDetailScreen)).toHaveLength(0)
        expect(getTexts(app)).toContain("Cold-calling lists for the whole team")
        await unmountApp(app)
    })

    it("hides the manager row from an agent and Convert from a role outside CONVERT", async () => {
        let app = await openSource(AGENT)
        expect(getTexts(detailOf(app))).toContain("Convert to lead")
        expect(getTexts(detailOf(app))).not.toContain("Set day")
        await unmountApp(app)

        app = await openSource(VIEWER)
        expect(getTexts(detailOf(app))).not.toContain("Convert to lead")
        expect(getTexts(detailOf(app))).not.toContain("Assign")
        await unmountApp(app)
    })

    it("converts to a lead and lands on the lead", async () => {
        const success = jest.spyOn(notify, "success")
        const app = await openSource(AGENT, [
            {
                method: "POST",
                path: `${DETAIL_PATH}/convert`,
                reply: () => respond(201, { success: true, data: { leadId: LEAD_ID } }),
            },
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
                                source: "Lead source",
                                status: 10,
                                createdAt: "2026-10-06T10:00:00Z",
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

        await press(findPressableByText(detailOf(app), "Convert to lead"))
        expect(getTexts(detailOf(app))).toEqual(
            expect.arrayContaining([
                "Convert Acme Traders to a lead?",
                "A new lead is created in the Leads list, in this region.",
                "It is assigned to Ravi Kumar.",
            ]),
        )
        await press(findPressableByText(detailOf(app), "Create lead"))

        expect(getCalls(fetchMock)).toEqual(
            expect.arrayContaining([`POST ${DETAIL_PATH}/convert`, `GET /api/admin/operations/leads/${LEAD_ID}`]),
        )
        expect(success).toHaveBeenCalledWith("Lead created")
        expect(getTexts(app)).toContain("Lead source")
        await unmountApp(app)
    })

    it("toasts the server's 409 and closes the sheet", async () => {
        const error = jest.spyOn(notify, "error")
        const app = await openSource(AGENT, [
            {
                method: "POST",
                path: `${DETAIL_PATH}/convert`,
                reply: () => respond(409, { success: false, message: "This lead source is already a lead." }),
            },
        ])

        await press(findPressableByText(detailOf(app), "Convert to lead"))
        await press(findPressableByText(detailOf(app), "Create lead"))
        expect(error).toHaveBeenCalledWith("This lead source is already a lead.")
        expect(getTexts(detailOf(app))).not.toContain("Convert Acme Traders to a lead?")
        await unmountApp(app)
    })

    it("shows the converted banner, locks the status and hides the call and callback controls", async () => {
        detail = makeDetail({
            status: 70,
            convertedLeadId: LEAD_ID,
            convertedLead: { _id: LEAD_ID, name: "Acme Lead" },
        })
        const app = await openSource()
        const screen = detailOf(app)
        const texts = getTexts(screen)

        expect(texts).toEqual(
            expect.arrayContaining(["This source is now a lead. Keep working on it there.", "Open Acme Lead"]),
        )
        expect(findPressable(screen, "Converted to a lead").props.disabled).toBe(true)
        expect(texts).not.toContain("Set callback")
        expect(texts).not.toContain("Add a note")
        expect(screen.root.findAll((node) => node.props.accessibilityLabel === "Call Acme Traders")).toHaveLength(0)
        await unmountApp(app)
    })

    it("shows the not-found card on a 404", async () => {
        detail = null
        const app = await openSource()
        expect(getTexts(detailOf(app))).toEqual(
            expect.arrayContaining([
                "Lead source not found",
                "It may have been deleted, or it is assigned to someone else.",
            ]),
        )
        await unmountApp(app)
    })
})
