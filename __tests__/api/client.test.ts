import { API_BASE_URL } from "@/api/endpoints"
import { ApiError, isNetworkError, send, sendRaw } from "@/api/client"
import { handleAuthError } from "@/api/handleAuthError"
import { resetToLogin } from "@/api/navigationRef"
import { notify } from "@/lib/notify"
import { clearToken, getToken, loadToken, saveToken } from "@/store/keychain"
import { getActiveRegion, getCachedMe, saveActiveRegion, saveCachedMe } from "@/store/mmkv"

jest.mock("@/api/navigationRef", () => ({ resetToLogin: jest.fn() }))
jest.mock("@/lib/notify", () => ({
    notify: { error: jest.fn(), success: jest.fn(), info: jest.fn(), warning: jest.fn(), dismiss: jest.fn() },
}))

interface MockResponse {
    status: number
    ok: boolean
    json: () => Promise<unknown>
}

const fetchMock = jest.fn<Promise<MockResponse>, [string, RequestInit]>()

function respond(status: number, body: unknown): MockResponse {
    return { status, ok: status >= 200 && status < 300, json: () => Promise.resolve(body) }
}

function getSentHeaders(call = 0): Record<string, string> {
    return fetchMock.mock.calls[call][1].headers as Record<string, string>
}

const ME = {
    id: "u1",
    name: "Priya",
    email: "priya@zan.test",
    role: 60 as const,
    regions: ["IN" as const],
    activeRegion: "IN" as const,
}

beforeEach(async () => {
    jest.clearAllMocks()
    globalThis.fetch = fetchMock as unknown as typeof fetch
    await saveToken("jwt-1")
    saveActiveRegion("US")
})

