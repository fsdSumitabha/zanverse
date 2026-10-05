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
const ID = "64b7f0c2a1b2c3d4e5f60718"
const CLIENT_ID = "64b7f0c2a1b2c3d4e5f60799"

function makeLead(overrides: object = {}) {
    return {
        _id: ID,
        name: "Acme Traders",
        phone: "+919876543210",
        email: "acme@example.com",
        source: "Facebook",
        status: 10,
        createdAt: "2026-09-01T10:00:00.000Z",
        updatedAt: "2026-09-01T10:00:00.000Z",
        createdBy: { _id: "u1", name: "Asha Rao", email: "asha@zan.test", role: 10 },
        ...overrides,
    }
}

const LIST_PATH = /^\/api\/admin\/operations\/leads\?page=1&limit=10/
const ME_ROUTE = (user: object): FetchRoute => ({
    path: "/api/auth/me",
    reply: () => respond(200, { success: true, data: user }),
})

function listRoute(leads: object[]): FetchRoute {
    return {
        path: LIST_PATH,
        reply: () =>
            respond(200, {
                success: true,
                data: leads,
                pagination: { page: 1, limit: 10, total: leads.length, pages: 1 },
            }),
    }
}

function detailRoute(lead: object | null, client: object | null = null): FetchRoute {
    return {
        path: `/api/admin/operations/leads/${ID}`,
        reply: () =>
            lead
                ? respond(200, { success: true, data: { lead, client } })
                : respond(404, { success: false, message: "Lead not found" }),
    }
}

let fetchMock: FetchMock

async function openLeads(routes: FetchRoute[], user: object = ADMIN) {
    await saveToken("jwt-1")
    routeFetch(fetchMock, [ME_ROUTE(user), ...routes])
    const renderer = await renderApp()
    await press(findPressableByText(renderer, "Leads"))
    return renderer
}

async function openDetail(routes: FetchRoute[], user: object = ADMIN) {
    const renderer = await openLeads(routes, user)
    await press(findPressable(renderer, "Lead Acme Traders"))
    return renderer
}

beforeEach(async () => {
    jest.clearAllMocks()
    fetchMock = installFetchMock()
    await clearToken()
    saveActiveRegion(null)
})

describe("leads list", () => {
    it("lists leads with the count, Create New Lead, and Convert only on the status-50 card", async () => {
        const renderer = await openLeads([listRoute([makeLead(), makeLead({ _id: "l2", name: "Bolt", status: 50 })])])
        const texts = getTexts(renderer)

        expect(texts).toContain("Acme Traders")
        expect(texts).toContain("2 leads found")
        expect(texts).toContain("Create New Lead")
        expect(texts.filter((text) => text === "Convert To Client")).toHaveLength(1)
        expect(texts).toContain("Created by Asha Rao")
        await unmountApp(renderer)
    })

    it("says 1 lead found for one", async () => {
        const renderer = await openLeads([listRoute([makeLead()])])

        expect(getTexts(renderer)).toContain("1 lead found")
        await unmountApp(renderer)
    })
})

