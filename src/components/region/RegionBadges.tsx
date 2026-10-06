import { Text, View } from "react-native"

import { toNativeClasses } from "@/lib/nativeClasses"
import { REGIONS, type RegionCode } from "@/lib/region"

/**
 * Each region gets its own colour so a wrong region is noticed at a glance rather than read. Verbatim from the web's
 * RegionBadge.tsx. The web shows the full name as a tooltip; here it is the screen reader label.
 */
const TONE: Record<RegionCode, string> = {
    IN: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    US: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
    AE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
}

const UNKNOWN_TONE = "bg-gray-200 text-gray-600 dark:bg-neutral-700 dark:text-neutral-300"
const EMPTY_TONE = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"

const BADGE_BASE = "rounded px-1.5 py-1 text-[11px] font-medium leading-none tracking-wide"

/** One small pill per region, e.g. IN. */
export function RegionBadge({ code }: { code: string }) {
    const region = REGIONS[code as RegionCode] as (typeof REGIONS)[RegionCode] | undefined
    const classes = toNativeClasses(`${BADGE_BASE} ${region ? TONE[region.code] : UNKNOWN_TONE}`)

    return (
        <View
            accessible
            accessibilityLabel={region ? region.label : `Unknown region: ${code}`}
            className={`self-start ${classes.container}`}
        >
            <Text className={classes.text}>{code}</Text>
        </View>
    )
}

interface RegionBadgesProps {
    regions?: string[] | null
    emptyLabel?: string
}

/**
 * A row of badges. Renders nothing visible but a red pill when the list is empty,
 * which is itself worth seeing: a user with no regions can read nothing.
 */
export default function RegionBadges({ regions, emptyLabel = "No region" }: RegionBadgesProps) {
    if (!regions || regions.length === 0) {
        const classes = toNativeClasses(`rounded px-1.5 py-1 text-[11px] font-medium ${EMPTY_TONE}`)
        return (
            <View
                accessible
                accessibilityLabel="This account cannot see any records. Set a region on it."
                className={`self-start ${classes.container}`}
            >
                <Text className={classes.text}>{emptyLabel}</Text>
            </View>
        )
    }

    return (
        <View className="flex-row flex-wrap gap-1">
            {regions.map((code) => (
                <RegionBadge key={code} code={code} />
            ))}
        </View>
    )
}
