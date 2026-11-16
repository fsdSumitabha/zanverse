import notifee, {
    AlarmType,
    AndroidVisibility,
    TriggerType,
    type Notification,
    type TimestampTrigger,
} from "react-native-notify-kit"

import { LEAD_SOURCE_STATUS } from "@/constants/leadSourceStatus"
import { PUSH_CHANNEL, PUSH_CHANNEL_META } from "@/constants/pushChannels"
import { formatPhoneForDisplay } from "@/lib/phone"
import { REGIONS, parseRegionCode } from "@/lib/region"
import { getRemindersEnabled } from "@/store/mmkv"
import type { LeadSourceRow } from "@/types/leadSource"

import {
    CALLBACK_CHANNEL_ID,
    NOTIFICATION_APPEARANCE,
    ensureChannel,
    getExpandedStyle,
    toNotificationText,
} from "./channels"
import { askExactAlarmsOnce, ensureNotificationPermission } from "./permission"
import { CALL_ACTION, OPEN_PRESS, SNOOZE_ACTION } from "./pressActions"

const ID_PREFIX = "callback-"
const DETAIL_PATH = "/admin/operations/lead-sources/"
const SNOOZE_MS = 15 * 60 * 1000

type ReminderRow = Pick<LeadSourceRow, "_id" | "name" | "phone" | "region" | "status" | "callbackAt" | "lastNote">

/** What a reminder carries for its buttons. The number stays on the phone: a reminder never goes through a server. */
interface ReminderContent {
    id: string
    title?: string
    body?: string
    data?: Notification["data"]
}

/** The notification id of a source's reminder. One per source, so a new time replaces the old one. */
export function getReminderId(sourceId: string): string {
    return `${ID_PREFIX}${sourceId}`
}

// A reminder belongs to a callback still ahead. The server clears callbackAt for every status but Call Back, and a
// converted source (70) is finished whatever it says.
function getDueTime(row: ReminderRow, now: number): number | null {
    if (!row.callbackAt || row.status === LEAD_SOURCE_STATUS.CONVERTED) return null
    const at = new Date(row.callbackAt).getTime()
    return Number.isFinite(at) && at > now ? at : null
}

// Always asks for an exact alarm. Without the permission, notify-kit uses an alarm that still fires in Doze, a few
// minutes late at most. When the person allows it later, notify-kit sets every stored reminder again, now exact.
function getTrigger(timestamp: number): TimestampTrigger {
    return {
        type: TriggerType.TIMESTAMP,
        timestamp,
        alarmManager: { type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE },
    }
}

// Call opens the source and dials the number in `data`. Snooze rings again in 15 minutes without opening the app.
// `title` and `body` are already safe to show (toNotificationText), so a snoozed reminder can pass its own back.
function buildReminder({ id, title, body, data }: ReminderContent): Notification {
    return {
        id,
        title,
        subtitle: PUSH_CHANNEL_META[PUSH_CHANNEL.CALLBACKS].label,
        body,
        data,
        android: {
            channelId: CALLBACK_CHANNEL_ID,
            ...NOTIFICATION_APPEARANCE,
            visibility: AndroidVisibility.PUBLIC,
            pressAction: OPEN_PRESS,
            actions: [CALL_ACTION, SNOOZE_ACTION],
            style: getExpandedStyle(body),
        },
    }
}

async function createReminder(row: ReminderRow, at: number): Promise<void> {
    const phoneCountry = REGIONS[parseRegionCode(row.region)].phoneCountry
    const reminder = buildReminder({
        id: getReminderId(row._id),
        title: toNotificationText(`Call back ${row.name}`),
        body: toNotificationText(
            `${formatPhoneForDisplay(row.phone, phoneCountry)} · ${row.lastNote || "no notes yet"}`,
        ),
        data: { url: `${DETAIL_PATH}${row._id}`, local: "1", name: row.name, phone: row.phone, region: row.region },
    })
    await notifee.createTriggerNotification(reminder, getTrigger(at))
}

