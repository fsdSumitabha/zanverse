import { CalendarClock, FolderKanban, Handshake, Target, type LucideIcon } from "lucide-react-native"
import { useEffect, useState } from "react"
import { Pressable, Text, View } from "react-native"

import { send } from "@/api/client"
import { STATS_API } from "@/api/endpoints"
import { SkeletonBlock } from "@/components/ui"
import { useAuth } from "@/contexts/AuthContext"
import { openTabScreen } from "@/lib/entityNav"
import { enableIconClassNames } from "@/lib/iconClassName"
import { toNativeClasses } from "@/lib/nativeClasses"
import type { TabParamList } from "@/navigation/types"

interface StatsData {
    leads: number
    activeClients: number
    projectsRunning: number
    meetingsThisWeek: number
}

interface StatItem {
    key: keyof StatsData
    label: string
    icon: LucideIcon
    accent: string
    tab: keyof TabParamList
    screen: string
    params?: object
}

// The web StatsPanel's ITEMS, with each link as a screen.
const ITEMS: StatItem[] = [
    {
        key: "leads",
        label: "Leads",
        icon: Target,
        accent: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
        tab: "LeadsTab",
        screen: "LeadsList",
    },
    {
        key: "activeClients",
        label: "Active Clients",
        icon: Handshake,
        accent: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        tab: "ClientsTab",
        screen: "ClientsList",
        params: { status: "1" },
    },
    {
        key: "projectsRunning",
        label: "Projects Running",
        icon: FolderKanban,
        accent: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400",
        tab: "ProjectsTab",
        screen: "ProjectsList",
    },
    {
        key: "meetingsThisWeek",
        label: "Meetings This Week",
        icon: CalendarClock,
        accent: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
        tab: "MoreTab",
        screen: "Meetings",
    },
]

enableIconClassNames(CalendarClock, FolderKanban, Handshake, Target)

/**
 * The four counters from `/stats` as a 2x2 grid of tiles, each opening the list the web links to. A failure shows
 * "—", silently, as on the web. Ported from the web's StatsPanel.tsx.
 */
export default function StatsCards({ refreshKey }: { refreshKey: number }) {
    const { role } = useAuth()
    const [stats, setStats] = useState<StatsData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Every pull-to-refresh on the dashboard bumps refreshKey.
    useEffect(() => {
        let isCancelled = false
        send<StatsData>(STATS_API, "GET")
            .then((data) => {
                if (!isCancelled) setStats(data ?? null)
            })
            .catch(() => undefined)
            .finally(() => {
                if (!isCancelled) setIsLoading(false)
            })
        return () => {
            isCancelled = true
        }
    }, [refreshKey])

    return (
        <View className="flex-row flex-wrap justify-between gap-y-3">
            {ITEMS.map((item) => {
                const Icon = item.icon
                const accent = toNativeClasses(item.accent)
                return (
                    <Pressable
                        key={item.key}
                        onPress={() => openTabScreen(item.tab, item.screen, item.params, role)}
                        accessibilityRole="button"
                        accessibilityLabel={`${item.label}: ${stats ? stats[item.key] : "not loaded"}`}
                        className="w-[48.5%] flex-row items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 active:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900"
                    >
                        <View className={`h-10 w-10 items-center justify-center rounded-lg ${accent.container}`}>
                            <Icon size={20} className={accent.text} />
                        </View>
                        <View className="min-w-0 flex-1">
                            {isLoading ? (
                                <SkeletonBlock width={40} height={22} />
                            ) : (
                                <Text className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                                    {stats ? stats[item.key] : "—"}
                                </Text>
                            )}
                            <Text numberOfLines={2} className="text-xs text-neutral-500 dark:text-neutral-400">
                                {item.label}
                            </Text>
                        </View>
                    </Pressable>
                )
            })}
        </View>
    )
}
