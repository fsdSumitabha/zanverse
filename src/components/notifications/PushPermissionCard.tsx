import { BellOff, BellRing, CircleCheck } from "lucide-react-native"
import { Text, View } from "react-native"

import { Button, Card } from "@/components/ui"
import { useNotificationPermission } from "@/hooks/useNotificationPermission"
import { enableIconClassNames } from "@/lib/iconClassName"
import { isFirebaseConfigured, useIsPushRegistered } from "@/lib/push/device"

enableIconClassNames(BellOff, BellRing, CircleCheck)

interface Props {
    /** The settings screen shows the card in every state. The inbox shows it only while notifications are off. */
    isShownWhenOn?: boolean
}

function getOnLine(isRegistered: boolean): string {
    if (!isFirebaseConfigured()) return "Reminders on this phone work. This build has no push from the CRM."
    return isRegistered ? "Push from the CRM reaches this phone." : "Connecting this phone for push from the CRM."
}

/**
 * Asks for the notification permission in context, never at launch: "Turn on notifications" shows the system dialog,
 * and once Android has stopped showing it, the button opens the app's page in system Settings instead.
 */
export default function PushPermissionCard({ isShownWhenOn = false }: Props) {
    const { permission, request } = useNotificationPermission()
    const isRegistered = useIsPushRegistered()

    if (permission === null) return null
    if (permission === "granted") {
        if (!isShownWhenOn) return null
        return (
            <Card className="flex-row items-center gap-3 p-4">
                <CircleCheck size={20} className="text-emerald-600 dark:text-emerald-400" />
                <View className="flex-1">
                    <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        Notifications are on
                    </Text>
                    <Text className="text-xs text-neutral-500 dark:text-neutral-400">{getOnLine(isRegistered)}</Text>
                </View>
            </Card>
        )
    }

    const isBlocked = permission === "blocked"
    return (
        <Card className="gap-3 p-4">
            <View className="flex-row items-center gap-3">
                {isBlocked ? (
                    <BellOff size={20} className="text-rose-600 dark:text-rose-400" />
                ) : (
                    <BellRing size={20} className="text-violet-600 dark:text-violet-400" />
                )}
                <View className="flex-1">
                    <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {isBlocked ? "Notifications are blocked" : "Notifications are off"}
                    </Text>
                    <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                        {isBlocked
                            ? "Turn them on for this app in Android Settings. Callbacks and new leads cannot reach you until then."
                            : "Turn them on to hear about callbacks, new leads and meetings."}
                    </Text>
                </View>
            </View>
            <Button label={isBlocked ? "Open Settings" : "Turn on notifications"} onPress={request} />
        </Card>
    )
}
