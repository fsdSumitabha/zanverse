import clsx from "clsx"
import { AlarmClock, ArrowUpRight, CalendarClock } from "lucide-react-native"
import { memo } from "react"
import { Pressable, Text, View } from "react-native"

import { Avatar } from "@/components/ui"
import { LEAD_SOURCE_STATUS } from "@/constants/leadSourceStatus"
import { useRegion } from "@/contexts/RegionContext"
import { callbackState, formatCallback, relativeCallback } from "@/lib/callback"
import { enableIconClassNames } from "@/lib/iconClassName"
import { toNativeClasses } from "@/lib/nativeClasses"
import { formatPhoneForDisplay } from "@/lib/phone"
import type { LeadSourceRow as Row, LeadSourceView } from "@/types/leadSource"

import CallButton from "./CallButton"
import { CALLBACK_TONES, getDayChip, getRowHeight, ROW_HEIGHT } from "./rowLayout"
import { StatusBadgeButton } from "./StatusMenuSheet"

interface Props {
    row: Row
    view: LeadSourceView
    today: string
    now: number
    isSelected: boolean
    /** True while any row is selected. Rows then toggle on a tap, and the call buttons hide. */
    isSelecting: boolean
    showAssignee: boolean
    onOpen: (row: Row) => void
    onToggle: (id: string) => void
    /** Opens the status sheet, starting on `status`. */
    onOpenStatus: (row: Row, status: number) => void
    /** Opens the callback sheet, to change or clear the time. */
    onOpenCallback: (row: Row) => void
    onOpenLead: (leadId: string) => void
}

const SKELETON_STYLE = { height: ROW_HEIGHT }

enableIconClassNames(AlarmClock, ArrowUpRight, CalendarClock)

function initials(name: string): string {
    const parts = name.trim().split(/\s+/)
    return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?"
}

/** Who the source is assigned to: their photo, their initials, or a dashed "?" when nobody. */
function AssigneeChip({ assignee }: { assignee: Row["assignee"] }) {
    if (assignee?.avatar) return <Avatar uri={assignee.avatar} size={28} name={assignee.name} />
    return (
        <View
            accessible
            accessibilityLabel={assignee ? `Assigned to ${assignee.name}` : "Not assigned"}
            className={clsx(
                "h-7 w-7 items-center justify-center rounded-full",
                assignee
                    ? "bg-emerald-100 dark:bg-emerald-500/15"
                    : "border border-dashed border-neutral-300 dark:border-neutral-600",
            )}
        >
            <Text
                className={clsx(
                    "text-[10px] font-semibold",
                    assignee ? "text-emerald-800 dark:text-emerald-300" : "text-neutral-400",
                )}
            >
                {assignee ? initials(assignee.name) : "?"}
            </Text>
        </View>
    )
}

/**
 * One lead source: name and list info, the phone and the newest note, then the chips; on the right the assignee,
 * the status badge and the call button. Ported from the web's LeadSourceRow.tsx. Long-press starts a selection.
 */
