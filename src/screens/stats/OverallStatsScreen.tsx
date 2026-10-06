import { BarChart3 } from "lucide-react-native"
import { useCallback, useEffect, useRef, useState } from "react"
import { RefreshControl, ScrollView, Text, View, useColorScheme } from "react-native"

import { ApiError, send } from "@/api/client"
import { OVERALL_STATS_API } from "@/api/endpoints"
import BudgetCard from "@/components/stats/BudgetCard"
import KpiRow, { getConversionLabel } from "@/components/stats/KpiRow"
import LeadsOverTimeCard from "@/components/stats/LeadsOverTimeCard"
import RoleCountsCard from "@/components/stats/RoleCountsCard"
import StatusPieCard from "@/components/stats/StatusPieCard"
import { EmptyState, SkeletonBlock, TimeAgo } from "@/components/ui"
import { STATS_PALETTE } from "@/constants/statsPalette"
import { useAuth } from "@/contexts/AuthContext"
import { openTabScreen } from "@/lib/entityNav"
import { formatInrCompact } from "@/lib/statsChart"
import { BRAND_COLOR, PALETTE } from "@/theme"
import type { OverallStats } from "@/types/overallStats"

const SKELETON_KEYS = [0, 1, 2, 3]

/** The web's FullPageSkeleton, in one column: four KPI blocks, then four card blocks. */
function StatsSkeleton() {
    return (
        <View className="gap-4">
            <View className="flex-row flex-wrap justify-between gap-y-3">
                {SKELETON_KEYS.map((key) => (
                    <SkeletonBlock key={key} width="48.5%" height={96} rounded="lg" />
                ))}
            </View>
            {SKELETON_KEYS.map((key) => (
                <SkeletonBlock key={key} width="100%" height={256} rounded="lg" />
            ))}
        </View>
    )
}

/**
 * "Pipeline overview": the four headline numbers, the four status charts, the budget, the team and the leads over
 * time, from one `/overall-stats` call. It loads on open and on pull-to-refresh only. Any signed-in role may open it.
 * Ported from the web's overall-stats/page.tsx and OverallStatsPanel.tsx.
 */
export default function OverallStatsScreen() {
    const { role } = useAuth()
    const isDarkMode = useColorScheme() === "dark"
    const [data, setData] = useState<OverallStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const requestId = useRef(0)

    const load = useCallback(async (isRefresh: boolean) => {
        const id = ++requestId.current
        if (isRefresh) setIsRefreshing(true)
        else setIsLoading(true)
        try {
            const stats = await send<OverallStats>(OVERALL_STATS_API, "GET")
            if (id !== requestId.current) return
            setData(stats ?? null)
            setError(null)
        } catch (caught) {
            if (id !== requestId.current) return
            if (caught instanceof ApiError && caught.status === 401) return
            setError(caught instanceof Error ? caught.message : "Failed to compute stats")
        } finally {
            if (id === requestId.current) {
                setIsLoading(false)
                setIsRefreshing(false)
            }
        }
    }, [])

    useEffect(() => {
        load(false)
    }, [load])

    let body
    if (isLoading && !data) {
        body = <StatsSkeleton />
    } else if (!data) {
        body = error ? (
            <EmptyState
                icon={BarChart3}
                title="Could not load the overview"
                message={error}
                actionLabel="Try again"
                onAction={() => load(false)}
            />
        ) : (
            <EmptyState icon={BarChart3} title="No stats yet" />
        )
    } else {
        const conversion = getConversionLabel(data.leads.conversionRate)
        body = (
            <View className="gap-4">
                <View className="flex-row items-center justify-end gap-1">
                    <Text className="text-[11px] text-neutral-500 dark:text-neutral-400">Updated</Text>
                    <TimeAgo date={data.updatedAt} className="text-[11px] text-neutral-500 dark:text-neutral-400" />
                </View>
                <KpiRow data={data} />
                <StatusPieCard
                    label="Leads"
                    total={data.leads.total}
                    accent={data.leads.conversionRate === null ? undefined : `${conversion} converted`}
                    accentTone="emerald"
                    byStatus={data.leads.byStatus}
                    meta={STATS_PALETTE.LEAD_STATUS_META}
                    variant="donut"
                    centerLine1={conversion}
                    centerLine2="conversion"
                    onPressTitle={() => openTabScreen("LeadsTab", "LeadsList", undefined, role)}
                />
                <StatusPieCard
                    label="Clients"
                    total={data.clients.total}
                    byStatus={data.clients.byStatus}
                    meta={STATS_PALETTE.CLIENT_STATUS_META}
                    variant="pie"
                    onPressTitle={() => openTabScreen("ClientsTab", "ClientsList", undefined, role)}
                />
                <StatusPieCard
                    label="Projects"
                    total={data.projects.total}
                    accent={formatInrCompact(data.projects.totalBudgetRunning)}
                    accentTone="amber"
                    byStatus={data.projects.byStatus}
                    meta={STATS_PALETTE.PROJECT_STATUS_META}
                    variant="pie"
                    onPressTitle={() => openTabScreen("ProjectsTab", "ProjectsList", undefined, role)}
                />
                <StatusPieCard
                    label="Meetings"
                    total={data.meetings.total}
                    accent={`${data.meetings.upcoming} upcoming`}
                    accentTone="blue"
                    byStatus={data.meetings.byStatus}
                    meta={STATS_PALETTE.MEETING_STATUS_META}
                    variant="pie"
                    onPressTitle={() => openTabScreen("MoreTab", "Meetings", undefined, role)}
                />
                <BudgetCard projects={data.projects} />
                <RoleCountsCard users={data.users} />
                <LeadsOverTimeCard data={data.leads.overTime} />
            </View>
        )
    }

    return (
        <ScrollView
            contentContainerClassName="gap-6 p-4"
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={() => load(true)}
                    colors={[BRAND_COLOR.light]}
                    tintColor={isDarkMode ? PALETTE["neutral-400"] : BRAND_COLOR.light}
                    progressBackgroundColor={isDarkMode ? PALETTE["neutral-800"] : PALETTE.white}
                />
            }
        >
            <View className="gap-1">
                <Text accessibilityRole="header" className="text-2xl font-bold text-neutral-900 dark:text-white">
                    Pipeline overview
                </Text>
                <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                    Status distribution across leads, clients, projects and meetings.
                </Text>
            </View>
            {body}
        </ScrollView>
    )
}
