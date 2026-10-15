import type { NativeStackHeaderProps } from "@react-navigation/native-stack"
import { ArrowLeft } from "lucide-react-native"
import { Pressable, Text, View, useColorScheme } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import HeaderSearchButton from "@/components/dashboard/HeaderSearchButton"
import HeaderBell from "@/components/notifications/HeaderBell"
import HeaderAvatar from "@/components/profile/HeaderAvatar"
import ZanMark from "@/components/ui/ZanMark"
import { enableIconClassNames } from "@/lib/iconClassName"

import { useTabPlacement } from "./barLayout"

// Material 3's small top app bar: 64 dp tall, a 28 dp logo, a 48 dp navigation button.
const BAR_HEIGHT = 64
const MARK_SIZE = 28
const BACK_ICON_SIZE = 24

enableIconClassNames(ArrowLeft)

/**
 * The header of every screen inside a tab (docs/navigation-architecure.md, section 1). A tab's list shows the ZAN mark
 * and the section's name; every other screen shows Back and its title. The right side is the bell and the profile
 * avatar everywhere, with global search before them on a tab's list.
 */
export default function TopAppBar({ navigation, route, options, back }: NativeStackHeaderProps) {
    const insets = useSafeAreaInsets()
    const isDarkMode = useColorScheme() === "dark"
    const { isInBar, firstBarTab } = useTabPlacement()
    const isTopLevel = isInBar && !back
    const title = typeof options.title === "string" ? options.title : route.name
    // A tab outside the bar, such as Lead Sources from the profile sheet, leaves by Back too.
    const hasBack = !isTopLevel && (Boolean(back) || navigation.canGoBack() || firstBarTab != null)

    function handleBack() {
        if (navigation.canGoBack()) {
            navigation.goBack()
            return
        }
        if (firstBarTab) navigation.getParent()?.navigate(firstBarTab)
    }

    return (
        <View className="bg-neutral-50 dark:bg-neutral-950" style={{ paddingTop: insets.top }}>
            <View className="flex-row items-center gap-1 pr-1" style={{ height: BAR_HEIGHT }}>
                {hasBack ? (
                    <Pressable
                        onPress={handleBack}
                        accessibilityRole="button"
                        accessibilityLabel="Navigate up"
                        className="ml-1 h-12 w-12 items-center justify-center rounded-full active:bg-neutral-900/10 dark:active:bg-white/10"
                    >
                        <ArrowLeft size={BACK_ICON_SIZE} className="text-neutral-900 dark:text-neutral-100" />
                    </Pressable>
                ) : (
                    <View className="ml-4 mr-2">
                        <ZanMark size={MARK_SIZE} tone={isDarkMode ? "dark" : "light"} />
                    </View>
                )}
                <Text
                    accessibilityRole="header"
                    numberOfLines={1}
                    className="flex-1 text-[22px] font-medium text-neutral-900 dark:text-neutral-50"
                >
                    {title}
                </Text>
                {isTopLevel && <HeaderSearchButton />}
                <HeaderBell />
                <HeaderAvatar />
            </View>
        </View>
    )
}
