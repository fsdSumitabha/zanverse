import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { renderScreenLayout } from "@/navigation/ScreenLayout"
import { getStackScreenOptions } from "@/navigation/stackOptions"
import type { CallsStackParamList } from "@/navigation/types"
import LeadSourcesScreen from "@/screens/leadSources/LeadSourcesScreen"
import PlaceholderScreen from "@/screens/PlaceholderScreen"

const Stack = createNativeStackNavigator<CallsStackParamList>()

/** The Calls tab's stack. The detail and uploads screens are placeholders until sessions 12 and 13. */
export default function CallsStack() {
    return (
        <Stack.Navigator screenOptions={getStackScreenOptions} screenLayout={renderScreenLayout}>
            <Stack.Screen name="LeadSources" component={LeadSourcesScreen} />
            <Stack.Screen name="LeadSourceDetail" component={PlaceholderScreen} />
            <Stack.Screen name="LeadSourceUploads" component={PlaceholderScreen} />
        </Stack.Navigator>
    )
}
