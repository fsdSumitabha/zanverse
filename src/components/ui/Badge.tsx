import clsx from "clsx"
import { Text } from "react-native"

export interface BadgeMeta {
    label: string
    /** Tailwind classes from a `*_META` map, copied from the web unchanged, such as "bg-emerald-600 text-white". */
    color: string
}

type BadgeSize = "md" | "sm"

interface Props {
    /** Any `*_META` map: LEAD_STATUS_META, CLIENT_STATUS_META, PROJECT_STATUS_META, SERVICE_META, ... */
    meta: Readonly<Record<number, BadgeMeta | undefined>>
    status: number
    /** "md" is the web's StatusBadge and ServiceBadge. "sm" is lead-sources/StatusPill. */
    size?: BadgeSize
    className?: string
}

// The web's pill classes, without whitespace-nowrap: one line is numberOfLines={1} here.
const SIZE_CLASSES: Record<BadgeSize, string> = {
    md: "text-xs px-2 py-1 rounded-md font-medium",
    sm: "rounded-md px-2 py-0.5 text-[11px] font-semibold",
}

/** What the web's StatusBadge shows for a code with no meta, such as the retired lead source status 60. */
const UNKNOWN_META: BadgeMeta = { label: "Unknown", color: "bg-gray-500 text-white" }

/**
 * A status as a coloured label. One component for the web's StatusBadge, ServiceBadge and StatusPill.
 * A code missing from the map renders a grey "Unknown" pill instead of crashing.
 */
export default function Badge({ meta, status, size = "md", className }: Props) {
    const { label, color } = meta[status] ?? UNKNOWN_META

    return (
        <Text numberOfLines={1} className={clsx("self-start overflow-hidden", SIZE_CLASSES[size], color, className)}>
            {label}
        </Text>
    )
}