function LeadSourceRow({
    row,
    view,
    today,
    now,
    isSelected,
    isSelecting,
    showAssignee,
    onOpen,
    onToggle,
    onOpenStatus,
    onOpenCallback,
    onOpenLead,
}: Props) {
    const { phoneCountry } = useRegion()
    const state = row.callbackAt ? callbackState(row.callbackAt, now) : null
    const isDue = state === "due"
    const isConverted = row.status === LEAD_SOURCE_STATUS.CONVERTED
    const dayChip = getDayChip(row, view, today)
    const callbackTone = state
        ? toNativeClasses(`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${CALLBACK_TONES[state]}`)
        : null
    const dayTone = dayChip ? toNativeClasses(`rounded-full px-2 py-0.5 text-[11px] font-medium ${dayChip.tone}`) : null

    return (
        <Pressable
            onPress={() => (isSelecting ? onToggle(row._id) : onOpen(row))}
            onLongPress={() => onToggle(row._id)}
            accessibilityRole="button"
            accessibilityLabel={row.name}
            testID="leadSourceRow"
            accessibilityState={{ selected: isSelected }}
            className={clsx(
                "flex-row items-center gap-2.5 border-b border-l-4 border-b-slate-100 py-2 pl-2 pr-2.5 dark:border-b-neutral-800",
                isSelected
                    ? "border-l-blue-500 bg-blue-50 dark:bg-blue-500/10"
                    : isDue
                    ? "border-l-rose-500 bg-rose-50 dark:bg-rose-500/10"
                    : "border-l-transparent bg-white active:bg-slate-50 dark:bg-neutral-900 dark:active:bg-neutral-800",
            )}
            style={{ height: getRowHeight(row, view, today) }}
        >
            <View className="min-w-0 flex-1 gap-0.5">
                <View className="min-w-0 flex-row items-baseline gap-2">
                    <Text
                        numberOfLines={1}
                        className="flex-shrink text-sm font-semibold text-neutral-900 dark:text-neutral-100"
                    >
                        {row.name}
                    </Text>
                    {row.listInfo.length > 0 && (
                        <Text numberOfLines={1} className="flex-shrink text-xs text-neutral-500 dark:text-neutral-400">
                            {row.listInfo.join(" · ")}
                        </Text>
                    )}
                    {isConverted && !!row.convertedLeadId && (
                        <Pressable
                            onPress={() => onOpenLead(row.convertedLeadId ?? "")}
                            accessibilityRole="link"
                            hitSlop={10}
                            className="flex-row items-center"
                        >
                            <Text className="text-xs font-medium text-blue-600 dark:text-blue-400">Lead</Text>
                            <ArrowUpRight size={12} className="text-blue-600 dark:text-blue-400" />
                        </Pressable>
                    )}
                </View>

                <View className="min-w-0 flex-row items-center gap-1.5">
                    <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                        {formatPhoneForDisplay(row.phone, phoneCountry)}
                    </Text>
                    {!!row.lastNote && (
                        <Text numberOfLines={1} className="flex-1 text-xs text-neutral-400 dark:text-neutral-500">
                            · {row.lastNote}
                        </Text>
                    )}
                </View>

                {(callbackTone || dayTone) && (
                    <View className="mt-1 flex-row items-center gap-1.5">
                        {callbackTone && row.callbackAt && (
                            <Pressable
                                onPress={() => onOpenCallback(row)}
                                disabled={isSelecting}
                                accessibilityRole="button"
                                accessibilityLabel={`Callback ${formatCallback(row.callbackAt)}, ${relativeCallback(
                                    row.callbackAt,
                                    now,
                                )}`}
                                hitSlop={8}
                                className={clsx("flex-row items-center gap-1", callbackTone.container)}
                            >
                                <AlarmClock size={12} className={callbackTone.text} />
                                <Text className={callbackTone.text}>{formatCallback(row.callbackAt)}</Text>
                            </Pressable>
                        )}
                        {dayTone && dayChip && (
                            <View
                                accessible
                                accessibilityLabel={dayChip.title}
                                className={clsx("flex-row items-center gap-1", dayTone.container)}
                            >
                                <CalendarClock size={12} className={dayTone.text} />
                                <Text className={dayTone.text}>{dayChip.text}</Text>
                            </View>
                        )}
                    </View>
                )}
            </View>

            <View className="flex-row items-center gap-2">
                {showAssignee && <AssigneeChip assignee={row.assignee} />}
                <StatusBadgeButton
                    status={row.status}
                    disabled={isSelecting}
                    onPress={() => onOpenStatus(row, row.status)}
                />
                {/* Hidden while selecting, so a stray tap cannot start a call when the person meant to pick rows. */}
                {isSelecting ? (
                    <View className="h-10 w-10" />
                ) : (
                    <CallButton name={row.name} phone={row.phone} status={row.status} />
                )}
            </View>
        </Pressable>
    )
}

export default memo(LeadSourceRow)

/** A row while the list loads. */
export function LeadSourceRowSkeleton() {
    return (
        <View
            accessibilityLabel="Loading"
            className="flex-row items-center gap-3 border-b border-slate-100 bg-white py-2 pl-3 pr-2.5 dark:border-neutral-800 dark:bg-neutral-900"
            style={SKELETON_STYLE}
        >
            <View className="flex-1 gap-1.5">
                <View className="h-3.5 w-2/5 rounded bg-neutral-200 dark:bg-neutral-800" />
                <View className="h-3 w-3/5 rounded bg-neutral-100 dark:bg-neutral-800" />
            </View>
            <View className="h-6 w-20 rounded-md bg-neutral-200 dark:bg-neutral-800" />
            <View className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-800" />
        </View>
    )
}
