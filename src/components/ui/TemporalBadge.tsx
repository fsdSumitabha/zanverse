import { Text } from "react-native"

// Verbatim from the web's "TemporalBadge .tsx" (the web file name has a space before .tsx).
const TEMPORAL_STYLES = {
    UPCOMING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    TODAY: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    PAST: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400",
}

const TEMPORAL_LABELS = {
    UPCOMING: "Upcoming",
    TODAY: "Today",
    PAST: "Past",
}

export type TemporalStatus = keyof typeof TEMPORAL_STYLES

/** When a meeting is: Upcoming, Today or Past. */
export default function TemporalBadge({ status }: { status: TemporalStatus }) {
    return (
        <Text
            numberOfLines={1}
            className={`self-start overflow-hidden text-xs px-2 py-1 rounded-md ${TEMPORAL_STYLES[status]}`}
        >
            {TEMPORAL_LABELS[status]}
        </Text>
    )
}
