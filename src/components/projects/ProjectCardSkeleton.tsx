import { View } from "react-native"

import { Card, SkeletonBlock } from "@/components/ui"

/** A project card while the list loads. Rebuilt from the web's ProjectCardSkeleton.tsx. */
export default function ProjectCardSkeleton() {
    return (
        <Card className="gap-3 p-4" accessibilityLabel="Loading">
            <View className="flex-row items-start justify-between">
                <View className="gap-2">
                    <SkeletonBlock width={128} height={16} />
                    <SkeletonBlock width={96} height={12} />
                    <SkeletonBlock width={160} height={14} />
                </View>
                <SkeletonBlock width={80} height={20} rounded="full" />
            </View>
            <SkeletonBlock width="90%" height={12} />
            <SkeletonBlock width={96} height={14} />
            <View className="flex-row gap-2">
                <SkeletonBlock width={72} height={12} />
                <SkeletonBlock width={64} height={20} rounded="md" />
            </View>
        </Card>
    )
}
