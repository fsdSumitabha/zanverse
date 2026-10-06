import { SlidersHorizontal } from "lucide-react-native"
import { Pressable, View } from "react-native"

import { enableIconClassNames } from "@/lib/iconClassName"

enableIconClassNames(SlidersHorizontal)

/** The square filter button, with a blue dot while any filter is set. */
export default function FilterButton({ isActive, onPress }: { isActive: boolean; onPress: () => void }) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={isActive ? "Filters, some on" : "Filters"}
            className="h-11 w-11 items-center justify-center rounded-lg border border-slate-300 bg-white active:opacity-80 dark:border-neutral-700 dark:bg-neutral-800"
        >
            <SlidersHorizontal size={18} className="text-neutral-700 dark:text-neutral-200" />
            {isActive && <View className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-blue-600" />}
        </Pressable>
    )
}
