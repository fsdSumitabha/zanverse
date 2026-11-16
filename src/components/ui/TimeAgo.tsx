import clsx from "clsx"
import { useState } from "react"
import { Pressable, Text } from "react-native"

import { formatFullDateTime, formatTimeAgo, type DateInput } from "@/lib/format"

interface Props {
    date: DateInput | null | undefined
    className?: string
}

/**
 * "3 hours ago". A press shows the full date and time, which the web shows on hover through `title`.
 * The web's text-neutral-500 gets dark:text-neutral-400 here, for contrast on dark cards.
 */
export default function TimeAgo({ date, className }: Props) {
    const [isAbsolute, setIsAbsolute] = useState(false)

    return (
        <Pressable
            onPress={() => setIsAbsolute((value) => !value)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityHint="Switches between the relative time and the full date"
            className="self-start"
        >
            <Text numberOfLines={1} className={clsx("text-xs text-neutral-500 dark:text-neutral-400", className)}>
                {isAbsolute ? formatFullDateTime(date) : formatTimeAgo(date)}
            </Text>
        </Pressable>
    )
}
