import { Calendar, Check, CircleAlert, RefreshCw, X, type LucideIcon } from "lucide-react-native"

import { MEETING_STATUS_META, type MeetingStatus } from "@/constants/meetingStatus"

/**
 * The `icon` names in MEETING_STATUS_META, as lucide components. The web looks them up dynamically
 * (`(Icons as any)[...]`), which a phone bundle cannot do; an explicit map also catches a renamed icon at build time.
 */
const MEETING_ICONS: Record<string, LucideIcon> = {
    calendar: Calendar,
    refresh: RefreshCw,
    times: X,
    "exclamation-circle": CircleAlert,
    check: Check,
}

/** The icon for a meeting status. Calendar when the status or its icon is unknown. */
export function getMeetingIcon(status: number): LucideIcon {
    const name = MEETING_STATUS_META[status as MeetingStatus]?.icon
    return (name && MEETING_ICONS[name]) || Calendar
}
