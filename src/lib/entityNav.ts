import { navigationRef } from "@/api/navigationRef"
import { ENTITY_TYPE } from "@/constants/entityTypes"
import { resolveNotificationPath } from "@/navigation/linking"
import { getNavItemsForRole } from "@/navigation/navItems"
import { openClient, openLead, openProject, openRecord } from "@/navigation/openRecord"
import type { TabParamList } from "@/navigation/types"

import { notify } from "./notify"

const FORBIDDEN_MESSAGE = "You aren't authorized to perform this action."
const MEETINGS_PATH = "/admin/operations/meetings"

/** Opens a lead, client or project in its own tab. Other entity types have no detail screen and do nothing. */
export function navigateToEntity(entityType: number, id: string, role: number | null): void {
    if (entityType === ENTITY_TYPE.LEAD) openLead(id, role)
    else if (entityType === ENTITY_TYPE.CLIENT) openClient(id, role)
    else if (entityType === ENTITY_TYPE.PROJECT) openProject(id, role)
}

/**
 * Opens a screen inside a tab with params, such as the Clients list on status 1. More is always there; a role
 * without any other tab gets the web's 403 line.
 */
export function openTabScreen(
    tab: keyof TabParamList,
    screen: string,
    params: object | undefined,
    role: number | null,
) {
    const hasTab = tab === "MoreTab" || getNavItemsForRole(role).some((item) => item.tab === tab)
    if (!hasTab) {
        notify.error(FORBIDDEN_MESSAGE)
        return
    }
    navigationRef.navigate("App", { screen: tab, params: { screen, params, initial: false } } as never)
}

/**
 * Opens what a web path from `/search` points at: `/admin/operations/{leads|clients|projects}/<id>` opens the record,
 * `/admin/operations/meetings` the Meetings screen. Returns false for a path the app does not know.
 */
export function hrefToScreen(href: string, role: number | null): boolean {
    const target = resolveNotificationPath(href)
    if (target) {
        openRecord(target, role)
        return true
    }
    const path = href
        .replace(/^https?:\/\/[^/]+/i, "")
        .split(/[?#]/)[0]
        .replace(/\/+$/, "")
    if (path === MEETINGS_PATH || path.startsWith(`${MEETINGS_PATH}/`)) {
        openTabScreen("MoreTab", "Meetings", undefined, role)
        return true
    }
    return false
}
