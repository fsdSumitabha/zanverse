import { SlidersHorizontal } from "lucide-react-native"
import { useState, type ComponentType, type ReactElement, type ReactNode } from "react"
import { FlatList, Pressable, RefreshControl, Text, View, useColorScheme } from "react-native"

import { AccessDenied, EmptyState, OfflineNotice, SkeletonList } from "@/components/ui"
import type { ListQueryResult } from "@/hooks/useListQuery"
import { enableIconClassNames } from "@/lib/iconClassName"
import { BRAND_COLOR, PALETTE } from "@/theme"

import ListFilters, { type ListFilterValues } from "./ListFilters"
import SearchField from "./SearchField"

interface Props<T extends { _id: string }> {
    query: ListQueryResult<T>
    renderItem: (item: T) => ReactElement
    /** One placeholder card. Shown five times on the first load, once under the list while more load. */
    SkeletonComponent?: ComponentType
    emptyText: string
    /** The count line, such as "12 leads found". Defaults to "12 found". */
    getCountLabel?: (total: number) => string
    searchPlaceholder?: string
    /** False hides the search box, for a route that has no search. */
    isSearchable?: boolean
    /** Shows the filter button and sheet, with the statuses from this META map. */
    statusMeta?: Record<string | number, { label: string }>
    /** Leaves the date range out of the filter sheet. */
    hideDateFilters?: boolean
    /** Beside the count line, such as a view switcher. */
    headerRight?: ReactNode
    /** Under the search row, such as a create button. */
    headerExtra?: ReactNode
    /** Extra space under the last row, such as for a floating button. */
    bottomInset?: number
}

const FIRST_LOAD_SKELETONS = 5
const FOOTER_HEIGHT = 24

enableIconClassNames(SlidersHorizontal)

function DefaultSkeleton() {
    return <SkeletonList count={1} />
}

function getActiveFilterCount({ status, from, to }: ListFilterValues): number {
    return [status, from, to].filter(Boolean).length
}

/**
 * The scaffold under every list screen: search, filters and the count, then the rows, loading more on scroll, with
 * pull-to-refresh and the loading, empty, error and access-denied states. A module screen supplies a card and a query.
 */
export default function ListScreen<T extends { _id: string }>({
    query,
    renderItem,
    SkeletonComponent = DefaultSkeleton,
    emptyText,
    getCountLabel = (total) => `${total} found`,
    searchPlaceholder,
    isSearchable = true,
    statusMeta,
    hideDateFilters = false,
    headerRight,
    headerExtra,
    bottomInset = 0,
}: Props<T>) {
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const isDarkMode = useColorScheme() === "dark"
    const filters: ListFilterValues = { status: query.query.status, from: query.query.from, to: query.query.to }
    const activeFilterCount = getActiveFilterCount(filters)

    if (query.accessError) {
        return (
            <View className="flex-1 justify-center p-4">
                <AccessDenied message={query.accessError} />
            </View>
        )
    }

    const header = (
        <View className="gap-3 pb-1">
            <View className="flex-row items-center gap-2">
                <View className="flex-1">
                    {isSearchable && (
                        <SearchField
                            value={query.searchText}
                            onChangeText={query.setSearch}
                            placeholder={searchPlaceholder}
                        />
                    )}
                </View>
                {statusMeta && (
                    <Pressable
                        onPress={() => setIsFilterOpen(true)}
                        accessibilityRole="button"
                        accessibilityLabel={activeFilterCount ? `Filters, ${activeFilterCount} on` : "Filters"}
                        className="h-11 w-11 items-center justify-center rounded-lg border border-slate-300 bg-white active:opacity-80 dark:border-neutral-700 dark:bg-neutral-800"
                    >
                        <SlidersHorizontal size={18} className="text-neutral-700 dark:text-neutral-200" />
                        {activeFilterCount > 0 && (
                            <View className="absolute right-1 top-1 h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1">
                                <Text className="text-[10px] font-semibold text-white">{activeFilterCount}</Text>
                            </View>
                        )}
                    </Pressable>
                )}
            </View>
            {headerExtra}
            <View className="min-h-[20px] flex-row items-center justify-between gap-2">
                <Text className="text-sm text-gray-500 dark:text-neutral-400">
                    {query.loading ? " " : getCountLabel(query.total)}
                </Text>
                {headerRight}
            </View>
        </View>
    )

    const empty = query.loading ? (
        <View className="gap-4">
            {Array.from({ length: FIRST_LOAD_SKELETONS }, (_, index) => (
                <SkeletonComponent key={index} />
            ))}
        </View>
    ) : query.isOffline ? (
        <OfflineNotice variant="empty" onRetry={query.refresh} />
    ) : query.error ? (
        <EmptyState
            title="Could not load the list"
            message={query.error}
            actionLabel="Try again"
            onAction={query.refresh}
        />
    ) : (
        <EmptyState title={emptyText} />
    )

    return (
        <>
            <FlatList
                data={query.loading ? [] : query.items}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => renderItem(item)}
                ListHeaderComponent={header}
                ListEmptyComponent={empty}
                ListFooterComponent={
                    query.loadingMore ? <SkeletonComponent /> : <View style={{ height: FOOTER_HEIGHT + bottomInset }} />
                }
                // The gap spaces the rows, so no separator component is needed.
                contentContainerClassName="gap-3 p-4"
                onEndReached={query.loadMore}
                onEndReachedThreshold={0.5}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                refreshControl={
                    <RefreshControl
                        refreshing={query.refreshing}
                        onRefresh={query.refresh}
                        colors={[BRAND_COLOR.light]}
                        tintColor={isDarkMode ? PALETTE["neutral-400"] : BRAND_COLOR.light}
                        progressBackgroundColor={isDarkMode ? PALETTE["neutral-800"] : PALETTE.white}
                    />
                }
            />
            {statusMeta && (
                <ListFilters
                    visible={isFilterOpen}
                    statusMeta={statusMeta}
                    value={filters}
                    hideDates={hideDateFilters}
                    onApply={query.setFilters}
                    onClose={() => setIsFilterOpen(false)}
                />
            )}
        </>
    )
}
