import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { renderScreenLayout } from "@/navigation/ScreenLayout"
import { getStackScreenOptions } from "@/navigation/stackOptions"
import type { UsersStackParamList } from "@/navigation/types"
import PlaceholderScreen from "@/screens/PlaceholderScreen"

const Stack = createNativeStackNavigator<UsersStackParamList>()

/** The Users tab's stack. Each screen is a placeholder until its session builds it. */
export default function UsersStack() {
    return (
        <Stack.Navigator screenOptions={getStackScreenOptions} screenLayout={renderScreenLayout}>
            <Stack.Screen name="UsersList" component={PlaceholderScreen} />
            <Stack.Screen name="UserCreate" component={PlaceholderScreen} />
            <Stack.Screen name="UserEdit" component={PlaceholderScreen} />
        </Stack.Navigator>
    )
}
