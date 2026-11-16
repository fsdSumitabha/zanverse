import notifee, {
    AlarmType,
    AndroidNotificationSetting,
    TriggerType,
    type TimestampTrigger,
} from "@notifee/react-native"

import { LEAD_SOURCE_STATUS } from "@/constants/leadSourceStatus"
import { formatPhoneForDisplay } from "@/lib/phone"
import { REGIONS, parseRegionCode } from "@/lib/region"
import { getRemindersEnabled } from "@/store/mmkv"
import type { LeadSourceRow } from "@/types/leadSource"

import { CALLBACK_CHANNEL_ID, ensureChannels } from "./channels"
import { ensureNotificationPermission } from "./permission"

const ID_PREFIX = "callback-"
const DETAIL_PATH = "/admin/operations/lead-sources/"

type ReminderRow = Pick<LeadSourceRow, "_id" | "name" | "phone" | "region" | "status" | "callbackAt" | "lastNote">

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

// Exact when Android allows exact alarms; otherwise an alarm that still fires in Doze, a few minutes late at most.
async function getAlarmType(): Promise<AlarmType> {
    const settings = await notifee.getNotificationSettings()
    return settings.android?.alarm === AndroidNotificationSetting.ENABLED
        ? AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE
        : AlarmType.SET_AND_ALLOW_WHILE_IDLE
}

async function createReminder(row: ReminderRow, at: number): Promise<void> {
    const phoneCountry = REGIONS[parseRegionCode(row.region)].phoneCountry
    const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: at,
        alarmManager: { type: await getAlarmType() },
    }
    await notifee.createTriggerNotification(
        {
            id: getReminderId(row._id),
            title: `Call back ${row.name}`,
            body: `${formatPhoneForDisplay(row.phone, phoneCountry)} · ${row.lastNote || "no notes yet"}`,
            data: { url: `${DETAIL_PATH}${row._id}`, local: "1" },
            android: { channelId: CALLBACK_CHANNEL_ID, pressAction: { id: "default" } },
        },
        trigger,
    )
}

/**
 * Sets, moves or removes a source's reminder from the row the API answered with. `askPermission` is for the moment a
 * callback is saved, the only time the app asks. A failure is logged and never reaches the save that called this.
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
        if (askPermission) await ensureNotificationPermission()
        await ensureChannels()
        await createReminder(row, at)
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
        let hasChannels = false
        for (const row of rows) {
            const at = getDueTime(row, now)
            if (at === null) {
                if (scheduled.has(getReminderId(row._id))) await notifee.cancelNotification(getReminderId(row._id))
                continue
            }
            if (!hasChannels) {
                await ensureChannels()
                hasChannels = true
            }
            await createReminder(row, at)
        }
    } catch (error) {
        console.warn("Push: could not sync the callback reminders", error)
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
