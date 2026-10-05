import type { ReactNode } from "react"
import { Text, View } from "react-native"

import { Card, SectionHeader } from "@/components/ui"

interface Props {
    /** The primitive's name, as it is imported. */
    title: string
    /** What to check on the device. */
    note?: string
    children: ReactNode
}

/** One labelled block on the kitchen-sink screen. */
export default function KitchenSection({ title, note, children }: Props) {
    return (
        <View className="gap-1">
            <SectionHeader title={title} />
            {!!note && <Text className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">{note}</Text>}
            <Card className="gap-3 p-4">{children}</Card>
        </View>
    )
}
