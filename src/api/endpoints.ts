/**
 * Where the API lives, and the paths the app calls.
 *
 * The web app calls same-origin paths like "/api/auth/me". A phone has no origin, so every path is joined to
 * API_BASE_URL by `src/api/client.ts`. No env loader is installed, so the value lives here. `.env.example` records it.
 */

// The Android emulator reaches the dev machine's localhost at 10.0.2.2. A physical device needs the machine's LAN
// address instead. Session 22 points release builds at the production HTTPS host.
export const API_BASE_URL = "http://10.0.2.2:3000"

export const AUTH_API = {
    LOGIN: "/api/auth/login",
    ME: "/api/auth/me",
    LOGOUT: "/api/auth/logout",
    REGION: "/api/auth/region",
    PROFILE: "/api/auth/profile",
    PROFILE_AVATAR: "/api/auth/profile/avatar",
    PROFILE_PASSWORD: "/api/auth/profile/password",
} as const

export const OPERATIONS_API = "/api/admin/operations"

export const DASHBOARD_API = OPERATIONS_API
export const STATS_API = `${OPERATIONS_API}/stats`
export const SEARCH_API = `${OPERATIONS_API}/search`
export const OVERALL_STATS_API = `${OPERATIONS_API}/overall-stats`
export const MEETINGS_API = `${OPERATIONS_API}/meetings`
export const ACTIVITY_LOGS_API = `${OPERATIONS_API}/activity-logs`

// As the web's lead-sources/api.ts has it.
export const LEAD_SOURCES_API = "/api/admin/operations/lead-sources"
export const LEAD_SOURCE_UPLOADS_API = `${LEAD_SOURCES_API}/uploads`
export const LEAD_SOURCE_TEMPLATE_API = `${LEAD_SOURCES_API}/template`
/** Not on the dev API yet: BACKEND_CHANGES.md item 6. The upload screen falls back on a 404. */
export const LEAD_SOURCE_COLUMNS_API = `${LEAD_SOURCES_API}/columns`

export const NOTIFICATIONS_API = {
    FEED: "/api/notifications",
    READ_ALL: "/api/notifications/read-all",
    SEEN: "/api/notifications/seen",
    /** `PATCH` marks one row read. */
    read: (id: string) => `/api/notifications/${id}/read`,
} as const

/** Joins a path to the API base URL. An absolute URL is returned as it is. */
export function resolveApiUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) return path
    return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`
}
