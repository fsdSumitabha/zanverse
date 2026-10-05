import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { renderScreenLayout } from "@/navigation/ScreenLayout"
import { getStackScreenOptions } from "@/navigation/stackOptions"
import type { LeadsStackParamList } from "@/navigation/types"
import PlaceholderScreen from "@/screens/PlaceholderScreen"

const Stack = createNativeStackNavigator<LeadsStackParamList>()

/** The Leads tab's stack. Each screen is a placeholder until its session builds it. */
export default function LeadsStack() {
    return (
        <Stack.Navigator screenOptions={getStackScreenOptions} screenLayout={renderScreenLayout}>
            <Stack.Screen name="LeadsList" component={PlaceholderScreen} />
            <Stack.Screen name="LeadDetail" component={PlaceholderScreen} />
            <Stack.Screen name="LeadCreate" component={PlaceholderScreen} />
            <Stack.Screen name="LeadEdit" component={PlaceholderScreen} />
            <Stack.Screen name="LeadConvert" component={PlaceholderScreen} />
        </Stack.Navigator>
    )
}
