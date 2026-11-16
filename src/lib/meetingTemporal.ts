import type { TemporalStatus } from "@/components/ui"

/**
 * When a meeting is, against the device clock: TODAY on the same local calendar day, UPCOMING after today, PAST
 * before. Ported from the web's src/utils/MeetingTemporalStatus.ts. `now` is a parameter only for tests.
 */
export function getMeetingTemporalStatus(date: string | Date, now: Date = new Date()): TemporalStatus {
    const scheduled = new Date(date)
    const isToday =
        scheduled.getFullYear() === now.getFullYear() &&
        scheduled.getMonth() === now.getMonth() &&
        scheduled.getDate() === now.getDate()

    if (isToday) return "TODAY"
    if (scheduled > now) return "UPCOMING"
    return "PAST"
}
