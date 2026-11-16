import { useCallback, useMemo, useState } from "react"
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View, useColorScheme } from "react-native"

import EntityCard from "@/components/dashboard/EntityCard"
import EntityCardSkeleton from "@/components/dashboard/EntityCardSkeleton"
import StatsCards from "@/components/dashboard/StatsCards"
import UpcomingMeetingsCard from "@/components/dashboard/UpcomingMeetingsCard"
import { AccessDenied } from "@/components/ui"
import { useAuth } from "@/contexts/AuthContext"
import { useDashboardFeed, type FeedItem } from "@/hooks/useDashboardFeed"
import { navigateToEntity } from "@/lib/entityNav"
import { BRAND_COLOR, PALETTE } from "@/theme"

const SKELETON_KEYS = [0, 1, 2, 3, 4]

// The same record can sit in two entity types only in theory; the type keeps the key unique either way.
function getFeedKey(item: FeedItem) {
    return `${item.entityType}-${item._id}`
}

/** The web's error box: what failed, the message, and Retry. */
function FeedError({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <View className="rounded-xl border border-red-500/30 bg-red-50 p-4 dark:bg-red-900/10">
            <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Failed to load data</Text>
            <Text className="mt-1 text-xs text-neutral-500">{message}</Text>
            <Pressable
                onPress={onRetry}
                accessibilityRole="button"
                className="mt-3 min-h-[44px] justify-center self-start rounded-md bg-red-500 px-4 active:bg-red-600"
            >
                <Text className="text-xs text-white">Retry</Text>
            </Pressable>
        </View>
    )
}

/**
 * The Dashboard tab: the four counters, the next meetings and the Lead / Client / Project feed, newest interaction
 * first, as one scrolling list. Pull-to-refresh reloads all three. Ported from the web's operations/page.tsx plus the
 * StatsPanel and UpcomingMeetingsPanel from its desktop aside.
 */
export default function DashboardScreen() {
    const { role } = useAuth()
    const feed = useDashboardFeed()
    const isDarkMode = useColorScheme() === "dark"
    const [refreshKey, setRefreshKey] = useState(0)
    const { refresh: refreshFeed, retry: retryFeed } = feed

    const refreshAll = useCallback(() => {
        setRefreshKey((key) => key + 1)
        refreshFeed()
    }, [refreshFeed])

    const retryAll = useCallback(() => {
        setRefreshKey((key) => key + 1)
        retryFeed()
    }, [retryFeed])

    const openItem = useCallback((item: FeedItem) => navigateToEntity(item.entityType, item._id, role), [role])

    // Built once per refresh, so a feed page arriving does not re-render the panels.
    const header = useMemo(
        () => (
            <View className="gap-3 pb-1">
                <StatsCards refreshKey={refreshKey} />
                <UpcomingMeetingsCard refreshKey={refreshKey} />
            </View>
        ),
        [refreshKey],
    )

    const hasItems = feed.items.length > 0
    const empty = feed.loading ? (
        <View className="gap-3">
            {SKELETON_KEYS.map((key) => (
                <EntityCardSkeleton key={key} />
            ))}
        </View>
    ) : feed.accessError ? (
        <AccessDenied message={feed.accessError} />
    ) : feed.error ? (
        <FeedError message={feed.error} onRetry={retryAll} />
    ) : (
        <View className="rounded-xl border border-neutral-200 p-6 dark:border-neutral-800">
            <Text className="text-center text-sm text-neutral-400">No data found</Text>
        </View>
    )

    const footer = feed.loadingMore ? (
        <ActivityIndicator
            accessibilityLabel="Loading more"
            className="py-4"
            color={isDarkMode ? PALETTE["neutral-400"] : PALETTE["neutral-500"]}
        />
    ) : hasItems && feed.error ? (
        <FeedError message={feed.error} onRetry={retryFeed} />
    ) : undefined

    return (
        <FlatList
            data={feed.loading || feed.accessError ? [] : feed.items}
            keyExtractor={getFeedKey}
            renderItem={({ item }) => <EntityCard item={item} onPress={() => openItem(item)} />}
            ListHeaderComponent={header}
            ListEmptyComponent={empty}
            ListFooterComponent={footer}
            contentContainerClassName="gap-3 p-4"
            onEndReached={feed.loadMore}
            onEndReachedThreshold={0.5}
            refreshControl={
                <RefreshControl
                    refreshing={feed.refreshing}
                    onRefresh={refreshAll}
                    colors={[BRAND_COLOR.light]}
                    tintColor={isDarkMode ? PALETTE["neutral-400"] : BRAND_COLOR.light}
                    progressBackgroundColor={isDarkMode ? PALETTE["neutral-800"] : PALETTE.white}
                />
            }
        />
    )
}
