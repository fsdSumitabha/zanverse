import { Bell, CheckCheck } from "lucide-react-native"
import { useCallback, useEffect, useRef } from "react"
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View, useColorScheme } from "react-native"

import NotificationRow from "@/components/notifications/NotificationRow"
import { EmptyState, SegmentedControl, SkeletonBlock, type Segment } from "@/components/ui"
import { useAuth } from "@/contexts/AuthContext"
import { useNotifications } from "@/contexts/NotificationContext"
import { useNotificationFeed, type NotificationFilter } from "@/hooks/useNotificationFeed"
import { enableIconClassNames } from "@/lib/iconClassName"
import { resolveNotificationPath } from "@/navigation/linking"
import { openRecord } from "@/navigation/openRecord"
import { BRAND_COLOR, PALETTE } from "@/theme"
import type { NotificationRow as Row } from "@/types/notification"

const FILTERS: Segment<NotificationFilter>[] = [
    { label: "All", value: "all" },
    { label: "Unread", value: "unread" },
]
const SKELETON_KEYS = [0, 1, 2, 3, 4]

enableIconClassNames(Bell, CheckCheck)

function SkeletonRows() {
    return (
        <View className="gap-3 p-3">
            {SKELETON_KEYS.map((key) => (
                <View key={key} className="flex-row gap-3">
                    <SkeletonBlock width={36} height={36} rounded="lg" />
                    <View className="flex-1 gap-2">
                        <SkeletonBlock width="70%" height={14} />
                        <SkeletonBlock width="90%" height={12} />
                    </View>
                </View>
            ))}
        </View>
    )
}

/**
 * The notifications inbox: newest first, older pages on scroll, All / Unread, mark one or all read, and a tap that
 * opens the lead, client or project a row is about. Ported from the web's notifications/page.tsx.
 */
export default function NotificationsScreen() {
    const { role } = useAuth()
    const { markSeen } = useNotifications()
    const feed = useNotificationFeed()
    const isDarkMode = useColorScheme() === "dark"
    const { markOneRead } = feed

    // Opening the inbox marks every row seen, once per visit, as the web's page does.
    const seenFiredRef = useRef(false)
    useEffect(() => {
        if (seenFiredRef.current) return
        seenFiredRef.current = true
        markSeen()
    }, [markSeen])

    const openRow = useCallback(
        (row: Row) => {
            markOneRead(row._id)
            const target = resolveNotificationPath(row.url)
            if (target) openRecord(target, role)
        },
        [markOneRead, role],
    )

    const header = (
        <View className="gap-3 px-3 pb-3 pt-3">
            <View className="flex-row flex-wrap items-center gap-2">
                <Bell size={20} className="text-neutral-700 dark:text-neutral-300" />
                <Text accessibilityRole="header" className="text-lg font-semibold text-neutral-900 dark:text-white">
                    Notifications
                </Text>
                {feed.unread > 0 && (
                    <Text className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:text-red-400">
                        {`${feed.unread} unread`}
                    </Text>
                )}
            </View>
            <View className="flex-row flex-wrap items-center justify-between gap-2">
                <SegmentedControl segments={FILTERS} value={feed.filter} onChange={feed.setFilter} />
                {feed.unread > 0 && (
                    <Pressable
                        onPress={feed.markAllRead}
                        accessibilityRole="button"
                        className="min-h-[44px] flex-row items-center gap-1 rounded-md border border-blue-500/40 px-3 active:bg-blue-500/10"
                    >
                        <CheckCheck size={14} className="text-blue-600 dark:text-blue-400" />
                        <Text className="text-xs text-blue-600 dark:text-blue-400">Mark all read</Text>
                    </Pressable>
                )}
            </View>
            <Text className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Notifications older than 30 days are automatically removed.
            </Text>
        </View>
    )

    return (
        <FlatList
            data={feed.loading ? [] : feed.rows}
            keyExtractor={(row) => row._id}
            renderItem={({ item }) => <NotificationRow row={item} onOpen={openRow} onMarkRead={markOneRead} />}
            ListHeaderComponent={header}
            ListEmptyComponent={
                feed.loading ? (
                    <SkeletonRows />
                ) : (
                    <EmptyState
                        icon={Bell}
                        title={feed.filter === "unread" ? "No unread notifications" : "No notifications yet"}
                    />
                )
            }
            ListFooterComponent={
                feed.loadingMore ? (
                    <ActivityIndicator
                        accessibilityLabel="Loading more"
                        className="py-4"
                        color={isDarkMode ? PALETTE["neutral-400"] : PALETTE["neutral-500"]}
                    />
                ) : undefined
            }
            onEndReached={feed.loadMore}
            onEndReachedThreshold={0.5}
            refreshControl={
                <RefreshControl
                    refreshing={feed.refreshing}
                    onRefresh={feed.refresh}
                    colors={[BRAND_COLOR.light]}
                    tintColor={isDarkMode ? BRAND_COLOR.dark : BRAND_COLOR.light}
                />
            }
        />
    )
}
