import clsx from "clsx"
import { Plus, Trash2, User } from "lucide-react-native"
import { memo } from "react"
import { Pressable, Text, View } from "react-native"

import { Avatar, Card, TimeAgo } from "@/components/ui"
import { ENTITY_TYPE, ENTITY_TYPE_META } from "@/constants/entityTypes"
import { useAuth } from "@/contexts/AuthContext"
import { humanizeFieldName, normalizeEntityType } from "@/lib/activityLog/formatActivityValue"
import { enableIconClassNames } from "@/lib/iconClassName"
import type { ActivityLogRow } from "@/types/activityLog"

import ActivityDiff from "./ActivityDiff"
import { ENTITY_BADGE, getEntityTarget, NEUTRAL_BADGE, openActivityTarget } from "./entityTarget"
import { InteractionDetailBlock, InteractionLine } from "./InteractionLine"

// Lifecycle markers written by the backend (logEntityChanges.ts).
const ACTION_CREATE = "CREATE"
const ACTION_DELETE = "DELETE"
const AVATAR_SIZE = 36
const CHIP = "flex-row items-center gap-1 rounded-md border px-2 py-0.5"

enableIconClassNames(Plus, Trash2, User)

/**
 * One audit row: who, when, and what: Created, Deleted, or "Updated <field>" with the old and new values. An
 * interaction row names its type and parent instead. Ported from the web's ActivityLogItem.tsx; the diff and the
 * interaction parts live in their own files.
 */
function ActivityLogItem({ row }: { row: ActivityLogRow }) {
    const { role } = useAuth()
    // Explicit markers first, then nullness for legacy rows written before the markers existed.
    const isCreate =
        row.action === ACTION_CREATE || (row.oldData === null && row.newData !== null && row.action !== ACTION_DELETE)
    const isDelete =
        row.action === ACTION_DELETE || (row.oldData !== null && row.newData === null && row.action !== ACTION_CREATE)
    const isFieldChange = !isCreate && !isDelete
    const entityType = normalizeEntityType(row.entityType)
    const entityLabel = entityType !== null ? ENTITY_TYPE_META[entityType]?.label ?? null : null
    const badge = entityType !== null ? ENTITY_BADGE[entityType] ?? NEUTRAL_BADGE : NEUTRAL_BADGE
    const target = getEntityTarget(entityType, row.entityId)
    const isInteractionMarker = isCreate && entityType === ENTITY_TYPE.INTERACTION
    const nameText = row.entityName ? `— ${row.entityName}` : row.entityId ? `#${row.entityId.slice(-6)}` : null

    function open() {
        if (target) openActivityTarget(target, role)
    }

    return (
        <Card className="flex-row items-start gap-3 p-3">
            <View className="h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-emerald-500/20 bg-emerald-500/10">
                {row.user?.avatar?.trim() ? (
                    <Avatar uri={row.user.avatar} size={AVATAR_SIZE} name={row.user.name} />
                ) : (
                    <User size={16} className="text-emerald-500" />
                )}
            </View>
            <View className="min-w-0 flex-1">
                <View className="flex-row flex-wrap items-center gap-x-2 gap-y-0.5">
                    <Text
                        numberOfLines={1}
                        className="flex-shrink text-sm font-medium text-neutral-900 dark:text-neutral-100"
                    >
                        {row.user?.name || row.user?.email || "System"}
                    </Text>
                    <TimeAgo date={row.createdAt} />
                </View>

                <View className="mt-1 flex-row flex-wrap items-center gap-2">
                    {isInteractionMarker ? (
                        <InteractionLine interaction={row.interaction ?? null} />
                    ) : isCreate ? (
                        <View className={clsx(CHIP, "border-emerald-500/30 bg-emerald-500/10")}>
                            <Plus size={12} className="text-emerald-700 dark:text-emerald-300" />
                            <Text className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                                Created
                            </Text>
                        </View>
                    ) : isDelete ? (
                        <View className={clsx(CHIP, "border-red-500/30 bg-red-500/10")}>
                            <Trash2 size={12} className="text-red-700 dark:text-red-300" />
                            <Text className="text-[11px] font-medium text-red-700 dark:text-red-300">Deleted</Text>
                        </View>
                    ) : (
                        <Text className="text-sm text-neutral-700 dark:text-neutral-300">
                            Updated <Text className="font-medium">{humanizeFieldName(row.action)}</Text>
                        </Text>
                    )}

                    {!!entityLabel && !isInteractionMarker && (
                        <Pressable
                            onPress={open}
                            disabled={!target}
                            accessibilityRole={target ? "link" : undefined}
                            accessibilityLabel={target ? `Open ${entityLabel.toLowerCase()} detail` : entityLabel}
                            hitSlop={8}
                        >
                            <Text
                                numberOfLines={1}
                                className={clsx("rounded-md border px-2 py-0.5 text-[11px] font-medium", badge)}
                            >
                                {entityLabel}
                            </Text>
                        </Pressable>
                    )}
                    {!isInteractionMarker && nameText && (
                        <Pressable onPress={open} disabled={!target} hitSlop={8} className="max-w-full flex-shrink">
                            <Text
                                numberOfLines={1}
                                className={clsx(
                                    "text-neutral-600 dark:text-neutral-400",
                                    row.entityName ? "text-sm" : "font-mono text-xs",
                                )}
                            >
                                {nameText}
                            </Text>
                        </Pressable>
                    )}
                </View>

                {isInteractionMarker && row.interaction && <InteractionDetailBlock interaction={row.interaction} />}
                {isFieldChange && (
                    <ActivityDiff
                        oldValue={row.oldData}
                        newValue={row.newData}
                        action={row.action}
                        entityType={entityType}
                    />
                )}
            </View>
        </Card>
    )
}

export default memo(ActivityLogItem)
