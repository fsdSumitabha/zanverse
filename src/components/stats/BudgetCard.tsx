import { Wallet } from "lucide-react-native"
import { Text, View } from "react-native"

import { enableIconClassNames } from "@/lib/iconClassName"
import { toNativeClasses } from "@/lib/nativeClasses"
import { formatInrCompact } from "@/lib/statsChart"
import type { OverallStats } from "@/types/overallStats"

import { STATS_CARD_CLASSES, TONE } from "./statsTones"

const ICON_TONE = toNativeClasses(TONE.amber.icon)

enableIconClassNames(Wallet)

/** The budget of running projects in the Cr / L / k form, with the pipeline, running and closed counts under it. */
export default function BudgetCard({ projects }: { projects: OverallStats["projects"] }) {
    const counts = [
        { label: "Pipeline", value: projects.pipeline },
        { label: "Running", value: projects.running },
        { label: "Closed", value: projects.closed },
    ]

    return (
        <View className={STATS_CARD_CLASSES}>
            <View className="flex-row items-center gap-2">
                <View className={`h-7 w-7 items-center justify-center rounded-md ${ICON_TONE.container}`}>
                    <Wallet size={16} className={ICON_TONE.text} />
                </View>
                <Text className="text-base font-semibold text-neutral-900 dark:text-white">Running budget</Text>
            </View>
            <Text className="mt-4 text-2xl font-bold leading-none text-neutral-900 dark:text-white">
                {formatInrCompact(projects.totalBudgetRunning)}
            </Text>
            <Text className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                Total budget of confirmed, in-progress, deployed and maintenance projects
            </Text>
            <View className="mt-4 flex-row border-t border-slate-100 pt-3 dark:border-neutral-800">
                {counts.map((count) => (
                    <View key={count.label} className="flex-1 items-center">
                        <Text className="text-lg font-semibold text-neutral-900 dark:text-white">{count.value}</Text>
                        <Text className="text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                            {count.label}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    )
}
