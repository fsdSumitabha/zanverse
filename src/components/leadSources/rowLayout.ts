import { LEAD_SOURCE_STATUS } from "@/constants/leadSourceStatus"
import type { CallbackState } from "@/lib/callback"
import { daysBetween, formatDay } from "@/lib/leadSourceDay"
import type { LeadSourceRow, LeadSourceView } from "@/types/leadSource"

export interface DayChip {
    text: string
    tone: string
    title: string
}

/** A row's height without the chip line, and with it. Fixed, so the list can use getItemLayout. */
export const ROW_HEIGHT = 64
export const ROW_HEIGHT_WITH_CHIPS = 88
export const SECTION_HEIGHT = 28

/** The web's callback chip tones: rose once due, amber inside 15 minutes, violet before that. */
export const CALLBACK_TONES: Record<CallbackState, string> = {
    due: "border-rose-600 bg-rose-600 text-white",
    soon: "border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200",
    later: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300",
}

const LATE_TONE = "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
const PLAIN_TONE = "bg-slate-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"

/**
 * The day chip a row shows, from the web's LeadSourceRow.tsx: on Today only for rows left over from an earlier day,
 * on the other tabs always (amber when late and still open), and never in the one-day view.
 */
export function getDayChip(row: LeadSourceRow, view: LeadSourceView, today: string): DayChip | null {
    if (!row.allottedDay) return null
    const late = daysBetween(row.allottedDay, today)
    const day = formatDay(row.allottedDay, today)
    if (view === "today") {
        if (row.section !== 2) return null
        return {
            text: day,
            tone: LATE_TONE,
            title: `Set for ${day}, ${late} day${late === 1 ? "" : "s"} ago, and still open`,
        }
    }
    if (view === "day") return null
    const isConverted = row.status === LEAD_SOURCE_STATUS.CONVERTED
    return { text: day, tone: late > 0 && !isConverted ? LATE_TONE : PLAIN_TONE, title: `Day: ${day}` }
}

/** The row's height: taller when it has a callback chip or a day chip. */
export function getRowHeight(row: LeadSourceRow, view: LeadSourceView, today: string): number {
    return row.callbackAt || getDayChip(row, view, today) ? ROW_HEIGHT_WITH_CHIPS : ROW_HEIGHT
}
