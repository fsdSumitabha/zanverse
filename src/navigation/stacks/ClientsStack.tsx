import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { renderScreenLayout } from "@/navigation/ScreenLayout"
import { getStackScreenOptions } from "@/navigation/stackOptions"
import type { ClientsStackParamList } from "@/navigation/types"
import ClientDetailScreen from "@/screens/clients/ClientDetailScreen"
import ClientEditScreen from "@/screens/clients/ClientEditScreen"
import ClientProjectsScreen from "@/screens/clients/ClientProjectsScreen"
import ClientsListScreen from "@/screens/clients/ClientsListScreen"
import ProjectCreateScreen from "@/screens/clients/ProjectCreateScreen"

const Stack = createNativeStackNavigator<ClientsStackParamList>()

/** The Clients tab's stack: list, detail, edit, the client's projects, and a new project for the client. */
export default function ClientsStack() {
    return (
        <Stack.Navigator screenOptions={getStackScreenOptions} screenLayout={renderScreenLayout}>
            <Stack.Screen name="ClientsList" component={ClientsListScreen} />
            <Stack.Screen name="ClientDetail" component={ClientDetailScreen} />
            <Stack.Screen name="ClientEdit" component={ClientEditScreen} />
            <Stack.Screen name="ClientProjects" component={ClientProjectsScreen} />
            <Stack.Screen name="ProjectCreate" component={ProjectCreateScreen} />
        </Stack.Navigator>
    )
}
