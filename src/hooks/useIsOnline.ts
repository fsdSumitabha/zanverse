import NetInfo, { type NetInfoState } from "@react-native-community/netinfo"
import { useSyncExternalStore } from "react"

const OFFLINE_REASON = "Offline"

// One NetInfo subscription for the whole app, held while any screen listens.
let isOnline = true
let stopNetInfo: (() => void) | null = null
const subscribers = new Set<() => void>()

// "Unknown" counts as online, so nothing is disabled for a moment at launch while NetInfo looks.
function readIsOnline(state: NetInfoState): boolean {
    return state.isConnected !== false && state.isInternetReachable !== false
}

function subscribe(onChange: () => void): () => void {
    subscribers.add(onChange)
    if (!stopNetInfo) {
        stopNetInfo = NetInfo.addEventListener((state) => {
            const next = readIsOnline(state)
            if (next === isOnline) return
            isOnline = next
            subscribers.forEach((notify) => notify())
        })
    }
    return () => {
        subscribers.delete(onChange)
        if (subscribers.size > 0 || !stopNetInfo) return
        stopNetInfo()
        stopNetInfo = null
        isOnline = true
    }
}

/** Whether the phone can reach the internet now, for code outside React such as `src/api/client.ts`. */
export function getIsOnline(): boolean {
    return isOnline
}

/** Whether the phone can reach the internet: connected, and not known to be cut off. Re-renders on a change. */
export function useIsOnline(): boolean {
    return useSyncExternalStore(subscribe, getIsOnline)
}

/**
 * The reason a write button is disabled, for Button's `disabledReason`: "Offline" while there is no network, else
 * nothing. Reads keep working offline; writes wait for the network and are never queued.
 */
export function useOfflineReason(): string | undefined {
    return useIsOnline() ? undefined : OFFLINE_REASON
}
