import { WifiOff } from "lucide-react-native"
import { Text, View } from "react-native"

import { enableIconClassNames } from "@/lib/iconClassName"

import EmptyState from "./EmptyState"

interface Props {
    /** "line" above a list fed from saved data; "empty" for a screen with nothing saved to show. */
    variant?: "line" | "empty"
    /** The empty variant's Retry. */
    onRetry?: () => void
}

enableIconClassNames(WifiOff)

/**
 * Offline as a stated condition. Over saved data: one amber line saying the list is saved. On a screen with nothing
 * saved: the empty state with a Retry that loads it once the network is back.
 */
export default function OfflineNotice({ variant = "line", onRetry }: Props) {
    if (variant === "empty") {
        return (
            <EmptyState
                icon={WifiOff}
                title="You're offline"
                message="Connect to load this screen."
                actionLabel={onRetry ? "Retry" : undefined}
                onAction={onRetry}
            />
        )
    }

    return (
        <View
            accessibilityRole="alert"
            className="flex-row items-center gap-2 rounded-md bg-amber-50 px-3 py-2 dark:bg-amber-500/10"
        >
            <WifiOff size={14} className="text-amber-700 dark:text-amber-300" />
            <Text className="flex-1 text-xs font-medium text-amber-800 dark:text-amber-300">
                Showing saved data — you're offline
            </Text>
        </View>
    )
}
