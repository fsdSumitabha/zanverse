import { CalendarClock, TrendingUp, Users, Wallet, type LucideIcon } from "lucide-react-native"
import { Text, View } from "react-native"

import { enableIconClassNames } from "@/lib/iconClassName"
import { toNativeClasses } from "@/lib/nativeClasses"
import { formatInrCompact } from "@/lib/statsChart"
import type { OverallStats } from "@/types/overallStats"

import { TONE, type Tone } from "./statsTones"

interface Kpi {
    icon: LucideIcon
    tone: Tone
    label: string
    value: string
    subtitle: string
}

enableIconClassNames(CalendarClock, TrendingUp, Users, Wallet)

/** The conversion headline: "—" while no lead is converted or lost, where the web would print "NaN%". */
export function getConversionLabel(rate: number | null): string {
    return rate === null ? "—" : `${Math.round(rate * 100)}%`
}

function getKpis(data: OverallStats): Kpi[] {
    return [
        {
            icon: TrendingUp,
            tone: "emerald",
            label: "Conversion",
            value: getConversionLabel(data.leads.conversionRate),
            subtitle: `${data.leads.converted} of ${data.leads.total} leads`,
        },
        {
            icon: Wallet,
            tone: "amber",
            label: "Active budget",
            value: formatInrCompact(data.projects.totalBudgetRunning),
            subtitle: `${data.projects.running} projects running`,
        },
        {
            icon: CalendarClock,
            tone: "blue",
            label: "Upcoming",
            value: String(data.meetings.upcoming),
            subtitle: `${data.meetings.thisWeek} this week · ${data.meetings.today} today`,
        },
        {
            icon: Users,
            tone: "rose",
            label: "Active team",
            value: String(data.users.active),
            subtitle: `${data.users.total} total${data.users.inactive > 0 ? ` · ${data.users.inactive} inactive` : ""}`,
        },
    ]
}

/** The four headline numbers as a 2x2 grid. Ported from the web's KpiCard row. */
export default function KpiRow({ data }: { data: OverallStats }) {
    return (
        <View className="flex-row flex-wrap justify-between gap-y-3">
            {getKpis(data).map((kpi) => {
                const Icon = kpi.icon
                const tone = toNativeClasses(TONE[kpi.tone].icon)
                return (
                    <View
                        key={kpi.label}
                        accessible
                        accessibilityLabel={`${kpi.label}: ${kpi.value}, ${kpi.subtitle}`}
                        className="w-[48.5%] rounded-lg border border-slate-200 bg-white p-4 dark:rounded-xl dark:border-neutral-800 dark:bg-neutral-900"
                    >
                        <View className="mb-2 flex-row items-center gap-2">
                            <View className={`h-7 w-7 items-center justify-center rounded-md ${tone.container}`}>
                                <Icon size={16} className={tone.text} />
                            </View>
                            <Text
                                numberOfLines={1}
                                className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
                            >
                                {kpi.label}
                            </Text>
                        </View>
                        <Text className="text-2xl font-bold leading-none text-neutral-900 dark:text-white">
                            {kpi.value}
                        </Text>
                        <Text className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">{kpi.subtitle}</Text>
                    </View>
                )
            })}
        </View>
    )
}
