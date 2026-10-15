import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { renderScreenLayout } from "@/navigation/ScreenLayout"
import { getStackScreenOptions } from "@/navigation/stackOptions"
import { renderPageScreens } from "@/navigation/stacks/pageScreens"
import type { MeetingsStackParamList } from "@/navigation/types"
import MeetingsListScreen from "@/screens/meetings/MeetingsListScreen"

const Stack = createNativeStackNavigator<MeetingsStackParamList>()

/** The Meetings tab's stack: the meetings list. A meeting is changed in place, so it has no screen of its own. */
export default function MeetingsStack() {
    return (
        <Stack.Navigator screenOptions={getStackScreenOptions} screenLayout={renderScreenLayout}>
            <Stack.Screen name="Meetings" component={MeetingsListScreen} />
            {renderPageScreens(Stack)}
        </Stack.Navigator>
    )
}
