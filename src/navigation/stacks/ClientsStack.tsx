import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { renderScreenLayout } from "@/navigation/ScreenLayout"
import { getStackScreenOptions } from "@/navigation/stackOptions"
import type { ClientsStackParamList } from "@/navigation/types"
import PlaceholderScreen from "@/screens/PlaceholderScreen"

const Stack = createNativeStackNavigator<ClientsStackParamList>()

/** The Clients tab's stack. Each screen is a placeholder until its session builds it. */
export default function ClientsStack() {
    return (
        <Stack.Navigator screenOptions={getStackScreenOptions} screenLayout={renderScreenLayout}>
            <Stack.Screen name="ClientsList" component={PlaceholderScreen} />
            <Stack.Screen name="ClientDetail" component={PlaceholderScreen} />
            <Stack.Screen name="ClientEdit" component={PlaceholderScreen} />
            <Stack.Screen name="ProjectCreate" component={PlaceholderScreen} />
        </Stack.Navigator>
    )
}
