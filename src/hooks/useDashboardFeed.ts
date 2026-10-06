import { useCallback, useEffect, useRef, useState } from "react"

import { ApiError, sendRaw } from "@/api/client"
import { DASHBOARD_API } from "@/api/endpoints"
import { notify } from "@/lib/notify"

/** One feed row: a lead, client or project with its latest interaction. The route's own normalized shape. */
export interface FeedItem {
    _id: string
    entityType: number
    name?: string
    title?: string
    company?: string
    companyName?: string
    phone?: string | null
    email?: string | null
    source?: string
    status?: number
    description?: string
    lastInteractionAt?: string
    lastInteraction?: { _id?: string; type: number; title: string; createdAt: string; description?: string } | null
}

interface FeedResponse {
    success: boolean
    data?: FeedItem[]
    pagination?: { page: number; limit: number; total: number; pages: number }
}

type FetchMode = "initial" | "refresh" | "append"

const PAGE_SIZE = 20
const ERROR_TOAST_ID = "dashboard-feed"

/**
 * The dashboard feed, 20 rows at a time. With the backend change (BACKEND_CHANGES "paginate the dashboard feed") the
 * route answers `?page&limit` with `pagination`; without it the route returns every row, and the hook keeps them all
 * and shows them 20 at a time behind the same `loadMore`.
 */
export function useDashboardFeed() {
    const [items, setItems] = useState<FeedItem[]>([])
    const [allRows, setAllRows] = useState<FeedItem[] | null>(null)
    const [shownCount, setShownCount] = useState(PAGE_SIZE)
    const [page, setPage] = useState(1)
    const [pages, setPages] = useState(1)
    const [mode, setMode] = useState<FetchMode | null>("initial")
    const [error, setError] = useState<string | null>(null)
    const [accessError, setAccessError] = useState<string | null>(null)
    const requestId = useRef(0)
    const failedRequest = useRef<{ mode: FetchMode; page: number }>({ mode: "initial", page: 1 })

    const load = useCallback(async (fetchMode: FetchMode, nextPage: number) => {
        const id = ++requestId.current
        setMode(fetchMode)
        try {
            const json = await sendRaw<FeedResponse>(`${DASHBOARD_API}?page=${nextPage}&limit=${PAGE_SIZE}`, "GET")
            if (id !== requestId.current) return
            if (!Array.isArray(json.data)) throw new Error("Invalid API response")
            const rows = json.data
            setError(null)
            setAccessError(null)
            if (json.pagination) {
                setAllRows(null)
                setPage(nextPage)
                setPages(json.pagination.pages)
                setItems((current) => {
                    if (fetchMode !== "append") return rows
                    const seen = new Set(current.map((row) => `${row.entityType}-${row._id}`))
                    return [...current, ...rows.filter((row) => !seen.has(`${row.entityType}-${row._id}`))]
                })
            } else {
                // The route sent everything: page it here.
                setAllRows(rows)
                setShownCount(PAGE_SIZE)
                setItems(rows.slice(0, PAGE_SIZE))
            }
        } catch (caught) {
            if (id !== requestId.current) return
            if (caught instanceof ApiError && caught.status === 401) return
            if (caught instanceof ApiError && caught.status === 403) {
                setAccessError(caught.message)
                return
            }
            failedRequest.current = { mode: fetchMode, page: nextPage }
            setError(caught instanceof Error ? caught.message : "Something went wrong")
            notify.error("Failed to load operations data", { id: ERROR_TOAST_ID })
        } finally {
            if (id === requestId.current) setMode(null)
        }
    }, [])

    useEffect(() => {
        load("initial", 1)
    }, [load])

    const refresh = useCallback(() => load("refresh", 1), [load])

    // Repeats the request that failed: the first load, a refresh or the next page.
    const retry = useCallback(() => load(failedRequest.current.mode, failedRequest.current.page), [load])

    const loadMore = useCallback(() => {
        if (mode !== null || error) return
        if (allRows) {
            if (shownCount >= allRows.length) return
            const next = shownCount + PAGE_SIZE
            setShownCount(next)
            setItems(allRows.slice(0, next))
            return
        }
        if (page < pages) load("append", page + 1)
    }, [mode, error, allRows, shownCount, page, pages, load])

    return {
        items,
        loading: mode === "initial",
        refreshing: mode === "refresh",
        loadingMore: mode === "append",
        error,
        accessError,
        refresh,
        retry,
        loadMore,
    }
}
