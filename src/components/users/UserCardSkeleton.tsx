import { View } from "react-native"

import { Card, SkeletonBlock } from "@/components/ui"

/** A user card while the list loads. Rebuilt from the web's UserCardSkeleton with the session 3 skeleton blocks. */
export default function UserCardSkeleton() {
    return (
        <Card className="gap-3 p-4">
            <View className="flex-row items-center gap-3">
                <SkeletonBlock width={48} height={48} rounded="lg" />
                <View className="flex-1 gap-2">
                    <SkeletonBlock width="50%" height={14} />
                    <SkeletonBlock width="70%" height={12} />
                </View>
                <SkeletonBlock width={56} height={22} rounded="md" />
            </View>
            <SkeletonBlock width="100%" height={1} />
            <View className="flex-row justify-between">
                <SkeletonBlock width={140} height={12} />
                <SkeletonBlock width={60} height={12} />
            </View>
            <SkeletonBlock width={120} height={12} />
        </Card>
    )
}
