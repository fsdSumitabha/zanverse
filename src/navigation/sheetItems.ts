import { Activity, BarChart3, LayoutDashboard, PhoneIncoming, UsersRound, type LucideIcon } from "lucide-react-native"

import { LEAD_SOURCE_ACCESS_ROLES } from "@/constants/leadSourceRoles"

import { USERS_LIST_ROLES } from "./permissions"
import type { PageParamList, TabName } from "./types"

/** A tab outside the floating bar, or a page that opens over the tab you are in. */
export type SheetTarget = { kind: "tab"; tab: TabName } | { kind: "page"; page: keyof PageParamList }

export interface SheetLink {
    name: string
    target: SheetTarget
    roles: readonly number[]
    icon: LucideIcon
}

export interface SheetSection {
    title: string
    links: SheetLink[]
}

/**
 * The profile sheet's link sections (docs/navigation-architecure.md, section 5). "Insights" is added here: the
 * Dashboard, Overall Stats and Activity Logs lost their More tab and need a place. Role arrays from the web's
 * MobileNav.tsx and SideBar.tsx.
 */
const SECTIONS: SheetSection[] = [
    {
        title: "Operations & management",
        links: [
            {
                name: "Users & Staff Directory",
                target: { kind: "tab", tab: "UsersTab" },
                roles: USERS_LIST_ROLES,
                icon: UsersRound,
            },
            {
                name: "Lead Sources & Uploads",
                target: { kind: "tab", tab: "CallsTab" },
                roles: LEAD_SOURCE_ACCESS_ROLES,
                icon: PhoneIncoming,
            },
        ],
    },
    {
        title: "Insights",
        links: [
            {
                name: "Dashboard",
                target: { kind: "page", page: "Dashboard" },
                roles: [10, 15, 20, 30, 40, 42, 45, 50, 60, 65, 69, 70, 80],
                icon: LayoutDashboard,
            },
            {
                name: "Overall Stats",
                target: { kind: "page", page: "OverallStats" },
                roles: [10, 15, 20, 30, 40, 42, 45, 50, 60, 70, 80],
                icon: BarChart3,
            },
            { name: "Activity Logs", target: { kind: "page", page: "ActivityLogs" }, roles: [10, 20], icon: Activity },
        ],
    },
]

/** Every icon the sheet draws, so it can enable their class names once. */
export const SHEET_ICONS: LucideIcon[] = SECTIONS.flatMap((section) => section.links.map((link) => link.icon))

/**
 * The sections the role sees, without empty ones. A tab already in the role's floating bar is left out, such as
 * Calls for a US Sales Agent.
 */
export function getSheetSectionsForRole(role: number | null | undefined, barTabs: readonly TabName[]): SheetSection[] {
    if (role == null) return []
    return SECTIONS.map((section) => ({
        title: section.title,
        links: section.links.filter(
            (link) => link.roles.includes(role) && !(link.target.kind === "tab" && barTabs.includes(link.target.tab)),
        ),
    })).filter((section) => section.links.length > 0)
}