describe("lead detail", () => {
    it("shows the lead and the four interaction buttons", async () => {
        const renderer = await openDetail([listRoute([makeLead()]), detailRoute(makeLead())])
        const texts = getTexts(renderer)

        expect(texts).toContain("Facebook")
        expect(texts).toContain("acme@example.com")
        expect(findPressable(renderer, "WhatsApp +91 98765 43210")).toBeTruthy()
        for (const label of ["+ Call Made", "+ Meeting Scheduled", "+ Note Added", "+ Quotation Sent"]) {
            expect(texts).toContain(label)
        }
        await unmountApp(renderer)
    })

    it("changes status with required remarks, PATCHes once and shows the new badge", async () => {
        let current = makeLead()
        const patches: unknown[] = []
        const renderer = await openDetail([
            listRoute([makeLead()]),
            {
                path: `/api/admin/operations/leads/${ID}`,
                reply: () => respond(200, { success: true, data: { lead: current, client: null } }),
            },
            {
                method: "PATCH",
                path: `/api/admin/operations/leads/${ID}/status`,
                reply: (init) => {
                    patches.push(JSON.parse(String(init.body)))
                    current = makeLead({ status: 20 })
                    return respond(200, { success: true, message: "Lead status updated successfully" })
                },
            },
        ])
        const success = jest.spyOn(notify, "success")

        await press(findPressable(renderer, "Status: New Lead. Press to change."))
        expect(getTexts(renderer)).not.toContain("Converted")
        await press(findPressableByText(renderer, "Contacted"))

        await press(findPressableByText(renderer, "Confirm"))
        expect(getTexts(renderer)).toContain("Remarks are required")
        expect(patches).toHaveLength(0)

        await typeInto(renderer, "Remarks", "Called, interested")
        await press(findPressableByText(renderer, "Confirm"))

        expect(patches).toEqual([{ status: 20, remarks: "Called, interested" }])
        expect(success).toHaveBeenCalledWith("Status updated")
        expect(findPressable(renderer, "Status: Contacted. Press to change.")).toBeTruthy()
        await unmountApp(renderer)
    })

    it("makes the status button inert at Converted", async () => {
        const renderer = await openDetail([listRoute([makeLead()]), detailRoute(makeLead({ status: 60 }))])

        const trigger = renderer.root.findByProps({ accessibilityLabel: "Status: Converted" })
        expect(trigger.props.accessibilityState.disabled).toBe(true)
        await unmountApp(renderer)
    })

    it("shows the converted client and opens it in the Clients tab", async () => {
        const client = {
            _id: CLIENT_ID,
            name: "Acme",
            company: "Acme Pvt",
            status: 1,
            createdAt: "2026-09-02T10:00:00Z",
        }
        const renderer = await openDetail([listRoute([makeLead()]), detailRoute(makeLead({ status: 60 }), client)])

        expect(getTexts(renderer)).toContain("Converted to Client")
        expect(getTexts(renderer)).toContain("Acme Pvt")
        await press(findPressableByText(renderer, "View client"))

        expect(getTexts(renderer)).toContain("ClientDetail")
        expect(getTexts(renderer).some((text) => text.includes(CLIENT_ID))).toBe(true)
        await unmountApp(renderer)
    })

    it("lets Admin delete after the Alert, then returns to the list", async () => {
        const alert = jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
            buttons?.find((button) => button.style === "destructive")?.onPress?.()
        })
        const renderer = await openDetail([
            listRoute([makeLead()]),
            detailRoute(makeLead()),
            {
                method: "DELETE",
                path: `/api/admin/operations/leads/${ID}`,
                reply: () => respond(200, { success: true, message: "Lead deleted successfully" }),
            },
        ])

        await press(findPressableByText(renderer, "Delete Lead"))

        expect(alert).toHaveBeenCalledWith("Delete this lead?", expect.any(String), expect.any(Array))
        expect(getCalls(fetchMock)).toContain(`DELETE /api/admin/operations/leads/${ID}`)
        expect(getTexts(renderer)).toContain("Create New Lead")
        await unmountApp(renderer)
    })

    it("hides Delete and Edit from a Digital Marketer (50)", async () => {
        const marketer = { ...ADMIN, role: 50 }
        const renderer = await openDetail([listRoute([makeLead()]), detailRoute(makeLead())], marketer)
        const texts = getTexts(renderer)

        expect(texts).toContain("Facebook")
        expect(texts).not.toContain("Delete Lead")
        expect(texts).not.toContain("Edit")
        await unmountApp(renderer)
    })

    it("shows Lead not found for an unknown id, and AccessDenied on a 403", async () => {
        const missing = await openDetail([listRoute([makeLead()]), detailRoute(null)])
        expect(getTexts(missing)).toContain("Lead not found")
        await unmountApp(missing)

        const denied = await openDetail([
            listRoute([makeLead()]),
            {
                path: `/api/admin/operations/leads/${ID}`,
                reply: () => respond(403, { success: false, message: "You aren't authorized to perform this action." }),
            },
        ])
        expect(getTexts(denied)).toContain("Access Denied")
        await unmountApp(denied)
    })
})

