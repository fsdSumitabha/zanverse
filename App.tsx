import "./global.css"

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { Home, PhoneCall, type LucideIcon } from "lucide-react-native"
import type { ComponentType } from "react"
import { StatusBar, StyleSheet, useColorScheme } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaProvider } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"

import { LEAD_SOURCE_ACCESS_ROLES } from "@/constants/leadSourceRoles"

import SpikeHomeScreen from "./src/screens/spike/SpikeHomeScreen"
import SpikeTabTwoScreen from "./src/screens/spike/SpikeTabTwoScreen"
import type { SpikeStackParamList, SpikeTabParamList } from "./src/screens/spike/spikeRoutes"

interface SpikeNavItem {
    name: string
    route: keyof SpikeTabParamList
    roles: number[]
    icon: LucideIcon
    component: ComponentType
}

interface TabIconProps {
    color: string
    size: number
}

/**
 * Same shape as the web's MobileNav `navItems` (name, icon, roles). The Dashboard array is copied from MobileNav.tsx,
 * and Calls uses LEAD_SOURCE_ACCESS_ROLES as MobileNav does. Session 5 filters by them. The spike shows every tab.
 */
const SPIKE_NAV_ITEMS: SpikeNavItem[] = [
    {
        name: "Dashboard",
        route: "SpikeHome",
        roles: [10, 15, 20, 30, 40, 42, 45, 50, 60, 65, 69, 70, 80],
        icon: Home,
        component: SpikeHomeScreen,
    },
    {
        name: "Calls",
        route: "SpikeTabTwo",
        roles: LEAD_SOURCE_ACCESS_ROLES,
        icon: PhoneCall,
        component: SpikeTabTwoScreen,
    },
]

const SPIKE_TABS = SPIKE_NAV_ITEMS.map((item) => ({ ...item, renderIcon: createTabIcon(item.icon) }))

const Stack = createNativeStackNavigator<SpikeStackParamList>()
const Tab = createBottomTabNavigator<SpikeTabParamList>()

/** Builds a tab bar icon renderer once per item, so the navigator never gets a new component per render. */
function createTabIcon(Icon: LucideIcon) {
    return function renderTabIcon({ color, size }: TabIconProps) {
        return <Icon color={color} size={size} />
    }
}

function SpikeTabs() {
    return (
        <Tab.Navigator screenOptions={{ headerShown: false }}>
            {SPIKE_TABS.map((item) => (
                <Tab.Screen
                    key={item.route}
                    name={item.route}
                    component={item.component}
                    options={{ title: item.name, tabBarIcon: item.renderIcon }}
                />
            ))}
        </Tab.Navigator>
    )
}

function App() {
    const isDarkMode = useColorScheme() === "dark"

    return (
        <GestureHandlerRootView style={styles.root}>
            <SafeAreaProvider>
                <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
                <NavigationContainer theme={isDarkMode ? DarkTheme : DefaultTheme}>
                    <Stack.Navigator>
                        <Stack.Screen name="Tabs" component={SpikeTabs} options={{ headerShown: false }} />
                        <Stack.Screen
                            name="SpikePushed"
                            component={SpikeTabTwoScreen}
                            options={{ title: "Pushed screen" }}
                        />
                    </Stack.Navigator>
                </NavigationContainer>
                <Toast />
            </SafeAreaProvider>
        </GestureHandlerRootView>
    )
}

// GestureHandlerRootView is not a core component, so NativeWind does not map className on it.
const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
})

export default App
