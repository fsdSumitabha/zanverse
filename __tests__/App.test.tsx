import { Text } from "react-native"
import ReactTestRenderer from "react-test-renderer"

import { clearToken, getToken, saveToken } from "@/store/keychain"
import { getActiveRegion, saveActiveRegion, saveLastEmail } from "@/store/mmkv"

import App from "../App"

jest.useFakeTimers()

interface MockResponse {
    status: number
    ok: boolean
    json: () => Promise<unknown>
}

const fetchMock = jest.fn<Promise<MockResponse>, [string, RequestInit]>()

function respond(status: number, body: unknown): MockResponse {
    return { status, ok: status >= 200 && status < 300, json: () => Promise.resolve(body) }
}

const MULTI_REGION_USER = {
    id: "u1",
    name: "Asha Rao",
    email: "asha@zan.test",
    role: 10,
    regions: ["IN", "US"],
    activeRegion: "ALL",
}

function getTexts(renderer: ReactTestRenderer.ReactTestRenderer): string[] {
    return renderer.root.findAllByType(Text).map((node) => {
        const children = node.props.children
        return Array.isArray(children) ? children.join("") : String(children)
    })
}

async function renderApp(): Promise<ReactTestRenderer.ReactTestRenderer> {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined
    await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(<App />)
    })
    // Let the boot's Keychain read and /api/auth/me settle, then the Splash reset.
    await ReactTestRenderer.act(async () => {
        await Promise.resolve()
    })
    return renderer!
}

async function unmount(renderer: ReactTestRenderer.ReactTestRenderer) {
    await ReactTestRenderer.act(async () => {
        renderer.unmount()
        jest.runOnlyPendingTimers()
    })
}

beforeEach(async () => {
    jest.clearAllMocks()
    globalThis.fetch = fetchMock as unknown as typeof fetch
    await clearToken()
    saveActiveRegion(null)
})

test("with no stored token it opens Login, prefilled with the last email, and calls nothing", async () => {
    saveLastEmail("asha@zan.test")

    const renderer = await renderApp()
    const texts = getTexts(renderer)

    expect(texts).toContain("Admin Login")
    expect(texts).toContain("Sign In")
    expect(renderer.root.findByProps({ accessibilityLabel: "Email" }).props.value).toBe("asha@zan.test")
    expect(fetchMock).not.toHaveBeenCalled()
    await unmount(renderer)
})

test("with a valid token it goes from Splash to Home and seeds the region from /api/auth/me", async () => {
    await saveToken("jwt-1")
    fetchMock.mockResolvedValueOnce(respond(200, { success: true, data: MULTI_REGION_USER }))

    const renderer = await renderApp()
    const texts = getTexts(renderer)

    expect(fetchMock.mock.calls[0][0]).toBe("http://10.0.2.2:3000/api/auth/me")
    expect(texts).toContain("Asha Rao")
    expect(texts).toContain("Admin")
    expect(getActiveRegion()).toBe("ALL")
    await unmount(renderer)
})

test("a dead token (/api/auth/me answers data null) opens Login and drops the token", async () => {
    await saveToken("jwt-expired")
    fetchMock.mockResolvedValueOnce(respond(200, { success: true, data: null }))

    const renderer = await renderApp()

    expect(getTexts(renderer)).toContain("Admin Login")
    expect(getToken()).toBeNull()
    await unmount(renderer)
})

function findPressable(renderer: ReactTestRenderer.ReactTestRenderer, label: string | RegExp) {
    return renderer.root.find(
        (node) =>
            typeof node.props.onPress === "function" &&
            typeof node.props.accessibilityLabel === "string" &&
            (typeof label === "string"
                ? node.props.accessibilityLabel === label
                : label.test(node.props.accessibilityLabel)),
    )
}

function findPressableByText(renderer: ReactTestRenderer.ReactTestRenderer, text: string) {
    const textNode = renderer.root.findAllByType(Text).find((node) => node.props.children === text)
    let node = textNode?.parent ?? null
    while (node && typeof node.props.onPress !== "function") node = node.parent
    if (!node) throw new Error(`No pressable holds the text "${text}"`)
    return node
}

async function press(node: ReactTestRenderer.ReactTestInstance) {
    await ReactTestRenderer.act(async () => {
        node.props.onPress()
        await Promise.resolve()
    })
}

test("switching region posts it, trusts data.active and sends it on the next request", async () => {
    await saveToken("jwt-1")
    fetchMock.mockResolvedValueOnce(respond(200, { success: true, data: MULTI_REGION_USER }))
    const renderer = await renderApp()

    // 1. Open the switcher and pick the United States.
    await press(findPressable(renderer, /^Showing every region you cover: IN, US/))
    fetchMock.mockResolvedValueOnce(respond(200, { success: true, data: { active: "US", regions: ["IN", "US"] } }))
    await press(findPressableByText(renderer, "United States"))

    const [url, init] = fetchMock.mock.calls[1]
    expect(url).toBe("http://10.0.2.2:3000/api/auth/region")
    expect(init.method).toBe("POST")
    expect(init.body).toBe(JSON.stringify({ region: "US" }))
    expect(getActiveRegion()).toBe("US")

    // 2. The tree remounted on the new region, and the pill shows the server's answer.
    expect(findPressable(renderer, "Working in United States. Press to change.")).toBeTruthy()

    // 3. The next request carries it.
    fetchMock.mockResolvedValueOnce(respond(200, { success: true, data: [] }))
    await press(findPressableByText(renderer, "Send a test request"))
    expect((fetchMock.mock.calls[2][1].headers as Record<string, string>)["X-Active-Region"]).toBe("US")
    await unmount(renderer)
})

test("an account with one region shows a plain badge with nothing to press", async () => {
    await saveToken("jwt-1")
    fetchMock.mockResolvedValueOnce(
        respond(200, { success: true, data: { ...MULTI_REGION_USER, role: 60, regions: ["IN"], activeRegion: "IN" } }),
    )
    const renderer = await renderApp()

    const badge = renderer.root.findByProps({ accessibilityLabel: "Working in India" })
    expect(badge.props.onPress).toBeUndefined()
    expect(getTexts(renderer)).toContain("Active region (IN). canSwitch: false")
    await unmount(renderer)
})

test("logout tells the server, clears the session and opens Login at once", async () => {
    await saveToken("jwt-1")
    fetchMock.mockResolvedValueOnce(respond(200, { success: true, data: MULTI_REGION_USER }))
    const renderer = await renderApp()

    fetchMock.mockResolvedValueOnce(respond(200, { success: true, message: "Logged out successfully" }))
    await press(findPressableByText(renderer, "Log out"))

    expect(fetchMock.mock.calls[1][0]).toBe("http://10.0.2.2:3000/api/auth/logout")
    expect(getToken()).toBeNull()
    expect(getActiveRegion()).toBeNull()
    expect(getTexts(renderer)).toContain("Admin Login")
    await unmount(renderer)
})
