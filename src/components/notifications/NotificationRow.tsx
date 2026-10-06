import clsx from "clsx"
import { Check } from "lucide-react-native"
import { memo, useRef } from "react"
import { Pressable, Text, View } from "react-native"
import Swipeable from "react-native-gesture-handler/Swipeable"

import { NotificationBadge, TimeAgo } from "@/components/ui"
import { enableIconClassNames } from "@/lib/iconClassName"
import type { NotificationRow as Row } from "@/types/notification"

interface Props {
    row: Row
    /** A tap: marks the row read and, when it has a url, opens it. */
    onOpen: (row: Row) => void
    onMarkRead: (id: string) => void
}

enableIconClassNames(Check)

/** The action behind a row swiped left. */
function MarkReadAction() {
    return (
        <View className="w-28 items-center justify-center bg-blue-600">
            <Check size={18} className="text-white" />
            <Text className="mt-1 text-xs font-medium text-white">Mark read</Text>
        </View>
    )
}

/**
 * One notification in its three states, as on the web: fresh (blue edge, "New"), seen but unread (amber edge), and
 * read (plain). A swipe left marks it read; so does the Check button.
 */
function NotificationRow({ row, onOpen, onMarkRead }: Props) {
    const swipeRef = useRef<Swipeable>(null)
    const isUnread = !row.readAt
    const isFresh = isUnread && !row.seenAt

    function handleSwipeOpen() {
        onMarkRead(row._id)
        swipeRef.current?.close()
    }

    const content = (
        <Pressable
            onPress={() => onOpen(row)}
            accessibilityRole="button"
            accessibilityLabel={`${row.title}${isUnread ? ", unread" : ""}`}
            className={clsx(
                "flex-row gap-2.5 border-l-2 px-3 py-3",
                isFresh
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-500/[0.07]"
                    : isUnread
                    ? "border-amber-400 bg-amber-50 dark:bg-amber-500/[0.05]"
                    : "border-transparent bg-white active:bg-neutral-50 dark:bg-neutral-900 dark:active:bg-neutral-800/50",
            )}
        >
            <NotificationBadge badge={row.badge} size="md" />
            <View className="min-w-0 flex-1">
                <View className="flex-row flex-wrap items-center gap-2">
                    <Text
                        className={clsx(
                            "flex-shrink text-sm",
                            isUnread
                                ? "font-semibold text-neutral-900 dark:text-white"
                                : "font-normal text-neutral-600 dark:text-neutral-400",
                        )}
                    >
                        {row.title}
                    </Text>
                    {isFresh && (
                        <Text className="rounded-full bg-blue-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                            New
                        </Text>
                    )}
                </View>
                {!!row.body && (
                    <Text
                        numberOfLines={2}
                        className={clsx(
                            "mt-0.5 text-xs",
                            isUnread
                                ? "text-neutral-700 dark:text-neutral-300"
                                : "text-neutral-500 dark:text-neutral-500",
                        )}
                    >
                        {row.body}
                    </Text>
                )}
                <View className="mt-1">
                    <TimeAgo date={row.createdAt} className="text-[11px] text-neutral-500" />
                </View>
            </View>
            {isUnread && (
                <Pressable
                    onPress={() => onMarkRead(row._id)}
                    accessibilityRole="button"
                    accessibilityLabel="Mark as read"
                    className="h-11 w-11 items-center justify-center self-start rounded-md active:bg-blue-500/10"
                >
                    <Check size={16} className="text-neutral-400" />
                </Pressable>
            )}
        </Pressable>
    )

    if (!isUnread) return <View className="border-b border-neutral-200 dark:border-neutral-800">{content}</View>

    return (
        <View className="border-b border-neutral-200 dark:border-neutral-800">
            <Swipeable
                ref={swipeRef}
                renderRightActions={MarkReadAction}
                onSwipeableOpen={handleSwipeOpen}
                rightThreshold={56}
                overshootRight={false}
            >
                {content}
            </Swipeable>
        </View>
    )
}

export default memo(NotificationRow)
