import { getApps } from "@react-native-firebase/app"
import { deleteToken, getMessaging, getToken, onTokenRefresh } from "@react-native-firebase/messaging"
import { useSyncExternalStore } from "react"
import { Platform } from "react-native"

import { send } from "@/api/client"

// The backend's device-token route (docs/BACKEND_CHANGES.md, Phase 2). It does not exist yet; a 404 is logged once.
const DEVICES_API = "/api/notifications/devices"

let registeredToken: string | null = null
let stopRefresh: (() => void) | null = null
let hasLoggedFailure = false
const subscribers = new Set<() => void>()

function setRegistered(token: string | null): void {
    if (token === registeredToken) return
    registeredToken = token
    subscribers.forEach((notify) => notify())
}

function logOnce(error: unknown): void {
    if (hasLoggedFailure) return
    hasLoggedFailure = true
    console.warn("Push: the device token was not registered; reminders stay on this phone only", error)
}

async function postToken(token: string): Promise<void> {
    await send(DEVICES_API, "POST", { token, platform: Platform.OS })
    setRegistered(token)
}

/** True when this build has Firebase set up (android/app/google-services.json). Without it there is no push. */
export function isFirebaseConfigured(): boolean {
    try {
        return getApps().length > 0
    } catch {
        return false
    }
}

/**
 * Sends this phone's FCM token to the backend, and again whenever Firebase rotates it. Called after login and after
 * `/api/auth/me` on a cold start. Fire-and-forget: a failure, such as the 404 while the route does not exist, is logged
 * once and changes nothing on screen.
 */
export async function registerDeviceToken(): Promise<void> {
    if (!isFirebaseConfigured()) return
    try {
        const messaging = getMessaging()
        await postToken(await getToken(messaging))
        if (!stopRefresh) {
            stopRefresh = onTokenRefresh(messaging, (token) => {
                postToken(token).catch(logOnce)
            })
        }
    } catch (error) {
        logOnce(error)
    }
}

/** Removes this phone's token from the backend and from Firebase. Called on logout, before the session is wiped. */
export async function unregisterDeviceToken(): Promise<void> {
    stopRefresh?.()
    stopRefresh = null
    const token = registeredToken
    setRegistered(null)
    if (!token || !isFirebaseConfigured()) return
    try {
        await send(DEVICES_API, "DELETE", { token })
        await deleteToken(getMessaging())
    } catch (error) {
        logOnce(error)
    }
}

function subscribe(onChange: () => void): () => void {
    subscribers.add(onChange)
    return () => subscribers.delete(onChange)
}

function getIsRegistered(): boolean {
    return registeredToken !== null
}

/** Whether the backend holds this phone's token, so a due callback can also arrive by push. */
export function useIsPushRegistered(): boolean {
    return useSyncExternalStore(subscribe, getIsRegistered)
}
