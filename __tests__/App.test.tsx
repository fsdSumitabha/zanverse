import ReactTestRenderer from "react-test-renderer"

import { API_BASE_URL } from "@/api/endpoints"
import { navigationRef } from "@/api/navigationRef"
import { clearToken, getToken, saveToken } from "@/store/keychain"
import { getActiveRegion, saveActiveRegion, saveLastEmail } from "@/store/mmkv"

import {
    findPressable,
    findPressableByText,
    flush,
    getBarLabels,
    getTexts,
    installFetchMock,
    openFromProfileSheet,
    openProfileSheet,
    press,
    renderApp,
    respond,
    unmountApp,
    type FetchMock,
} from "../jest/appHarness"

jest.useFakeTimers()

const ADMIN = {
    id: "u1",
    name: "Asha Rao",
    email: "asha@zan.test",
    role: 10,
    regions: ["IN", "US"],
    activeRegion: "ALL",
}

let fetchMock: FetchMock

// The notification bell and the Leads list the app opens on fetch on their own, so calls are found by URL, not by
// position.
const BACKGROUND_CALLS = [/\/api\/notifications/, /\/api\/admin\/operations\/leads\?page=/]

function getForegroundCalls() {
    return fetchMock.mock.calls.filter(([url]) => !BACKGROUND_CALLS.some((pattern) => pattern.test(url)))
}

async function signInAs(user: object): Promise<ReactTestRenderer.ReactTestRenderer> {
    await saveToken("jwt-1")
    fetchMock.mockResolvedValueOnce(respond(200, { success: true, data: user }))
    return renderApp()
}

beforeEach(async () => {
    jest.clearAllMocks()
    fetchMock = installFetchMock()
    await clearToken()
    saveActiveRegion(null)
})

