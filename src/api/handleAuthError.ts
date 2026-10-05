import { ApiError } from "@/api/client"

const HTTP_UNAUTHORIZED = 401
const HTTP_FORBIDDEN = 403

/**
 * Shared 401/403 handling for a screen's catch block. Ported from the web's `handleAuthError.ts`.
 *
 * - **401**: `client.ts` has already shown the "auth-401" toast and gone to Login. Nothing is left to do here.
 * - **403**: the person is signed in but lacks the role. The screen renders `AccessDenied` with the server's message,
 *   passed through `onForbidden`.
 *
 * Returns `true` when the error was one of these, so the caller early-returns. Otherwise `false`, and the caller shows
 * the error its usual way.
 */
export function handleAuthError(error: unknown, onForbidden: (message: string) => void): boolean {
    if (!(error instanceof ApiError)) return false
    if (error.status === HTTP_UNAUTHORIZED) return true
    if (error.status === HTTP_FORBIDDEN) {
        onForbidden(error.message)
        return true
    }
    return false
}
