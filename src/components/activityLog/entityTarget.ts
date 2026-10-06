import { navigationRef } from "@/api/navigationRef"
import { ENTITY_TYPE, type EntityType } from "@/constants/entityTypes"
import { notify } from "@/lib/notify"
import { getNavItemsForRole } from "@/navigation/navItems"
import { canOpen } from "@/navigation/permissions"
import type { TabParamList } from "@/navigation/types"

/** Where an activity row's badge leads: a screen inside a tab, with its params. */
export interface ActivityTarget {
    tab: keyof TabParamList
    screen: string
    params: Record<string, string>
}

const FORBIDDEN_MESSAGE = "You aren't authorized to perform this action."

// Keyed by the numeric EntityType code. Verbatim from the web's ActivityLogItem.tsx.
export const ENTITY_BADGE: Record<number, string> = {
    [ENTITY_TYPE.USER]: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-500/30",
    [ENTITY_TYPE.LEAD]: "bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/30",
    [ENTITY_TYPE.CLIENT]: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30",
    [ENTITY_TYPE.PROJECT]: "bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/30",
    [ENTITY_TYPE.INTERACTION]: "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30",
    [ENTITY_TYPE.CALL]: "bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/30",
    [ENTITY_TYPE.MEETING]: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border-cyan-500/30",
    [ENTITY_TYPE.DOCUMENT]: "bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/30",
    [ENTITY_TYPE.QUOTATION]: "bg-orange-500/10 text-orange-600 dark:text-orange-300 border-orange-500/30",
    [ENTITY_TYPE.LEAD_SOURCE]: "bg-teal-500/10 text-teal-600 dark:text-teal-300 border-teal-500/30",
    [ENTITY_TYPE.LEAD_SOURCE_UPLOAD]: "bg-lime-500/10 text-lime-700 dark:text-lime-300 border-lime-500/30",
}

export const NEUTRAL_BADGE = "bg-neutral-500/10 text-neutral-600 dark:text-neutral-300 border-neutral-500/30"

/**
 * The detail screen of an entity, in place of the web's href. Null means no detail screen, so the badge stays a
 * plain pill: interactions, meetings, calls and the rest have no page of their own.
 */
export function getEntityTarget(entityType: EntityType | null, entityId: string | null): ActivityTarget | null {
    if (!entityId) return null
    switch (entityType) {
        case ENTITY_TYPE.LEAD:
            return { tab: "LeadsTab", screen: "LeadDetail", params: { id: entityId } }
        case ENTITY_TYPE.CLIENT:
            return { tab: "ClientsTab", screen: "ClientDetail", params: { id: entityId } }
        case ENTITY_TYPE.PROJECT:
            return { tab: "ProjectsTab", screen: "ProjectDetail", params: { id: entityId } }
        case ENTITY_TYPE.USER:
            return { tab: "UsersTab", screen: "UserEdit", params: { id: entityId } }
        case ENTITY_TYPE.LEAD_SOURCE:
            return { tab: "CallsTab", screen: "LeadSourceDetail", params: { sourceId: entityId } }
        case ENTITY_TYPE.LEAD_SOURCE_UPLOAD:
            return { tab: "CallsTab", screen: "LeadSourceReport", params: { uploadId: entityId } }
        default:
            return null
    }
}

/** An interaction's parent: a lead, a client or a project. */
export function getInteractionParentTarget(
    parentType: EntityType | null,
    parentId: string | null,
): ActivityTarget | null {
    if (parentType !== ENTITY_TYPE.LEAD && parentType !== ENTITY_TYPE.CLIENT && parentType !== ENTITY_TYPE.PROJECT) {
        return null
    }
    return getEntityTarget(parentType, parentId)
}

/**
 * Opens a target in its tab, with that tab's list under it. A role without the tab or the screen gets the web's 403
 * line, not a jump that ends on AccessDenied.
 */
export function openActivityTarget(target: ActivityTarget, role: number | null): void {
    const hasTab = getNavItemsForRole(role).some((item) => item.tab === target.tab)
    if (!hasTab || !canOpen(target.screen, role)) {
        notify.error(FORBIDDEN_MESSAGE)
        return
    }
    navigationRef.navigate("App", {
        screen: target.tab,
        params: { screen: target.screen, params: target.params, initial: false },
    } as never)
}
