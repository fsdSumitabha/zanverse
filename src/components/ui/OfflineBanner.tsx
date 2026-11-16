import { WifiOff } from "lucide-react-native"
import { Text, View } from "react-native"

import { useIsOnline } from "@/hooks/useIsOnline"
import { enableIconClassNames } from "@/lib/iconClassName"

enableIconClassNames(WifiOff)

/**
 * A thin bar under the header while the phone has no connection. Hidden while the state is still unknown, so it never
 * flashes at launch.
 */
export default function OfflineBanner() {
    const isOnline = useIsOnline()
    if (isOnline) return null

    return (
        <View
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            className="flex-row items-center justify-center gap-2 bg-amber-100 px-4 py-1.5 dark:bg-amber-500/20"
        >
            <WifiOff size={14} className="text-amber-800 dark:text-amber-300" />
            <Text className="text-xs font-medium text-amber-800 dark:text-amber-300">You are offline</Text>
        </View>
    )
}
