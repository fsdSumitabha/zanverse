import clsx from "clsx"
import { ArrowRight } from "lucide-react-native"
import { memo, useState } from "react"
import { Pressable, Text, View } from "react-native"

import { UPLOAD_ROW_RESULT_META, type UploadRowResult } from "@/constants/leadSourceStatus"
import { enableIconClassNames } from "@/lib/iconClassName"
import { toNativeClasses } from "@/lib/nativeClasses"
import type { LeadSourceUploadReport } from "@/types/leadSource"

type ReportRow = LeadSourceUploadReport["rows"][number]

interface Props {
    row: ReportRow
    columns: LeadSourceUploadReport["columns"]
    onOpenSource: (sourceId: string) => void
}

// Cells shown before a tap expands the card.
const PREVIEW_CELLS = 4

enableIconClassNames(ArrowRight)

/**
 * One sheet row of the report, as a card: the row number, the result, why, and its cells. A tap shows every cell.
 * The phone's replacement for a line of the web's ReportGrid.
 */
function ReportRowCard({ row, columns, onOpenSource }: Props) {
    const [isExpanded, setIsExpanded] = useState(false)
    const meta = UPLOAD_ROW_RESULT_META[row.result as UploadRowResult]
    const chip = toNativeClasses(`rounded px-1.5 py-0.5 text-[11px] font-semibold ${meta?.chip ?? ""}`)
    const cells = row.values
        .map((value, index) => ({ header: columns[index]?.header ?? `Column ${index + 1}`, value, index }))
        .filter((cell) => cell.value)
    const shown = isExpanded ? cells : cells.slice(0, PREVIEW_CELLS)

    return (
        <Pressable
            onPress={() => setIsExpanded((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel={`Row ${row.n}, ${meta?.label ?? ""}`}
            accessibilityState={{ expanded: isExpanded }}
            className={clsx(
                "gap-1.5 border-b border-slate-200 bg-white px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900",
                meta?.row,
            )}
        >
            <View className="flex-row items-center justify-between gap-2">
                <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Row {row.n}</Text>
                {meta && (
                    <View className={chip.container}>
                        <Text className={chip.text}>{meta.label}</Text>
                    </View>
                )}
            </View>
            {row.messages.map((message) => (
                <Text key={message} className="text-xs text-neutral-700 dark:text-neutral-300">
                    {message}
                </Text>
            ))}
            {shown.map((cell) => (
                <Text
                    key={cell.index}
                    numberOfLines={isExpanded ? undefined : 1}
                    className="text-xs text-neutral-600 dark:text-neutral-400"
                >
                    <Text className="font-medium text-neutral-800 dark:text-neutral-200">{cell.header}:</Text>{" "}
                    {cell.value}
                </Text>
            ))}
            {!isExpanded && cells.length > PREVIEW_CELLS && (
                <Text className="text-xs text-neutral-400">+{cells.length - PREVIEW_CELLS} more. Tap to show.</Text>
            )}
            {!!row.sourceId && (
                <Pressable
                    onPress={() => row.sourceId && onOpenSource(row.sourceId)}
                    accessibilityRole="link"
                    accessibilityLabel={`Open the lead source from row ${row.n}`}
                    className="min-h-[44px] flex-row items-center gap-1 self-start"
                >
                    <Text className="text-xs font-medium text-blue-600 dark:text-blue-400">Open this lead source</Text>
                    <ArrowRight size={14} className="text-blue-600 dark:text-blue-400" />
                </Pressable>
            )}
        </Pressable>
    )
}

export default memo(ReportRowCard)
