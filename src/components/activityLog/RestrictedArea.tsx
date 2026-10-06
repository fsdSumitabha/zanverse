import { ShieldAlert } from "lucide-react-native"
import { Text, View } from "react-native"

import { Button } from "@/components/ui"
import { enableIconClassNames } from "@/lib/iconClassName"

enableIconClassNames(ShieldAlert)

/** The amber card a non-admin sees in place of the system activity log. Ported from the web's ActivityLogsClient. */
export default function RestrictedArea({ onOpenProfile }: { onOpenProfile: () => void }) {
    return (
        <View className="gap-4 rounded-2xl border border-amber-300 bg-amber-50 p-6 dark:border-amber-500/40 dark:bg-amber-500/10">
            <View className="flex-row items-start gap-3">
                <ShieldAlert size={20} className="mt-0.5 text-amber-600 dark:text-amber-300" />
                <View className="flex-1">
                    <Text className="font-semibold text-amber-900 dark:text-amber-200">Restricted area</Text>
                    <Text className="mt-1 text-sm text-amber-800 dark:text-amber-200/80">
                        The system activity log is available only to administrators. Your own activity is visible on
                        your profile page.
                    </Text>
                </View>
            </View>
            <Button label="Open my profile" variant="quiet" onPress={onOpenProfile} className="self-start" />
        </View>
    )
}
