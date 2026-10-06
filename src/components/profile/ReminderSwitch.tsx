import { BellRing } from "lucide-react-native"
import { useState } from "react"
import { Switch, Text, View, useColorScheme } from "react-native"

import { Card } from "@/components/ui"
import { enableIconClassNames } from "@/lib/iconClassName"
import { cancelAllCallbackReminders } from "@/lib/push/reminders"
import { getRemindersEnabled, saveRemindersEnabled } from "@/store/mmkv"
import { BRAND_COLOR, PALETTE } from "@/theme"

enableIconClassNames(BellRing)

/**
 * The "Callback reminders" switch. Off removes every reminder set on this phone and sets no new ones. On sets them
 * again from the next Lead Sources load.
 */
export default function ReminderSwitch() {
    const [isEnabled, setIsEnabled] = useState(getRemindersEnabled)
    const isDarkMode = useColorScheme() === "dark"

    function handleChange(next: boolean) {
        setIsEnabled(next)
        saveRemindersEnabled(next)
        if (!next) cancelAllCallbackReminders()
    }

    return (
        <Card className="flex-row items-center gap-3 p-4">
            <BellRing size={18} className="text-violet-600 dark:text-violet-400" />
            <View className="flex-1">
                <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Callback reminders</Text>
                <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                    {isEnabled
                        ? "This phone rings when a callback you set falls due."
                        : "Off: no reminders ring on this phone."}
                </Text>
            </View>
            <Switch
                value={isEnabled}
                onValueChange={handleChange}
                accessibilityLabel="Callback reminders"
                trackColor={{
                    false: isDarkMode ? PALETTE["neutral-700"] : PALETTE["neutral-300"],
                    true: BRAND_COLOR.light,
                }}
                thumbColor={PALETTE.white}
            />
        </Card>
    )
}
