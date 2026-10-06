import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { renderScreenLayout } from "@/navigation/ScreenLayout"
import { getStackScreenOptions } from "@/navigation/stackOptions"
import type { MoreStackParamList } from "@/navigation/types"
import ActivityLogsScreen from "@/screens/activityLogs/ActivityLogsScreen"
import MeetingsListScreen from "@/screens/meetings/MeetingsListScreen"
import MoreScreen from "@/screens/more/MoreScreen"
import NotificationsScreen from "@/screens/notifications/NotificationsScreen"
import ProfileEditScreen from "@/screens/profile/ProfileEditScreen"
import ProfileScreen from "@/screens/profile/ProfileScreen"
import PlaceholderScreen from "@/screens/PlaceholderScreen"

const Stack = createNativeStackNavigator<MoreStackParamList>()

/** The More tab's stack: the More list, then the destinations that have no tab of their own. */
export default function MoreStack() {
    return (
        <Stack.Navigator screenOptions={getStackScreenOptions} screenLayout={renderScreenLayout}>
            <Stack.Screen name="More" component={MoreScreen} />
            <Stack.Screen name="Meetings" component={MeetingsListScreen} />
            <Stack.Screen name="OverallStats" component={PlaceholderScreen} />
            <Stack.Screen name="ActivityLogs" component={ActivityLogsScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
        </Stack.Navigator>
    )
}
