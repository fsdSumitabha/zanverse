import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { handleNavigationReady, navigationRef } from "@/api/navigationRef"
import { useAuth } from "@/contexts/AuthContext"
import { useRegionScope } from "@/contexts/RegionContext"
import LoginScreen from "@/screens/auth/LoginScreen"
import SplashScreen from "@/screens/auth/SplashScreen"
import HomePlaceholderScreen from "@/screens/dev/HomePlaceholderScreen"
import KitchenSinkScreen from "@/screens/dev/KitchenSinkScreen"
import { useNavigationTheme } from "@/theme"

import type { RootStackParamList } from "./types"

const Stack = createNativeStackNavigator<RootStackParamList>()

/**
 * Splash, then Login or the app. Session 4's temporary version: `App` is a placeholder Home. Session 5 replaces it
 * with the tabs.
 *
 * The container is keyed on the active region. A region switch remounts every screen, so nothing fetched under the
 * old region stays on screen. A remount starts on the route that matches the session, so it never passes Splash.
 */
export default function RootNavigator() {
    const { loading, user } = useAuth()
    const { active } = useRegionScope()
    const theme = useNavigationTheme()

    const initialRouteName: keyof RootStackParamList = loading ? "Splash" : user ? "App" : "Auth"

    return (
        <NavigationContainer key={active} ref={navigationRef} theme={theme} onReady={handleNavigationReady}>
            <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="Auth" component={LoginScreen} />
                <Stack.Screen name="App" component={HomePlaceholderScreen} />
                <Stack.Screen name="KitchenSink" component={KitchenSinkScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    )
}
