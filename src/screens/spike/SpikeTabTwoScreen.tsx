import { useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { PhoneCall } from "lucide-react-native"
import { Pressable, Text, View, useColorScheme } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import type { SpikeStackParamList } from "./spikeRoutes"

const ICON_COLOR_LIGHT = "#2563eb"
const ICON_COLOR_DARK = "#60a5fa"

/**
 * Second tab, and also the pushed stack screen. Pushing it from the tab proves the native-stack back gesture
 * (system back on Android, edge swipe on iOS) on top of the bottom tabs.
 */
export default function SpikeTabTwoScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<SpikeStackParamList>>()
    const route = useRoute()
    const insets = useSafeAreaInsets()
    const isDarkMode = useColorScheme() === "dark"
    const isPushed = route.name === "SpikePushed"
    // The pushed screen has a native header that already clears the status bar.
    const paddingTop = isPushed ? 0 : insets.top

    return (
        <View
            className="flex-1 items-center justify-center gap-4 bg-neutral-50 px-6 dark:bg-neutral-950"
            style={{ paddingTop }}
        >
            <PhoneCall size={32} color={isDarkMode ? ICON_COLOR_DARK : ICON_COLOR_LIGHT} />
            <Text className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                {isPushed ? "Pushed stack screen" : "Tab two"}
            </Text>
            <Text className="text-center text-sm text-neutral-500 dark:text-neutral-400">
                {isPushed
                    ? "Use the back gesture or the system back button to return to the tabs."
                    : "Push a screen on the root stack, then go back with the gesture."}
            </Text>
            {!isPushed && (
                <Pressable
                    onPress={() => navigation.navigate("SpikePushed")}
                    className="min-h-[44px] justify-center rounded-lg bg-blue-600 px-4 active:bg-blue-700"
                >
                    <Text className="text-sm font-medium text-white">Push a stack screen</Text>
                </Pressable>
            )}
        </View>
    )
}
