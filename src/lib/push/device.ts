import { getApps } from "@react-native-firebase/app"
import { getMessaging, onRegistered, register, unregister } from "@react-native-firebase/messaging"
import { useSyncExternalStore } from "react"
import { Platform } from "react-native"

import { send } from "@/api/client"
import { NOTIFICATIONS_API } from "@/api/endpoints"
import { PUSH_PLATFORM } from "@/constants/pushDevice"
// package.json sits above src/. android/app/build.gradle reads the same field for the app's versionName.
import packageJson from "@/../package.json"

const PLATFORM = Platform.OS === "ios" ? PUSH_PLATFORM.IOS : PUSH_PLATFORM.ANDROID

// The FID the server holds for this session, and the one being sent now, so a repeat callback sends nothing.
let registeredFid: string | null = null
let sendingFid: string | null = null
let stopRegistered: (() => void) | null = null
let hasLoggedFailure = false
const subscribers = new Set<() => void>()

function setRegistered(fid: string | null): void {
    if (fid === registeredFid) return
    registeredFid = fid
    subscribers.forEach((notify) => notify())
}

function logOnce(error: unknown): void {
    if (hasLoggedFailure) return
    hasLoggedFailure = true
    console.warn("Push: this phone was not saved for push; reminders stay on this phone only", error)
}

async function saveDevice(fid: string): Promise<void> {
    if (fid === registeredFid || fid === sendingFid) return
    sendingFid = fid
    try {
        await send(NOTIFICATIONS_API.DEVICES, "POST", { fid, platform: PLATFORM, appVersion: packageJson.version })
        setRegistered(fid)
    } finally {
        sendingFid = null
    }
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
 * Registers this phone with FCM by its Firebase Installation ID (FID), and saves the FID on the server. Firebase calls
 * back with the FID after each register(), and by itself if the FID ever changes. Called after login and after
 * `/api/auth/me` on every start, so the server sees when the phone was last used. Fire-and-forget: a failure is logged
 * once and changes nothing on screen.
 */
export async function registerPushDevice(): Promise<void> {
    if (!isFirebaseConfigured()) return
    try {
        const messaging = getMessaging()
        if (!stopRegistered) {
            stopRegistered = onRegistered(messaging, (fid) => {
                saveDevice(fid).catch(logOnce)
            })
        }
        await register(messaging)
    } catch (error) {
        logOnce(error)
    }
}

/**
 * Removes this phone from the server, then from FCM. Called on logout, before the session is wiped: the DELETE starts
 * before the first await, so it still carries the JWT. If it fails, unregister() still stops FCM delivering here, and
 * the server drops the row on its next send.
 */
export async function unregisterPushDevice(): Promise<void> {
    stopRegistered?.()
    stopRegistered = null
    const fid = registeredFid
    setRegistered(null)
    if (!isFirebaseConfigured()) return
    try {
        // The phone has no push_device cookie, so the server reads the FID from the body.
        if (fid) await send(NOTIFICATIONS_API.DEVICES, "DELETE", { fid })
    } catch (error) {
        logOnce(error)
    }
    try {
        await unregister(getMessaging())
    } catch (error) {
        logOnce(error)
    }
}

function subscribe(onChange: () => void): () => void {
    subscribers.add(onChange)
    return () => subscribers.delete(onChange)
}

function getIsRegistered(): boolean {
    return registeredFid !== null
}

/** Whether the server holds this phone's FID, so pushes from the CRM reach it. */
export function useIsPushRegistered(): boolean {
    return useSyncExternalStore(subscribe, getIsRegistered)
}
