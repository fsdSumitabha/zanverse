import type { ReactNode } from "react"
import { Text, View } from "react-native"

interface Props {
    title: string
    /** Shown as a small grey pill next to the title, such as the number of rows. */
    count?: number
    /** A button or link on the right. */
    action?: ReactNode
}

/** A title row above a list or a block, with an optional count and a right-hand action. */
export default function SectionHeader({ title, count, action }: Props) {
    return (
        <View className="min-h-[44px] flex-row items-center justify-between gap-3">
            <View className="min-w-0 flex-1 flex-row items-center gap-2">
                <Text
                    numberOfLines={1}
                    className="shrink text-base font-semibold text-neutral-900 dark:text-neutral-100"
                >
                    {title}
                </Text>
                {count !== undefined && (
                    <Text className="overflow-hidden rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                        {count}
                    </Text>
                )}
            </View>
            {action}
        </View>
    )
}
