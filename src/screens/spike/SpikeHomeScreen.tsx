import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs"
import { ShieldAlert } from "lucide-react-native"
import { Pressable, ScrollView, Text, View, useColorScheme } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Svg, { Circle } from "react-native-svg"
import Toast from "react-native-toast-message"

import { LEAD_SOURCE_STATUS, LEAD_SOURCE_STATUSES, LEAD_SOURCE_STATUS_META } from "@/constants/leadSourceStatus"

import NativeModuleChecks from "./NativeModuleChecks"
import SpikeSection from "./SpikeSection"

// The web's StatusBadge classes, with the status colour appended unchanged.
const BADGE_CLASSES = "self-start overflow-hidden rounded-md px-2 py-1 text-xs font-medium"

// The web's AccessDenied icon is text-amber-600, dark:text-amber-400. lucide-react-native takes the colour as a prop.
const ICON_COLOR_LIGHT = "#d97706"
const ICON_COLOR_DARK = "#fbbf24"

const FAB_SIZE = 56

/** Throwaway screen that proves styling, dark mode, icons, safe-area insets and every native module on one page. */
export default function SpikeHomeScreen() {
    const insets = useSafeAreaInsets()
    const tabBarHeight = useBottomTabBarHeight()
    const isDarkMode = useColorScheme() === "dark"
    const iconColor = isDarkMode ? ICON_COLOR_DARK : ICON_COLOR_LIGHT
    const fabBottom = insets.bottom + tabBarHeight
    const interested = LEAD_SOURCE_STATUS_META[LEAD_SOURCE_STATUS.INTERESTED]

    return (
        <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
            <ScrollView
                contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: fabBottom + FAB_SIZE + 16 }}
                className="px-4"
            >
                <Text className="mb-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">Session 1 spike</Text>
                <Text className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
                    OS theme: {isDarkMode ? "dark" : "light"}. Toggle it in the emulator; this page should flip with no
                    reload.
                </Text>

                <SpikeSection title="StatusBadge · LEAD_SOURCE_STATUS_META[40].color">
                    <Text className={`${BADGE_CLASSES} ${interested.color}`}>{interested.label}</Text>
                    <View className="mt-3 flex-row flex-wrap gap-2">
                        {LEAD_SOURCE_STATUSES.map((status) => (
                            <Text key={status} className={`${BADGE_CLASSES} ${LEAD_SOURCE_STATUS_META[status].color}`}>
                                {LEAD_SOURCE_STATUS_META[status].label}
                            </Text>
                        ))}
                    </View>
                </SpikeSection>

                <SpikeSection title="LeadSourceRow class strings">
                    <View className="flex-row items-center gap-2.5 border-l-4 border-l-blue-500 bg-blue-50/80 py-2 pl-2 pr-2.5 dark:bg-blue-500/10">
                        <Text className="h-7 w-7 overflow-hidden rounded-full bg-emerald-100 text-center text-[10px] font-semibold leading-7 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                            AK
                        </Text>
                        <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                            Selected row
                        </Text>
                    </View>
                    {/* The web's mouse-over classes become active: (pressed) classes on a phone. */}
                    <Pressable className="mt-2 min-h-[44px] flex-row items-center gap-2.5 border-l-4 border-l-rose-500 bg-rose-50/60 py-2 pl-2 pr-2.5 active:bg-rose-50 dark:bg-rose-500/[0.07] dark:active:bg-rose-500/10">
                        <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                            Callback due row (press it)
                        </Text>
                    </Pressable>
                </SpikeSection>

                <SpikeSection title="react-native-svg · lucide-react-native">
                    <View className="flex-row items-center gap-4">
                        <Svg width={48} height={48}>
                            <Circle cx={24} cy={24} r={20} fill="#059669" />
                        </Svg>
                        <ShieldAlert size={16} color={iconColor} />
                        <ShieldAlert size={28} color={iconColor} />
                        <Text className="flex-1 text-xs text-neutral-500 dark:text-neutral-400">
                            ShieldAlert at 16 and 28, colour {iconColor}
                        </Text>
                    </View>
                </SpikeSection>

                <SpikeSection title="Safe area · edge-to-edge">
                    <Text className="font-mono text-xs text-neutral-700 dark:text-neutral-300">
                        insets: top {Math.round(insets.top)} · right {Math.round(insets.right)} · bottom{" "}
                        {Math.round(insets.bottom)} · left {Math.round(insets.left)}
                    </Text>
                    <Text className="font-mono text-xs text-neutral-700 dark:text-neutral-300">
                        useBottomTabBarHeight(): {Math.round(tabBarHeight)}
                    </Text>
                    <Text className="font-mono text-xs text-neutral-700 dark:text-neutral-300">
                        FAB bottom = insets.bottom + tabBarHeight = {Math.round(fabBottom)}
                    </Text>
                </SpikeSection>

                <NativeModuleChecks />
            </ScrollView>

            <Pressable
                accessibilityLabel="Floating button"
                onPress={() => Toast.show({ type: "info", text1: "Floating button pressed" })}
                className="absolute right-4 items-center justify-center rounded-full bg-blue-600 active:bg-blue-700"
                style={{ bottom: fabBottom, width: FAB_SIZE, height: FAB_SIZE }}
            >
                <Text className="text-2xl font-bold text-white">+</Text>
            </Pressable>
        </View>
    )
}
