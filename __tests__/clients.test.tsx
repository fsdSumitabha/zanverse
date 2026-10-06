import { Alert, Linking } from "react-native"

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

jest.useFakeTimers()

const ADMIN = { id: "u1", name: "Asha Rao", email: "asha@zan.test", role: 10, regions: ["IN"], activeRegion: "IN" }
const ID = "64b7f0c2a1b2c3d4e5f60799"
const LEAD_ID = "64b7f0c2a1b2c3d4e5f60718"

function makeClient(overrides: object = {}) {
    return {
        _id: ID,
        name: "Acme",
        company: "Acme Pvt",
        phone: "+919876543210",
        email: "hello@acme.test",
        status: 1,
        createdAt: "2026-09-02T10:00:00.000Z",
        updatedAt: "2026-09-03T10:00:00.000Z",
        createdBy: { _id: "u1", name: "Asha Rao", email: "asha@zan.test", role: 10 },
        ...overrides,
    }
}

function makeProject(index: number) {
    return {
        _id: `p${index}`,
        title: `Project ${index}`,
        description: "Build it",
        serviceType: 10,
        status: 110,
        budget: 250000,
        createdAt: "2026-09-04T10:00:00.000Z",
        updatedAt: "2026-09-04T10:00:00.000Z",
        clientId: { _id: ID, name: "Acme", company: "Acme Pvt", phone: "+919876543210" },
    }
}

const LEAD = {
    _id: LEAD_ID,
    name: "Acme",
    phone: "+919876543210",
    source: "facebook",
    status: 60,
    createdAt: "2026-08-01T10:00:00Z",
}

let fetchMock: FetchMock
let client: object
let projects: object[]
let interactions: object[]

function routes(user: object, extra: FetchRoute[]): FetchRoute[] {
    return [
        ...extra,
        { path: "/api/auth/me", reply: () => respond(200, { success: true, data: user }) },
        {
            path: /^\/api\/admin\/operations\/clients\?page=1/,
            reply: () =>
                respond(200, { success: true, data: [client], pagination: { page: 1, limit: 10, total: 1, pages: 1 } }),
        },
        {
            path: `/api/admin/operations/clients/${ID}`,
            reply: () => respond(200, { success: true, data: { client, lead: null, projects } }),
        },
        {
            path: `/api/admin/operations/clients/${ID}/interactions`,
            reply: () => respond(200, { success: true, interactions }),
        },
        {
            path: `/api/admin/operations/clients/${ID}/projects`,
            reply: () => respond(200, { success: true, data: projects }),
        },
    ]
}

async function openClients(extra: FetchRoute[] = [], user: object = ADMIN) {
    await saveToken("jwt-1")
    routeFetch(fetchMock, routes(user, extra))
    const renderer = await renderApp()
    await press(findPressableByText(renderer, "Clients"))
    return renderer
}

async function openClient(extra: FetchRoute[] = [], user: object = ADMIN) {
    const renderer = await openClients(extra, user)
    await press(findPressable(renderer, "Client Acme"))
    return renderer
}

beforeEach(async () => {
    jest.clearAllMocks()
    fetchMock = installFetchMock()
    client = makeClient()
    projects = []
    interactions = []
    await clearToken()
    saveActiveRegion(null)
})

describe("clients list", () => {
    it("lists clients with no create button and no floating button", async () => {
        const renderer = await openClients()
        const texts = getTexts(renderer)

        expect(texts).toEqual(expect.arrayContaining(["Acme", "Acme Pvt", "Active", "Created by Asha Rao"]))
        expect(renderer.root.findAll((node) => node.props.accessibilityLabel === "Create New Project")).toHaveLength(0)
        await unmountApp(renderer)
    })
})

