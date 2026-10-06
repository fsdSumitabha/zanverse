import { Inbox } from "lucide-react-native"
import { useEffect, useMemo, useState, type ReactElement } from "react"
import { ActivityIndicator, FlatList, RefreshControl, Text, View, useColorScheme } from "react-native"

import { ACTIVITY_LOGS_API } from "@/api/endpoints"
import { EmptyState, SkeletonBlock } from "@/components/ui"
import { useListQuery } from "@/hooks/useListQuery"
import { buildActivityParams } from "@/lib/activityLog/buildActivityParams"
import { BRAND_COLOR, PALETTE } from "@/theme"
import type { ActivityLogFilterState, ActivityLogRow } from "@/types/activityLog"

import ActivityLogItem from "./ActivityLogItem"

interface Props {
    filters: ActivityLogFilterState
    /** Locks the list to one user, as on the profile screen. Overrides the user filter. */
    forceUserId?: string
    limit?: number
    /** Scrolled above the rows, such as the profile card or the screen's title. */
    ListHeaderComponent?: ReactElement
    /** Called on pull-to-refresh as well, such as to reload the profile above. */
    onRefresh?: () => void
    isRefreshing?: boolean
}

const DEFAULT_LIMIT = 15
const SEARCH_DEBOUNCE_MS = 300
const SKELETON_KEYS = [0, 1, 2, 3, 4]

/**
 * The audit feed: 15 rows at a time, more on scroll, filtered by entity, user, dates and name. Ported from the web's
 * ActivityLogList.tsx with infinite scroll in place of its page buttons. Only the name search is debounced, 300 ms.
 */
export default function ActivityLogList({
    filters,
    forceUserId,
    limit = DEFAULT_LIMIT,
    ListHeaderComponent,
    onRefresh,
    isRefreshing = false,
}: Props) {
    const isDarkMode = useColorScheme() === "dark"
    const [searchTerm, setSearchTerm] = useState(filters.q)

    useEffect(() => {
        if (!filters.q.trim()) {
            setSearchTerm(filters.q)
            return
        }
        const handle = setTimeout(() => setSearchTerm(filters.q), SEARCH_DEBOUNCE_MS)
        return () => clearTimeout(handle)
    }, [filters.q])

    const params = useMemo(
        () => buildActivityParams({ ...filters, q: searchTerm }, forceUserId),
        [filters, searchTerm, forceUserId],
    )
    const query = useListQuery<ActivityLogRow>({ path: ACTIVITY_LOGS_API, pageSize: limit, params })

    function refresh() {
        onRefresh?.()
        query.refresh()
    }

    return (
        <FlatList
            data={query.loading ? [] : query.items}
            keyExtractor={(row) => row._id}
            renderItem={({ item }) => (
                <View className="px-4 pb-2">
                    <ActivityLogItem row={item} />
                </View>
            )}
            ListHeaderComponent={
                <View>
                    {ListHeaderComponent}
                    <Text className="px-5 pb-2 text-xs text-neutral-500 dark:text-neutral-400">
                        {query.loading ? "Loading…" : `${query.total} entr${query.total === 1 ? "y" : "ies"}`}
                    </Text>
                </View>
            }
            ListEmptyComponent={
                query.loading ? (
                    <View className="gap-2 px-4">
                        {SKELETON_KEYS.map((key) => (
                            <SkeletonBlock key={key} width="100%" height={64} rounded="lg" />
                        ))}
                    </View>
                ) : query.error ? (
                    <View className="mx-4 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-500/40 dark:bg-red-500/10">
                        <Text className="text-sm text-red-700 dark:text-red-300">{query.error}</Text>
                    </View>
                ) : (
                    <EmptyState icon={Inbox} title="No activity matches the current filters." />
                )
            }
            ListFooterComponent={
                query.loadingMore ? (
                    <ActivityIndicator
                        accessibilityLabel="Loading more"
                        className="py-4"
                        color={isDarkMode ? PALETTE["neutral-400"] : PALETTE["neutral-500"]}
                    />
                ) : (
                    <View className="h-6" />
                )
            }
            onEndReached={query.loadMore}
            onEndReachedThreshold={0.5}
            keyboardShouldPersistTaps="handled"
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing || query.refreshing}
                    onRefresh={refresh}
                    colors={[BRAND_COLOR.light]}
                    tintColor={isDarkMode ? BRAND_COLOR.dark : BRAND_COLOR.light}
                />
            }
        />
    )
}
