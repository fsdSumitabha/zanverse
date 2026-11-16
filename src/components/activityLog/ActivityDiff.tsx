import clsx from "clsx"
import { ArrowRight } from "lucide-react-native"
import { Text, View } from "react-native"

import type { EntityType } from "@/constants/entityTypes"
import { STATUS_META_BY_ENTITY } from "@/constants/statusMetaByEntity"
import { formatActivityValue } from "@/lib/activityLog/formatActivityValue"
import { enableIconClassNames } from "@/lib/iconClassName"

interface Props {
    oldValue: unknown
    newValue: unknown
    action: string | null
    entityType: EntityType | null
}

const TONES = {
    old: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20",
    new: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
}

enableIconClassNames(ArrowRight)

/** A status change shows the status's own colour from its META map; anything else the web's red and green tones. */
function getPillClasses(tone: "old" | "new", value: unknown, action: string | null, entityType: EntityType | null) {
    if (action === "status" && entityType !== null && typeof value === "number") {
        const color = STATUS_META_BY_ENTITY[entityType]?.[value]?.color
        if (color) return `border-transparent ${color}`
    }
    return TONES[tone]
}

function DiffPill({
    tone,
    value,
    action,
    entityType,
}: {
    tone: "old" | "new"
    value: unknown
    action: string | null
    entityType: EntityType | null
}) {
    const text = formatActivityValue(value, action, entityType)
    return (
        <Text
            numberOfLines={1}
            accessibilityLabel={`${tone === "old" ? "Was" : "Now"} ${text}`}
            className={clsx(
                "max-w-full flex-shrink rounded-md border px-2 py-1 text-sm",
                getPillClasses(tone, value, action, entityType),
            )}
        >
            {text}
        </Text>
    )
}

/** A field change: the old value, an arrow, the new value. Ported from the web's DiffPill pair. */
export default function ActivityDiff({ oldValue, newValue, action, entityType }: Props) {
    return (
        <View className="mt-2 flex-row flex-wrap items-center gap-2">
            <DiffPill tone="old" value={oldValue} action={action} entityType={entityType} />
            <ArrowRight size={14} className="text-neutral-400" />
            <DiffPill tone="new" value={newValue} action={action} entityType={entityType} />
        </View>
    )
}
