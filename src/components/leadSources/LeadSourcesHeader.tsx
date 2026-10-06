import { AlarmClock, FileUp, PhoneCall } from "lucide-react-native"
import { Pressable, Text, View } from "react-native"

import SearchField from "@/components/list/SearchField"
import { Button } from "@/components/ui"
import type { LeadSourceList } from "@/hooks/useLeadSourceList"
import { enableIconClassNames } from "@/lib/iconClassName"

import LeadSourceFilters from "./LeadSourceFilters"
import ViewTabs from "./ViewTabs"

interface Props {
    list: LeadSourceList
    isManager: boolean
    onShowDue: () => void
    onOpenUploads: () => void
    onUploadSheet: () => void
}

enableIconClassNames(AlarmClock, PhoneCall)

function getProgressStyle(share: number) {
    return { width: `${share}%` as const }
}

/**
 * Everything above the rows: the title, the callbacks-due banner, the view tabs and status filter, the manager
 * filters, the search box and Today's progress bar. Ported from the top of the web's LeadSourcesClient.tsx.
 */
export default function LeadSourcesHeader({ list, isManager, onShowDue, onOpenUploads, onUploadSheet }: Props) {
    const { filters, counts, progress } = list
    const view = filters.day ? "day" : filters.view
    const dueCount = counts?.callbacksDue ?? 0
    const share = progress && progress.total > 0 ? Math.round((progress.worked / progress.total) * 100) : 0

    return (
        <View className="gap-3 px-3 pb-3 pt-3">
            <View className="flex-row items-center gap-2.5">
                <View className="h-9 w-9 items-center justify-center rounded-lg bg-emerald-600/10">
                    <PhoneCall size={20} className="text-emerald-700 dark:text-emerald-400" />
                </View>
                <View className="flex-1">
                    <Text
                        accessibilityRole="header"
                        className="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
                    >
                        Lead Sources
                    </Text>
                    <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                        {isManager ? "Cold-calling lists for the whole team" : "Numbers to call, assigned to you"}
                    </Text>
                </View>
            </View>

            {isManager && (
                <Button label="Upload sheet" icon={FileUp} onPress={onUploadSheet} testID="uploadSheetButton" />
            )}

            {dueCount > 0 && (
                <View className="flex-row items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 dark:border-rose-500/30 dark:bg-rose-500/10">
                    <View className="flex-1 flex-row items-center gap-2 py-1">
                        <AlarmClock size={16} className="text-rose-800 dark:text-rose-200" />
                        <Text className="flex-1 text-sm font-medium text-rose-800 dark:text-rose-200">
                            {dueCount === 1 ? "1 callback is due." : `${dueCount} callbacks are due.`}
                        </Text>
                    </View>
                    {view !== "today" && (
                        <Pressable
                            onPress={onShowDue}
                            accessibilityRole="button"
                            className="min-h-[44px] justify-center rounded-lg px-2 active:bg-rose-100 dark:active:bg-rose-500/20"
                        >
                            <Text className="text-sm font-semibold text-rose-800 dark:text-rose-200">Show them</Text>
                        </Pressable>
                    )}
                </View>
            )}

            <ViewTabs
                view={view}
                counts={counts}
                onChange={(next) => list.setFilters({ view: next, day: "" })}
                status={filters.status}
                onStatusChange={(status) => list.setFilters({ status })}
            />

            {isManager && (
                <LeadSourceFilters
                    values={filters}
                    onChange={list.setFilters}
                    onClear={() => list.setFilters({ status: "", assignee: "", day: "", upload: "" })}
                    onOpenUploads={onOpenUploads}
                />
            )}

            <SearchField value={list.searchText} onChangeText={list.setSearch} placeholder="Search lead sources" />

            {view === "today" && progress && progress.total > 0 && (
                <View className="flex-row items-center gap-3 px-1">
                    <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-neutral-800">
                        <View className="h-full rounded-full bg-emerald-500" style={getProgressStyle(share)} />
                    </View>
                    <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                        {progress.worked} of {progress.total} for today called
                    </Text>
                </View>
            )}

            <Text className="px-1 text-xs text-neutral-500 dark:text-neutral-400">
                {list.loading ? "Loading..." : `${list.total} ${list.total === 1 ? "source" : "sources"}`}
            </Text>
        </View>
    )
}
