import type { ComponentType } from "react"

import type { PageParamList } from "@/navigation/types"
import ActivityLogsScreen from "@/screens/activityLogs/ActivityLogsScreen"
import DashboardScreen from "@/screens/dashboard/DashboardScreen"
import SearchScreen from "@/screens/dashboard/SearchScreen"
import NotificationsScreen from "@/screens/notifications/NotificationsScreen"
import ProfileEditScreen from "@/screens/profile/ProfileEditScreen"
import ProfileScreen from "@/screens/profile/ProfileScreen"
import NotificationSettingsScreen from "@/screens/settings/NotificationSettingsScreen"
import SettingsScreen from "@/screens/settings/SettingsScreen"
import OverallStatsScreen from "@/screens/stats/OverallStatsScreen"

type PageName = keyof PageParamList

const PAGES: { name: PageName; component: ComponentType }[] = [
    { name: "Dashboard", component: DashboardScreen },
    { name: "Search", component: SearchScreen },
    { name: "OverallStats", component: OverallStatsScreen },
    { name: "ActivityLogs", component: ActivityLogsScreen },
    { name: "Notifications", component: NotificationsScreen },
    { name: "Profile", component: ProfileScreen },
    { name: "ProfileEdit", component: ProfileEditScreen },
    { name: "Settings", component: SettingsScreen },
    { name: "NotificationSettings", component: NotificationSettingsScreen },
]

interface PageStack {
    Screen: ComponentType<{ name: PageName; component: ComponentType }>
}

/**
 * The pages, for a tab's stack: `{renderPageScreens(Stack)}` inside its navigator. Every tab has them, so a page opens
 * over the tab you are in and Back returns there. This is React Navigation's pattern for screens shared by tabs.
 */
export function renderPageScreens(Stack: PageStack) {
    return PAGES.map(({ name, component }) => <Stack.Screen key={name} name={name} component={component} />)
}
