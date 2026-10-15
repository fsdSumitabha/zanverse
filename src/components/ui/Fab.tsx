import { Plus, type LucideIcon } from "lucide-react-native"
import { Pressable } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useBottomClearance } from "@/hooks/useBottomClearance"
import { PALETTE } from "@/theme"

interface Props {
    onPress: () => void
    accessibilityLabel: string
    icon?: LucideIcon
    /** Added to the bottom offset, on top of the floating tab bar or the gesture bar. */
    extraBottom?: number
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
 * The bottom-right floating button. It sits above the floating tab bar on a tab's list, and above the gesture bar
 * everywhere else (useBottomClearance). Its parent must fill the screen (or the area it floats over), because it is
 * positioned absolutely.
 */
export default function Fab({ onPress, accessibilityLabel, icon: Icon = Plus, extraBottom }: Props) {
    const insets = useSafeAreaInsets()
    const bottomClearance = useBottomClearance()

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
                    bottom: bottomClearance + (extraBottom ?? 0) + EDGE_GAP,
                },
            ]}
        >
            <Icon size={24} color={PALETTE.white} />
        </Pressable>
    )
}
