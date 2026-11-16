import { Text, View } from "react-native"

import { MONTH_NAMES } from "@/lib/statsChart"
import type { MonthBucket } from "@/types/overallStats"

const HEAD_CLASSES = "text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500"
const DIM_CLASSES = "text-neutral-300 dark:text-neutral-600"

/**
 * One year's 12 months as rows of Month / Total / Converted, with "—" and dim text for a month with no leads. The
 * mobile layout of the web's MonthTable.
 */
export default function MonthTable({ months }: { months: MonthBucket[] }) {
    return (
        <View>
            <View className="flex-row pb-2">
                <Text className={`flex-1 ${HEAD_CLASSES}`}>Month</Text>
                <Text className={`flex-1 text-right ${HEAD_CLASSES}`}>Total</Text>
                <Text className={`flex-1 text-right ${HEAD_CLASSES}`}>Converted</Text>
            </View>
            {months.map((m) => {
                const isEmpty = m.leads === 0
                return (
                    <View
                        key={m.month}
                        accessible
                        accessibilityLabel={
                            isEmpty
                                ? `${MONTH_NAMES[m.month - 1]}: no leads`
                                : `${MONTH_NAMES[m.month - 1]}: ${m.leads} leads, ${m.converted} converted`
                        }
                        className="flex-row border-t border-slate-100 py-2 dark:border-neutral-800"
                    >
                        <Text
                            className={`flex-1 text-xs font-semibold ${
                                isEmpty ? DIM_CLASSES : "text-neutral-700 dark:text-neutral-300"
                            }`}
                        >
                            {MONTH_NAMES[m.month - 1]}
                        </Text>
                        <Text
                            className={`flex-1 text-right text-xs ${
                                isEmpty ? DIM_CLASSES : "font-semibold text-neutral-900 dark:text-white"
                            }`}
                        >
                            {isEmpty ? "—" : m.leads}
                        </Text>
                        <Text
                            className={`flex-1 text-right text-xs ${
                                isEmpty ? DIM_CLASSES : "font-semibold text-emerald-600 dark:text-emerald-400"
                            }`}
                        >
                            {isEmpty ? "—" : m.converted}
                        </Text>
                    </View>
                )
            })}
        </View>
    )
}
