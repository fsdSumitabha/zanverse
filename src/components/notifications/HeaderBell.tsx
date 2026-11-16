import { Bell } from "lucide-react-native"
import { Pressable, Text, View } from "react-native"

import { navigationRef } from "@/api/navigationRef"
import { useNotifications } from "@/contexts/NotificationContext"
import { enableIconClassNames } from "@/lib/iconClassName"

const MAX_SHOWN = 9

enableIconClassNames(Bell)

/**
 * The bell in every stack header, with the unseen count. A tap opens the Notifications screen, which is the phone's
 * version of the web's dropdown, and marks the rows seen.
 */
export default function HeaderBell() {
    const { unseen, markSeen } = useNotifications()

    function open() {
        if (unseen > 0) markSeen()
        navigationRef.navigate("App", { screen: "MoreTab", params: { screen: "Notifications", initial: false } })
    }

    return (
        <Pressable
            onPress={open}
            accessibilityRole="button"
            accessibilityLabel={unseen > 0 ? `Notifications, ${unseen} new` : "Notifications"}
            hitSlop={8}
            className="h-11 w-11 items-center justify-center"
        >
            <Bell size={22} className="text-neutral-700 dark:text-neutral-200" />
            {unseen > 0 && (
                <View className="absolute right-1 top-1 h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1">
                    <Text className="text-[10px] font-bold text-white">{unseen > MAX_SHOWN ? "9+" : unseen}</Text>
                </View>
            )}
        </Pressable>
    )
}
