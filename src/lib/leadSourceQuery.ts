import type { LeadSourceView } from "@/types/leadSource"

export type LeadSourceTab = Exclude<LeadSourceView, "day">

/** The list's filters, under the web's query param names. `day` set means the "day" pseudo-view. */
export interface LeadSourceFilters {
    view: LeadSourceTab
    status: string
    assignee: string
    upload: string
    day: string
    search: string
}

export const EMPTY_LEAD_SOURCE_FILTERS: LeadSourceFilters = {
    view: "today",
    status: "",
    assignee: "",
    upload: "",
    day: "",
    search: "",
}

/** The query string the web's LeadSourcesClient builds, in its order. `today` is the device's local day now. */
export function buildLeadSourceQuery(filters: LeadSourceFilters, page: number, limit: number, today: string): string {
    const params: [string, string][] = [
        ["view", filters.day ? "all" : filters.view],
        ["today", today],
        ["page", String(page)],
        ["limit", String(limit)],
    ]
    if (filters.search) params.push(["search", filters.search])
    for (const key of ["status", "assignee", "day", "upload"] as const) {
        if (filters[key]) params.push([key, filters[key]])
    }
    return params.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&")
}

/** True for the plain Today tab: no search, no filter, no day. Only that page 1 is ever cached. */
export function isPlainToday(filters: LeadSourceFilters): boolean {
    return (
        filters.view === "today" &&
        !filters.search &&
        !filters.status &&
        !filters.assignee &&
        !filters.upload &&
        !filters.day
    )
}
