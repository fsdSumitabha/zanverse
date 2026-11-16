import type { ReactNode } from "react"
import { Text, View } from "react-native"

interface Props {
    title: string
    children: ReactNode
}

/** A titled card for one proof on the spike screen. */
export default function SpikeSection({ title, children }: Props) {
    return (
        <View className="mb-4 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {title}
            </Text>
            {children}
        </View>
    )
}
