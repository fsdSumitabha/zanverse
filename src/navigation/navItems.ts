import { FolderKanban, Handshake, Home, PhoneCall, Target, UserRoundCog, type LucideIcon } from "lucide-react-native"

import { LEAD_SOURCE_ACCESS_ROLES } from "@/constants/leadSourceRoles"

import type { TabParamList } from "./types"

export interface NavItem {
    name: string
    /** The tab this item opens. The web's `href` is a path; here it is a tab route. */
    tab: Exclude<keyof TabParamList, "MoreTab">
    roles: number[]
    icon: LucideIcon
}

/**
 * The bottom tabs. Copied from the web's MobileNav.tsx: same names, same order, same literal role arrays. The tab bar
 * shows the items whose roles include the signed-in role, then More.
 */
export const NAV_ITEMS: NavItem[] = [
    {
        name: "Dashboard",
        tab: "DashboardTab",
        roles: [10, 15, 20, 30, 40, 42, 45, 50, 60, 65, 69, 70, 80],
        icon: Home,
    },
    {
        name: "Leads",
        tab: "LeadsTab",
        roles: [10, 15, 20, 30, 40, 42, 45, 50, 60, 65, 69, 70, 80],
        icon: Target,
    },
    {
        // "Calls", not "Lead Sources". The label shows under the active
        // icon, and the long name runs into the next icon on a small phone.
        name: "Calls",
        tab: "CallsTab",
        roles: LEAD_SOURCE_ACCESS_ROLES,
        icon: PhoneCall,
    },
    {
        name: "Clients",
        tab: "ClientsTab",
        roles: [10, 15, 20, 30, 40, 42, 45, 50, 60, 69, 70, 80],
        icon: Handshake,
    },
    {
        name: "Projects",
        tab: "ProjectsTab",
        roles: [10, 15, 20, 30, 40, 42, 45, 50, 60, 70, 80],
        icon: FolderKanban,
    },
    {
        name: "Users",
        tab: "UsersTab",
        roles: [10, 15, 20, 69],
        icon: UserRoundCog,
    },
]

/** The tab items the role may see, in the web's order. */
export function getNavItemsForRole(role: number | null | undefined): NavItem[] {
    if (role == null) return []
    return NAV_ITEMS.filter((item) => item.roles.includes(role))
}
