import { resolveApiUrl } from "@/api/endpoints"
import { resetToLogin } from "@/api/navigationRef"
import { notify } from "@/lib/notify"
import { clearToken, getToken } from "@/store/keychain"
import { clearAll, getActiveRegion } from "@/store/mmkv"

/**
 * The one way the app talks to the API. Ported from the web's `lead-sources/api.ts` (`send`, `ApiError`) and
 * `handleAuthError.ts` (the 401 toast). Screens never call `fetch` themselves.
 *
 * Every request carries `Authorization: Bearer <jwt>` and `X-Active-Region`, because a phone has no cookie the API
 * can rely on.
 */

/** A refused request, with the message and field the API sent. Field-for-field the web's class. */
export class ApiError extends Error {
    status: number
    field?: string
    details?: unknown

    constructor(message: string, status: number, field?: string, details?: unknown) {
        super(message)
        this.name = "ApiError"
        this.status = status
        this.field = field
        this.details = details
    }
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export interface SendOptions {
    /** Cancels the request. The promise then rejects with an AbortError, which `isAbortError` recognises. */
    signal?: AbortSignal
    /**
     * A 401 with exactly this message is an ordinary error, not the end of the session. The password route answers
     * "Old password is incorrect" with 401; that must not log the person out.
     */
    keepSessionOn401Message?: string
}

/** The fields every route's JSON can carry. `sendRaw` callers extend it with their own extras. */
export interface ApiEnvelope<T = unknown> {
    success: boolean
    data?: T
    message?: string
    field?: string
    details?: unknown
}

interface ErrorBody {
    success?: boolean
    message?: string
    /** The quotations route reports failures here instead of in `message`. */
    error?: string
    field?: string
    details?: unknown
}

const AUTH_TOAST_ID = "auth-401"
const SESSION_EXPIRED_MESSAGE = "Session expired. Please log in again."
const FORBIDDEN_MESSAGE = "You aren't authorized to perform this action."
const FALLBACK_MESSAGE = "Something went wrong. Try again."
const NETWORK_MESSAGE = "No connection. Check your network and try again."

const HTTP_UNAUTHORIZED = 401
const HTTP_FORBIDDEN = 403
/** The status an ApiError carries when the request never reached the server. */
export const NETWORK_ERROR_STATUS = 0

let unauthorizedListener: (() => void) | null = null

/** AuthContext registers here, so a 401 anywhere also clears the signed-in user. */
export function setUnauthorizedListener(listener: (() => void) | null): void {
    unauthorizedListener = listener
}

/** True for a request cancelled through its AbortSignal. Callers ignore these. */
export function isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === "AbortError"
}

/** True when the request never reached the server. */
export function isNetworkError(error: unknown): boolean {
    return error instanceof ApiError && error.status === NETWORK_ERROR_STATUS
}

function isFormData(body: unknown): body is FormData {
    return typeof FormData !== "undefined" && body instanceof FormData
}

function getFallbackMessage(status: number): string {
    if (status === HTTP_UNAUTHORIZED) return SESSION_EXPIRED_MESSAGE
    if (status === HTTP_FORBIDDEN) return FORBIDDEN_MESSAGE
    return FALLBACK_MESSAGE
}

function buildHeaders(token: string | null, hasJsonBody: boolean): Record<string, string> {
    const headers: Record<string, string> = { Accept: "application/json" }
    // FormData gets no Content-Type: fetch writes it with the multipart boundary.
    if (hasJsonBody) headers["Content-Type"] = "application/json"
    if (token) headers.Authorization = `Bearer ${token}`
    const region = getActiveRegion()
    if (region) headers["X-Active-Region"] = region
    return headers
}

async function handleUnauthorized(message: string | undefined): Promise<void> {
    // 1. Tell the person once. Parallel 401s share the id, so they show one toast.
    notify.error(message || SESSION_EXPIRED_MESSAGE, { id: AUTH_TOAST_ID })

    // 2. Forget the session. The token leaves memory at once, so requests still in flight cannot repeat this.
    const cleared = clearToken()
    clearAll()
    unauthorizedListener?.()

    // 3. Back to Login, replacing the web's window.location.href.
    resetToLogin()
    await cleared
}

async function request<T>(path: string, method: HttpMethod, body: unknown, options: SendOptions): Promise<T> {
    const isForm = isFormData(body)
    const hasBody = body !== undefined
    const token = getToken()

    let res: Response
    try {
        res = await fetch(resolveApiUrl(path), {
            method,
            headers: buildHeaders(token, hasBody && !isForm),
            body: !hasBody ? undefined : isForm ? body : JSON.stringify(body),
            signal: options.signal,
        })
    } catch (error) {
        if (isAbortError(error)) throw error
        throw new ApiError(NETWORK_MESSAGE, NETWORK_ERROR_STATUS)
    }

    const json = (await res.json().catch(() => null)) as (ErrorBody & T) | null
    return readApiResult<T>(res.status, json, token, options.keepSessionOn401Message)
}

/**
 * The response rules every request follows: a 401 for the current token ends the session, and anything but success
 * throws ApiError with the server's message. Exported for the react-native-blob-util upload, which cannot use fetch
 * because it needs upload progress.
 */
export async function readApiResult<T>(
    status: number,
    json: unknown,
    token: string | null,
    keepSessionOn401Message?: string,
): Promise<T> {
    const body = json as (ErrorBody & T) | null
    const isExpected401 = keepSessionOn401Message !== undefined && body?.message === keepSessionOn401Message

    // Only a request that carried the current token can end the session. A login attempt has no token, so its
    // 401 "Invalid credentials" is just an error. A late 401 for a token already replaced is ignored.
    if (status === HTTP_UNAUTHORIZED && !isExpected401 && token !== null && getToken() === token) {
        await handleUnauthorized(body?.message)
    }

    const isOk = status >= 200 && status < 300
    if (!isOk || !body?.success) {
        throw new ApiError(
            body?.message || body?.error || getFallbackMessage(status),
            status,
            body?.field,
            body?.details,
        )
    }

    return body
}

/** The token and region headers, for requests that do not go through fetch (uploads and file downloads). */
export function getApiHeaders(): { token: string | null; headers: Record<string, string> } {
    const token = getToken()
    const headers = buildHeaders(token, false)
    delete headers.Accept
    return { token, headers }
}

/**
 * Sends a request and returns `data`.
 *
 * Throws ApiError with the server's message for anything but success, so the caller can show it as it is. A 401 for
 * the signed-in session also clears it and sends the person to Login.
 */
export async function send<T>(path: string, method: HttpMethod, body?: unknown, options: SendOptions = {}): Promise<T> {
    const json = await request<ApiEnvelope<T>>(path, method, body, options)
    return json.data as T
}

/**
 * Sends a request and returns the whole JSON body, for routes that put more than `data` at the top level:
 * `pagination`, the lead-sources list's `counts` and `progress`, notifications' `unseen` and `unread`, and the
 * timeline routes' `interactions`. Errors behave as in `send`.
 */
export async function sendRaw<T extends object>(
    path: string,
    method: HttpMethod,
    body?: unknown,
    options: SendOptions = {},
): Promise<T> {
    return request<T>(path, method, body, options)
}
