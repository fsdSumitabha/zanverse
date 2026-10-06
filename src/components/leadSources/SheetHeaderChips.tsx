import clsx from "clsx"
import { Text, View } from "react-native"

import type { SheetColumnInfo } from "@/hooks/useSheetColumns"

/**
 * The expected header row, from the server: required names in rose, the rest grey. Before the API has the columns
 * route, a line points to the template instead.
 */
export default function SheetHeaderChips({ columns }: { columns: SheetColumnInfo[] | null }) {
    if (!columns) {
        return (
            <Text className="text-xs text-neutral-600 dark:text-neutral-300">
                Download the template to see the expected header row.
            </Text>
        )
    }

    return (
        <View className="gap-2">
            <Text className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                Header row. Names in red are required. Case, spaces and underscores do not matter.
            </Text>
            <View className="flex-row flex-wrap gap-1.5">
                {columns.map((column) => (
                    <Text
                        key={column.key}
                        accessibilityLabel={`${column.label}${column.required ? ", required" : ""}`}
                        className={clsx(
                            "rounded-md px-2 py-0.5 font-mono text-[11px]",
                            column.required
                                ? "border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                                : "bg-slate-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
                        )}
                    >
                        {column.headers[0] ?? column.key}
                    </Text>
                ))}
            </View>
        </View>
    )
}
