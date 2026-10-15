import {
    CalendarClock,
    FolderKanban,
    Handshake,
    PhoneCall,
    Target,
    UserRoundCog,
    type LucideIcon,
} from "lucide-react-native"

import { LEAD_SOURCE_ACCESS_ROLES } from "@/constants/leadSourceRoles"

import { USERS_LIST_ROLES } from "./permissions"
import type { AppScreenName, TabName } from "./types"

export interface NavItem {
    name: string
    /** The tab this item opens. The web's `href` is a path; here it is a tab route. */
    tab: TabName
    /** The tab's first screen: the list it opens on. */
    screen: AppScreenName
    roles: readonly number[]
    icon: LucideIcon
}

/**
 * Every tab, with the roles that may open it. Leads, Clients and Projects use the web's MobileNav.tsx arrays, Meetings
 * the SideBar.tsx array, Calls the lead source roles and Users the proxy's `/users` list. A role gets only the tabs
 * it may open, so no tab ends on Access Denied.
 */
export const NAV_ITEMS: NavItem[] = [
    {
        name: "Leads",
        tab: "LeadsTab",
        screen: "LeadsList",
        roles: [10, 15, 20, 30, 40, 42, 45, 50, 60, 65, 69, 70, 80],
        icon: Target,
    },
    {
        name: "Clients",
        tab: "ClientsTab",
        screen: "ClientsList",
        roles: [10, 15, 20, 30, 40, 42, 45, 50, 60, 69, 70, 80],
        icon: Handshake,
    },
    {
        name: "Projects",
        tab: "ProjectsTab",
        screen: "ProjectsList",
        roles: [10, 15, 20, 30, 40, 42, 45, 50, 60, 70, 80],
        icon: FolderKanban,
    },
    {
        name: "Meetings",
        tab: "MeetingsTab",
        screen: "Meetings",
        roles: [10, 15, 20, 30, 40, 42, 45, 50, 60, 65, 69, 70, 80],
        icon: CalendarClock,
    },
    {
        // "Calls", not "Lead Sources": the label sits under a 76 dp item and the long name does not fit.
        name: "Calls",
        tab: "CallsTab",
        screen: "LeadSources",
        roles: LEAD_SOURCE_ACCESS_ROLES,
        icon: PhoneCall,
    },
    {
        name: "Users",
        tab: "UsersTab",
        screen: "UsersList",
        roles: USERS_LIST_ROLES,
        icon: UserRoundCog,
    },
]

/** The CRM workspace's floating bar (docs/navigation-architecure.md): the four tabs most staff work in, in order. */
const BAR_TABS: readonly TabName[] = ["LeadsTab", "ClientsTab", "ProjectsTab", "MeetingsTab"]
const BAR_SIZE = 4
// Calls goes beside Leads: a lead source becomes a lead.
const CALLS_BAR_INDEX = 1

/** The tabs the role may open, in NAV_ITEMS order. */
export function getNavItemsForRole(role: number | null | undefined): NavItem[] {
    if (role == null) return []
    return NAV_ITEMS.filter((item) => item.roles.includes(role))
}

/** True when the role may open the tab. */
export function canOpenTab(tab: TabName, role: number | null | undefined): boolean {
    return getNavItemsForRole(role).some((item) => item.tab === tab)
}

/**
 * The floating bar's items: the four main tabs the role may open. A role that may not open all four, such as a US
 * Sales Agent (65), spends its day in Lead Sources, so Calls takes the free slot instead of hiding in the profile sheet.
 */
export function getBarItemsForRole(role: number | null | undefined): NavItem[] {
    const allowed = getNavItemsForRole(role)
    const items = allowed.filter((item) => BAR_TABS.includes(item.tab))
    const calls = allowed.find((item) => item.tab === "CallsTab")
    if (calls && items.length < BAR_SIZE) items.splice(CALLS_BAR_INDEX, 0, calls)
    return items
}
