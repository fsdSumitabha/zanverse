import { Activity } from "lucide-react-native"
import type { ReactElement } from "react"
import { FlatList, RefreshControl, Text, View, useColorScheme } from "react-native"

import { ACTIVITY_LOGS_API } from "@/api/endpoints"
import { SkeletonBlock } from "@/components/ui"
import { useListQuery } from "@/hooks/useListQuery"
import { enableIconClassNames } from "@/lib/iconClassName"
import { BRAND_COLOR } from "@/theme"
import type { ActivityLogRow } from "@/types/activityLog"

import ActivityLogItem from "./ActivityLogItem"

interface Props {
    userId: string
    /** The profile above the activity, scrolled with it. */
    header: ReactElement
    /** Pull-to-refresh reloads the profile too. */
    onRefresh: () => void
    isRefreshing: boolean
}

const PAGE_SIZE = 15
const SKELETON_KEYS = [0, 1, 2]

enableIconClassNames(Activity)

/**
 * "My activity" under the profile: the signed-in person's own rows, 15 at a time, more on scroll. Ported from the
 * web's profile page, where the list is locked to the person (`forceUserId`) and shows no filters.
 */
export default function MyActivityList({ userId, header, onRefresh, isRefreshing }: Props) {
    const query = useListQuery<ActivityLogRow>({
        path: ACTIVITY_LOGS_API,
        pageSize: PAGE_SIZE,
        extraParams: { userId },
    })
    const isDarkMode = useColorScheme() === "dark"

    function refresh() {
        onRefresh()
        query.refresh()
    }

    return (
        <FlatList
            data={query.loading ? [] : query.items}
            keyExtractor={(row) => row._id}
            renderItem={({ item }) => (
                <View className="px-4 pb-3">
                    <ActivityLogItem row={item} />
                </View>
            )}
            ListHeaderComponent={
                <View>
                    {header}
                    <View className="px-4 pb-4 pt-2">
                        <View className="flex-row items-center gap-2">
                            <Activity size={20} className="text-emerald-500" />
                            <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                My activity
                            </Text>
                        </View>
                        <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                            Everything you’ve done across the system.
                        </Text>
                    </View>
                </View>
            }
            ListEmptyComponent={
                query.loading ? (
                    <View className="gap-3 px-4">
                        {SKELETON_KEYS.map((key) => (
                            <SkeletonBlock key={key} width="100%" height={56} rounded="lg" />
                        ))}
                    </View>
                ) : (
                    <Text className="px-4 py-6 text-center text-sm text-neutral-500">Nothing yet.</Text>
                )
            }
            ListFooterComponent={<View className="h-6" />}
            onEndReached={query.loadMore}
            onEndReachedThreshold={0.5}
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
