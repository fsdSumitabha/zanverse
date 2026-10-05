import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { handleNavigationReady, navigationRef } from "@/api/navigationRef"
import { useAuth } from "@/contexts/AuthContext"
import { useRegionScope } from "@/contexts/RegionContext"
import LoginScreen from "@/screens/auth/LoginScreen"
import SplashScreen, { SplashView } from "@/screens/auth/SplashScreen"
import KitchenSinkScreen from "@/screens/dev/KitchenSinkScreen"
import { useNavigationTheme } from "@/theme"

import { linking } from "./linking"
import TabNavigator from "./TabNavigator"
import type { RootStackParamList } from "./types"

const Stack = createNativeStackNavigator<RootStackParamList>()

/**
 * The tabs, keyed on the active region. A region switch remounts every tab and screen, so nothing fetched under the
 * old region stays on screen; the open screens fetch again, as the web's reload does. The navigation container itself
 * is not remounted, so deep links and the navigation ref are untouched.
 */
function AppTabsScreen() {
    const { active } = useRegionScope()
    return <TabNavigator key={active} />
}

/** Splash, then Login or the tabs. */
export default function RootNavigator() {
    const { loading, user } = useAuth()
    const theme = useNavigationTheme()

    // Read once, when the stack first mounts. After that, Splash, Login, logout and a 401 move between routes with
    // resetToLogin() and resetToApp().
    const initialRouteName: keyof RootStackParamList = loading ? "Splash" : user ? "App" : "Auth"

    return (
        <NavigationContainer
            ref={navigationRef}
            theme={theme}
            linking={linking}
            fallback={<SplashView />}
            onReady={handleNavigationReady}
        >
            <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="Auth" component={LoginScreen} />
                <Stack.Screen name="App" component={AppTabsScreen} />
                <Stack.Screen name="KitchenSink" component={KitchenSinkScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    )
}
