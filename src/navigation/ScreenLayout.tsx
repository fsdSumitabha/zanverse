import type { ReactNode } from "react"
import { View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { AccessDenied, OfflineBanner } from "@/components/ui"
import { useAuth } from "@/contexts/AuthContext"
import { BottomClearanceContext } from "@/hooks/useBottomClearance"

import { getBarOverlap, useTabPlacement } from "./barLayout"
import { canOpen } from "./permissions"

interface Props {
    routeName: string
    /** True for the first screen of its stack: the tab's list. */
    isFirstScreen: boolean
    children: ReactNode
}

/**
 * Wraps every screen inside a tab, under its header: the offline bar, then the screen, or AccessDenied when the role
 * may not open it. This replaces the web proxy's page guard.
 *
 * It also settles the bottom edge. The floating bar shows only on the first screen of a tab in the bar, and floats over
 * it, so that screen runs to the bottom and its lists and buttons clear the bar (useBottomClearance). Every other
 * screen stops above the gesture bar.
 */
export default function ScreenLayout({ routeName, isFirstScreen, children }: Props) {
    const { role } = useAuth()
    const insets = useSafeAreaInsets()
    const { isInBar } = useTabPlacement()
    const isUnderBar = isInBar && isFirstScreen

    return (
        <View
            className="flex-1 bg-neutral-50 dark:bg-neutral-950"
            style={isUnderBar ? undefined : { paddingBottom: insets.bottom }}
        >
            <BottomClearanceContext.Provider value={isUnderBar ? getBarOverlap(insets.bottom) : 0}>
                <OfflineBanner />
                {canOpen(routeName, role) ? (
                    children
                ) : (
                    <View className="flex-1 justify-center p-4">
                        <AccessDenied />
                    </View>
                )}
            </BottomClearanceContext.Provider>
        </View>
    )
}

interface LayoutArgs {
    route: { key: string; name: string }
    navigation: { getState: () => { routes: { key: string }[] } }
    children: ReactNode
}

/** For a stack navigator's `screenLayout` prop. */
export function renderScreenLayout({ route, navigation, children }: LayoutArgs) {
    const isFirstScreen = navigation.getState().routes[0]?.key === route.key
    return (
        <ScreenLayout routeName={route.name} isFirstScreen={isFirstScreen}>
            {children}
        </ScreenLayout>
    )
}
