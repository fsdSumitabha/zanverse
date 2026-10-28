import type { RemoteMessage } from "@react-native-firebase/messaging"
import notifee, { AndroidGroupAlertBehavior, AndroidVisibility } from "react-native-notify-kit"

import { PUSH_CHANNEL, PUSH_CHANNEL_META, type PushChannel } from "@/constants/pushChannels"
import { notify } from "@/lib/notify"

import { NOTIFICATION_APPEARANCE, ensureChannel, resolveChannel } from "./channels"
import { openPushUrl } from "./openPushUrl"
import { CALL_ACTION, OPEN_ACTION, OPEN_PRESS } from "./pressActions"
import { getReminderId } from "./reminders"

const FALLBACK_TITLE = "ZAN Services"
const SUMMARY_PREFIX = "summary-"
// A bundle needs two notifications. One alone shows as itself, with no header above it.
const MIN_BUNDLE_SIZE = 2

function readText(value: unknown): string | undefined {
    return typeof value === "string" && value ? value : undefined
}

// One notification per record: a second update about the same lead replaces the first instead of stacking. A callback
// push from the server, once it exists, takes the phone reminder's id, so the two never show at once.
function getNotificationId(channel: PushChannel, entityId: string | undefined): string | undefined {
    if (!entityId) return undefined
    if (channel === PUSH_CHANNEL.CALLBACKS) return getReminderId(entityId)
    return `${PUSH_CHANNEL_META[channel].id}-${entityId}`
}

// The bundle header for one channel, titled with the channel's name. Only the newest notification in a bundle rings.
async function displayChannelSummary(id: string, label: string): Promise<void> {
    await notifee.displayNotification({
        id: `${SUMMARY_PREFIX}${id}`,
        title: label,
        android: {
            channelId: id,
            ...NOTIFICATION_APPEARANCE,
            groupId: id,
            groupSummary: true,
            groupAlertBehavior: AndroidGroupAlertBehavior.CHILDREN,
            visibility: AndroidVisibility.PUBLIC,
            pressAction: OPEN_PRESS,
        },
    })
}

/**
 * Keeps each channel's bundle in step with the tray. Each channel bundles on its own, under its name: without this,
 * Android bundles four or more of the app's notifications together under the app name. A header appears once its
 * channel has two notifications, and goes once it has none, because Android can leave an empty header behind.
 */
export async function syncChannelSummaries(): Promise<void> {
    const shown = await notifee.getDisplayedNotifications()
    const counts = new Map<string, number>()
    const headers = new Set<string>()
    for (const { id, notification } of shown) {
        const groupId = notification.android?.groupId
        if (!groupId) continue
        if (id?.startsWith(SUMMARY_PREFIX)) headers.add(groupId)
        else counts.set(groupId, (counts.get(groupId) ?? 0) + 1)
    }

    const empty = [...headers].filter((groupId) => !counts.has(groupId))
    if (empty.length > 0) await notifee.cancelDisplayedNotifications(empty.map((id) => `${SUMMARY_PREFIX}${id}`))
    for (const meta of Object.values(PUSH_CHANNEL_META)) {
        if ((counts.get(meta.id) ?? 0) >= MIN_BUNDLE_SIZE && !headers.has(meta.id)) {
            await displayChannelSummary(meta.id, meta.label)
        }
    }
}

/**
 * Shows a push from the CRM on the channel its `data.channel` names, with the app in the background or closed. Every
 * high-priority push must show a notification: FCM lowers the priority of apps that let them pass silently.
 *
 * The large picture on the right appears only when the push carries `data.imageUrl`. Leads and clients have no photo,
 * so no push from today's server has one.
 */
export async function displayRemoteMessage(message: RemoteMessage): Promise<void> {
    const data = message.data ?? {}
    const channel = resolveChannel(data.channel)
    const channelId = PUSH_CHANNEL_META[channel].id
    const entityId = readText(data.entityId)
    const notificationId = getNotificationId(channel, entityId)
    const imageUrl = readText(data.imageUrl)
    // A new lead can be called straight from the tray. The app looks up the number: a push never carries one.
    const actions = channel === PUSH_CHANNEL.NEW_LEADS && entityId ? [CALL_ACTION, OPEN_ACTION] : undefined

    await ensureChannel(channel)
    await notifee.displayNotification({
        ...(notificationId ? { id: notificationId } : {}),
        title: readText(message.notification?.title) ?? readText(data.title) ?? FALLBACK_TITLE,
        body: readText(message.notification?.body) ?? readText(data.body),
        data,
        android: {
            channelId,
            ...NOTIFICATION_APPEARANCE,
            groupId: channelId,
            visibility: AndroidVisibility.PUBLIC,
            pressAction: OPEN_PRESS,
            actions,
            ...(imageUrl ? { largeIcon: imageUrl, circularLargeIcon: true } : {}),
        },
    })
    await syncChannelSummaries()
}

/**
 * A push that arrives while the app is on screen. Android shows nothing for it, so the app shows a toast with an Open
 * button, as the web's PushListener does. A callback push still goes to the tray, because it asks for a call now.
 */
export async function showForegroundPush(message: RemoteMessage): Promise<void> {
    const data = message.data ?? {}
    if (resolveChannel(data.channel) === PUSH_CHANNEL.CALLBACKS) {
        await displayRemoteMessage(message)
        return
    }
    const url = readText(data.url)
    notify.info(readText(message.notification?.title) ?? readText(data.title) ?? FALLBACK_TITLE, {
        description: readText(message.notification?.body) ?? readText(data.body),
        action: url ? { label: "Open", onClick: () => openPushUrl(url) } : undefined,
    })
}
