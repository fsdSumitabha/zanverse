import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { renderScreenLayout } from "@/navigation/ScreenLayout"
import { getStackScreenOptions } from "@/navigation/stackOptions"
import type { UsersStackParamList } from "@/navigation/types"
import UserCreateScreen from "@/screens/users/UserCreateScreen"
import UserEditScreen from "@/screens/users/UserEditScreen"
import UsersListScreen from "@/screens/users/UsersListScreen"

const Stack = createNativeStackNavigator<UsersStackParamList>()

/** The Users tab's stack: the staff list, and one form to create or edit an account. */
export default function UsersStack() {
    return (
        <Stack.Navigator screenOptions={getStackScreenOptions} screenLayout={renderScreenLayout}>
            <Stack.Screen name="UsersList" component={UsersListScreen} />
            <Stack.Screen name="UserCreate" component={UserCreateScreen} />
            <Stack.Screen name="UserEdit" component={UserEditScreen} />
        </Stack.Navigator>
    )
}
