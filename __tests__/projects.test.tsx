import { Alert } from "react-native"

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
const ID = "64b7f0c2a1b2c3d4e5f60777"
const CLIENT_ID = "64b7f0c2a1b2c3d4e5f60799"

function makeProject(overrides: object = {}) {
    return {
        _id: ID,
        title: "Website rebuild",
        description: "New marketing site with a blog and a careers page",
        serviceType: 10,
        status: 110,
        budget: 250000,
        createdAt: "2026-09-04T10:00:00.000Z",
        updatedAt: "2026-09-05T10:00:00.000Z",
        clientId: { _id: CLIENT_ID, name: "Acme", company: "Acme Pvt", phone: "+919876543210" },
        createdBy: { _id: "u1", name: "Asha Rao", email: "asha@zan.test" },
        ...overrides,
    }
}

let fetchMock: FetchMock
let project: ReturnType<typeof makeProject>
let interactions: object[]

function routes(user: object, extra: FetchRoute[]): FetchRoute[] {
    return [
        ...extra,
        { path: "/api/auth/me", reply: () => respond(200, { success: true, data: user }) },
        {
            path: /^\/api\/admin\/operations\/projects\?page=1/,
            reply: () =>
                respond(200, {
                    success: true,
                    data: [project],
                    pagination: { page: 1, limit: 10, total: 1, pages: 1 },
                }),
        },
        { path: `/api/admin/operations/projects/${ID}`, reply: () => respond(200, { success: true, data: project }) },
        {
            path: `/api/admin/operations/projects/${ID}/interactions`,
            reply: () => respond(200, { success: true, interactions }),
        },
    ]
}

async function openProjects(extra: FetchRoute[] = [], user: object = ADMIN) {
    await saveToken("jwt-1")
    routeFetch(fetchMock, routes(user, extra))
    const renderer = await renderApp()
    await press(findPressableByText(renderer, "Projects"))
    return renderer
}

async function openProject(extra: FetchRoute[] = [], user: object = ADMIN) {
    const renderer = await openProjects(extra, user)
    await press(findPressable(renderer, "Project Website rebuild"))
    return renderer
}

beforeEach(async () => {
    jest.clearAllMocks()
    fetchMock = installFetchMock()
    project = makeProject()
    interactions = []
    await clearToken()
    saveActiveRegion(null)
})

describe("projects list", () => {
    it("shows the card with client, company, title, status, budget, service and Created by", async () => {
        const renderer = await openProjects()
        const texts = getTexts(renderer)

        expect(texts).toEqual(
            expect.arrayContaining([
                "Acme",
                "Acme Pvt",
                "Website rebuild",
                "Discussion",
                "₹2,50,000",
                "Web Dev",
                "Created by Asha Rao",
            ]),
        )
        expect(texts).toContain("1 project found")
        await unmountApp(renderer)
    })

    it("falls back for a deleted client", async () => {
        project = makeProject({ clientId: null })
        const renderer = await openProjects()

        expect(getTexts(renderer)).toEqual(expect.arrayContaining(["Deleted client", "N/A"]))
        await unmountApp(renderer)
    })

    it("offers all eight statuses in the filter sheet and filters by In Progress from page 1", async () => {
        const renderer = await openProjects()

        await press(findPressable(renderer, "Filters"))
        for (const label of [
            "Discussion",
            "Proposal Sent",
            "Negotiation",
            "Confirmed",
            "In Progress",
            "Deployed",
            "Maintenance",
            "Closed",
        ]) {
            expect(getTexts(renderer)).toContain(label)
        }
        await press(findPressableByText(renderer, "In Progress"))
        await press(findPressableByText(renderer, "Done"))

        expect(getCalls(fetchMock)).toContain("GET /api/admin/operations/projects?page=1&limit=10&status=150")
        await unmountApp(renderer)
    })

    it("renders AccessDenied with the API's message for a role the list refuses", async () => {
        const renderer = await openProjects([
            {
                path: /^\/api\/admin\/operations\/projects\?page=1/,
                reply: () => respond(403, { success: false, message: "You aren't authorized to perform this action." }),
            },
        ])

        expect(getTexts(renderer)).toContain("Access Denied")
        expect(getTexts(renderer)).toContain("You aren't authorized to perform this action.")
        await unmountApp(renderer)
    })
})

