import clsx from "clsx"
import { Activity, ArrowRight } from "lucide-react-native"
import { Pressable, Text, View } from "react-native"

import { CLIENT_STATUS_META } from "@/constants/clientStatus"
import { ENTITY_TYPE, ENTITY_TYPE_META, type EntityType } from "@/constants/entityTypes"
import { INTERACTION_TYPE, INTERACTION_TYPE_META } from "@/constants/interactionTypes"
import { LEAD_STATUS_META } from "@/constants/leadStatus"
import { PROJECT_STATUS_META } from "@/constants/projectStatus"
import { useAuth } from "@/contexts/AuthContext"
import { enableIconClassNames } from "@/lib/iconClassName"
import type { InteractionDetail } from "@/types/activityLog"

import { getInteractionParentTarget, openActivityTarget } from "./entityTarget"

const FALLBACK_CHIP = "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
const FALLBACK_STATUS = "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"

enableIconClassNames(Activity, ArrowRight)

function statusMetaFor(parentType: EntityType | null, code: number) {
    if (parentType === ENTITY_TYPE.LEAD) return LEAD_STATUS_META[code as keyof typeof LEAD_STATUS_META]
    if (parentType === ENTITY_TYPE.CLIENT) return CLIENT_STATUS_META[code as keyof typeof CLIENT_STATUS_META]
    if (parentType === ENTITY_TYPE.PROJECT) return PROJECT_STATUS_META[code as keyof typeof PROJECT_STATUS_META]
    return null
}

/** STATUS_CHANGED interactions carry `{ from, to }` as JSON in their title. Null for any other shape. */
function parseStatusTitle(title: string | null): { from: number; to: number } | null {
    if (!title) return null
    try {
        const value = JSON.parse(title) as { from?: unknown; to?: unknown }
        if (typeof value.from === "number" && typeof value.to === "number") return { from: value.from, to: value.to }
    } catch {
        // Not JSON, which is fine.
    }
    return null
}

/**
 * The summary of an interaction row: its type chip and "on Lead — Acme", which opens the parent. Falls back to
 * "Logged an activity" when the API did not enrich the row. Ported from the web's InteractionLine.
 */
export function InteractionLine({ interaction }: { interaction: InteractionDetail | null }) {
    const { role } = useAuth()
    if (!interaction) {
        return (
            <View className="flex-row items-center gap-1">
                <Activity size={12} className="text-neutral-500 dark:text-neutral-400" />
                <Text className="text-[11px] italic text-neutral-500 dark:text-neutral-400">Logged an activity</Text>
            </View>
        )
    }

    const meta = INTERACTION_TYPE_META[interaction.type as keyof typeof INTERACTION_TYPE_META]
    const target = getInteractionParentTarget(interaction.parentEntityType, interaction.parentEntityId)
    const parentLabel =
        interaction.parentEntityType !== null ? ENTITY_TYPE_META[interaction.parentEntityType]?.label : null
    const parentText = `${parentLabel}${interaction.parentEntityName ? ` — ${interaction.parentEntityName}` : ""}`

    return (
        <View className="flex-row flex-wrap items-center gap-1.5">
            <Text className={clsx("rounded-md px-2 py-0.5 text-[11px] font-medium", meta?.color ?? FALLBACK_CHIP)}>
                {meta?.label ?? "Activity"}
            </Text>
            {!!parentLabel && (
                <>
                    <Text className="text-sm text-neutral-500">on</Text>
                    {target ? (
                        <Pressable
                            onPress={() => openActivityTarget(target, role)}
                            accessibilityRole="link"
                            hitSlop={8}
                        >
                            <Text className="text-sm font-medium text-blue-600 dark:text-blue-400">{parentText}</Text>
                        </Pressable>
                    ) : (
                        <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{parentText}</Text>
                    )}
                </>
            )}
        </View>
    )
}

/** Under an interaction row: the from → to status pills of a status change, and the remarks. */
export function InteractionDetailBlock({ interaction }: { interaction: InteractionDetail }) {
    const transition = interaction.type === INTERACTION_TYPE.STATUS_CHANGED ? parseStatusTitle(interaction.title) : null
    const fromMeta = transition ? statusMetaFor(interaction.parentEntityType, transition.from) : null
    const toMeta = transition ? statusMetaFor(interaction.parentEntityType, transition.to) : null

    if (!transition && !interaction.description) return null

    return (
        <View className="mt-2 gap-1.5">
            {transition && (
                <View className="flex-row flex-wrap items-center gap-2">
                    <Text
                        className={clsx(
                            "rounded-md px-2 py-0.5 text-xs font-medium",
                            fromMeta?.color ?? FALLBACK_STATUS,
                        )}
                    >
                        {fromMeta?.label ?? `Status #${transition.from}`}
                    </Text>
                    <ArrowRight size={14} className="text-neutral-400" />
                    <Text
                        className={clsx("rounded-md px-2 py-0.5 text-xs font-medium", toMeta?.color ?? FALLBACK_STATUS)}
                    >
                        {toMeta?.label ?? `Status #${transition.to}`}
                    </Text>
                </View>
            )}
            {!!interaction.description && (
                <Text className="text-sm text-neutral-600 dark:text-neutral-400">
                    <Text className="text-neutral-500">Remarks: </Text>
                    {interaction.description}
                </Text>
            )}
        </View>
    )
}
