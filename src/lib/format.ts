import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

// Dates and amounts as the app shows them. The web formats with toLocaleString() and TimeAgo.tsx, so its output
// follows the browser's locale. These fixed dayjs formats read the same on every phone. Times are local.

/** A moment as the API sends it (ISO text), a timestamp in ms, or a Date. */
export type DateInput = string | number | Date

/** Shown for a missing or unreadable value, as the web's MeetingCard and profile page do. */
const EMPTY_VALUE = "—"
const DATE_TIME_FORMAT = "MMM D, YYYY h:mm A"
const DATE_FORMAT = "MMM D, YYYY"
const SHORT_DATE_FORMAT = "MMM D"
const TIME_FORMAT = "h:mm A"
const DAY_TIME_FORMAT = "ddd, h:mm A"
const FULL_DATE_TIME_FORMAT = "DD/MM/YYYY hh:mm A"
const AMOUNT_FORMAT = new Intl.NumberFormat("en-IN")

dayjs.extend(relativeTime)

/**
 * Parses a value, or returns null when it is missing or unreadable.
 * The explicit check matters: dayjs(undefined) is "now", which would show a missing date as the current time.
 */
function toDayjs(value: DateInput | null | undefined): dayjs.Dayjs | null {
    if (value == null || value === "") return null
    const date = dayjs(value)
    return date.isValid() ? date : null
}

function formatWith(value: DateInput | null | undefined, template: string): string {
    const date = toDayjs(value)
    return date ? date.format(template) : EMPTY_VALUE
}

/**
 * "Oct 5, 2026 3:07 PM". Replaces `toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })` in
 * MeetingCard.tsx, CallItem.tsx, activityLog/formatActivityValue.ts and profile/page.tsx, and the bare
 * `toLocaleString()` in LeadDetails.tsx, ClientInfoCard.tsx and the upload report page.
 */
export function formatDateTime(value: DateInput | null | undefined): string {
    return formatWith(value, DATE_TIME_FORMAT)
}

/** "Oct 5, 2026". The date part of formatDateTime, for places that show no time. */
export function formatDate(value: DateInput | null | undefined): string {
    return formatWith(value, DATE_FORMAT)
}

/**
 * "Oct 5". Replaces `fmtShort` in filters/DateField.tsx. A "YYYY-MM-DD" day string is read as that local day,
 * like the web's `new Date(day + "T00:00:00")`, so it never shifts by a time zone.
 */
export function formatShortDate(value: DateInput | null | undefined): string {
    return formatWith(value, SHORT_DATE_FORMAT)
}

/** "3:07 PM". Replaces `d.format("h:mm A")` in UpcomingMeetingsPanel.tsx ("Today, 3:07 PM"). */
export function formatTime(value: DateInput | null | undefined): string {
    return formatWith(value, TIME_FORMAT)
}

/** "Mon, 3:07 PM". Replaces `d.format("ddd, h:mm A")` in UpcomingMeetingsPanel.tsx, for days within a week. */
export function formatDayTime(value: DateInput | null | undefined): string {
    return formatWith(value, DAY_TIME_FORMAT)
}

/** "05/10/2026 03:07 PM". The full time TimeAgo.tsx shows as its tooltip. */
export function formatFullDateTime(value: DateInput | null | undefined): string {
    return formatWith(value, FULL_DATE_TIME_FORMAT)
}

/** "5 minutes ago", "in 2 hours". The text of TimeAgo.tsx, which is dayjs `fromNow()`. */
export function formatTimeAgo(value: DateInput | null | undefined): string {
    const date = toDayjs(value)
    return date ? date.fromNow() : EMPTY_VALUE
}

/**
 * "1,25,000", with Indian digit grouping. Replaces `toLocaleString()` on quotation amounts and project budgets
 * (QuotationItem.tsx, ProjectCard.tsx, ProjectDetail.tsx, ClientProjectPreviewCard.tsx). The ₹ sign stays at the
 * call site, as on the web.
 */
export function formatAmount(value: number | null | undefined): string {
    if (value == null || !Number.isFinite(value)) return EMPTY_VALUE
    return AMOUNT_FORMAT.format(value)
}