describe("client detail", () => {
    it("shows the header and, for a converted client, the Converted from Lead block that opens the lead", async () => {
        const renderer = await openClient([
            {
                path: `/api/admin/operations/clients/${ID}`,
                reply: () => respond(200, { success: true, data: { client, lead: LEAD, projects: [] } }),
            },
            {
                path: `/api/admin/operations/leads/${LEAD_ID}`,
                reply: () => respond(200, { success: true, data: { lead: LEAD, client } }),
            },
            {
                path: `/api/admin/operations/leads/${LEAD_ID}/interactions`,
                reply: () => respond(200, { success: true, interactions: [] }),
            },
        ])
        const texts = getTexts(renderer)

        expect(texts).toEqual(
            expect.arrayContaining(["Overview", "Timeline", "Projects", "hello@acme.test", "Converted from Lead"]),
        )
        await press(findPressableByText(renderer, "View lead"))
        expect(getCalls(fetchMock)).toContain(`GET /api/admin/operations/leads/${LEAD_ID}`)
        await unmountApp(renderer)
    })

    it("opens the mail app from the email line", async () => {
        const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined)
        const renderer = await openClient()

        await press(findPressable(renderer, "Email hello@acme.test"))
        expect(open).toHaveBeenCalledWith("mailto:hello@acme.test")
        await unmountApp(renderer)
    })

    it("shows no lead block for a client created directly", async () => {
        const renderer = await openClient()

        expect(getTexts(renderer)).not.toContain("Converted from Lead")
        await unmountApp(renderer)
    })

    it("changes status with remarks and reloads both the client and the timeline", async () => {
        const patches: unknown[] = []
        const renderer = await openClient([
            {
                method: "PATCH",
                path: `/api/admin/operations/clients/${ID}/status`,
                reply: (init) => {
                    patches.push(JSON.parse(String(init.body)))
                    client = makeClient({ status: 3 })
                    interactions = [
                        {
                            _id: "s1",
                            type: 2510,
                            title: JSON.stringify({ from: 1, to: 3 }),
                            description: "Paused",
                            createdAt: "2026-09-05T10:00:00Z",
                        },
                    ]
                    return respond(200, { success: true, message: "Client status updated successfully" })
                },
            },
        ])

        await press(findPressable(renderer, "Status: Active. Press to change."))
        await press(findPressableByText(renderer, "On Hold"))
        await press(findPressableByText(renderer, "Confirm"))
        expect(getTexts(renderer)).toContain("Remarks are required")

        await typeInto(renderer, "Remarks", "Paused")
        await press(findPressableByText(renderer, "Confirm"))
        expect(patches).toEqual([{ status: 3, remarks: "Paused" }])
        expect(findPressable(renderer, "Status: On Hold. Press to change.")).toBeTruthy()

        const timelineCalls = getCalls(fetchMock).filter((call) => call.endsWith(`/clients/${ID}/interactions`))
        expect(timelineCalls.length).toBeGreaterThanOrEqual(2)
        await press(findPressableByText(renderer, "Timeline"))
        expect(getTexts(renderer)).toEqual(expect.arrayContaining(["Status Changed", "Active", "On Hold"]))
        await unmountApp(renderer)
    })

    it("makes the status pill read-only at Completed", async () => {
        client = makeClient({ status: 4 })
        const renderer = await openClient()

        expect(
            renderer.root.findByProps({ accessibilityLabel: "Status: Completed" }).props.accessibilityState.disabled,
        ).toBe(true)
        await unmountApp(renderer)
    })

    it("adds a note from the Timeline tab at entityType 1", async () => {
        const posts: { entityType?: number }[] = []
        const renderer = await openClient([
            {
                method: "POST",
                path: "/api/admin/operations/notes",
                reply: (init) => {
                    posts.push(JSON.parse(String(init.body)))
                    interactions = [
                        {
                            _id: "n1",
                            type: 2110,
                            title: "",
                            description: "Called back",
                            createdAt: "2026-09-05T10:00:00Z",
                        },
                    ]
                    return respond(201, { success: true, data: {} })
                },
            },
        ])

        await press(findPressableByText(renderer, "Timeline"))
        expect(getTexts(renderer)).toContain("No interactions yet")
        await press(findPressable(renderer, "Add Note Added"))
        await typeInto(renderer, "Note", "Called back")
        await press(findPressableByText(renderer, "Save Note"))

        expect(posts[0]).toMatchObject({ entityType: 1, entityId: ID })
        expect(getTexts(renderer)).toContain("Called back")
        await unmountApp(renderer)
    })

    it("shows three project cards and View All lists every project", async () => {
        projects = [1, 2, 3, 4].map(makeProject)
        const renderer = await openClient()

        await press(findPressableByText(renderer, "Projects"))
        expect(getTexts(renderer).filter((text) => text.startsWith("Project ")).length).toBe(3)
        expect(getTexts(renderer)).toEqual(expect.arrayContaining(["Web Dev", "2,50,000"]))

        await press(findPressableByText(renderer, "View All"))
        expect(getTexts(renderer)).toContain("Project 4")
        await unmountApp(renderer)
    })

    it("shows Delete to role 15, deletes after the Alert and returns to the list", async () => {
        jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
            buttons?.find((button) => button.style === "destructive")?.onPress?.()
        })
        const renderer = await openClient(
            [
                {
                    method: "DELETE",
                    path: `/api/admin/operations/clients/${ID}`,
                    reply: () => respond(200, { success: true, message: "Client deleted successfully" }),
                },
            ],
            { ...ADMIN, role: 15 },
        )

        await press(findPressableByText(renderer, "Delete Client"))

        expect(getCalls(fetchMock)).toContain(`DELETE /api/admin/operations/clients/${ID}`)
        expect(getTexts(renderer)).not.toContain("Overview")
        await unmountApp(renderer)
    })

    it("hides Delete from role 60", async () => {
        const renderer = await openClient([], { ...ADMIN, role: 60 })

        expect(getTexts(renderer)).toContain("Overview")
        expect(getTexts(renderer)).not.toContain("Delete Client")
        await unmountApp(renderer)
    })

    it("renders AccessDenied with the API's message on a 403", async () => {
        const renderer = await openClient([
            {
                path: `/api/admin/operations/clients/${ID}`,
                reply: () => respond(403, { success: false, message: "You aren't authorized to perform this action." }),
            },
        ])

        expect(getTexts(renderer)).toContain("Access Denied")
        await unmountApp(renderer)
    })
})