/**
 * Sets, moves or removes a source's reminder from the row the API answered with. `askPermission` is for the moment a
 * callback is saved, the only time the app asks: first to show notifications, then, once ever, to ring at the exact
 * minute. A failure is logged and never reaches the save that called this.
 */
export async function scheduleCallbackReminder(
    row: ReminderRow,
    { askPermission = false }: { askPermission?: boolean } = {},
): Promise<void> {
    try {
        if (!getRemindersEnabled()) return
        const at = getDueTime(row, Date.now())
        if (at === null) {
            await notifee.cancelNotification(getReminderId(row._id))
            return
        }
        const canShow = askPermission && (await ensureNotificationPermission())
        await ensureChannel(PUSH_CHANNEL.CALLBACKS)
        await createReminder(row, at)
        if (canShow) await askExactAlarmsOnce()
    } catch (error) {
        console.warn("Push: could not schedule the callback reminder", error)
    }
}

/** Removes a source's reminder, such as after a convert or a bulk change. */
export async function cancelCallbackReminder(sourceId: string): Promise<void> {
    try {
        await notifee.cancelNotification(getReminderId(sourceId))
    } catch (error) {
        console.warn("Push: could not cancel the callback reminder", error)
    }
}

/**
 * Matches the phone's reminders to the rows a load returned: each row with a callback ahead has its reminder at that
 * time, and each row without one has none. Rows not in the load are left alone, since one page is not every source.
 */
export async function syncCallbackReminders(rows: ReminderRow[]): Promise<void> {
    try {
        if (!getRemindersEnabled() || rows.length === 0) return
        const scheduled = new Set(await notifee.getTriggerNotificationIds())
        const now = Date.now()
        let hasChannel = false
        for (const row of rows) {
            const at = getDueTime(row, now)
            if (at === null) {
                if (scheduled.has(getReminderId(row._id))) await notifee.cancelNotification(getReminderId(row._id))
                continue
            }
            if (!hasChannel) {
                await ensureChannel(PUSH_CHANNEL.CALLBACKS)
                hasChannel = true
            }
            await createReminder(row, at)
        }
    } catch (error) {
        console.warn("Push: could not sync the callback reminders", error)
    }
}

/**
 * The Snooze button: the reminder leaves the tray and rings again in 15 minutes, with the same text and buttons. It
 * runs with the app closed, so it rebuilds the reminder from what the pressed notification carried.
 */
export async function snoozeCallbackReminder(notification: Notification): Promise<void> {
    try {
        if (!notification.id) return
        await notifee.cancelDisplayedNotification(notification.id)
        await ensureChannel(PUSH_CHANNEL.CALLBACKS)
        const reminder = buildReminder({
            id: notification.id,
            title: notification.title,
            body: notification.body,
            data: notification.data,
        })
        await notifee.createTriggerNotification(reminder, getTrigger(Date.now() + SNOOZE_MS))
    } catch (error) {
        console.warn("Push: could not snooze the callback reminder", error)
    }
}

/** Removes every callback reminder on the phone, for the Profile switch turned off. */
export async function cancelAllCallbackReminders(): Promise<void> {
    try {
        const ids = (await notifee.getTriggerNotificationIds()).filter((id) => id.startsWith(ID_PREFIX))
        if (ids.length > 0) await notifee.cancelTriggerNotifications(ids)
    } catch (error) {
        console.warn("Push: could not cancel the callback reminders", error)
    }
}

/**
 * Logout: removes what the app put on this phone for the person leaving, the notifications in the tray and every
 * reminder still to ring, so the next person to sign in here sees none of it.
 */
export async function clearPhoneNotifications(): Promise<void> {
    await cancelAllCallbackReminders()
    try {
        await notifee.cancelDisplayedNotifications()
    } catch (error) {
        console.warn("Push: could not clear the shown notifications", error)
    }
}
