import { ShieldAlert } from "lucide-react-native"
import { Text, View } from "react-native"

import { enableIconClassNames } from "@/lib/iconClassName"

interface Props {
    /** The API's 403 message. Falls back to the web's generic line. */
    message?: string
}

const DEFAULT_MESSAGE = "You aren't authorized to perform this action."

enableIconClassNames(ShieldAlert)

/**
 * The 403 view, shown in place of a screen's content when the API answers 403. Classes are the web's AccessDenied,
 * except the title's dark colour: the web's dark:text-orange-800 is about 2.7:1 on neutral-950, too dark to read.
 */
export default function AccessDenied({ message }: Props) {
    return (
        <View className="items-center justify-center rounded-xl bg-white px-6 py-16 dark:bg-neutral-950">
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/20">
                <ShieldAlert size={28} className="text-amber-600 dark:text-amber-400" />
            </View>
            <Text className="text-center text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Access Denied
            </Text>
            <Text className="mt-1 max-w-sm text-center text-sm text-neutral-600 dark:text-neutral-400">
                {message || DEFAULT_MESSAGE}
            </Text>
        </View>
    )
}
