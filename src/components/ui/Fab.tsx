import { Plus, type LucideIcon } from "lucide-react-native"
import { Pressable } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { PALETTE } from "@/theme"

interface Props {
    onPress: () => void
    accessibilityLabel: string
    icon?: LucideIcon
    /**
     * Added to the bottom offset. Session 5 decides what goes here on tab screens. Note the session 1 finding in
     * prompts/README.md: useBottomTabBarHeight() already includes insets.bottom, and a tab screen already ends at
     * the tab bar, so passing the tab bar height may lift the button too far. Check it on a device.
     */
    extraBottom?: number
    /**
     * True on a tab screen. The screen already ends at the tab bar's top edge, and the tab bar already covers the
     * gesture bar, so the bottom inset is not added (the session 1 finding).
     */
    isAboveTabBar?: boolean
}

const FAB_SIZE = 56
const EDGE_GAP = 16

// A floating button sits above the content, like the web's shadow-lg. Android shows that with elevation.
const FAB_SHADOW = {
    elevation: 6,
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
}

/**
 * The bottom-right floating button. Edge-to-edge is on, so it adds the bottom inset to clear the gesture bar.
 * Its parent must fill the screen (or the area it floats over), because it is positioned absolutely.
 */
export default function Fab({
    onPress,
    accessibilityLabel,
    icon: Icon = Plus,
    extraBottom,
    isAboveTabBar = false,
}: Props) {
    const insets = useSafeAreaInsets()

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            android_ripple={{ color: "rgba(255, 255, 255, 0.25)", borderless: true, radius: FAB_SIZE / 2 }}
            className="absolute items-center justify-center rounded-full bg-blue-600 active:scale-[0.98]"
            style={[
                FAB_SHADOW,
                {
                    width: FAB_SIZE,
                    height: FAB_SIZE,
                    right: insets.right + EDGE_GAP,
                    bottom: (isAboveTabBar ? 0 : insets.bottom) + (extraBottom ?? 0) + EDGE_GAP,
                },
            ]}
        >
            <Icon size={24} color={PALETTE.white} />
        </Pressable>
    )
}
