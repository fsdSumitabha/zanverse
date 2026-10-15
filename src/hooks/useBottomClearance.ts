import { createContext, useContext } from "react"
import { useSafeAreaInsets } from "react-native-safe-area-context"

/**
 * What covers the bottom of a tab screen. ScreenLayout sets it: the floating bar's overlap on a screen the bar floats
 * over, 0 on a screen that already stops above the gesture bar. Null outside a tab screen.
 */
export const BottomClearanceContext = createContext<number | null>(null)

/**
 * How far a floating button, or the end of a list, must stay from the bottom of the screen: clear of the floating tab
 * bar where it shows, and of the gesture bar everywhere else.
 */
export function useBottomClearance(): number {
    const clearance = useContext(BottomClearanceContext)
    const insets = useSafeAreaInsets()
    return clearance ?? insets.bottom
}