describe("client forms", () => {
    it("saves an edit and shows a server phone error under the field", async () => {
        let replyWithError = true
        const patches: unknown[] = []
        const renderer = await openClient([
            {
                method: "PATCH",
                path: `/api/admin/operations/clients/${ID}`,
                reply: (init) => {
                    patches.push(JSON.parse(String(init.body)))
                    if (replyWithError) {
                        return respond(409, {
                            success: false,
                            message: "A client with this phone already exists",
                            field: "phone",
                        })
                    }
                    return respond(200, { success: true, data: client })
                },
            },
        ])

        await press(findPressable(renderer, "Edit client"))
        await typeInto(renderer, "Company", "Acme Private Ltd")
        await press(findPressableByText(renderer, "Update Client"))
        expect(getTexts(renderer)).toContain("A client with this phone already exists")

        replyWithError = false
        await press(findPressableByText(renderer, "Update Client"))
        expect(patches[1]).toEqual({
            name: "Acme",
            company: "Acme Private Ltd",
            email: "hello@acme.test",
            phone: "+919876543210",
        })
        expect(getTexts(renderer)).toContain("Overview")
        await unmountApp(renderer)
    })

    it("creates a project from the floating button with no id typed, then opens it", async () => {
        let posted: Record<string, unknown> = {}
        const renderer = await openClient([
            {
                method: "POST",
                path: "/api/admin/operations/projects",
                reply: (init) => {
                    posted = JSON.parse(String(init.body))
                    return respond(201, { success: true, data: makeProject(9) })
                },
            },
            {
                path: "/api/admin/operations/projects/p9",
                reply: () => respond(200, { success: true, data: makeProject(9) }),
            },
            {
                path: "/api/admin/operations/projects/p9/interactions",
                reply: () => respond(200, { success: true, interactions: [] }),
            },
        ])
        const success = jest.spyOn(notify, "success")

        await press(findPressable(renderer, "Create New Project"))
        expect(getTexts(renderer)).toContain("Add a new project for this client")
        await typeInto(renderer, "Title", "Mobile app")
        await typeInto(renderer, "Description", "Phone app for staff")
        await typeInto(renderer, "Budget", "500000")
        await press(findPressableByText(renderer, "Create Project"))

        expect(posted).toEqual({
            clientId: ID,
            title: "Mobile app",
            description: "Phone app for staff",
            status: 110,
            budget: 500000,
        })
        expect(success).toHaveBeenCalledWith("Project created successfully", expect.any(Object))
        expect(getCalls(fetchMock)).toContain("GET /api/admin/operations/projects/p9")
        expect(getTexts(renderer)).toContain("Budget Overview")
        await unmountApp(renderer)
    })
})
