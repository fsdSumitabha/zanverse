import { useCallback, useEffect, useRef, useState } from "react"

import { sendRaw } from "@/api/client"
import { NOTIFICATIONS_API } from "@/api/endpoints"
import { notify } from "@/lib/notify"
import type { NotificationFeed, NotificationRow } from "@/types/notification"

export type NotificationFilter = "all" | "unread"

type FetchMode = "initial" | "refresh" | "append"

// The web's page size and flag, exactly.
const PAGE_SIZE = 15
const READ_ALL_TOAST_ID = "notifications-read-all"

function buildFeedPath(filter: NotificationFilter, cursor: string | null): string {
    const cursorParam = cursor ? `&before=${cursor}` : ""
    const unreadParam = filter === "unread" ? "&unread=true" : ""
    return `${NOTIFICATIONS_API.FEED}?limit=${PAGE_SIZE}${cursorParam}${unreadParam}`
}

/**
 * The notifications inbox: cursor pages of 15, newest first. Scrolling appends the next older page; a new filter or
 * pull-to-refresh starts again. Marking read is optimistic and fire-and-forget, as on the web's page.
 */
export function useNotificationFeed() {
    const [filter, setFilter] = useState<NotificationFilter>("all")
    const [rows, setRows] = useState<NotificationRow[]>([])
    const [unread, setUnread] = useState(0)
    const [total, setTotal] = useState(0)
    const [nextCursor, setNextCursor] = useState<string | null>(null)
    const [mode, setMode] = useState<FetchMode | null>("initial")
    const requestId = useRef(0)
    const rowsRef = useRef(rows)
    rowsRef.current = rows

    const load = useCallback(
        async (fetchMode: FetchMode, cursor: string | null) => {
            const id = ++requestId.current
            setMode(fetchMode)
            try {
                const json = await sendRaw<NotificationFeed>(buildFeedPath(filter, cursor), "GET")
                if (id !== requestId.current) return
                const page = json.data ?? []
                setRows((current) => {
                    if (fetchMode !== "append") return page
                    const seen = new Set(current.map((row) => row._id))
                    return [...current, ...page.filter((row) => !seen.has(row._id))]
                })
                setUnread(json.unread ?? 0)
                setTotal(json.total ?? 0)
                setNextCursor(json.nextCursor ?? null)
            } catch {
                // Silent, as on the web. The 401 path inside client.ts still runs.
            } finally {
                if (id === requestId.current) setMode(null)
            }
        },
        [filter],
    )

    useEffect(() => {
        load("initial", null)
    }, [load])

    const refresh = useCallback(() => load("refresh", null), [load])

    const loadMore = useCallback(() => {
        if (mode !== null || !nextCursor) return
        load("append", nextCursor)
    }, [mode, nextCursor, load])

    /**
     * Marks one row read at once, then tells the server without waiting. A row already read changes nothing, so a tap
     * that only opens a read row does not lower the count (the web's page lowers it anyway).
     */
    const markOneRead = useCallback((id: string) => {
        const row = rowsRef.current.find((candidate) => candidate._id === id)
        if (!row || row.readAt) return
        const readAt = new Date().toISOString()
        setRows((current) => current.map((candidate) => (candidate._id === id ? { ...candidate, readAt } : candidate)))
        setUnread((count) => Math.max(0, count - 1))
        sendRaw(NOTIFICATIONS_API.read(id), "PATCH").catch(() => undefined)
    }, [])

    const markAllRead = useCallback(async () => {
        const now = new Date().toISOString()
        setRows((current) => current.map((row) => ({ ...row, readAt: row.readAt ?? now })))
        setUnread(0)
        try {
            await sendRaw(NOTIFICATIONS_API.READ_ALL, "PATCH")
            notify.success("All notifications marked as read", { id: READ_ALL_TOAST_ID })
        } catch {
            notify.error("Failed to mark all read", { id: READ_ALL_TOAST_ID })
        }
    }, [])

    return {
        filter,
        setFilter,
        rows,
        unread,
        total,
        nextCursor,
        loading: mode === "initial",
        refreshing: mode === "refresh",
        loadingMore: mode === "append",
        refresh,
        loadMore,
        markOneRead,
        markAllRead,
    }
}
