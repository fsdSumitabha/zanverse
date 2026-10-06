import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { handleNavigationReady, navigationRef } from "@/api/navigationRef"
import SheetProvider from "@/components/ui/SheetProvider"
import { registerSentryNavigation } from "@/lib/sentry"
import { useAuth } from "@/contexts/AuthContext"
import { useRegionScope } from "@/contexts/RegionContext"
import LoginScreen from "@/screens/auth/LoginScreen"
import SplashScreen, { SplashView } from "@/screens/auth/SplashScreen"
import KitchenSinkScreen from "@/screens/dev/KitchenSinkScreen"
import AddNoteScreen from "@/screens/interactions/AddNoteScreen"
import AttendeePickerScreen from "@/screens/interactions/AttendeePickerScreen"
import LogCallScreen from "@/screens/interactions/LogCallScreen"
import ScheduleMeetingScreen from "@/screens/interactions/ScheduleMeetingScreen"
import SendQuotationScreen from "@/screens/interactions/SendQuotationScreen"
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

// Runs the resets that waited for the container, and lets Sentry name the screen an error happened on.
function handleReady() {
    handleNavigationReady()
    registerSentryNavigation(navigationRef)
}

/** Splash, then Login or the tabs, and the timeline forms as modals over the tabs. */
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
            onReady={handleReady}
        >
            {/* Inside the container, so a sheet's content can still read the navigation context. */}
            <SheetProvider>
                <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Splash" component={SplashScreen} />
                    <Stack.Screen name="Auth" component={LoginScreen} />
                    <Stack.Screen name="App" component={AppTabsScreen} />
                    <Stack.Screen name="KitchenSink" component={KitchenSinkScreen} />
                    {/* The timeline forms draw their own 90% sheet over the record, so the route is see-through. */}
                    <Stack.Group
                        screenOptions={{ presentation: "transparentModal", animation: "fade", headerShown: false }}
                    >
                        <Stack.Screen name="AddNote" component={AddNoteScreen} />
                        <Stack.Screen name="LogCall" component={LogCallScreen} />
                        <Stack.Screen name="SendQuotation" component={SendQuotationScreen} />
                        <Stack.Screen name="ScheduleMeeting" component={ScheduleMeetingScreen} />
                    </Stack.Group>
                    <Stack.Group screenOptions={{ presentation: "modal", headerShown: true }}>
                        <Stack.Screen
                            name="AttendeePicker"
                            component={AttendeePickerScreen}
                            options={{ title: "Attendees" }}
                        />
                    </Stack.Group>
                </Stack.Navigator>
            </SheetProvider>
        </NavigationContainer>
    )
}
