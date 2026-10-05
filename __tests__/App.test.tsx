import ReactTestRenderer from "react-test-renderer"

import { navigationRef } from "@/api/navigationRef"
import { clearToken, getToken, saveToken } from "@/store/keychain"
import { getActiveRegion, saveActiveRegion, saveLastEmail } from "@/store/mmkv"

import {
    findPressable,
    findPressableByText,
    flush,
    getTexts,
    installFetchMock,
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

const TAB_LABELS = ["Dashboard", "Leads", "Calls", "Clients", "Projects", "Users", "More"]

let fetchMock: FetchMock

async function signInAs(user: object): Promise<ReactTestRenderer.ReactTestRenderer> {
    await saveToken("jwt-1")
    fetchMock.mockResolvedValueOnce(respond(200, { success: true, data: user }))
    return renderApp()
}

function getTabLabels(renderer: ReactTestRenderer.ReactTestRenderer): string[] {
    const texts = getTexts(renderer)
    return TAB_LABELS.filter((label) => texts.includes(label))
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

        expect(fetchMock.mock.calls[0][0]).toBe("http://10.0.2.2:3000/api/auth/me")
        expect(getTexts(renderer)).toContain("Dashboard")
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
    it("shows an Admin all six tabs plus More", async () => {
        const renderer = await signInAs(ADMIN)

        expect(getTabLabels(renderer)).toEqual(TAB_LABELS)
        await unmountApp(renderer)
    })

    it("shows a US Sales Agent (65) Dashboard, Leads, Calls and More only", async () => {
        const renderer = await signInAs({ ...ADMIN, role: 65, regions: ["US"], activeRegion: "US" })

        expect(getTabLabels(renderer)).toEqual(["Dashboard", "Leads", "Calls", "More"])
        await unmountApp(renderer)
    })
})

describe("More", () => {
    it("shows Activity Logs to an Admin and hides it from a Digital Marketer (50)", async () => {
        const admin = await signInAs(ADMIN)
        await press(findPressableByText(admin, "More"))
        expect(getTexts(admin)).toContain("Activity Logs")
        expect(getTexts(admin)).toContain("Asha Rao")
        await unmountApp(admin)

        const marketer = await signInAs({ ...ADMIN, role: 50, regions: ["IN"], activeRegion: "IN" })
        await press(findPressableByText(marketer, "More"))
        expect(getTexts(marketer)).toContain("Meetings")
        expect(getTexts(marketer)).not.toContain("Activity Logs")
        await unmountApp(marketer)
    })

    it("switches region: posts it, trusts data.active, and the next request carries it", async () => {
        const renderer = await signInAs(ADMIN)
        await press(findPressableByText(renderer, "More"))

        // 1. Open the switcher and pick the United States. The server answers with what it allowed.
        await press(findPressable(renderer, /^Showing every region you cover: IN, US/))
        fetchMock.mockResolvedValueOnce(respond(200, { success: true, data: { active: "US", regions: ["IN", "US"] } }))
        await press(findPressableByText(renderer, "United States"))

        const [url, init] = fetchMock.mock.calls[1]
        expect(url).toBe("http://10.0.2.2:3000/api/auth/region")
        expect(init.method).toBe("POST")
        expect(init.body).toBe(JSON.stringify({ region: "US" }))
        expect(getActiveRegion()).toBe("US")

        // 2. The tabs remounted, back on the same tab, and the pill shows the server's answer.
        expect(findPressable(renderer, "Working in United States. Press to change.")).toBeTruthy()

        // 3. The next request carries the new region.
        fetchMock.mockResolvedValueOnce(respond(200, { success: true, data: [] }))
        await press(findPressableByText(renderer, "Send a test request"))
        expect((fetchMock.mock.calls[2][1].headers as Record<string, string>)["X-Active-Region"]).toBe("US")
        await unmountApp(renderer)
    })

    it("shows a one-region account a plain badge with nothing to press", async () => {
        const renderer = await signInAs({ ...ADMIN, role: 60, regions: ["IN"], activeRegion: "IN" })
        await press(findPressableByText(renderer, "More"))

        const badge = renderer.root.findByProps({ accessibilityLabel: "Working in India" })
        expect(badge.props.onPress).toBeUndefined()
        await unmountApp(renderer)
    })

    it("logs out: tells the server, clears the session and opens Login at once", async () => {
        const renderer = await signInAs(ADMIN)
        await press(findPressableByText(renderer, "More"))

        fetchMock.mockResolvedValueOnce(respond(200, { success: true, message: "Logged out successfully" }))
        await press(findPressable(renderer, "Logout"))

        expect(fetchMock.mock.calls[1][0]).toBe("http://10.0.2.2:3000/api/auth/logout")
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

    it("opens the placeholder with its params when the role may open it", async () => {
        const renderer = await signInAs(ADMIN)

        await ReactTestRenderer.act(async () => {
            navigationRef.navigate("App", {
                screen: "CallsTab",
                params: { screen: "LeadSourceDetail", params: { id: "64b7f0c2a1b2c3d4e5f60718" } },
            })
        })
        await flush()

        const texts = getTexts(renderer)
        expect(texts).toContain("LeadSourceDetail")
        expect(texts.some((text) => text.includes("64b7f0c2a1b2c3d4e5f60718"))).toBe(true)
        await unmountApp(renderer)
    })
})
