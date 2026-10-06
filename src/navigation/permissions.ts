import { LEAD_SOURCE_ACCESS_ROLES, LEAD_SOURCE_MANAGE_ROLES } from "@/constants/leadSourceRoles"

import type { AppScreenName } from "./types"

/**
 * Which roles may open a screen. Ported from `routePermissions` in the web's src/proxy.ts, which redirects on
 * navigation. A phone has no proxy, so the stacks check this before rendering a screen. The API stays the real gate:
 * a screen still renders AccessDenied when the API answers 403.
 *
 * A screen absent from this map is open to any signed-in role, as on the web.
 */
export const SCREEN_ROLES: Partial<Record<AppScreenName, readonly number[]>> = {
    UsersList: [10, 45, 20, 69],
    UserCreate: [10, 20, 69],
    UserEdit: [10, 20],
    LeadCreate: [10, 15, 45, 50, 60, 69, 70],
    LeadEdit: [10, 45, 60, 69, 70],
    LeadConvert: [10, 45, 60, 69, 70],
    ClientEdit: [10, 45, 60, 69, 70],
    ProjectCreate: [10, 45, 60, 70],
    ProjectEdit: [10, 45, 60, 70],
    LeadSourceUploads: LEAD_SOURCE_MANAGE_ROLES,
    LeadSources: LEAD_SOURCE_ACCESS_ROLES,
    LeadSourceDetail: LEAD_SOURCE_ACCESS_ROLES,
}

/** True when the role may open the screen. */
export function canOpen(screen: string, role: number | null | undefined): boolean {
    const roles = SCREEN_ROLES[screen as AppScreenName]
    if (!roles) return true
    return role != null && roles.includes(role)
}
