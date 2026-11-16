import { ChevronRight, TrendingUp } from "lucide-react-native"
import { useState } from "react"
import { Pressable, Text, View } from "react-native"

import { enableIconClassNames } from "@/lib/iconClassName"
import { toNativeClasses } from "@/lib/nativeClasses"
import { fillMonths, getPercent } from "@/lib/statsChart"
import type { YearBucket } from "@/types/overallStats"

import LeadsMonthlyChart from "./LeadsMonthlyChart"
import MonthTable from "./MonthTable"
import { STATS_CARD_CLASSES, TONE } from "./statsTones"

const ICON_TONE = toNativeClasses(TONE.emerald.icon)

enableIconClassNames(ChevronRight, TrendingUp)

/** One year: a header row that opens and closes it, then the month table and the month chart. */
function YearBlock({ year, isOpen, onToggle }: { year: YearBucket; isOpen: boolean; onToggle: () => void }) {
    const months = fillMonths(year.months)
    const convPct = getPercent(year.converted, year.leads)

    return (
        <View className="overflow-hidden rounded-lg border border-slate-100 dark:border-neutral-800/70">
            <Pressable
                onPress={onToggle}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                accessibilityLabel={`${year.year}: ${year.leads} leads, ${year.converted} converted, ${convPct}%`}
                className="min-h-[44px] flex-row items-center gap-3 px-3 py-2.5 active:bg-slate-50 dark:active:bg-neutral-800/50"
            >
                <View className={isOpen ? "rotate-90" : ""}>
                    <ChevronRight size={16} className="text-neutral-400" />
                </View>
                <Text className="w-14 text-sm font-semibold text-neutral-900 dark:text-white">{year.year}</Text>
                <View className="flex-1 flex-row items-center justify-end gap-4">
                    <View className="flex-row items-center gap-1">
                        <Text className="text-xs font-semibold text-neutral-900 dark:text-white">{year.leads}</Text>
                        <Text className="text-xs text-neutral-500 dark:text-neutral-400">leads</Text>
                    </View>
                    <Text className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {`${year.converted} conv · ${convPct}%`}
                    </Text>
                </View>
            </Pressable>

            {isOpen && (
                <View className="gap-4 border-t border-slate-100 p-3 dark:border-neutral-800/70">
                    <MonthTable months={months} />
                    <LeadsMonthlyChart months={months} />
                </View>
            )}
        </View>
    )
}

/**
 * Leads per year, newest first, each opening to its months. The latest year starts open. Ported from the web's
 * Leadsovertimecard.tsx.
 */
export default function LeadsOverTimeCard({ data }: { data: YearBucket[] }) {
    const [openYears, setOpenYears] = useState<Set<number>>(() => {
        const latestYear = data.length ? Math.max(...data.map((y) => y.year)) : null
        return new Set(latestYear !== null ? [latestYear] : [])
    })

    function toggle(year: number) {
        setOpenYears((prev) => {
            const next = new Set(prev)
            if (next.has(year)) next.delete(year)
            else next.add(year)
            return next
        })
    }

    const years = [...data].sort((a, b) => b.year - a.year)

    return (
        <View className={STATS_CARD_CLASSES}>
            <View className="flex-row items-center justify-between gap-3">
                <View className="flex-row items-center gap-2">
                    <View className={`h-7 w-7 items-center justify-center rounded-md ${ICON_TONE.container}`}>
                        <TrendingUp size={16} className={ICON_TONE.text} />
                    </View>
                    <Text className="text-base font-semibold text-neutral-900 dark:text-white">Leads over time</Text>
                </View>
                <Text className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Monthly
                </Text>
            </View>

            {years.length === 0 ? (
                <View className="mt-6 h-32 items-center justify-center">
                    <Text className="text-sm text-neutral-500">No lead history yet</Text>
                </View>
            ) : (
                <View className="mt-4 gap-2">
                    {years.map((year) => (
                        <YearBlock
                            key={year.year}
                            year={year}
                            isOpen={openYears.has(year.year)}
                            onToggle={() => toggle(year.year)}
                        />
                    ))}
                </View>
            )}
        </View>
    )
}
