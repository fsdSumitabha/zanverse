import { ArrowRight, ArrowRightLeft } from "lucide-react-native"
import { useState } from "react"
import { Text, View } from "react-native"

import { Badge } from "@/components/ui"
import { INTERACTION_TYPE_META } from "@/constants/interactionTypes"
import { STATUS_META_BY_ENTITY } from "@/constants/statusMetaByEntity"
import { useAuth } from "@/contexts/AuthContext"
import { enableIconClassNames } from "@/lib/iconClassName"

import { canEditInteraction } from "../canEditInteraction"
import EditHistory from "../EditHistory"
import InteractionEditor from "../InteractionEditor"
import InteractionRowFrame from "../InteractionRowFrame"
import RowHeader from "../RowHeader"
import type { TimelineItem } from "../timelineTypes"

interface Props {
    entityType: number
    item: TimelineItem
    onChanged?: () => void
}

interface StatusMeta {
    label: string
    decoration?: string
}

enableIconClassNames(ArrowRight)

function parseTransition(title: string | undefined): { action?: string; from?: number; to?: number } | null {
    try {
        return title ? JSON.parse(title) : null
    } catch {
        return null
    }
}

/**
 * A status change (2510): the from → to pills, which never change, and the remarks, which can be edited. Ported from
 * the web's StatusChangeItem.tsx.
 */
export default function StatusChangeItem({ entityType, item, onChanged }: Props) {
    const { role } = useAuth()
    const allowed = canEditInteraction(role)
    const [editing, setEditing] = useState(false)

    const parsed = parseTransition(item.title)
    const statusMeta = STATUS_META_BY_ENTITY[entityType as keyof typeof STATUS_META_BY_ENTITY] as
        | Record<number, StatusMeta | undefined>
        | undefined
    const fromMeta = parsed?.from !== undefined ? statusMeta?.[parsed.from] : null
    const toMeta = parsed?.to !== undefined ? statusMeta?.[parsed.to] : null

    return (
        <InteractionRowFrame icon={ArrowRightLeft} createdBy={item.createdBy}>
            <RowHeader
                createdAt={item.createdAt}
                onEdit={allowed && !editing ? () => setEditing(true) : undefined}
                editLabel="Edit remarks"
            >
                <Text className="text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-300">
                    Status Changed
                </Text>
                <Badge meta={INTERACTION_TYPE_META} status={item.type} />
            </RowHeader>

            {fromMeta && toMeta && (
                <View className="flex-row flex-wrap items-center gap-2">
                    <Text
                        className={`px-2 py-0.5 text-sm text-neutral-800 dark:text-neutral-200 ${
                            fromMeta.decoration ?? ""
                        }`}
                    >
                        {fromMeta.label}
                    </Text>
                    <ArrowRight size={16} className="text-gray-400" />
                    <Text
                        className={`px-2 py-0.5 text-sm text-neutral-800 dark:text-neutral-200 ${
                            toMeta.decoration ?? ""
                        }`}
                    >
                        {toMeta.label}
                    </Text>
                </View>
            )}

            {editing ? (
                <InteractionEditor
                    interactionId={String(item._id)}
                    initialDescription={item.description ?? ""}
                    showTitle={false}
                    onCancel={() => setEditing(false)}
                    onSaved={() => {
                        setEditing(false)
                        onChanged?.()
                    }}
                />
            ) : (
                !!item.description && (
                    <Text className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{item.description}</Text>
                )
            )}

            {!editing && (
                <EditHistory history={item.editHistory} createdBy={item.createdBy} createdAt={item.createdAt} />
            )}
        </InteractionRowFrame>
    )
}
