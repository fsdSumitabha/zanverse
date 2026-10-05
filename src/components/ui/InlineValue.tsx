import clsx from "clsx"
import { Text } from "react-native"

interface Props {
    /** The text the web shows in its hover Tooltip, such as `Created by ${name}`. */
    value: string | null | undefined
    className?: string
}

/**
 * The Tooltip replacement. A phone has no hover, so what the web shows on hover is a second, quieter line of text
 * instead. One line only: a long value is cut with an ellipsis.
 */
export default function InlineValue({ value, className }: Props) {
    const text = value?.trim()
    if (!text) return null

    return (
        <Text numberOfLines={1} className={clsx("mt-0.5 text-xs text-neutral-500 dark:text-neutral-400", className)}>
            {text}
        </Text>
    )
}
