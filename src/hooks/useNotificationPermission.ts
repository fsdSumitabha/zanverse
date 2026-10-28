import { useCallback, useEffect, useState } from "react"
import { AppState } from "react-native"

import {
    getNotificationPermission,
    requestNotificationPermission,
    type NotificationPermission,
} from "@/lib/push/permission"

interface PermissionState {
    /** `null` until the first read. */
    permission: NotificationPermission | null
    /** Shows the system dialog, or opens Settings once Android will not show it. */
    request: () => Promise<void>
    refresh: () => Promise<void>
}

/**
 * Whether this phone shows the app's notifications. Read again each time the app comes back to the front, because
 * the person may have just changed it in system Settings.
 */
export function useNotificationPermission(): PermissionState {
    const [permission, setPermission] = useState<NotificationPermission | null>(null)

    const refresh = useCallback(async () => {
        try {
            setPermission(await getNotificationPermission())
        } catch {
            setPermission("blocked")
        }
    }, [])

    const request = useCallback(async () => {
        try {
            setPermission(await requestNotificationPermission())
        } catch {
            await refresh()
        }
    }, [refresh])

    useEffect(() => {
        refresh()
        const subscription = AppState.addEventListener("change", (next) => {
            if (next === "active") refresh()
        })
        return () => subscription.remove()
    }, [refresh])

    return { permission, request, refresh }
}
