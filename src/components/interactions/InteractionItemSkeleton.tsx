import { View } from "react-native"

import { SkeletonBlock } from "@/components/ui"

/** A timeline row while the timeline loads. Rebuilt from the web's InteractionItemSkeleton.tsx. */
export default function InteractionItemSkeleton() {
    return (
        <View
            accessibilityLabel="Loading"
            className="flex-row gap-3 rounded-lg border border-gray-300 bg-white p-4 dark:rounded-xl dark:border-gray-600 dark:bg-neutral-900"
        >
            <View className="mt-1">
                <SkeletonBlock width={32} height={32} rounded="lg" />
            </View>
            <View className="flex-1 gap-3">
                <View className="flex-row items-start justify-between">
                    <View className="flex-row flex-wrap items-center gap-2">
                        <SkeletonBlock width={128} height={16} />
                        <SkeletonBlock width={64} height={16} rounded="full" />
                    </View>
                    <SkeletonBlock width={80} height={12} />
                </View>
                <SkeletonBlock width="75%" height={12} />
                <View className="gap-2">
                    <SkeletonBlock width="100%" height={12} />
                    <SkeletonBlock width="83%" height={12} />
                </View>
            </View>
        </View>
    )
}
