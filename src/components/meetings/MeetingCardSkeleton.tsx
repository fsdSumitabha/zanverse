import { View } from "react-native"

import { SkeletonBlock } from "@/components/ui"

/** A meeting card while the list loads. Ported from the web's skeletons/MeetingCardSkeleton.tsx. */
export default function MeetingCardSkeleton() {
    return (
        <View className="flex-row gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
            <SkeletonBlock width={36} height={36} rounded="lg" />
            <View className="flex-1 gap-2">
                <View className="flex-row flex-wrap items-center gap-2">
                    <SkeletonBlock width={140} height={16} />
                    <SkeletonBlock width={96} height={20} rounded="md" />
                </View>
                <SkeletonBlock width={128} height={12} />
                <SkeletonBlock width="100%" height={12} />
                <SkeletonBlock width="75%" height={12} />
                <View className="flex-row items-center justify-between pt-1">
                    <SkeletonBlock width={112} height={12} />
                    <SkeletonBlock width={80} height={24} rounded="md" />
                </View>
            </View>
        </View>
    )
}
