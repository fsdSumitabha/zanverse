import { useFocusEffect } from "@react-navigation/native"
import { useCallback, useEffect, useRef, useState } from "react"
import { AppState } from "react-native"

import { ApiError, sendRaw } from "@/api/client"
import { LEAD_SOURCES_API } from "@/api/endpoints"
import { todayString } from "@/lib/leadSourceDay"
import { notify } from "@/lib/notify"
import type { LeadSourceCounts, LeadSourceListResponse, LeadSourceRow, LeadSourceView } from "@/types/leadSource"

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

type FetchMode = "initial" | "refresh" | "quiet" | "append"

export const LEAD_SOURCE_PAGE_SIZE = 50
// The list route's own cap (MAX_LIMIT in the web's listQuery.ts).
const MAX_LIMIT = 100
/** How often the list quietly reloads, so a callback that falls due moves to the top. */
const REFRESH_MS = 60_000
/** The pause after a write before the quiet reload that re-sorts the row and refreshes the counts. */
const RESORT_DELAY_MS = 900
const SEARCH_DEBOUNCE_MS = 300
const MIN_SEARCH_LENGTH = 2

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

/**
 * The lead sources list: one owner for the rows, `counts`, `progress` and paging. Ported from the web's
 * LeadSourcesClient: the request id that drops an out-of-order answer, the row swapped in place after a write and
 * re-sorted 900 ms later, and the quiet reload every minute that never runs while the person is busy.
 */
export function useLeadSourceList({ isPaused }: { isPaused: boolean }) {
    const [filters, setFiltersState] = useState<LeadSourceFilters>(EMPTY_LEAD_SOURCE_FILTERS)
    const [searchText, setSearchText] = useState("")
    const [rows, setRows] = useState<LeadSourceRow[]>([])
    const [counts, setCounts] = useState<LeadSourceCounts | null>(null)
    const [progress, setProgress] = useState<{ total: number; worked: number } | null>(null)
    const [total, setTotal] = useState(0)
    const [mode, setMode] = useState<FetchMode | null>("initial")
    const [accessError, setAccessError] = useState<string | null>(null)

    const requestId = useRef(0)
    const latest = useRef({ filters, rows, isPaused })
    latest.current = { filters, rows, isPaused }
    const menusOpen = useRef(0)
    const resortTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const isMounted = useRef(true)

    const load = useCallback(async (fetchMode: FetchMode) => {
        const id = ++requestId.current
        const current = latest.current
        // Append asks for the next page of 50. A quiet reload re-reads what is on screen, up to the route's cap.
        const page = fetchMode === "append" ? Math.floor(current.rows.length / LEAD_SOURCE_PAGE_SIZE) + 1 : 1
        const limit =
            fetchMode === "quiet"
                ? Math.min(MAX_LIMIT, Math.max(LEAD_SOURCE_PAGE_SIZE, current.rows.length))
                : LEAD_SOURCE_PAGE_SIZE
        if (fetchMode !== "quiet") setMode(fetchMode)

        try {
            const query = buildLeadSourceQuery(current.filters, page, limit, todayString())
            const json = await sendRaw<LeadSourceListResponse>(`${LEAD_SOURCES_API}?${query}`, "GET")
            if (!isMounted.current || id !== requestId.current) return

            setAccessError(null)
            setRows((list) =>
                fetchMode === "append"
                    ? [...list, ...json.data.filter((row) => !list.some((r) => r._id === row._id))]
                    : json.data,
            )
            setCounts(json.counts)
            setProgress(json.progress)
            setTotal(json.pagination.total)
        } catch (error) {
            if (!isMounted.current || id !== requestId.current) return
            if (error instanceof ApiError && error.status === 401) return
            if (error instanceof ApiError && error.status === 403) {
                setAccessError(error.message)
                setRows([])
                return
            }
            if (fetchMode !== "quiet")
                notify.error(error instanceof Error ? error.message : "Failed to load lead sources")
        } finally {
            // Whichever request is newest ends the loading state, quiet or not.
            if (isMounted.current && id === requestId.current) setMode(null)
        }
    }, [])

    // A new filter is a new list. A re-sort still waiting from the old list is not needed.
    const filtersKey = JSON.stringify(filters)
    useEffect(() => {
        if (resortTimer.current) clearTimeout(resortTimer.current)
        load("initial")
    }, [filtersKey, load])

    useEffect(() => {
        isMounted.current = true
        return () => {
            isMounted.current = false
            if (resortTimer.current) clearTimeout(resortTimer.current)
        }
    }, [])

    // Typing updates the box at once. The search follows 300 ms later, at 0 or 2+ characters.
    useEffect(() => {
        const term = searchText.trim()
        if (term.length > 0 && term.length < MIN_SEARCH_LENGTH) return
        const handle = setTimeout(() => {
            setFiltersState((current) => (current.search === term ? current : { ...current, search: term }))
        }, SEARCH_DEBOUNCE_MS)
        return () => clearTimeout(handle)
    }, [searchText])

    const reloadQuietly = useCallback(() => {
        if (latest.current.isPaused || menusOpen.current > 0) return
        load("quiet")
    }, [load])

    // Every minute while the app is in front, and at once when it comes back from the background.
    useEffect(() => {
        const timer = setInterval(() => {
            if (AppState.currentState === "active") reloadQuietly()
        }, REFRESH_MS)
        let previous = AppState.currentState
        const subscription = AppState.addEventListener("change", (next) => {
            if (next === "active" && previous !== "active") reloadQuietly()
            previous = next
        })
        return () => {
            clearInterval(timer)
            subscription.remove()
        }
    }, [reloadQuietly])

    // Tabs keep the screen mounted. Coming back to the tab reloads quietly; the first focus is the mount.
    const hasFocused = useRef(false)
    useFocusEffect(
        useCallback(() => {
            if (!hasFocused.current) {
                hasFocused.current = true
                return
            }
            reloadQuietly()
        }, [reloadQuietly]),
    )

    /** Applies a filter change, back on page 1. */
    const setFilters = useCallback((patch: Partial<LeadSourceFilters>) => {
        setFiltersState((current) => ({ ...current, ...patch }))
    }, [])

    /** Swaps a changed row in at once, keeping its section, then reloads quietly so it moves to where it belongs. */
    const onUpdated = useCallback(
        (row: LeadSourceRow) => {
            setRows((list) => list.map((r) => (r._id === row._id ? { ...r, ...row, section: r.section } : r)))
            if (resortTimer.current) clearTimeout(resortTimer.current)
            resortTimer.current = setTimeout(() => load("quiet"), RESORT_DELAY_MS)
        },
        [load],
    )

    /** For menus inside rows: the poll waits while any is open. */
    const onMenuOpenChange = useCallback((open: boolean) => {
        menusOpen.current = Math.max(0, menusOpen.current + (open ? 1 : -1))
    }, [])

    const hasMore = rows.length < total
    const loadMore = useCallback(() => {
        if (mode !== null || !hasMore || accessError) return
        load("append")
    }, [mode, hasMore, accessError, load])

    return {
        filters,
        setFilters,
        searchText,
        setSearch: setSearchText,
        rows,
        counts,
        progress,
        total,
        hasMore,
        loading: mode === "initial",
        refreshing: mode === "refresh",
        loadingMore: mode === "append",
        accessError,
        refresh: useCallback(() => load("refresh"), [load]),
        reloadNow: useCallback(() => load("quiet"), [load]),
        loadMore,
        onUpdated,
        onMenuOpenChange,
    }
}

export type LeadSourceList = ReturnType<typeof useLeadSourceList>
