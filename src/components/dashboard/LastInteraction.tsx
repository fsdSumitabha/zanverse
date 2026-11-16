import {
    ArrowLeftRight,
    ArrowRight,
    ArrowRightLeft,
    Briefcase,
    Calendar,
    Check,
    FileText,
    Phone,
    RefreshCw,
    X,
    type LucideIcon,
} from "lucide-react-native"
import { Text, View } from "react-native"

import { TimeAgo } from "@/components/ui"
import { INTERACTION_TYPE, INTERACTION_TYPE_META, type InteractionType } from "@/constants/interactionTypes"
import { STATUS_META_BY_ENTITY } from "@/constants/statusMetaByEntity"
import { enableIconClassNames } from "@/lib/iconClassName"
import type { FeedItem } from "@/hooks/useDashboardFeed"

type Interaction = NonNullable<FeedItem["lastInteraction"]>

// The web InteractionCard's getIcon switch, as a map. Unknown names fall back to FileText.
const ICONS: Record<string, LucideIcon> = {
    calendar: Calendar,
    check: Check,
    times: X,
    refresh: RefreshCw,
    file: FileText,
    phone: Phone,
    doc: FileText,
    briefcase: Briefcase,
    "exchange-alt": ArrowLeftRight,
}
const NOTE_ADDED = 2110

enableIconClassNames(
    ArrowLeftRight,
    ArrowRight,
    ArrowRightLeft,
    Briefcase,
    Calendar,
    Check,
    FileText,
    Phone,
    RefreshCw,
    X,
)

function parseTransition(title: string): { from?: number; to?: number } | null {
    try {
        return JSON.parse(title)
    } catch {
        return null
    }
}

/** A status change, read-only: the from → to labels with their underline colours. The web's StatusChangeItem. */
function StatusChange({ entityType, item }: { entityType: number; item: Interaction }) {
    const parsed = parseTransition(item.title)
    const meta = STATUS_META_BY_ENTITY[entityType as keyof typeof STATUS_META_BY_ENTITY]
    const fromMeta = parsed?.from !== undefined ? meta?.[parsed.from] : null
    const toMeta = parsed?.to !== undefined ? meta?.[parsed.to] : null

    return (
        <View className="flex-row items-start gap-3 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
            <View className="rounded-lg bg-neutral-100 p-2 dark:bg-neutral-800">
                <ArrowRightLeft size={16} className="text-neutral-600 dark:text-neutral-300" />
            </View>
            <View className="flex-1 gap-2">
                <View className="flex-row items-center justify-between gap-2">
                    <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Status Changed</Text>
                    <TimeAgo date={item.createdAt} />
                </View>
                {fromMeta && toMeta && (
                    <View className="flex-row flex-wrap items-center gap-2">
                        <Text
                            className={`px-2 py-0.5 text-sm text-gray-800 dark:text-gray-300 ${
                                fromMeta.decoration ?? ""
                            }`}
                        >
                            {fromMeta.label}
                        </Text>
                        <ArrowRight size={16} className="text-gray-400" />
                        <Text
                            className={`px-2 py-0.5 text-sm text-gray-800 dark:text-gray-300 ${
                                toMeta.decoration ?? ""
                            }`}
                        >
                            {toMeta.label}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    )
}

/**
 * A feed card's latest interaction: a status change shows its two statuses; anything else a compact row in its
 * interaction colour. Ported from the web's EntityCard, InteractionCard and StatusChangeItem.
 */
export default function LastInteraction({ entityType, item }: { entityType: number; item: Interaction }) {
    if (item.type === INTERACTION_TYPE.STATUS_CHANGED) return <StatusChange entityType={entityType} item={item} />

    const meta = INTERACTION_TYPE_META[item.type as InteractionType] ?? INTERACTION_TYPE_META[NOTE_ADDED]
    const Icon = ICONS[meta.icon] ?? FileText
    return (
        <View className={`rounded-lg border-l-4 p-3 pl-4 ${meta.color}`}>
            <View className="flex-row items-start gap-2">
                <Icon size={16} className="mt-0.5 text-neutral-700 dark:text-neutral-200" />
                <View className="flex-1">
                    <View className="flex-row flex-wrap items-center gap-2">
                        <Text className="text-sm font-medium text-neutral-800 dark:text-neutral-100">{item.title}</Text>
                        <Text className="rounded bg-black/5 px-2 py-0.5 text-[10px] text-neutral-700 dark:bg-white/10 dark:text-neutral-200">
                            {meta.label}
                        </Text>
                    </View>
                    <View className="mt-2">
                        <TimeAgo date={item.createdAt} className="text-xs text-neutral-400" />
                    </View>
                </View>
            </View>
        </View>
    )
}
