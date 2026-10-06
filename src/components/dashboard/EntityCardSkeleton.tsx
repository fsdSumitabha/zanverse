import { View } from "react-native"

import { SkeletonBlock } from "@/components/ui"

/** A feed card while the first page loads. Rebuilt from the web's skeletons/EntityCardSkeleton.tsx. */
export default function EntityCardSkeleton() {
    return (
        <View className="flex-row gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <SkeletonBlock width={32} height={32} rounded="lg" />
            <View className="flex-1 gap-2">
                <SkeletonBlock width="55%" height={18} />
                <SkeletonBlock width="35%" height={12} />
                <SkeletonBlock width="80%" height={12} />
                <SkeletonBlock width="100%" height={48} rounded="lg" />
            </View>
        </View>
    )
}
