import { View } from "react-native"

import { Card, SkeletonBlock } from "@/components/ui"

/** The lead header card while it loads. Rebuilt from the web's LeadDetailsSkeleton.tsx. */
export default function LeadDetailsSkeleton() {
    return (
        <Card className="gap-4 p-5" accessibilityLabel="Loading">
            <View className="flex-row items-center justify-between">
                <View className="gap-2">
                    <SkeletonBlock width={128} height={20} />
                    <SkeletonBlock width={96} height={16} />
                </View>
                <SkeletonBlock width={80} height={24} />
            </View>
            <View className="gap-4">
                <View className="gap-1">
                    <SkeletonBlock width={64} height={16} />
                    <SkeletonBlock width={112} height={16} />
                </View>
                <View className="gap-1">
                    <SkeletonBlock width={64} height={16} />
                    <SkeletonBlock width={144} height={16} />
                </View>
            </View>
            <SkeletonBlock width={160} height={12} />
        </Card>
    )
}
