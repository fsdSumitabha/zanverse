import { getStateFromPath } from "@react-navigation/native"

import { getMoreItemsForRole } from "@/navigation/moreItems"
import { getNavItemsForRole, NAV_ITEMS } from "@/navigation/navItems"
import { canOpen } from "@/navigation/permissions"
import { getTargetNavigation, linking, resolveNotificationPath } from "@/navigation/linking"

const ID = "64b7f0c2a1b2c3d4e5f60718"

function getTabNames(role: number): string[] {
    return getNavItemsForRole(role).map((item) => item.name)
}

describe("navItems", () => {
    it("keeps the web's order and labels", () => {
        expect(NAV_ITEMS.map((item) => item.name)).toEqual([
            "Dashboard",
            "Leads",
            "Calls",
            "Clients",
            "Projects",
            "Users",
        ])
    })

    it("filters by role exactly as MobileNav does", () => {
        expect(getTabNames(10)).toEqual(["Dashboard", "Leads", "Calls", "Clients", "Projects", "Users"])
        expect(getTabNames(65)).toEqual(["Dashboard", "Leads", "Calls"])
        expect(getTabNames(69)).toEqual(["Dashboard", "Leads", "Calls", "Clients", "Users"])
        expect(getTabNames(20)).toEqual(["Dashboard", "Leads", "Clients", "Projects", "Users"])
        expect(getTabNames(80)).toEqual(["Dashboard", "Leads", "Clients", "Projects"])
        expect(getNavItemsForRole(null)).toEqual([])
    })
})

describe("moreItems", () => {
    it("shows Activity Logs to Admin and HR only", () => {
        const names = (role: number) => getMoreItemsForRole(role).map((item) => item.name)

        expect(names(10)).toEqual(["Meetings", "Overall Stats", "Activity Logs", "Notifications", "Profile"])
        expect(names(50)).toEqual(["Meetings", "Overall Stats", "Notifications", "Profile"])
        expect(names(65)).toEqual(["Meetings", "Notifications", "Profile"])
        expect(names(90)).toEqual(["Notifications", "Profile"])
    })
})

describe("canOpen", () => {
    it("follows the proxy's role lists", () => {
        expect(canOpen("UserEdit", 69)).toBe(false)
        expect(canOpen("UserEdit", 20)).toBe(true)
        expect(canOpen("UserCreate", 69)).toBe(true)
        expect(canOpen("LeadCreate", 65)).toBe(false)
        expect(canOpen("LeadConvert", 15)).toBe(false)
        expect(canOpen("ProjectCreate", 69)).toBe(false)
        expect(canOpen("LeadSourceUploads", 60)).toBe(false)
        expect(canOpen("LeadSourceUploads", 15)).toBe(true)
        expect(canOpen("LeadSources", 20)).toBe(false)
        expect(canOpen("LeadSourceDetail", 65)).toBe(true)
    })

    it("opens a screen absent from the map to any signed-in role, and nothing to no role", () => {
        expect(canOpen("LeadDetail", 80)).toBe(true)
        expect(canOpen("Profile", 90)).toBe(true)
        expect(canOpen("UserEdit", null)).toBe(false)
    })
})

describe("resolveNotificationPath", () => {
    it("maps the three notification url shapes", () => {
        expect(resolveNotificationPath(`/admin/operations/leads/${ID}`)).toEqual({
            tab: "LeadsTab",
            screen: "LeadDetail",
            params: { id: ID },
        })
        expect(resolveNotificationPath(`/admin/operations/clients/${ID}`)?.screen).toBe("ClientDetail")
        expect(resolveNotificationPath(`https://zan.example/admin/operations/projects/${ID}/?tab=1`)?.screen).toBe(
            "ProjectDetail",
        )
    })

    it("gives null for anything else", () => {
        expect(resolveNotificationPath(undefined)).toBeNull()
        expect(resolveNotificationPath("/admin/operations/leads/")).toBeNull()
        expect(resolveNotificationPath("/admin/operations/meetings")).toBeNull()
        expect(resolveNotificationPath(`/admin/operations/leads/${ID}/edit`)).toBeNull()
    })

    it("builds navigate arguments that keep the tab's list under the screen", () => {
        const target = resolveNotificationPath(`/admin/operations/leads/${ID}`)!
        expect(getTargetNavigation(target)).toEqual({
            screen: "LeadsTab",
            params: { screen: "LeadDetail", params: { id: ID }, initial: false },
        })
    })
})

describe("linking", () => {
    function getRoutes(path: string): string[] {
        const names: string[] = []
        let state = getStateFromPath(path, linking.config) as
            | { routes: { name: string; state?: unknown }[]; index?: number }
            | undefined
        while (state) {
            const route = state.routes[state.index ?? state.routes.length - 1]
            names.push(...state.routes.map((r) => r.name).filter((name) => !names.includes(name)))
            state = route.state as typeof state
        }
        return names
    }

    it("opens zanverse://leads/<id> on LeadDetail with the list under it", () => {
        const state = getStateFromPath(`leads/${ID}`, linking.config)
        const app = state?.routes[0]
        const tabs = app?.state
        const leadsTab = tabs?.routes[0]
        const stack = leadsTab?.state

        expect(app?.name).toBe("App")
        expect(leadsTab?.name).toBe("LeadsTab")
        expect(stack?.routes.map((route) => route.name)).toEqual(["LeadsList", "LeadDetail"])
        expect(stack?.routes[1].params).toEqual({ id: ID })
    })

    it("prefers the static paths over :id", () => {
        expect(getRoutes("leads/create")).toContain("LeadCreate")
        expect(getRoutes("lead-sources/uploads")).toContain("LeadSourceUploads")
        expect(getRoutes("users/create")).toContain("UserCreate")
    })

    it("reaches the More destinations", () => {
        expect(getRoutes("activity-logs")).toEqual(["App", "MoreTab", "More", "ActivityLogs"])
        expect(getRoutes(`clients/${ID}/projects/create`)).toContain("ProjectCreate")
    })
})
