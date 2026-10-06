import clsx from "clsx"
import { useMemo, useState, type ReactElement } from "react"
import { FlatList, Pressable, Text, TextInput, View } from "react-native"

import { FIELD_CLASSES } from "@/components/ui"
import { UPLOAD_ROW_RESULT, type UploadRowResult } from "@/constants/leadSourceStatus"
import type { LeadSourceUploadReport } from "@/types/leadSource"
import { PALETTE } from "@/theme"

import ReportRowCard from "./ReportRowCard"

/** "imported" includes rows imported with warnings, the same as the tiles. */
type Filter = "all" | "imported" | UploadRowResult

interface Props {
    report: LeadSourceUploadReport
    /** The report's header card, scrolled with the rows. */
    header: ReactElement
    onOpenSource: (sourceId: string) => void
}

const PAGE_SIZE = 50

function matches(filter: Filter, result: number): boolean {
    if (filter === "all") return true
    if (filter === "imported") return result !== UPLOAD_ROW_RESULT.SKIPPED
    return result === filter
}

/**
 * Every sheet row of an upload: filter chips, a search over the row number, the cells and the messages, and the row
 * cards 50 at a time. The phone's replacement for the web's ReportGrid table.
 */
export default function ReportRows({ report, header, onOpenSource }: Props) {
    const [filter, setFilter] = useState<Filter>("all")
    const [query, setQuery] = useState("")
    const [shownCount, setShownCount] = useState(PAGE_SIZE)

    const counts = useMemo(() => {
        const totals: Record<UploadRowResult, number> = { 10: 0, 20: 0, 30: 0 }
        for (const row of report.rows) totals[row.result as UploadRowResult] += 1
        return totals
    }, [report.rows])

    const visible = useMemo(() => {
        const term = query.trim().toLowerCase()
        return report.rows.filter((row) => {
            if (!matches(filter, row.result)) return false
            if (!term) return true
            return (
                String(row.n) === term ||
                row.values.some((value) => value.toLowerCase().includes(term)) ||
                row.messages.some((message) => message.toLowerCase().includes(term))
            )
        })
    }, [report.rows, filter, query])

    const chips: { value: Filter; label: string; count: number }[] = [
        { value: "all", label: "All rows", count: report.rows.length },
        {
            value: "imported",
            label: "Imported",
            count: counts[UPLOAD_ROW_RESULT.IMPORTED] + counts[UPLOAD_ROW_RESULT.WARNED],
        },
        { value: UPLOAD_ROW_RESULT.WARNED, label: "With warnings", count: counts[UPLOAD_ROW_RESULT.WARNED] },
        { value: UPLOAD_ROW_RESULT.SKIPPED, label: "Skipped", count: counts[UPLOAD_ROW_RESULT.SKIPPED] },
    ]

    function choose(next: Filter) {
        setFilter(next)
        setShownCount(PAGE_SIZE)
    }

    const controls = report.rows.length > 0 && (
        <View className="gap-2 px-3 pb-2 pt-3">
            <View className="flex-row flex-wrap gap-1.5">
                {chips.map((chip) => {
                    const isActive = filter === chip.value
                    return (
                        <Pressable
                            key={chip.label}
                            onPress={() => choose(chip.value)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isActive }}
                            className={clsx(
                                "min-h-[36px] justify-center rounded-full border px-3",
                                isActive
                                    ? "border-neutral-900 bg-neutral-900 dark:border-white dark:bg-white"
                                    : "border-slate-300 dark:border-neutral-700",
                            )}
                            hitSlop={4}
                        >
                            <Text
                                className={clsx(
                                    "text-xs font-medium",
                                    isActive
                                        ? "text-white dark:text-neutral-900"
                                        : "text-neutral-700 dark:text-neutral-300",
                                )}
                            >
                                {`${chip.label} ${chip.count}`}
                            </Text>
                        </Pressable>
                    )
                })}
            </View>
            <TextInput
                value={query}
                onChangeText={(text) => {
                    setQuery(text)
                    setShownCount(PAGE_SIZE)
                }}
                placeholder="Find in the report"
                placeholderTextColor={PALETTE["neutral-400"]}
                accessibilityLabel="Find in the report"
                autoCapitalize="none"
                autoCorrect={false}
                className={FIELD_CLASSES}
            />
        </View>
    )

    return (
        <FlatList
            data={visible.slice(0, shownCount)}
            keyExtractor={(row) => String(row.n)}
            renderItem={({ item }) => <ReportRowCard row={item} columns={report.columns} onOpenSource={onOpenSource} />}
            ListHeaderComponent={
                <View>
                    <View className="p-3 pb-0">{header}</View>
                    {controls}
                </View>
            }
            ListEmptyComponent={
                report.rows.length > 0 ? (
                    <Text className="px-3 py-8 text-center text-sm text-neutral-500">No rows match.</Text>
                ) : undefined
            }
            ListFooterComponent={<View className="h-10" />}
            onEndReached={() => setShownCount((count) => (count < visible.length ? count + PAGE_SIZE : count))}
            onEndReachedThreshold={0.5}
            keyboardShouldPersistTaps="handled"
        />
    )
}
