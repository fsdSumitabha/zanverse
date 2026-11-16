import ReactTestRenderer from "react-test-renderer"

import { API_BASE_URL } from "@/api/endpoints"
import { useListQuery, type ListQueryResult } from "@/hooks/useListQuery"
import { saveToken } from "@/store/keychain"

jest.useFakeTimers()

// Tabs keep screens mounted; the hook reloads on a later focus. The test triggers focus by hand.
const mockFocus: { current: (() => void) | null } = { current: null }
jest.mock("@react-navigation/native", () => {
    const actual = jest.requireActual("@react-navigation/native")
    const { useEffect } = jest.requireActual("react")
    return {
        ...actual,
        useFocusEffect: (callback: () => void) => {
            useEffect(() => {
                mockFocus.current = callback
                callback()
            }, [callback])
        },
    }
})
jest.mock("@/lib/notify", () => ({ notify: { error: jest.fn(), success: jest.fn() } }))

interface Row {
    _id: string
}

interface PendingRequest {
    url: string
    resolve: (body: unknown, status?: number) => void
}

let pending: PendingRequest[] = []

// Each request waits until the test answers it, and rejects like fetch when its signal aborts.
function installFetch() {
    pending = []
    globalThis.fetch = jest.fn(
        (url: string, init: RequestInit) =>
            new Promise((resolve, reject) => {
                init.signal?.addEventListener("abort", () =>
                    reject(Object.assign(new Error("Aborted"), { name: "AbortError" })),
                )
                pending.push({
                    url,
                    resolve: (body, status = 200) =>
                        resolve({ status, ok: status < 300, json: () => Promise.resolve(body) }),
                })
            }),
    ) as unknown as typeof fetch
}

function rows(page: number, count = 10): Row[] {
    return Array.from({ length: count }, (_, index) => ({ _id: `p${page}-${index}` }))
}

function envelope(page: number, pages: number, total = pages * 10) {
    return { success: true, data: rows(page), pagination: { page, limit: 10, total, pages } }
}

let result: ListQueryResult<Row>
let renderCount = 0

function Harness({ path = "/api/admin/operations/leads" }: { path?: string }) {
    result = useListQuery<Row>({ path })
    renderCount++
    return null
}

async function settle() {
    await ReactTestRenderer.act(async () => {
        await Promise.resolve()
    })
}

async function answer(index: number, body: unknown, status?: number) {
    await ReactTestRenderer.act(async () => {
        pending[index].resolve(body, status)
        await Promise.resolve()
    })
    await settle()
}

let mounted: ReactTestRenderer.ReactTestRenderer | null = null

async function mount(path?: string) {
    await ReactTestRenderer.act(async () => {
        mounted = ReactTestRenderer.create(<Harness path={path} />)
    })
}

function getParams(index: number): Record<string, string> {
    const query = pending[index].url.split("?")[1] ?? ""
    return Object.fromEntries(query.split("&").map((pair) => pair.split("=").map(decodeURIComponent)))
}

afterEach(async () => {
    // A harness left mounted would keep writing `result` from its own timers.
    await ReactTestRenderer.act(async () => mounted?.unmount())
    mounted = null
})

beforeEach(async () => {
    installFetch()
    mockFocus.current = null
    renderCount = 0
    await saveToken("jwt-1")
})

