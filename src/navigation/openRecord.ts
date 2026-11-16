import { navigationRef } from "@/api/navigationRef"
import { notify } from "@/lib/notify"

import { getTargetNavigation, type LinkTarget } from "./linking"
import { getNavItemsForRole } from "./navItems"

const FORBIDDEN_MESSAGE = "You aren't authorized to perform this action."

/**
 * Opens a record's screen in the tab that owns it, with that tab's list under it, such as a lead's converted client.
 * A role without that tab gets the web's 403 line instead of a jump that does nothing.
 */
export function openRecord(target: LinkTarget, role: number | null): void {
    const hasTab = getNavItemsForRole(role).some((item) => item.tab === target.tab)
    if (!hasTab) {
        notify.error(FORBIDDEN_MESSAGE)
        return
    }
    const { screen, params } = getTargetNavigation(target)
    // The target's tab is a union, which React Navigation cannot check against each tab's params.
    navigationRef.navigate("App", { screen, params } as never)
}

/** Opens a client's detail screen in the Clients tab. */
export function openClient(id: string, role: number | null): void {
    openRecord({ tab: "ClientsTab", screen: "ClientDetail", params: { id } }, role)
}

/** Opens a project's detail screen in the Projects tab. */
export function openProject(id: string, role: number | null): void {
    openRecord({ tab: "ProjectsTab", screen: "ProjectDetail", params: { id } }, role)
}

/** Opens a lead's detail screen in the Leads tab. */
export function openLead(id: string, role: number | null): void {
    openRecord({ tab: "LeadsTab", screen: "LeadDetail", params: { id } }, role)
}
