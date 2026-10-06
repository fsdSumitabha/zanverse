import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { renderScreenLayout } from "@/navigation/ScreenLayout"
import { getStackScreenOptions } from "@/navigation/stackOptions"
import type { CallsStackParamList } from "@/navigation/types"
import LeadSourceDetailScreen from "@/screens/leadSources/LeadSourceDetailScreen"
import LeadSourcesScreen from "@/screens/leadSources/LeadSourcesScreen"
import PlaceholderScreen from "@/screens/PlaceholderScreen"

const Stack = createNativeStackNavigator<CallsStackParamList>()

/** The Calls tab's stack. The three upload screens are placeholders until session 13. */
export default function CallsStack() {
    return (
        <Stack.Navigator screenOptions={getStackScreenOptions} screenLayout={renderScreenLayout}>
            <Stack.Screen name="LeadSources" component={LeadSourcesScreen} />
            <Stack.Screen name="LeadSourceDetail" component={LeadSourceDetailScreen} />
            <Stack.Screen name="LeadSourceUploads" component={PlaceholderScreen} />
            <Stack.Screen name="LeadSourceUpload" component={PlaceholderScreen} />
            <Stack.Screen name="LeadSourceReport" component={PlaceholderScreen} />
        </Stack.Navigator>
    )
}
