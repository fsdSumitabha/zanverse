import NetInfo from "@react-native-community/netinfo"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { AppState } from "react-native"

import { sendRaw } from "@/api/client"
import { NOTIFICATIONS_API } from "@/api/endpoints"
import type { NotificationFeed, NotificationRow } from "@/types/notification"

interface NotificationState {
    unseen: number
    unread: number
    /** The four newest rows, as the web's bell holds them. */
    rows: NotificationRow[]
    refreshBadge: () => void
    /** Zeroes the unseen count at once and tells the server, as opening the web's bell does. */
    markSeen: () => void
}

/** How often the bell refreshes while the app is in front: the web's 30 s, or 60 s on mobile data when idle. */
export const POLL_MS = 30_000
export const CELLULAR_IDLE_POLL_MS = 60_000
const BELL_LIMIT = 4

const NotificationContext = createContext<NotificationState | null>(null)

function getFeedKey(json: NotificationFeed): string {
    return `${json.unseen ?? 0}:${json.unread ?? 0}:${json.data?.[0]?._id ?? ""}`
}

/**
 * The bell's counts for every screen. Ported from the poll in the web's NotificationBell.tsx, gated on AppState: it
 * polls only while the app is in front, stops in the background, and fetches once at once on coming back.
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
    const [unseen, setUnseen] = useState(0)
    const [unread, setUnread] = useState(0)
    const [rows, setRows] = useState<NotificationRow[]>([])
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastKeyRef = useRef<string | null>(null)
    const isCellularRef = useRef(false)
    const isMountedRef = useRef(true)

    const stop = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = null
    }, [])

    const poll = useCallback(async () => {
        stop()
        let hasChanged = true
        try {
            const json = await sendRaw<NotificationFeed>(`${NOTIFICATIONS_API.FEED}?limit=${BELL_LIMIT}`, "GET")
            if (!isMountedRef.current) return
            const key = getFeedKey(json)
            hasChanged = key !== lastKeyRef.current
            lastKeyRef.current = key
            setRows(json.data ?? [])
            setUnseen(json.unseen ?? 0)
            setUnread(json.unread ?? 0)
        } catch {
            // Silent, as on the web.
        }
        if (!isMountedRef.current || AppState.currentState !== "active") return
        // On mobile data, a quiet feed is checked half as often.
        const delay = isCellularRef.current && !hasChanged ? CELLULAR_IDLE_POLL_MS : POLL_MS
        timerRef.current = setTimeout(poll, delay)
    }, [stop])

    useEffect(() => {
        isMountedRef.current = true
        const netSubscription = NetInfo.addEventListener((state) => {
            isCellularRef.current = state.type === "cellular"
        })
        let previous = AppState.currentState
        const appSubscription = AppState.addEventListener("change", (next) => {
            if (next === "active" && previous !== "active") poll()
            if (next !== "active") stop()
            previous = next
        })
        poll()
        return () => {
            isMountedRef.current = false
            stop()
            netSubscription()
            appSubscription.remove()
        }
    }, [poll, stop])

    const markSeen = useCallback(() => {
        setUnseen(0)
        sendRaw(NOTIFICATIONS_API.SEEN, "PATCH").catch(() => undefined)
    }, [])

    const value = useMemo(
        () => ({ unseen, unread, rows, refreshBadge: poll, markSeen }),
        [unseen, unread, rows, poll, markSeen],
    )

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

/** The bell's counts. Inside the signed-in app only. */
export function useNotifications(): NotificationState {
    const state = useContext(NotificationContext)
    if (!state) throw new Error("useNotifications must be used inside NotificationProvider")
    return state
}
