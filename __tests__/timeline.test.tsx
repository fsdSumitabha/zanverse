import { pick } from "@react-native-documents/picker"

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
    installRecordingFormData,
    type FetchMock,
    type FetchRoute,
    type FormPart,
} from "../jest/appHarness"

jest.useFakeTimers()

const ADMIN = { id: "u1", name: "Asha Rao", email: "asha@zan.test", role: 10, regions: ["IN"], activeRegion: "IN" }
const ID = "64b7f0c2a1b2c3d4e5f60718"
const LEAD = {
    _id: ID,
    name: "Acme Traders",
    phone: "+919876543210",
    source: "Facebook",
    status: 10,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
}
const TIMELINE_PATH = `/api/admin/operations/leads/${ID}/interactions`

let fetchMock: FetchMock
let timeline: object[]
let restoreFormData: () => void = () => undefined

function note(id: string, description: string, extra: object = {}) {
    return {
        _id: id,
        type: 2110,
        title: "Note",
        description,
        createdAt: "2026-09-02T10:00:00Z",
        editHistory: [],
        ...extra,
    }
}

function baseRoutes(user: object = ADMIN): FetchRoute[] {
    return [
        { path: "/api/auth/me", reply: () => respond(200, { success: true, data: user }) },
        {
            path: /^\/api\/admin\/operations\/leads\?page=1/,
            reply: () =>
                respond(200, { success: true, data: [LEAD], pagination: { page: 1, limit: 10, total: 1, pages: 1 } }),
        },
        {
            path: `/api/admin/operations/leads/${ID}`,
            reply: () => respond(200, { success: true, data: { lead: LEAD, client: null } }),
        },
        { path: TIMELINE_PATH, reply: () => respond(200, { success: true, interactions: timeline }) },
    ]
}

async function openLead(extraRoutes: FetchRoute[] = [], user: object = ADMIN) {
    await saveToken("jwt-1")
    routeFetch(fetchMock, [...extraRoutes, ...baseRoutes(user)])
    const renderer = await renderApp()
    await press(findPressableByText(renderer, "Leads"))
    await press(findPressable(renderer, "Lead Acme Traders"))
    return renderer
}

function getParts(body: unknown): Record<string, FormPart> {
    const parts = (body as { getParts: () => FormPart[] }).getParts()
    return Object.fromEntries(parts.map((part) => [part.fieldName, part]))
}

beforeAll(() => {
    restoreFormData = installRecordingFormData()
})

afterAll(() => {
    restoreFormData()
})

beforeEach(async () => {
    jest.clearAllMocks()
    fetchMock = installFetchMock()
    timeline = []
    await clearToken()
    saveActiveRegion(null)
})

describe("timeline on the lead screen", () => {
    it("shows No interactions yet for an empty lead", async () => {
        const renderer = await openLead()

        expect(getTexts(renderer)).toContain("No interactions yet")
        await unmountApp(renderer)
    })

    it("renders the rows newest first, with a 2050 row whose meeting is null", async () => {
        timeline = [
            note("n1", "Wants a demo"),
            { _id: "m1", type: 2050, title: "Demo done", meeting: null, createdAt: "2026-09-01T10:00:00Z" },
            {
                _id: "s1",
                type: 2510,
                title: JSON.stringify({ action: "status", from: 10, to: 20 }),
                description: "Called",
                createdAt: "2026-08-30T10:00:00Z",
            },
        ]
        const renderer = await openLead()
        const texts = getTexts(renderer)

        expect(texts).toEqual(
            expect.arrayContaining(["Wants a demo", "Demo done", "Status Changed", "New Lead", "Contacted"]),
        )
        await unmountApp(renderer)
    })
})

