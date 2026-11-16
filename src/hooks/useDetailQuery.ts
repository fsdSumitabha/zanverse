import { useFocusEffect } from "@react-navigation/native"
import { useCallback, useEffect, useRef, useState } from "react"

import { ApiError, isAbortError, send } from "@/api/client"

type FetchMode = "initial" | "refresh" | "quiet"

/**
 * One record for a detail screen: `GET path` → `data`, with the four states a screen needs. Ported from the fetch in
 * the web's detail pages.
 *
 * - `loading` on the first fetch, `refreshing` on pull-to-refresh, nothing on a reload after focus.
 * - `accessError` holds the server's 403 message, for AccessDenied.
 * - Any other failure leaves `data` null, which the screen shows as "not found", as the web does.
 */
export function useDetailQuery<T>(path: string | null) {
    const [data, setData] = useState<T | null>(null)
    const [mode, setMode] = useState<FetchMode | null>("initial")
    const [accessError, setAccessError] = useState<string | null>(null)
    const [reloadCount, setReloadCount] = useState(0)
    const nextModeRef = useRef<FetchMode>("initial")

    useEffect(() => {
        if (!path) return
        const controller = new AbortController()
        const currentMode = nextModeRef.current
        setMode(currentMode)

        async function load(url: string) {
            try {
                const result = await send<T>(url, "GET", undefined, { signal: controller.signal })
                if (controller.signal.aborted) return
                setData(result ?? null)
                setAccessError(null)
            } catch (error) {
                if (isAbortError(error) || controller.signal.aborted) return
                if (error instanceof ApiError && error.status === 401) return
                if (error instanceof ApiError && error.status === 403) {
                    setAccessError(error.message)
                    return
                }
                // A failed reload keeps what is on screen. A failed first load is "not found".
                if (currentMode === "initial") setData(null)
            } finally {
                if (!controller.signal.aborted) setMode(null)
            }
        }

        load(path)
        return () => controller.abort()
    }, [path, reloadCount])

    const reload = useCallback((nextMode: FetchMode) => {
        nextModeRef.current = nextMode
        setReloadCount((count) => count + 1)
    }, [])

    /** Pull-to-refresh. */
    const refresh = useCallback(() => reload("refresh"), [reload])

    /** Starts a reload with no spinner, such as after a write on this screen. */
    const refetch = useCallback(() => reload("quiet"), [reload])

    // The first focus is the mount, which is already loading. A later focus reloads quietly: a write on another
    // screen, such as an edit, may have changed the record.
    const hasFocusedRef = useRef(false)
    useFocusEffect(
        useCallback(() => {
            if (!hasFocusedRef.current) {
                hasFocusedRef.current = true
                return
            }
            reload("quiet")
        }, [reload]),
    )

    return {
        data,
        setData,
        loading: mode === "initial",
        refreshing: mode === "refresh",
        accessError,
        refresh,
        refetch,
    }
}
