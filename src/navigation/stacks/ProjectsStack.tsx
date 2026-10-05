import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { renderScreenLayout } from "@/navigation/ScreenLayout"
import { getStackScreenOptions } from "@/navigation/stackOptions"
import type { ProjectsStackParamList } from "@/navigation/types"
import ProjectDetailScreen from "@/screens/projects/ProjectDetailScreen"
import ProjectEditScreen from "@/screens/projects/ProjectEditScreen"
import ProjectsListScreen from "@/screens/projects/ProjectsListScreen"

const Stack = createNativeStackNavigator<ProjectsStackParamList>()

/** The Projects tab's stack: list, detail and edit. Projects are created from their client. */
export default function ProjectsStack() {
    return (
        <Stack.Navigator screenOptions={getStackScreenOptions} screenLayout={renderScreenLayout}>
            <Stack.Screen name="ProjectsList" component={ProjectsListScreen} />
            <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
            <Stack.Screen name="ProjectEdit" component={ProjectEditScreen} />
        </Stack.Navigator>
    )
}
