import { useEffect } from "react"
import { ActivityIndicator, Text, View, useColorScheme } from "react-native"

import { resetToApp, resetToLogin } from "@/api/navigationRef"
import { useAuth } from "@/contexts/AuthContext"
import { BRAND_COLOR, PALETTE } from "@/theme"

/**
 * The first screen. AuthProvider reads the token from Keychain and asks `/api/auth/me` while this shows. When that
 * answers, a user goes to the app and `data === null` goes to Login.
 */
export default function SplashScreen() {
    const { loading, user } = useAuth()
    const isDarkMode = useColorScheme() === "dark"

    useEffect(() => {
        if (loading) return
        if (user) resetToApp()
        else resetToLogin()
    }, [loading, user])

    return (
        <View className="flex-1 items-center justify-center gap-4 bg-neutral-50 dark:bg-neutral-950">
            <Text className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">ZAN Services</Text>
            <ActivityIndicator color={isDarkMode ? PALETTE["blue-400"] : BRAND_COLOR.light} />
        </View>
    )
}
