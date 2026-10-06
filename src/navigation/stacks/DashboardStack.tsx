import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { renderScreenLayout } from "@/navigation/ScreenLayout"
import { getStackScreenOptions } from "@/navigation/stackOptions"
import type { DashboardStackParamList } from "@/navigation/types"
import PlaceholderScreen from "@/screens/PlaceholderScreen"

const Stack = createNativeStackNavigator<DashboardStackParamList>()

/** The Dashboard tab's stack. Each screen is a placeholder until its session builds it. */
export default function DashboardStack() {
    return (
        <Stack.Navigator screenOptions={getStackScreenOptions} screenLayout={renderScreenLayout}>
            <Stack.Screen name="Dashboard" component={PlaceholderScreen} />
        </Stack.Navigator>
    )
}