describe("useListQuery", () => {
    it("loads page 1 with the web's param names and shows the first-load state", async () => {
        await mount()

        expect(result.loading).toBe(true)
        expect(pending).toHaveLength(1)
        expect(pending[0].url.startsWith(`${API_BASE_URL}/api/admin/operations/leads?`)).toBe(true)
        expect(getParams(0)).toEqual({ page: "1", limit: "10" })

        await answer(0, envelope(1, 3, 25))

        expect(result.loading).toBe(false)
        expect(result.items).toHaveLength(10)
        expect(result.total).toBe(25)
        expect(result.pages).toBe(3)
    })

    it("appends the next page on loadMore and stops at the last page", async () => {
        await mount()
        await answer(0, envelope(1, 2))

        await ReactTestRenderer.act(async () => result.loadMore())
        expect(result.loadingMore).toBe(true)
        expect(getParams(1).page).toBe("2")
        await answer(1, envelope(2, 2))

        expect(result.items).toHaveLength(20)
        expect(result.items[10]._id).toBe("p2-0")

        await ReactTestRenderer.act(async () => result.loadMore())
        expect(pending).toHaveLength(2)
    })

    it("ignores loadMore while a page is loading", async () => {
        await mount()
        await answer(0, envelope(1, 5))

        await ReactTestRenderer.act(async () => {
            result.loadMore()
        })
        await ReactTestRenderer.act(async () => {
            result.loadMore()
        })
        expect(pending).toHaveLength(2)
    })

    it("resets to page 1 and replaces the rows when filters change", async () => {
        await mount()
        await answer(0, envelope(1, 3))
        await ReactTestRenderer.act(async () => result.loadMore())
        await answer(1, envelope(2, 3))

        await ReactTestRenderer.act(async () =>
            result.setFilters({ status: "20", from: "2026-02-01", to: "2026-03-01" }),
        )

        expect(result.loading).toBe(true)
        expect(getParams(2)).toEqual({ page: "1", limit: "10", status: "20", from: "2026-02-01", to: "2026-03-01" })
        await answer(2, { success: true, data: rows(9, 4), pagination: { page: 1, limit: 10, total: 4, pages: 1 } })

        expect(result.items.map((row) => row._id)).toEqual(["p9-0", "p9-1", "p9-2", "p9-3"])
        expect(result.total).toBe(4)
    })

    it("searches 300 ms after typing, only at 0 or 2+ characters", async () => {
        await mount()
        await answer(0, envelope(1, 1))

        await ReactTestRenderer.act(async () => result.setSearch("a"))
        await ReactTestRenderer.act(async () => jest.advanceTimersByTime(1000))
        expect(pending).toHaveLength(1)
        expect(result.searchText).toBe("a")

        await ReactTestRenderer.act(async () => result.setSearch("ac"))
        await ReactTestRenderer.act(async () => jest.advanceTimersByTime(299))
        expect(pending).toHaveLength(1)
        await ReactTestRenderer.act(async () => jest.advanceTimersByTime(1))
        expect(pending).toHaveLength(2)
        expect(getParams(1)).toEqual({ page: "1", limit: "10", search: "ac" })

        await ReactTestRenderer.act(async () => result.setSearch(""))
        await ReactTestRenderer.act(async () => jest.advanceTimersByTime(300))
        expect(pending).toHaveLength(3)
        expect(getParams(2)).toEqual({ page: "1", limit: "10" })
    })

    it("refreshes page 1 and keeps the filters and the search", async () => {
        await mount()
        await answer(0, envelope(1, 3))
        await ReactTestRenderer.act(async () => result.setFilters({ status: "40" }))
        await answer(1, envelope(1, 3))
        await ReactTestRenderer.act(async () => result.setSearch("acme"))
        await ReactTestRenderer.act(async () => jest.advanceTimersByTime(300))
        await answer(2, envelope(1, 3))
        await ReactTestRenderer.act(async () => result.loadMore())
        await answer(3, envelope(2, 3))

        await ReactTestRenderer.act(async () => result.refresh())

        expect(result.refreshing).toBe(true)
        expect(result.loading).toBe(false)
        expect(getParams(4)).toEqual({ page: "1", limit: "10", search: "acme", status: "40" })
        await answer(4, envelope(1, 3))
        expect(result.refreshing).toBe(false)
        expect(result.items).toHaveLength(10)
    })

    it("reloads page 1 quietly on a later focus, not on the first", async () => {
        await mount()
        expect(pending).toHaveLength(1)
        await answer(0, envelope(1, 2))

        await ReactTestRenderer.act(async () => mockFocus.current?.())

        expect(pending).toHaveLength(2)
        expect(result.loading).toBe(false)
        expect(result.refreshing).toBe(false)
        expect(result.items).toHaveLength(10)
    })

    it("drops a stale response: only the newest request writes", async () => {
        await mount()
        await ReactTestRenderer.act(async () => result.setFilters({ status: "10" }))

        // The first request was aborted by the second. Answering it changes nothing.
        await answer(0, envelope(7, 1))
        expect(result.items).toEqual([])

        await answer(1, envelope(1, 1))
        expect(result.items[0]._id).toBe("p1-0")
    })

    it("turns a 403 into accessError with the server's message", async () => {
        await mount()
        await answer(0, { success: false, message: "You aren't authorized to perform this action." }, 403)

        expect(result.accessError).toBe("You aren't authorized to perform this action.")
        expect(result.items).toEqual([])
        expect(result.loading).toBe(false)
    })

    it("reads pagination.totalPages, as the meetings route sends it", async () => {
        await mount("/api/admin/operations/meetings")
        await answer(0, { success: true, data: rows(1), pagination: { page: 1, limit: 10, total: 30, totalPages: 3 } })

        expect(result.pages).toBe(3)
    })

    it("keeps setPage the same function across renders", async () => {
        await mount()
        const first = result.setPage
        const rendersBefore = renderCount
        await answer(0, envelope(1, 2))

        expect(renderCount).toBeGreaterThan(rendersBefore)
        expect(result.setPage).toBe(first)
    })
})
