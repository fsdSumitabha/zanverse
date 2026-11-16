import clsx from "clsx"
import type { ReactElement } from "react"
import { FlatList, RefreshControl, Text, View } from "react-native"

import { Button } from "@/components/ui"
import type { useInteractions } from "@/hooks/useInteractions"
import { BRAND_COLOR } from "@/theme"

import InteractionItem from "./InteractionItem"
import InteractionItemSkeleton from "./InteractionItemSkeleton"

interface Props {
    entityType: number
    timeline: ReturnType<typeof useInteractions>
    /** The screen's content above the timeline, such as the header card and the add buttons. */
    header: ReactElement
    refreshing: boolean
    /** Pull-to-refresh: the screen reloads its record and the timeline. */
    onRefresh: () => void
    /** Called after a row was edited in place. */
    onChanged?: () => void
}

const SKELETON_ROWS = 3

function TimelineRow({ isLast, children }: { isLast: boolean; children: ReactElement }) {
    return (
        <View className="pl-6">
            {/* The web's vertical line, one segment per row, reaching through the gap to the next row. */}
            <View
                className={clsx(
                    "absolute left-2 top-0 w-[2px] bg-gray-300 dark:bg-neutral-700",
                    isLast ? "bottom-0" : "-bottom-4",
                )}
            />
            {children}
        </View>
    )
}

/**
 * A record's screen as one list: the header, then the timeline rows newest first, with pull-to-refresh. Ported from
 * the web's InteractionTimeline.tsx, without its staggered fade-in, which fights list virtualization.
 */
export default function InteractionTimeline({ entityType, timeline, header, refreshing, onRefresh, onChanged }: Props) {
    const { interactions, loading, error, reload } = timeline

    const empty = loading ? (
        <View className="gap-4">
            {Array.from({ length: SKELETON_ROWS }, (_, index) => (
                <TimelineRow key={index} isLast={index === SKELETON_ROWS - 1}>
                    <InteractionItemSkeleton />
                </TimelineRow>
            ))}
        </View>
    ) : error ? (
        <View className="items-center gap-3 py-6">
            <Text className="text-center text-gray-500">{error}</Text>
            <Button label="Try again" variant="quiet" onPress={reload} />
        </View>
    ) : (
        <Text className="py-6 text-center text-gray-500">No interactions yet</Text>
    )

    return (
        <FlatList
            data={loading ? [] : interactions}
            keyExtractor={(item) => item._id}
            renderItem={({ item, index }) => (
                <TimelineRow isLast={index === interactions.length - 1}>
                    <InteractionItem entityType={entityType} item={item} onChanged={onChanged ?? reload} />
                </TimelineRow>
            )}
            ListHeaderComponent={header}
            ListEmptyComponent={empty}
            contentContainerClassName="gap-4 p-4"
            keyboardShouldPersistTaps="handled"
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND_COLOR.light]} />
            }
        />
    )
}