describe("project detail", () => {
    it("shows the detail card as the timeline's header, and the client row opens the client", async () => {
        const renderer = await openProject([
            {
                path: `/api/admin/operations/clients/${CLIENT_ID}`,
                reply: () =>
                    respond(200, {
                        success: true,
                        data: {
                            client: {
                                _id: CLIENT_ID,
                                name: "Acme",
                                company: "Acme Pvt",
                                phone: "+919876543210",
                                status: 1,
                            },
                            lead: null,
                            projects: [],
                        },
                    }),
            },
            {
                path: `/api/admin/operations/clients/${CLIENT_ID}/interactions`,
                reply: () => respond(200, { success: true, interactions: [] }),
            },
        ])
        const texts = getTexts(renderer)

        expect(texts).toEqual(
            expect.arrayContaining(["Budget Overview", "Estimated", "₹2,50,000", "Paid", "Due", "No interactions yet"]),
        )
        await press(findPressable(renderer, "Client Acme Pvt • Acme"))
        expect(getCalls(fetchMock)).toContain(`GET /api/admin/operations/clients/${CLIENT_ID}`)
        await unmountApp(renderer)
    })

    it("changes status with remarks, refuses empty remarks, and shows the 2510 row", async () => {
        const patches: unknown[] = []
        const renderer = await openProject([
            {
                method: "PATCH",
                path: `/api/admin/operations/projects/${ID}/status`,
                reply: (init) => {
                    patches.push(JSON.parse(String(init.body)))
                    project = makeProject({ status: 150 })
                    interactions = [
                        {
                            _id: "s1",
                            type: 2510,
                            title: JSON.stringify({ from: 110, to: 150 }),
                            description: "Kickoff done",
                            createdAt: "2026-09-06T10:00:00Z",
                        },
                    ]
                    return respond(200, { success: true, message: "Project status updated successfully" })
                },
            },
        ])

        await press(findPressable(renderer, "Status: Discussion. Press to change."))
        await press(findPressableByText(renderer, "In Progress"))
        await press(findPressableByText(renderer, "Confirm"))
        expect(getTexts(renderer)).toContain("Remarks are required")
        expect(patches).toHaveLength(0)

        await typeInto(renderer, "Remarks", "Kickoff done")
        await press(findPressableByText(renderer, "Confirm"))

        expect(patches).toEqual([{ status: 150, remarks: "Kickoff done" }])
        expect(findPressable(renderer, "Status: In Progress. Press to change.")).toBeTruthy()
        expect(getTexts(renderer)).toEqual(expect.arrayContaining(["Status Changed", "Kickoff done"]))
        await unmountApp(renderer)
    })

    it("shows a plain badge at Closed, with nothing to press", async () => {
        project = makeProject({ status: 180 })
        const renderer = await openProject()

        expect(getTexts(renderer)).toContain("Closed")
        expect(
            renderer.root.findAll((node) => String(node.props.accessibilityLabel ?? "").startsWith("Status:")),
        ).toHaveLength(0)
        await unmountApp(renderer)
    })

    it("adds a note at entityType 2", async () => {
        const posts: object[] = []
        const renderer = await openProject([
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
                            description: "Sent the plan",
                            createdAt: "2026-09-06T10:00:00Z",
                        },
                    ]
                    return respond(201, { success: true, data: {} })
                },
            },
        ])

        await press(findPressable(renderer, "Add Note Added"))
        await typeInto(renderer, "Note", "Sent the plan")
        await press(findPressableByText(renderer, "Save Note"))

        expect(posts[0]).toMatchObject({ entityType: 2, entityId: ID })
        expect(getTexts(renderer)).toContain("Sent the plan")
        await unmountApp(renderer)
    })

    it("deletes after the Alert for role 70, and shows no Delete or Edit to role 50", async () => {
        jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
            buttons?.find((button) => button.style === "destructive")?.onPress?.()
        })
        const accountant = await openProject(
            [
                {
                    method: "DELETE",
                    path: `/api/admin/operations/projects/${ID}`,
                    reply: () => respond(200, { success: true, message: "Project deleted successfully" }),
                },
            ],
            { ...ADMIN, role: 70 },
        )
        await press(findPressableByText(accountant, "Delete Project"))
        expect(getCalls(fetchMock)).toContain(`DELETE /api/admin/operations/projects/${ID}`)
        expect(getTexts(accountant)).toContain("1 project found")
        await unmountApp(accountant)

        const marketer = await openProject([], { ...ADMIN, role: 50 })
        expect(getTexts(marketer)).toContain("Budget Overview")
        expect(getTexts(marketer)).not.toContain("Delete Project")
        expect(getTexts(marketer)).not.toContain("Edit")
        await unmountApp(marketer)
    })
})

describe("project edit", () => {
    it("shows the client read-only and saves a new title and budget with the client id unchanged", async () => {
        const patches: unknown[] = []
        const renderer = await openProject([
            {
                method: "PATCH",
                path: `/api/admin/operations/projects/${ID}`,
                reply: (init) => {
                    patches.push(JSON.parse(String(init.body)))
                    project = makeProject({ title: "Website v2", budget: 300000 })
                    return respond(200, { success: true, data: project })
                },
            },
        ])
        const success = jest.spyOn(notify, "success")

        await press(findPressable(renderer, "Edit project"))
        expect(renderer.root.findByProps({ accessibilityLabel: "Client: Acme Pvt • Acme" })).toBeTruthy()
        await typeInto(renderer, "Title", "Website v2")
        await typeInto(renderer, "Budget", "300000")
        await press(findPressableByText(renderer, "Save changes"))

        expect(patches).toEqual([
            {
                clientId: CLIENT_ID,
                title: "Website v2",
                description: "New marketing site with a blog and a careers page",
                serviceType: 10,
                status: 110,
                budget: 300000,
            },
        ])
        expect(success).toHaveBeenCalledWith("Project updated successfully", expect.any(Object))
        expect(getTexts(renderer)).toEqual(expect.arrayContaining(["Website v2", "₹3,00,000"]))
        await unmountApp(renderer)
    })

    it("refuses an empty title with the web's message", async () => {
        const renderer = await openProject()
        const error = jest.spyOn(notify, "error")

        await press(findPressable(renderer, "Edit project"))
        await typeInto(renderer, "Title", "  ")
        await press(findPressableByText(renderer, "Save changes"))

        expect(error).toHaveBeenCalledWith("Client ID and project title are required")
        expect(getCalls(fetchMock).some((call) => call.startsWith("PATCH"))).toBe(false)
        await unmountApp(renderer)
    })
})