describe("boot", () => {
    it("with no stored token opens Login, prefilled with the last email, and calls nothing", async () => {
        saveLastEmail("asha@zan.test")

        const renderer = await renderApp()

        expect(getTexts(renderer)).toContain("Admin Login")
        expect(renderer.root.findByProps({ accessibilityLabel: "Email" }).props.value).toBe("asha@zan.test")
        expect(fetchMock).not.toHaveBeenCalled()
        await unmountApp(renderer)
    })

    it("with a valid token goes to the tabs and seeds the region from /api/auth/me", async () => {
        const renderer = await signInAs(ADMIN)

        expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE_URL}/api/auth/me`)
        expect(getBarLabels(renderer)).toEqual(["Leads", "Clients", "Projects", "Meetings"])
        expect(getActiveRegion()).toBe("ALL")
        await unmountApp(renderer)
    })

    it("with a dead token (/api/auth/me answers data null) opens Login and drops the token", async () => {
        await saveToken("jwt-expired")
        fetchMock.mockResolvedValueOnce(respond(200, { success: true, data: null }))

        const renderer = await renderApp()

        expect(getTexts(renderer)).toContain("Admin Login")
        expect(getToken()).toBeNull()
        await unmountApp(renderer)
    })
})

describe("tabs by role", () => {
    it("shows an Admin the four main tabs in the floating bar, and opens on Leads", async () => {
        const renderer = await signInAs(ADMIN)

        expect(getBarLabels(renderer)).toEqual(["Leads", "Clients", "Projects", "Meetings"])
        expect(renderer.root.findByProps({ accessibilityRole: "header" }).props.children).toBe("Leads")
        await unmountApp(renderer)
    })

    it("gives a US Sales Agent (65) Calls in the slots Clients and Projects leave free", async () => {
        const renderer = await signInAs({ ...ADMIN, role: 65, regions: ["US"], activeRegion: "US" })

        expect(getBarLabels(renderer)).toEqual(["Leads", "Calls", "Meetings"])
        await unmountApp(renderer)
    })
})

describe("profile sheet", () => {
    it("shows Activity Logs to an Admin and hides it from a Digital Marketer (50)", async () => {
        const admin = await signInAs(ADMIN)
        await openProfileSheet(admin)
        expect(getTexts(admin)).toEqual(
            expect.arrayContaining(["Asha Rao", "Admin", "Users & Staff Directory", "Lead Sources & Uploads"]),
        )
        expect(getTexts(admin)).toContain("Activity Logs")
        await unmountApp(admin)

        const marketer = await signInAs({ ...ADMIN, role: 50, regions: ["IN"], activeRegion: "IN" })
        await openProfileSheet(marketer)
        expect(getTexts(marketer)).toEqual(expect.arrayContaining(["Dashboard", "App Settings", "Log Out"]))
        expect(getTexts(marketer)).not.toContain("Activity Logs")
        expect(getTexts(marketer)).not.toContain("Users & Staff Directory")
        await unmountApp(marketer)
    })

    it("opens a page over the tab, hides the bar, and Back brings both back", async () => {
        const renderer = await signInAs(ADMIN)
        const getBarPointerEvents = () =>
            renderer.root.findByProps({ accessibilityRole: "tablist" }).parent?.props.pointerEvents

        expect(getBarPointerEvents()).toBe("box-none")
        await openFromProfileSheet(renderer, "Dashboard")
        expect(getBarPointerEvents()).toBe("none")

        await press(findPressable(renderer, "Navigate up"))
        expect(getBarPointerEvents()).toBe("box-none")
        await unmountApp(renderer)
    })

    it("switches region: posts it, trusts data.active, and the next request carries it", async () => {
        const renderer = await signInAs(ADMIN)
        await openProfileSheet(renderer)

        // 1. Open the switcher and pick the United States. The server answers with what it allowed.
        await press(findPressable(renderer, /^Showing every region you cover: IN, US/))
        fetchMock.mockResolvedValueOnce(respond(200, { success: true, data: { active: "US", regions: ["IN", "US"] } }))
        await press(findPressableByText(renderer, "United States"))

        const [url, init] = getForegroundCalls()[1]
        expect(url).toBe(`${API_BASE_URL}/api/auth/region`)
        expect(init.method).toBe("POST")
        expect(init.body).toBe(JSON.stringify({ region: "US" }))
        expect(getActiveRegion()).toBe("US")

        // 2. The tabs remounted, back on the same tab, and the pill shows the server's answer.
        await openProfileSheet(renderer)
        expect(findPressable(renderer, "Working in United States. Press to change.")).toBeTruthy()

        // 3. The next request carries the new region.
        await press(findPressable(renderer, "App Settings"))
        fetchMock.mockResolvedValueOnce(respond(200, { success: true, data: [] }))
        await press(findPressable(renderer, "Send a test request"))
        const lastCall = getForegroundCalls().at(-1)
        expect((lastCall?.[1].headers as Record<string, string>)["X-Active-Region"]).toBe("US")
        await unmountApp(renderer)
    })

    it("shows a one-region account a plain badge with nothing to press", async () => {
        const renderer = await signInAs({ ...ADMIN, role: 60, regions: ["IN"], activeRegion: "IN" })
        await openProfileSheet(renderer)

        const badge = renderer.root.findByProps({ accessibilityLabel: "Working in India" })
        expect(badge.props.onPress).toBeUndefined()
        await unmountApp(renderer)
    })

    it("logs out: tells the server, clears the session and opens Login at once", async () => {
        const renderer = await signInAs(ADMIN)
        await openProfileSheet(renderer)

        fetchMock.mockResolvedValueOnce(respond(200, { success: true, message: "Logged out successfully" }))
        await press(findPressable(renderer, "Log Out"))

        const calls = getForegroundCalls()
        expect(calls[1][0]).toBe(`${API_BASE_URL}/api/auth/logout`)
        expect(getToken()).toBeNull()
        expect(getActiveRegion()).toBeNull()
        expect(getTexts(renderer)).toContain("Admin Login")
        await unmountApp(renderer)
    })
})

describe("screen guard", () => {
    it("renders AccessDenied for UserEdit as a US Leads Manager (69)", async () => {
        const renderer = await signInAs({ ...ADMIN, role: 69, regions: ["US"], activeRegion: "US" })

        await ReactTestRenderer.act(async () => {
            navigationRef.navigate("App", {
                screen: "UsersTab",
                params: { screen: "UserEdit", params: { id: "64b7f0c2a1b2c3d4e5f60718" } },
            })
        })
        await flush()

        const texts = getTexts(renderer)
        expect(texts).toContain("Access Denied")
        expect(texts).toContain("You aren't authorized to perform this action.")
        await unmountApp(renderer)
    })

    it("opens a screen with its params when the role may open it", async () => {
        const renderer = await signInAs(ADMIN)

        await ReactTestRenderer.act(async () => {
            navigationRef.navigate("App", {
                screen: "CallsTab",
                params: { screen: "LeadSourceDetail", params: { sourceId: "64b7f0c2a1b2c3d4e5f60718" } },
            })
        })
        await flush()

        const calls = fetchMock.mock.calls.map(([url]) => url)
        expect(calls).toContain(`${API_BASE_URL}/api/admin/operations/lead-sources/64b7f0c2a1b2c3d4e5f60718`)
        await unmountApp(renderer)
    })
})