describe("send", () => {
    it("returns data and sends the Bearer token and the active region", async () => {
        fetchMock.mockResolvedValueOnce(respond(200, { success: true, data: { id: "l1" } }))

        await expect(send("/api/admin/operations/leads/l1", "GET")).resolves.toEqual({ id: "l1" })

        expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE_URL}/api/admin/operations/leads/l1`)
        expect(getSentHeaders()).toMatchObject({ Authorization: "Bearer jwt-1", "X-Active-Region": "US" })
        expect(getSentHeaders()["Content-Type"]).toBeUndefined()
    })

    it("sends a JSON body with the JSON content type", async () => {
        fetchMock.mockResolvedValueOnce(respond(200, { success: true, data: null }))

        await send("/api/auth/region", "POST", { region: "IN" })

        expect(getSentHeaders()["Content-Type"]).toBe("application/json")
        expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify({ region: "IN" }))
    })

    it("clears the token and the cache and resets to Login once on a 401", async () => {
        saveCachedMe(ME)
        fetchMock.mockResolvedValue(respond(401, { success: false, message: "Token expired" }))

        const results = await Promise.allSettled([
            send("/api/admin/operations/leads", "GET"),
            send("/api/admin/operations/clients", "GET"),
        ])

        expect(results.map((result) => result.status)).toEqual(["rejected", "rejected"])
        expect(getToken()).toBeNull()
        await expect(loadToken()).resolves.toBeNull()
        expect(getCachedMe()).toBeNull()
        expect(getActiveRegion()).toBeNull()
        expect(resetToLogin).toHaveBeenCalledTimes(1)
        expect(notify.error).toHaveBeenCalledWith("Token expired", { id: "auth-401" })
    })

    it("shows the session expired line when a 401 has no message", async () => {
        fetchMock.mockResolvedValueOnce(respond(401, null))

        await expect(send("/api/admin/operations", "GET")).rejects.toMatchObject({
            status: 401,
            message: "Session expired. Please log in again.",
        })
        expect(notify.error).toHaveBeenCalledWith("Session expired. Please log in again.", { id: "auth-401" })
    })

    it("treats a 401 with no token, like a wrong password, as a plain error", async () => {
        await clearToken()
        fetchMock.mockResolvedValueOnce(respond(401, { success: false, message: "Invalid credentials" }))

        await expect(send("/api/auth/login", "POST", { email: "a@b.c", password: "x" })).rejects.toMatchObject({
            status: 401,
            message: "Invalid credentials",
        })
        expect(resetToLogin).not.toHaveBeenCalled()
        expect(notify.error).not.toHaveBeenCalled()
    })

    it("turns a field error into an ApiError carrying the field", async () => {
        fetchMock.mockResolvedValueOnce(
            respond(409, { success: false, message: "A lead with this phone already exists", field: "phone" }),
        )

        const error = await send("/api/admin/operations/leads", "POST", { phone: "1" }).catch((e: unknown) => e)

        expect(error).toBeInstanceOf(ApiError)
        expect(error).toMatchObject({ status: 409, field: "phone", message: "A lead with this phone already exists" })
        expect(resetToLogin).not.toHaveBeenCalled()
    })

    it("reads the quotations route's error field", async () => {
        fetchMock.mockResolvedValueOnce(respond(400, { success: false, error: "Amount is required" }))

        await expect(send("/api/admin/operations/quotations", "POST", {})).rejects.toMatchObject({
            message: "Amount is required",
        })
    })

    it("rejects a 200 whose body says success false", async () => {
        fetchMock.mockResolvedValueOnce(respond(200, { success: false, message: "Not saved" }))

        await expect(send("/x", "GET")).rejects.toMatchObject({ status: 200, message: "Not saved" })
    })

    it("sends FormData with no Content-Type header", async () => {
        fetchMock.mockResolvedValueOnce(respond(200, { success: true, data: { id: "c1" } }))
        const form = new FormData()
        form.append("notes", "Called back")

        await send("/api/admin/operations/calls", "POST", form)

        const init = fetchMock.mock.calls[0][1]
        expect(init.body).toBe(form)
        expect(getSentHeaders()["Content-Type"]).toBeUndefined()
        expect(getSentHeaders().Authorization).toBe("Bearer jwt-1")
    })

    it("passes the AbortSignal through and lets an AbortError reject as it is", async () => {
        const controller = new AbortController()
        const abortError = Object.assign(new Error("Aborted"), { name: "AbortError" })
        fetchMock.mockRejectedValueOnce(abortError)

        await expect(send("/x", "GET", undefined, { signal: controller.signal })).rejects.toBe(abortError)
        expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal)
    })

    it("turns a failed connection into a network ApiError", async () => {
        fetchMock.mockRejectedValueOnce(new TypeError("Network request failed"))

        const error = await send("/x", "GET").catch((e: unknown) => e)

        expect(isNetworkError(error)).toBe(true)
    })

    it("sends no region header when no region is stored", async () => {
        saveActiveRegion(null)
        fetchMock.mockResolvedValueOnce(respond(200, { success: true, data: null }))

        await send("/api/auth/me", "GET")

        expect(getSentHeaders()["X-Active-Region"]).toBeUndefined()
    })
})

describe("sendRaw", () => {
    it("returns the whole envelope, counts and progress included", async () => {
        const body = {
            success: true,
            data: [{ _id: "s1" }],
            pagination: { page: 1, limit: 20, total: 1, pages: 1 },
            counts: { 10: 4, 20: 1 },
            progress: { done: 1, total: 5 },
        }
        fetchMock.mockResolvedValueOnce(respond(200, body))

        const json = await sendRaw<typeof body>("/api/admin/operations/lead-sources", "GET")

        expect(json.counts).toEqual({ 10: 4, 20: 1 })
        expect(json.progress).toEqual({ done: 1, total: 5 })
    })
})

describe("handleAuthError", () => {
    it("forwards a 403 message and reports it handled", () => {
        const onForbidden = jest.fn()

        expect(handleAuthError(new ApiError("Admins only", 403), onForbidden)).toBe(true)
        expect(onForbidden).toHaveBeenCalledWith("Admins only")
    })

    it("reports a 401 handled without calling onForbidden", () => {
        const onForbidden = jest.fn()

        expect(handleAuthError(new ApiError("Session expired", 401), onForbidden)).toBe(true)
        expect(onForbidden).not.toHaveBeenCalled()
    })

    it("leaves other errors to the caller", () => {
        const onForbidden = jest.fn()

        expect(handleAuthError(new ApiError("Not found", 404), onForbidden)).toBe(false)
        expect(handleAuthError(new Error("boom"), onForbidden)).toBe(false)
        expect(onForbidden).not.toHaveBeenCalled()
    })
})
