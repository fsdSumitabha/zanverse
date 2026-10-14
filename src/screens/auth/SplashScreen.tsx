import { useEffect } from "react"
import { ActivityIndicator, Text, View, useColorScheme } from "react-native"

import { resetToApp, resetToLogin } from "@/api/navigationRef"
import ZanMark from "@/components/ui/ZanMark"
import { useAuth } from "@/contexts/AuthContext"
import { BRAND_COLOR, PALETTE } from "@/theme"

// The native splash before this screen (Android 12+ res/drawable/splash_icon.xml, the iOS LaunchScreen) draws the
// mark at this size in the centre, on this background. Same size, same place: the hand-over does not jump.
const MARK_SIZE = 128

/** The splash's look, also shown by the navigation container while a deep link waits for the session. */
export function SplashView() {
    const isDarkMode = useColorScheme() === "dark"

    return (
        <View className="flex-1 items-center justify-center bg-neutral-50 dark:bg-neutral-950">
            <ZanMark size={MARK_SIZE} tone={isDarkMode ? "dark" : "light"} />
            {/* Out of the flow, so the mark stays exactly centred. */}
            <View className="absolute inset-x-0 top-1/2 items-center gap-4" style={{ marginTop: MARK_SIZE / 2 + 24 }}>
                <Text className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">ZAN Services</Text>
                <ActivityIndicator color={isDarkMode ? PALETTE["blue-400"] : BRAND_COLOR.light} />
            </View>
        </View>
    )
}

/**
 * The first screen. AuthProvider reads the token from Keychain and asks `/api/auth/me` while this shows. When that
 * answers, a user goes to the tabs and `data === null` goes to Login. The region was seeded from the answer's
 * `activeRegion` by then.
 */
export default function SplashScreen() {
    const { loading, user } = useAuth()

    useEffect(() => {
        if (loading) return
        if (user) resetToApp()
        else resetToLogin()
    }, [loading, user])

    return <SplashView />
}
