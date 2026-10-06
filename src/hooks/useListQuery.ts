import { useFocusEffect } from "@react-navigation/native"
import { useCallback, useEffect, useRef, useState } from "react"

import { ApiError, isAbortError, sendRaw } from "@/api/client"
import { notify } from "@/lib/notify"

/** The list state, under the web's own query param names. */
export interface ListQuery {
    page: number
    search: string
    status: string
    from: string
    to: string
    view: string
    sort: string
    /** Meetings only: the quick range on `scheduledAt` (today, last7, upcoming). */
    range: string
    /** Meetings only: 0 lead, 1 client, 2 project. */
    entityType: string
}

export type ListFilterPatch = Partial<
    Pick<ListQuery, "status" | "from" | "to" | "view" | "sort" | "range" | "entityType">
>

/** The list envelope. Meetings report `totalPages`; every other route reports `pages`. */
export interface ListEnvelope<T> {
    success: boolean
    data?: T[]
    pagination?: { page?: number; limit?: number; total?: number; pages?: number; totalPages?: number }
}

interface Options<T> {
    /** The list route, such as `/api/admin/operations/leads`. */
    path: string
    /** Rows per page. 10 unless a screen says otherwise. */
    pageSize?: number
    /** Extra query params sent as they are, such as the lead sources list's `today`. */
    extraParams?: Record<string, string>
    /** Starting filters, such as a default `view`. */
    initialQuery?: Partial<Omit<ListQuery, "page">>
    /** Reads the rows from the envelope. Defaults to `data`. */
    selectItems?: (json: ListEnvelope<T>) => T[]
}

type FetchMode = "initial" | "refresh" | "quiet" | "append"

const DEFAULT_PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300
const MIN_SEARCH_LENGTH = 2

const EMPTY_FILTERS: Omit<ListQuery, "page" | "search"> = {
    status: "",
    from: "",
    to: "",
    view: "",
    sort: "",
    range: "",
    entityType: "",
}

function buildQuery(query: ListQuery, pageSize: number, extraParams: Record<string, string> = {}): string {
    const params: [string, string][] = [
        ["page", String(query.page)],
        ["limit", String(pageSize)],
    ]
    for (const key of ["search", "status", "from", "to", "view", "sort", "range", "entityType"] as const) {
        if (query[key]) params.push([key, query[key]])
    }
    for (const [key, value] of Object.entries(extraParams)) params.push([key, value])
    return params.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&")
}

function mergeById<T extends { _id: string }>(current: T[], next: T[]): T[] {
    const seen = new Set(current.map((item) => item._id))
    return [...current, ...next.filter((item) => !seen.has(item._id))]
}

/**
 * One paged list: the query, the rows, and the four loading states. Ported from the fetch in the web's LeadsClient,
 * with page buttons replaced by load-more on scroll.
 *
 * A filter or search change starts again at page 1; a higher page appends. Every request aborts the one before it, so
 * a slow old response never overwrites a newer one. Focusing the screen again quietly reloads page 1, because tabs
 * keep screens mounted and the list may have changed elsewhere.
 */
