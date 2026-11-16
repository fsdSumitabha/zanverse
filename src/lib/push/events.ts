import { AppState } from "react-native"
import notifee, { EventType, type Event, type InitialNotification, type Notification } from "react-native-notify-kit"

import { send } from "@/api/client"
import { OPERATIONS_API } from "@/api/endpoints"
import { startCall } from "@/lib/contact"
import { REGIONS, parseRegionCode } from "@/lib/region"
import { notify } from "@/lib/notify"
import { getActiveRegion } from "@/store/mmkv"
import type { Lead } from "@/types/lead"

import { INBOX_URL, openPushUrl } from "./openPushUrl"
import { PRESS_ACTION } from "./pressActions"
import { snoozeCallbackReminder } from "./reminders"
import { syncChannelSummaries } from "./remoteMessage"

/** A Call press waiting for the app to be on screen and signed in. */
interface PendingCall {
    name: string
    /** A reminder carries the number. A new-lead push carries only the lead's id, and the app looks the number up. */
    phone?: string
    region?: string
    leadId?: string
}

// The same press can arrive twice on a cold start: once as an event and once from getInitialNotification.
const REPEAT_WINDOW_MS = 10_000

let pendingCall: PendingCall | null = null
let isAppReady = false
let lastPress: { key: string; at: number } | null = null

function readText(value: unknown): string | undefined {
    return typeof value === "string" && value ? value : undefined
}

function isRepeat(notification: Notification, actionId: string): boolean {
    const key = `${notification.id ?? notification.title ?? ""}:${actionId}`
    const now = Date.now()
    const isSame = lastPress?.key === key && now - lastPress.at < REPEAT_WINDOW_MS
    lastPress = { key, at: now }
    return isSame
}

function getPhoneCountry(region: string | undefined) {
    return REGIONS[parseRegionCode(region ?? getActiveRegion())].phoneCountry
}

async function dialLead(leadId: string): Promise<void> {
    try {
        const data = await send<{ lead: Lead | null }>(`${OPERATIONS_API}/leads/${leadId}`, "GET")
        const lead = data?.lead
        if (!lead?.phone) {
            notify.info("This lead has no phone number")
            return
        }
        startCall({ name: lead.name, phone: lead.phone }, getPhoneCountry(undefined))
    } catch (error) {
        notify.error(error instanceof Error ? error.message : "Could not load the lead")
    }
}

/**
 * Starts a waiting call once the app is on screen with a session: the dialer cannot open over a closed app, and a
 * lead's number needs the JWT. PushProvider calls it when it mounts and each time the app comes to the front.
 */
export function runPendingCall(): void {
    if (!pendingCall || !isAppReady || AppState.currentState !== "active") return
    const call = pendingCall
    pendingCall = null
    if (call.phone) startCall({ name: call.name, phone: call.phone }, getPhoneCountry(call.region))
    else if (call.leadId) dialLead(call.leadId)
}

/** PushProvider's mount and unmount: calls wait while it is not mounted (signed out, or still starting). */
export function setPushAppReady(isReady: boolean): void {
    isAppReady = isReady
    if (isReady) runPendingCall()
}

function queueCall(notification: Notification): void {
    const data = notification.data ?? {}
    const name = readText(data.name) ?? notification.title ?? ""
    const phone = readText(data.phone)
    const leadId = phone ? undefined : readText(data.entityId)
    if (!phone && !leadId) return
    pendingCall = { name, phone, region: readText(data.region), leadId }
    runPendingCall()
}

/**
 * Every press on a notification: from onForegroundEvent, onBackgroundEvent and getInitialNotification alike. A tap or
 * Open opens the record. Call opens it and starts the dialer. Snooze moves a callback reminder 15 minutes later and
 * leaves the app closed. After each, and after a swipe-away, the channel bundles are brought in step with the tray.
 */
export async function handleNotificationEvent({ type, detail }: Event): Promise<void> {
    const notification = detail.notification
    if (!notification) return
    // A bundle header has no url, and neither has a push with no record. They open the inbox, as the web's worker does.
    const url = readText(notification.data?.url) ?? INBOX_URL
    if (type === EventType.DISMISSED) {
        await syncChannelSummaries()
        return
    }
    if (type === EventType.PRESS) {
        openPushUrl(url)
        await syncChannelSummaries()
        return
    }
    if (type !== EventType.ACTION_PRESS) return

    const actionId = detail.pressAction?.id ?? PRESS_ACTION.OPEN
    if (isRepeat(notification, actionId)) return
    // A button, unlike a tap, leaves the notification in the tray.
    if (notification.id) await notifee.cancelDisplayedNotification(notification.id)
    if (actionId === PRESS_ACTION.SNOOZE) {
        await snoozeCallbackReminder(notification)
        return
    }
    openPushUrl(url)
    if (actionId === PRESS_ACTION.CALL) queueCall(notification)
    await syncChannelSummaries()
}

/** The press that opened the app, from getInitialNotification, handled like any other press. */
export function handleInitialNotification(initial: InitialNotification | null): Promise<void> {
    if (!initial) return Promise.resolve()
    const type = initial.pressAction.id === PRESS_ACTION.OPEN ? EventType.PRESS : EventType.ACTION_PRESS
    return handleNotificationEvent({
        type,
        detail: { notification: initial.notification, pressAction: initial.pressAction },
    })
}
