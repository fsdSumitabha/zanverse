import { Text, View } from "react-native"

import { LEAD_SOURCE_COLUMNS } from "@/constants/leadSourceColumns"
import { isDayString } from "@/lib/leadSourceDay"

const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** "2021-04-03" becomes "3 Apr 2021". Anything else stays as it is. */
function showDay(value: string): string {
    if (!isDayString(value)) return value
    const [y, m, d] = value.split("-").map(Number)
    return `${d} ${MONTH[m - 1]} ${y}`
}

/** "website_url" becomes "Website url". For columns that are not in the config. */
function humanize(key: string): string {
    const text = key.replace(/_/g, " ").trim()
    return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Every value the sheet row held, with the labels from leadSourceColumns.ts, in the same order. Columns the config
 * does not know come last, under a name made from their header. Empty cells are left out. Ported from the web's
 * SheetData.tsx.
 */
export default function SheetData({ data }: { data: Record<string, string> }) {
    const known = new Set(LEAD_SOURCE_COLUMNS.map((column) => column.key))
    const entries = [
        ...LEAD_SOURCE_COLUMNS.filter((column) => data[column.key]).map((column) => ({
            label: column.label,
            value: column.kind === "date" ? showDay(data[column.key]) : data[column.key],
            isExtra: false,
        })),
        ...Object.entries(data)
            .filter(([key, value]) => !known.has(key) && value)
            .map(([key, value]) => ({ label: humanize(key), value, isExtra: true })),
    ]

    if (entries.length === 0) {
        return <Text className="text-sm text-neutral-500">The sheet row had no other values.</Text>
    }

    return (
        <View className="gap-3">
            {entries.map((entry) => (
                <View key={entry.label} className="min-w-0">
                    <Text className="text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                        {entry.label}
                        {entry.isExtra && (
                            <Text className="normal-case tracking-normal text-neutral-400"> (extra column)</Text>
                        )}
                    </Text>
                    <Text selectable className="mt-0.5 text-sm text-neutral-900 dark:text-neutral-100">
                        {entry.value}
                    </Text>
                </View>
            ))}
        </View>
    )
}