describe("lead form", () => {
    it("shows the server's phone error under the field and stays on the form", async () => {
        const renderer = await openLeads([
            listRoute([]),
            {
                method: "POST",
                path: "/api/admin/operations/leads",
                reply: () =>
                    respond(409, { success: false, message: "A lead with this phone already exists", field: "phone" }),
            },
        ])
        await press(findPressableByText(renderer, "Create New Lead"))

        await typeInto(renderer, "Name", "New Co")
        await typeInto(renderer, "Phone", "98765 43210")
        await typeInto(renderer, "Source (Facebook, Google...)", "Google")
        await press(findPressableByText(renderer, "Create Lead"))

        const post = fetchMock.mock.calls.find(([, init]) => init.method === "POST")!
        expect(JSON.parse(String(post[1].body))).toEqual({
            name: "New Co",
            email: "",
            source: "Google",
            phone: "+919876543210",
            region: "IN",
        })
        expect(getTexts(renderer)).toContain("A lead with this phone already exists")
        expect(getTexts(renderer)).toContain("Create Lead")
        await unmountApp(renderer)
    })

    it("opens the new lead after a successful create", async () => {
        const renderer = await openLeads([
            listRoute([]),
            {
                method: "POST",
                path: "/api/admin/operations/leads",
                reply: () => respond(201, { success: true, data: makeLead({ name: "New Co" }) }),
            },
            detailRoute(makeLead({ name: "New Co" })),
        ])
        await press(findPressableByText(renderer, "Create New Lead"))
        await typeInto(renderer, "Name", "New Co")
        await typeInto(renderer, "Phone", "98765 43210")
        await typeInto(renderer, "Source (Facebook, Google...)", "Google")
        await press(findPressableByText(renderer, "Create Lead"))

        expect(getTexts(renderer)).toContain("New Co")
        expect(getTexts(renderer)).toContain("+ Call Made")
        await unmountApp(renderer)
    })

    it("saves an edit with an untouched legacy phone as the saved text", async () => {
        const legacy = makeLead({ phone: "9876543210" })
        const patches: unknown[] = []
        const renderer = await openDetail([
            listRoute([legacy]),
            detailRoute(legacy),
            {
                method: "PATCH",
                path: `/api/admin/operations/leads/${ID}`,
                reply: (init) => {
                    patches.push(JSON.parse(String(init.body)))
                    return respond(200, { success: true, data: legacy })
                },
            },
        ])
        await press(findPressable(renderer, "Edit lead"))
        await typeInto(renderer, "Name", "Acme Traders Ltd")
        await press(findPressableByText(renderer, "Update Lead"))

        expect(patches).toEqual([
            { name: "Acme Traders Ltd", email: "acme@example.com", source: "Facebook", phone: "9876543210" },
        ])
        expect(getTexts(renderer)).not.toContain("Update Lead")
        await unmountApp(renderer)
    })
})

describe("convert", () => {
    it("converts a status-50 lead and opens the new client at once", async () => {
        const negotiating = makeLead({ status: 50 })
        const renderer = await openLeads([
            listRoute([negotiating]),
            detailRoute(negotiating),
            {
                method: "POST",
                path: `/api/admin/operations/leads/${ID}/convert`,
                reply: () => respond(201, { success: true, data: { clientId: CLIENT_ID } }),
            },
        ])
        await press(findPressableByText(renderer, "Convert To Client"))

        expect(getTexts(renderer)).toContain("Lead Details")
        await typeInto(renderer, "Company", "Acme Pvt")
        await press(findPressableByText(renderer, "Convert to Client"))

        expect(getCalls(fetchMock)).toContain(`POST /api/admin/operations/leads/${ID}/convert`)
        expect(getTexts(renderer)).toContain("ClientDetail")
        await unmountApp(renderer)
    })
})
