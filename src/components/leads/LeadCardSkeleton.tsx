import { View } from "react-native"

import { Card, SkeletonBlock } from "@/components/ui"

/** A lead card while the list loads. Rebuilt from the web's LeadCardSkeleton.tsx. */
export default function LeadCardSkeleton() {
    return (
        <Card className="gap-3 p-4" accessibilityLabel="Loading">
            <View className="flex-row items-center justify-between">
                <View className="gap-2">
                    <SkeletonBlock width={128} height={16} />
                    <SkeletonBlock width={96} height={12} />
                </View>
                <SkeletonBlock width={80} height={20} rounded="full" />
            </View>
            <View className="gap-2">
                <SkeletonBlock width={112} height={12} />
                <SkeletonBlock width={144} height={12} />
                <SkeletonBlock width={160} height={12} />
            </View>
        </Card>
    )
}
