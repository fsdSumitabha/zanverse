import clsx from "clsx"
import { Text, View } from "react-native"

import { Card, TimeAgo } from "@/components/ui"
import { ENTITY_TYPE_META, type EntityType } from "@/constants/entityTypes"
import type { ActivityLogRow } from "@/types/activityLog"

const NEUTRAL_BADGE = "bg-neutral-500/10 text-neutral-600 dark:text-neutral-300 border-neutral-500/30"

/** "assignedTo" or "assigned_to" becomes "Assigned to". */
function humanize(field: string | null): string {
    if (!field) return "a field"
    const words = field
        .replace(/_/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .toLowerCase()
    return words.charAt(0).toUpperCase() + words.slice(1)
}

function getActionText(row: ActivityLogRow): string {
    const isCreate =
        row.action === "CREATE" || (row.oldData === null && row.newData !== null && row.action !== "DELETE")
    const isDelete =
        row.action === "DELETE" || (row.oldData !== null && row.newData === null && row.action !== "CREATE")
    if (isCreate) return "Created"
    if (isDelete) return "Deleted"
    return `Updated ${humanize(row.action)}`
}

/**
 * One activity row, readable but short: what was done, to which kind of record, and when. Session 18 replaces the body
 * with the web's full old → new view; the props stay `{ row }`.
 */
export default function ActivityLogItem({ row }: { row: ActivityLogRow }) {
    const entityLabel = row.entityType !== null ? ENTITY_TYPE_META[row.entityType as EntityType]?.label : null

    return (
        <Card className="gap-1 p-3">
            <View className="flex-row flex-wrap items-center gap-2">
                <Text className="text-sm text-neutral-700 dark:text-neutral-300">{getActionText(row)}</Text>
                {!!entityLabel && (
                    <Text className={clsx("rounded-md border px-2 py-0.5 text-[11px] font-medium", NEUTRAL_BADGE)}>
                        {entityLabel}
                    </Text>
                )}
                {!!row.entityName && (
                    <Text numberOfLines={1} className="flex-shrink text-sm text-neutral-600 dark:text-neutral-400">
                        — {row.entityName}
                    </Text>
                )}
            </View>
            <TimeAgo date={row.createdAt} />
        </Card>
    )
}
