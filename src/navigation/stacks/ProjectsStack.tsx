import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { renderScreenLayout } from "@/navigation/ScreenLayout"
import { getStackScreenOptions } from "@/navigation/stackOptions"
import type { ProjectsStackParamList } from "@/navigation/types"
import PlaceholderScreen from "@/screens/PlaceholderScreen"

const Stack = createNativeStackNavigator<ProjectsStackParamList>()

/** The Projects tab's stack. Each screen is a placeholder until its session builds it. */
export default function ProjectsStack() {
    return (
        <Stack.Navigator screenOptions={getStackScreenOptions} screenLayout={renderScreenLayout}>
            <Stack.Screen name="ProjectsList" component={PlaceholderScreen} />
            <Stack.Screen name="ProjectDetail" component={PlaceholderScreen} />
            <Stack.Screen name="ProjectEdit" component={PlaceholderScreen} />
        </Stack.Navigator>
    )
}