describe("forms", () => {
    it("adds a note, refuses an empty one, and the new row appears on return", async () => {
        const posts: unknown[] = []
        const renderer = await openLead([
            {
                method: "POST",
                path: "/api/admin/operations/notes",
                reply: (init) => {
                    posts.push(JSON.parse(String(init.body)))
                    timeline = [note("n9", "Sent the brochure")]
                    return respond(201, { success: true, data: {} })
                },
            },
        ])
        const error = jest.spyOn(notify, "error")
        const success = jest.spyOn(notify, "success")

        await press(findPressable(renderer, "Add Note Added"))
        await press(findPressableByText(renderer, "Save Note"))
        expect(error).toHaveBeenCalledWith("Description cannot be empty")

        await typeInto(renderer, "Note", "Sent the brochure")
        await press(findPressableByText(renderer, "Save Note"))

        expect(posts).toEqual([
            { entityType: 0, entityId: ID, type: 2110, title: "", description: "Sent the brochure" },
        ])
        expect(success).toHaveBeenCalledWith("Note added successfully", expect.any(Object))
        expect(getTexts(renderer)).toContain("Sent the brochure")
        await unmountApp(renderer)
    })

    it("sends a quotation with a PDF as multipart with the web's part names", async () => {
        let body: unknown
        const renderer = await openLead([
            {
                method: "POST",
                path: "/api/admin/operations/quotations",
                reply: (init) => {
                    body = init.body
                    return respond(201, { success: true, data: {} })
                },
            },
        ])
        ;(pick as jest.Mock).mockResolvedValueOnce([
            { uri: "content://q.pdf", name: "q.pdf", type: "application/pdf", size: 2048 },
        ])

        await press(findPressable(renderer, "Add Quotation Sent"))
        await typeInto(renderer, "Title", "Website build")
        await typeInto(renderer, "Amount (₹)", "100000")
        await press(findPressable(renderer, "Upload Quotation File"))
        expect(getTexts(renderer)).toContain("q.pdf")
        await press(findPressableByText(renderer, "Send"))

        const parts = getParts(body)
        expect(Object.keys(parts)).toEqual([
            "entityType",
            "entityId",
            "title",
            "description",
            "amount",
            "gst_percentage",
            "status",
            "file",
        ])
        expect(parts.gst_percentage.string).toBe("18")
        expect(parts.status.string).toBe("2410")
        expect(parts.file).toMatchObject({ uri: "content://q.pdf", name: "q.pdf", type: "application/pdf" })
        const headers = fetchMock.mock.calls.find(([, init]) => init.method === "POST")![1].headers as Record<
            string,
            string
        >
        expect(headers["Content-Type"]).toBeUndefined()
        await unmountApp(renderer)
    })

    it("rejects a .txt before upload with the allowlist message", async () => {
        const renderer = await openLead()
        ;(pick as jest.Mock).mockResolvedValueOnce([
            { uri: "content://a.txt", name: "a.txt", type: "text/plain", size: 10 },
        ])

        await press(findPressable(renderer, "Add Quotation Sent"))
        await press(findPressable(renderer, "Upload Quotation File"))

        expect(getTexts(renderer).join(" ")).toContain("a.txt: File type must be one of application/pdf")
        await unmountApp(renderer)
    })

    it("logs a call with a recording, and routes a phone error back to the field", async () => {
        let body: unknown
        let replyWithPhoneError = true
        const renderer = await openLead([
            {
                method: "POST",
                path: "/api/admin/operations/calls",
                reply: (init) => {
                    body = init.body
                    if (replyWithPhoneError) {
                        return respond(400, { success: false, message: "This is not a valid number.", field: "phone" })
                    }
                    return respond(201, { success: true, data: {} })
                },
            },
        ])
        ;(pick as jest.Mock).mockResolvedValueOnce([
            { uri: "content://r.m4a", name: "r.m4a", type: "audio/mp4", size: 4096 },
        ])

        await press(findPressable(renderer, "Add Call Made"))
        await typeInto(renderer, "Contact Name", "Ravi")
        await typeInto(renderer, "Contact Phone", "98765 43210")
        await typeInto(renderer, "Duration (minutes)", "12")
        await typeInto(renderer, "Title", "Follow-up")
        await typeInto(renderer, "Notes", "Asked for pricing")
        await press(findPressable(renderer, "Recording"))
        await press(findPressableByText(renderer, "Save Call"))

        expect(getTexts(renderer)).toContain("This is not a valid number.")
        const parts = getParts(body)
        expect(Object.keys(parts)).toEqual([
            "entityType",
            "entityId",
            "contactPersonName",
            "contactPersonPhone",
            "callTime",
            "duration",
            "direction",
            "status",
            "title",
            "description",
            "notes",
            "recording",
        ])
        expect(parts.contactPersonPhone.string).toBe("+919876543210")
        expect(parts.status.string).toBe("0")
        expect(parts.recording).toMatchObject({ uri: "content://r.m4a", type: "audio/mp4" })

        replyWithPhoneError = false
        await press(findPressableByText(renderer, "Save Call"))
        expect(getTexts(renderer)).toContain("No interactions yet")
        await unmountApp(renderer)
    })

    it("schedules a meeting with two attendees from the picker", async () => {
        let posted: { attendees?: string[]; status?: number; meetingType?: number } = {}
        const renderer = await openLead([
            {
                path: "/api/admin/operations/users/picker",
                reply: () =>
                    respond(200, {
                        success: true,
                        data: [
                            { _id: "a", name: "Asha Rao", email: "asha@zan.test" },
                            { _id: "b", name: "Ravi Kumar", email: "ravi@zan.test" },
                            { _id: "c", name: "Meera Iyer" },
                        ],
                    }),
            },
            {
                method: "POST",
                path: "/api/admin/operations/meetings",
                reply: (init) => {
                    posted = JSON.parse(String(init.body))
                    return respond(201, { success: true, data: {} })
                },
            },
        ])

        await press(findPressable(renderer, "Add Meeting Scheduled"))
        await typeInto(renderer, "Title", "Discovery")
        await press(findPressable(renderer, "Attendees, 0 selected"))
        await press(findPressable(renderer, "Asha Rao"))
        await press(findPressable(renderer, "Ravi Kumar"))
        await press(findPressableByText(renderer, "Done (2 selected)"))

        expect(findPressable(renderer, "Attendees, 2 selected")).toBeTruthy()
        await press(findPressableByText(renderer, "Schedule"))

        expect(posted).toMatchObject({ attendees: ["a", "b"], status: 2010, meetingType: 0 })
        expect(getCalls(fetchMock)).toContain("POST /api/admin/operations/meetings")
        await unmountApp(renderer)
    })
})

