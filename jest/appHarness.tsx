// Shared by the whole-app tests: a fetch mock, a renderer for <App />, and finders for text and pressables.
import { Text } from "react-native"
import ReactTestRenderer from "react-test-renderer"

import App from "../App"

export interface MockResponse {
    status: number
    ok: boolean
    json: () => Promise<unknown>
}

export type FetchMock = jest.Mock<Promise<MockResponse>, [string, RequestInit]>

/** A fetch Response with only what client.ts reads. */
export function respond(status: number, body: unknown): MockResponse {
    return { status, ok: status >= 200 && status < 300, json: () => Promise.resolve(body) }
}

/** Installs a fresh fetch mock on the global and returns it. */
export function installFetchMock(): FetchMock {
    const fetchMock: FetchMock = jest.fn()
    globalThis.fetch = fetchMock as unknown as typeof fetch
    return fetchMock
}

/** Every string rendered inside a Text. */
export function getTexts(renderer: ReactTestRenderer.ReactTestRenderer): string[] {
    return renderer.root.findAllByType(Text).map((node) => {
        const children = node.props.children
        return Array.isArray(children) ? children.join("") : String(children)
    })
}

/** Lets pending promises and the effects they trigger settle. */
export async function flush(): Promise<void> {
    await ReactTestRenderer.act(async () => {
        await Promise.resolve()
    })
}

/** Mounts the whole app and waits for the boot (Keychain read, /api/auth/me, Splash reset). */
export async function renderApp(): Promise<ReactTestRenderer.ReactTestRenderer> {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined
    await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(<App />)
    })
    await flush()
    await flush()
    return renderer!
}

export async function unmountApp(renderer: ReactTestRenderer.ReactTestRenderer): Promise<void> {
    await ReactTestRenderer.act(async () => {
        renderer.unmount()
        jest.runOnlyPendingTimers()
    })
}

/** The nearest pressable whose accessibility label matches. */
export function findPressable(renderer: ReactTestRenderer.ReactTestRenderer, label: string | RegExp) {
    return renderer.root.find(
        (node) =>
            typeof node.props.onPress === "function" &&
            typeof node.props.accessibilityLabel === "string" &&
            (typeof label === "string"
                ? node.props.accessibilityLabel === label
                : label.test(node.props.accessibilityLabel)),
    )
}

/** The nearest pressable that holds a Text with exactly this string. A title with the same text is skipped. */
export function findPressableByText(renderer: ReactTestRenderer.ReactTestRenderer, text: string) {
    for (const textNode of renderer.root.findAllByType(Text)) {
        if (textNode.props.children !== text) continue
        let node = textNode.parent
        while (node && typeof node.props.onPress !== "function") node = node.parent
        if (node) return node
    }
    throw new Error(`No pressable holds the text "${text}"`)
}

/** Presses a node and lets what it starts settle. */
export async function press(node: ReactTestRenderer.ReactTestInstance): Promise<void> {
    await ReactTestRenderer.act(async () => {
        node.props.onPress({ preventDefault: () => undefined, nativeEvent: {} })
        await Promise.resolve()
    })
    await flush()
}

export interface FetchRoute {
    method?: string
    /** Matched against the path after the API base URL, query string included. */
    path: string | RegExp
    reply: (init: RequestInit, path: string) => MockResponse
}

/** Answers each request from the first matching route, and 404s anything else. Returns the calls made. */
export function routeFetch(fetchMock: FetchMock, routes: FetchRoute[]): void {
    fetchMock.mockImplementation((url: string, init: RequestInit) => {
        const path = url.replace(/^https?:\/\/[^/]+/, "")
        const method = init.method ?? "GET"
        const route = routes.find(
            (candidate) =>
                (candidate.method ?? "GET") === method &&
                (typeof candidate.path === "string" ? candidate.path === path : candidate.path.test(path)),
        )
        return Promise.resolve(route ? route.reply(init, path) : respond(404, { success: false, message: "Not found" }))
    })
}

/** The calls a fetch mock received, as `METHOD path`. */
export function getCalls(fetchMock: FetchMock): string[] {
    return fetchMock.mock.calls.map(([url, init]) => `${init.method ?? "GET"} ${url.replace(/^https?:\/\/[^/]+/, "")}`)
}

/** Types into the TextInput with this accessibility label. */
export async function typeInto(renderer: ReactTestRenderer.ReactTestRenderer, label: string, text: string) {
    const input = renderer.root.find(
        (node) => node.props.accessibilityLabel === label && typeof node.props.onChangeText === "function",
    )
    await ReactTestRenderer.act(async () => input.props.onChangeText(text))
}
