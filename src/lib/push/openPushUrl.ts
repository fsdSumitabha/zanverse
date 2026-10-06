import { navigationRef } from "@/api/navigationRef"
import { resolveNotificationPath } from "@/navigation/linking"
import { openRecord } from "@/navigation/openRecord"
import { readCachedMe } from "@/store/cache"

// A tap that arrived before the app could navigate (a cold start from a notification, or the Login screen) waits here.
let pendingUrl: string | null = null
let stopWaitingForReady: (() => void) | null = null

// The tabs must be on the stack: before that, Splash or Login would reset the root and lose the jump.
function canNavigate(): boolean {
    if (!navigationRef.isReady()) return false
    return navigationRef.getRootState()?.routes.some((route) => route.name === "App") ?? false
}

function waitForReady(): void {
    if (stopWaitingForReady || navigationRef.isReady()) return
    stopWaitingForReady = navigationRef.addListener("ready", () => {
        stopWaitingForReady?.()
        stopWaitingForReady = null
        openPendingPushUrl()
    })
}

/**
 * Opens what a tapped notification points at: a callback reminder's `/admin/operations/lead-sources/:id`, or any of
 * the record paths the bell's rows carry. Every tap source comes through here. Until the tabs can be navigated, the
 * url waits, and opens on the navigation container's `ready` event or when PushProvider mounts.
 */
export function openPushUrl(url: unknown): void {
    if (typeof url !== "string" || !url) return
    if (!canNavigate()) {
        pendingUrl = url
        waitForReady()
        return
    }
    const target = resolveNotificationPath(url)
    if (!target) {
        console.warn(`Push: no screen for ${url}`)
        return
    }
    openRecord(target, readCachedMe()?.role ?? null)
}

/** Opens the tap that waited, if the tabs can be navigated now. Called when PushProvider mounts with the tabs. */
export function openPendingPushUrl(): void {
    if (!pendingUrl || !canNavigate()) return
    const url = pendingUrl
    pendingUrl = null
    openPushUrl(url)
}
