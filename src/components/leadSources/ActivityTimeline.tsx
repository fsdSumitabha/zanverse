import {
    AlarmClock,
    ArrowRightLeft,
    CalendarDays,
    FileUp,
    ListChecks,
    StickyNote,
    UserRound,
    type LucideIcon,
} from "lucide-react-native"
import type { ReactNode } from "react"
import { Text, View } from "react-native"

import { Badge, TimeAgo } from "@/components/ui"
import { LEAD_SOURCE_ACTIVITY, LEAD_SOURCE_STATUS_META } from "@/constants/leadSourceStatus"
import { formatCallback } from "@/lib/callback"
import { enableIconClassNames } from "@/lib/iconClassName"
import { formatDay } from "@/lib/leadSourceDay"
import type { LeadSourceActivityItem } from "@/types/leadSource"

const ICON: Record<number, LucideIcon> = {
    [LEAD_SOURCE_ACTIVITY.UPLOADED]: FileUp,
    [LEAD_SOURCE_ACTIVITY.NOTE]: StickyNote,
    [LEAD_SOURCE_ACTIVITY.STATUS]: ListChecks,
    [LEAD_SOURCE_ACTIVITY.CALLBACK]: AlarmClock,
    [LEAD_SOURCE_ACTIVITY.ASSIGNED]: UserRound,
    [LEAD_SOURCE_ACTIVITY.DAY]: CalendarDays,
    [LEAD_SOURCE_ACTIVITY.CONVERTED]: ArrowRightLeft,
}
const TEXT = "text-sm text-neutral-600 dark:text-neutral-400"
const STRONG = "font-medium text-neutral-800 dark:text-neutral-200"

enableIconClassNames(AlarmClock, ArrowRightLeft, CalendarDays, FileUp, ListChecks, StickyNote, UserRound)

function strong(value: ReactNode) {
    return <Text className={STRONG}>{value}</Text>
}

/** A day inside a sentence: "today", "tomorrow", or "Mon 28 Sep". */
function dayInSentence(day: string): string {
    const text = formatDay(day)
    return ["Today", "Tomorrow", "Yesterday"].includes(text) ? text.toLowerCase() : text
}

/** "to call today", "to call on Mon 28 Sep". */
function toCallOn(day: string): string {
    const text = dayInSentence(day)
    return /^(today|tomorrow|yesterday)$/.test(text) ? `to call ${text}` : `to call on ${text}`
}

/** The words after the person's name, for every type but a status change. Verbatim from the web. */
function describe(a: LeadSourceActivityItem): ReactNode {
    switch (a.type) {
        case LEAD_SOURCE_ACTIVITY.UPLOADED: {
            const to = (a.to ?? {}) as { assignee?: string | null; day?: string | null }
            return (
                <>
                    uploaded it from {strong(a.text)}
                    {to.assignee && <>, for {strong(to.assignee)}</>}
                    {to.day && <> {strong(toCallOn(to.day))}</>}
                </>
            )
        }
        case LEAD_SOURCE_ACTIVITY.NOTE:
            return "added a note"
        case LEAD_SOURCE_ACTIVITY.CALLBACK:
            return a.callbackAt ? (
                <>
                    set a callback for {strong(formatCallback(a.callbackAt))}
                    {a.to !== undefined && a.from !== a.to && " and marked it Call Back"}
                </>
            ) : (
                "cleared the callback"
            )
        case LEAD_SOURCE_ACTIVITY.ASSIGNED:
            return a.to ? (
                <>
                    assigned it to {strong(String(a.to))}
                    {a.from ? ` (was ${String(a.from)})` : null}
                </>
            ) : (
                <>removed the assignee{a.from ? ` (${String(a.from)})` : null}</>
            )
        case LEAD_SOURCE_ACTIVITY.DAY:
            return a.to ? (
                <>
                    moved it to {strong(dayInSentence(String(a.to)))}
                    {a.from ? ` (was ${dayInSentence(String(a.from))})` : null}
                </>
            ) : (
                "removed the day"
            )
        case LEAD_SOURCE_ACTIVITY.CONVERTED:
            return "converted it to a lead"
        default:
            return "made a change"
    }
}

/** A status change: the pills sit between the words, so the sentence is a wrapping row of pieces. */
function StatusSentence({ item }: { item: LeadSourceActivityItem }) {
    const from = Number(item.from)
    const to = Number(item.to)
    return (
        <>
            {item.from === item.to ? (
                <>
                    <Text className={TEXT}>marked it</Text>
                    <Badge meta={LEAD_SOURCE_STATUS_META} status={to} size="sm" />
                    <Text className={TEXT}>again</Text>
                </>
            ) : (
                <>
                    <Text className={TEXT}>changed</Text>
                    <Badge meta={LEAD_SOURCE_STATUS_META} status={from} size="sm" />
                    <Text className={TEXT}>to</Text>
                    <Badge meta={LEAD_SOURCE_STATUS_META} status={to} size="sm" />
                </>
            )}
            {!!item.callbackAt && <Text className={TEXT}>, call back {strong(formatCallback(item.callbackAt))}</Text>}
        </>
    )
}

/** What happened to a lead source, newest first (the API reverses the stored order). Ported from the web. */
export default function ActivityTimeline({ items }: { items: LeadSourceActivityItem[] }) {
    if (items.length === 0) {
        return <Text className="py-6 text-center text-sm text-neutral-500">Nothing yet.</Text>
    }

    return (
        <View className="gap-4">
            {items.map((item) => {
                const Icon = ICON[item.type] ?? StickyNote
                const isStatus = item.type === LEAD_SOURCE_ACTIVITY.STATUS
                return (
                    <View key={item._id} className="flex-row gap-2.5">
                        <View className="h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
                            <Icon size={14} className="text-neutral-500 dark:text-neutral-400" />
                        </View>
                        <View className="min-w-0 flex-1 gap-1.5">
                            <View className="flex-row flex-wrap items-center gap-x-1 gap-y-0.5">
                                {isStatus ? (
                                    <>
                                        <Text className={`${TEXT} ${STRONG}`}>{item.byName || "Someone"}</Text>
                                        <StatusSentence item={item} />
                                    </>
                                ) : (
                                    <Text className={TEXT}>
                                        {strong(item.byName || "Someone")} {describe(item)}
                                    </Text>
                                )}
                                <Text className={TEXT}>·</Text>
                                <TimeAgo date={item.at} className={TEXT} />
                            </View>
                            {!!item.text && item.type !== LEAD_SOURCE_ACTIVITY.UPLOADED && (
                                <Text
                                    selectable
                                    className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-200"
                                >
                                    {item.text}
                                </Text>
                            )}
                        </View>
                    </View>
                )
            })}
        </View>
    )
}
