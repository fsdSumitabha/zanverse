import { Activity, BarChart3, Bell, CalendarClock, UserCircle, type LucideIcon } from "lucide-react-native"

import { USER_ROLE_META } from "@/constants/userRoles"

import type { MoreStackParamList } from "./types"

export interface MoreItem {
    name: string
    screen: Exclude<keyof MoreStackParamList, "More">
    roles: readonly number[]
    icon: LucideIcon
}

/** Every role, for the rows the web shows to anyone signed in. */
const ALL_ROLES: readonly number[] = Object.keys(USER_ROLE_META).map(Number)

/**
 * The More tab's rows: the web SideBar items that have no bottom tab, plus Notifications and Profile from the top bar.
 * Role arrays copied from SideBar.tsx.
 */
export const MORE_ITEMS: MoreItem[] = [
    {
        name: "Meetings",
        screen: "Meetings",
        roles: [10, 15, 20, 30, 40, 42, 45, 50, 60, 65, 69, 70, 80],
        icon: CalendarClock,
    },
    {
        name: "Overall Stats",
        screen: "OverallStats",
        roles: [10, 15, 20, 30, 40, 42, 45, 50, 60, 70, 80],
        icon: BarChart3,
    },
    { name: "Activity Logs", screen: "ActivityLogs", roles: [10, 20], icon: Activity },
    { name: "Notifications", screen: "Notifications", roles: ALL_ROLES, icon: Bell },
    { name: "Profile", screen: "Profile", roles: ALL_ROLES, icon: UserCircle },
]

/** The More rows the role may see, in order. */
export function getMoreItemsForRole(role: number | null | undefined): MoreItem[] {
    if (role == null) return []
    return MORE_ITEMS.filter((item) => item.roles.includes(role))
}
