import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { renderScreenLayout } from "@/navigation/ScreenLayout"
import { getStackScreenOptions } from "@/navigation/stackOptions"
import type { CallsStackParamList } from "@/navigation/types"
import PlaceholderScreen from "@/screens/PlaceholderScreen"

const Stack = createNativeStackNavigator<CallsStackParamList>()

/** The Calls tab's stack. Each screen is a placeholder until its session builds it. */
export default function CallsStack() {
    return (
        <Stack.Navigator screenOptions={getStackScreenOptions} screenLayout={renderScreenLayout}>
            <Stack.Screen name="LeadSources" component={PlaceholderScreen} />
            <Stack.Screen name="LeadSourceDetail" component={PlaceholderScreen} />
            <Stack.Screen name="LeadSourceUploads" component={PlaceholderScreen} />
        </Stack.Navigator>
    )
}