describe("editing in place", () => {
    it("edits a note's description and sends only that key", async () => {
        timeline = [note("n1", "Old text")]
        const patches: unknown[] = []
        const renderer = await openLead([
            {
                method: "PATCH",
                path: "/api/admin/operations/interactions/n1",
                reply: (init) => {
                    patches.push(JSON.parse(String(init.body)))
                    timeline = [
                        note("n1", "New text", {
                            editHistory: [
                                {
                                    oldDescription: "Old text",
                                    editedBy: { name: "Asha Rao" },
                                    editedAt: "2026-09-03T10:00:00Z",
                                },
                            ],
                        }),
                    ]
                    return respond(200, { success: true, data: {} })
                },
            },
        ])

        await press(findPressable(renderer, "Edit note"))
        await typeInto(renderer, "Description", "New text")
        await press(findPressable(renderer, "Save"))

        expect(patches).toEqual([{ description: "New text" }])
        expect(getTexts(renderer)).toContain("New text")
        expect(getTexts(renderer)).toContain("Edited once")
        await unmountApp(renderer)
    })

    it("shows no pencil to a Project Manager (30)", async () => {
        timeline = [
            note("n1", "Old text"),
            { _id: "s1", type: 2510, title: JSON.stringify({ from: 10, to: 20 }), createdAt: "2026-09-01T10:00:00Z" },
        ]
        const renderer = await openLead([], { ...ADMIN, role: 30 })

        expect(getTexts(renderer)).toContain("Old text")
        expect(renderer.root.findAll((node) => node.props.accessibilityLabel === "Edit note")).toHaveLength(0)
        expect(renderer.root.findAll((node) => node.props.accessibilityLabel === "Edit remarks")).toHaveLength(0)
        await unmountApp(renderer)
    })
})