export function useListQuery<T extends { _id: string }>(options: Options<T>) {
    const { path, pageSize = DEFAULT_PAGE_SIZE, extraParams, initialQuery, selectItems } = options

    const [query, setQuery] = useState<ListQuery>(() => ({ page: 1, search: "", ...EMPTY_FILTERS, ...initialQuery }))
    // Bumped to fetch the same query again (refresh, focus).
    const [reloadCount, setReloadCount] = useState(0)
    // How the next page-1 fetch shows itself. Read and reset by the fetch, so any other change defaults to "initial".
    const nextModeRef = useRef<FetchMode>("initial")
    const [searchText, setSearchText] = useState(query.search)

    const [items, setItems] = useState<T[]>([])
    const [envelope, setEnvelope] = useState<ListEnvelope<T> | null>(null)
    const [total, setTotal] = useState(0)
    const [pages, setPages] = useState(1)
    const [activeMode, setActiveMode] = useState<FetchMode | null>("initial")
    const [accessError, setAccessError] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Read inside the fetch without making it re-run.
    const latest = useRef({ extraParams, selectItems, items })
    latest.current = { extraParams, selectItems, items }
    const queryString = buildQuery(query, pageSize, extraParams)

    useEffect(() => {
        const controller = new AbortController()
        const mode: FetchMode = query.page > 1 ? "append" : nextModeRef.current
        nextModeRef.current = "initial"
        setActiveMode(mode)

        async function load() {
            try {
                const json = await sendRaw<ListEnvelope<T>>(`${path}?${queryString}`, "GET", undefined, {
                    signal: controller.signal,
                })
                if (controller.signal.aborted) return

                const rows = latest.current.selectItems?.(json) ?? json.data ?? []
                setItems((current) => (mode === "append" ? mergeById(current, rows) : rows))
                setEnvelope(json)
                setTotal(json.pagination?.total ?? rows.length)
                setPages(json.pagination?.totalPages ?? json.pagination?.pages ?? 1)
                setAccessError(null)
                setError(null)
            } catch (err) {
                if (isAbortError(err) || controller.signal.aborted) return
                if (err instanceof ApiError && err.status === 401) return
                if (err instanceof ApiError && err.status === 403) {
                    setAccessError(err.message)
                    setItems([])
                    setTotal(0)
                    return
                }
                const message = err instanceof Error ? err.message : "Something went wrong. Try again."
                setError(message)
                // With rows on screen, the list stays and the failure is a toast.
                if (latest.current.items.length > 0) notify.error(message)
            } finally {
                if (!controller.signal.aborted) setActiveMode(null)
            }
        }

        load()
        return () => controller.abort()
        // The query string carries every query field. reloadCount forces a reload of the same query.
    }, [path, queryString, query.page, reloadCount])

    // Stable, as the web's setPage was: callers may put it in effect dependencies.
    const setPage = useCallback((page: number) => {
        setQuery((current) => (current.page === page ? current : { ...current, page }))
    }, [])

    /** Applies filters together, back on page 1. The same values again fetch nothing. */
    const setFilters = useCallback((patch: ListFilterPatch) => {
        setQuery((current) => ({ ...current, ...patch, page: 1 }))
    }, [])

    const resetFilters = useCallback(() => {
        setQuery((current) => ({ ...current, ...EMPTY_FILTERS, ...initialQuery, page: 1 }))
        // initialQuery is the screen's constant default.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const reloadFirstPage = useCallback((mode: FetchMode) => {
        nextModeRef.current = mode
        setQuery((current) => (current.page === 1 ? current : { ...current, page: 1 }))
        setReloadCount((count) => count + 1)
    }, [])

    /** Pull-to-refresh: page 1 again, with every filter and the search kept. */
    const refresh = useCallback(() => reloadFirstPage("refresh"), [reloadFirstPage])

    /** The next page, when there is one and nothing is loading. */
    const loadMore = useCallback(() => {
        if (activeMode !== null || query.page >= pages || accessError) return
        setQuery((current) => ({ ...current, page: current.page + 1 }))
    }, [activeMode, query.page, pages, accessError])

    // Typing updates the field at once. The query follows 300 ms later, at 0 or 2+ characters, as the web SearchBar.
    useEffect(() => {
        const term = searchText.trim()
        if (term.length > 0 && term.length < MIN_SEARCH_LENGTH) return
        const handle = setTimeout(() => {
            setQuery((current) => (current.search === term ? current : { ...current, search: term, page: 1 }))
        }, SEARCH_DEBOUNCE_MS)
        return () => clearTimeout(handle)
    }, [searchText])

    // The first focus is the mount, which is already loading. Later focuses reload quietly.
    const hasFocusedRef = useRef(false)
    useFocusEffect(
        useCallback(() => {
            if (!hasFocusedRef.current) {
                hasFocusedRef.current = true
                return
            }
            reloadFirstPage("quiet")
        }, [reloadFirstPage]),
    )

    return {
        query,
        searchText,
        setSearch: setSearchText,
        setPage,
        setFilters,
        resetFilters,
        items,
        setItems,
        envelope,
        total,
        pages,
        loading: activeMode === "initial",
        refreshing: activeMode === "refresh",
        loadingMore: activeMode === "append",
        accessError,
        error,
        refresh,
        loadMore,
    }
}

export type ListQueryResult<T extends { _id: string }> = ReturnType<typeof useListQuery<T>>
