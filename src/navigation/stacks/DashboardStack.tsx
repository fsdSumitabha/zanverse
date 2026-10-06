import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { renderScreenLayout } from "@/navigation/ScreenLayout"
import { DASHBOARD_SCREEN_OPTIONS, getStackScreenOptions } from "@/navigation/stackOptions"
import type { DashboardStackParamList } from "@/navigation/types"
import DashboardScreen from "@/screens/dashboard/DashboardScreen"
import SearchScreen from "@/screens/dashboard/SearchScreen"

const Stack = createNativeStackNavigator<DashboardStackParamList>()

/** The Dashboard tab's stack: the feed, and the global search above it. */
export default function DashboardStack() {
    return (
        <Stack.Navigator screenOptions={getStackScreenOptions} screenLayout={renderScreenLayout}>
            <Stack.Screen name="Dashboard" component={DashboardScreen} options={DASHBOARD_SCREEN_OPTIONS} />
            <Stack.Screen name="Search" component={SearchScreen} />
        </Stack.Navigator>
    )
}
