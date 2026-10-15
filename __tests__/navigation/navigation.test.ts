import { getStateFromPath } from "@react-navigation/native"

import { getBarItemsForRole, getNavItemsForRole, NAV_ITEMS } from "@/navigation/navItems"
import { canOpen } from "@/navigation/permissions"
import { getTargetNavigation, linking, resolveNotificationPath } from "@/navigation/linking"
import { getSheetSectionsForRole } from "@/navigation/sheetItems"

const ID = "64b7f0c2a1b2c3d4e5f60718"

function getTabNames(role: number): string[] {
    return getNavItemsForRole(role).map((item) => item.name)
}

function getBarNames(role: number | null): string[] {
    return getBarItemsForRole(role).map((item) => item.name)
}

describe("navItems", () => {
    it("lists every tab, the four bar tabs first", () => {
        expect(NAV_ITEMS.map((item) => item.name)).toEqual([
            "Leads",
            "Clients",
            "Projects",
            "Meetings",
            "Calls",
            "Users",
        ])
    })

    it("gives a role only the tabs it may open", () => {
        expect(getTabNames(10)).toEqual(["Leads", "Clients", "Projects", "Meetings", "Calls", "Users"])
        expect(getTabNames(65)).toEqual(["Leads", "Meetings", "Calls"])
        expect(getTabNames(69)).toEqual(["Leads", "Clients", "Meetings", "Calls", "Users"])
        expect(getTabNames(20)).toEqual(["Leads", "Clients", "Projects", "Meetings", "Users"])
        expect(getTabNames(80)).toEqual(["Leads", "Clients", "Projects", "Meetings"])
        expect(getTabNames(90)).toEqual([])
        expect(getNavItemsForRole(null)).toEqual([])
    })

    it("opens Users to the proxy's /users roles, as the doc's table does", () => {
        expect(getTabNames(45)).toContain("Users")
        expect(getTabNames(15)).not.toContain("Users")
    })
})

describe("the floating bar", () => {
    it("shows the four main tabs to a role that may open them", () => {
        expect(getBarNames(10)).toEqual(["Leads", "Clients", "Projects", "Meetings"])
        expect(getBarNames(20)).toEqual(["Leads", "Clients", "Projects", "Meetings"])
        expect(getBarNames(60)).toEqual(["Leads", "Clients", "Projects", "Meetings"])
    })

    it("puts Calls beside Leads in a free slot", () => {
        expect(getBarNames(65)).toEqual(["Leads", "Calls", "Meetings"])
        expect(getBarNames(69)).toEqual(["Leads", "Calls", "Clients", "Meetings"])
    })

    it("is empty for a role with no tab", () => {
        expect(getBarNames(90)).toEqual([])
        expect(getBarNames(null)).toEqual([])
    })
})

describe("profile sheet", () => {
    function getSheet(role: number) {
        const barTabs = getBarItemsForRole(role).map((item) => item.tab)
        return getSheetSectionsForRole(role, barTabs).map((section) => [
            section.title,
            section.links.map((link) => link.name),
        ])
    }

    it("shows an Admin every tool", () => {
        expect(getSheet(10)).toEqual([
            ["Operations & management", ["Users & Staff Directory", "Lead Sources & Uploads"]],
            ["Insights", ["Dashboard", "Overall Stats", "Activity Logs"]],
        ])
    })

    it("leaves out a tab that is already in the bar, and what the role may not open", () => {
        expect(getSheet(65)).toEqual([["Insights", ["Dashboard"]]])
        expect(getSheet(69)).toEqual([
            ["Operations & management", ["Users & Staff Directory"]],
            ["Insights", ["Dashboard"]],
        ])
        expect(getSheet(50)).toEqual([
            ["Operations & management", ["Lead Sources & Uploads"]],
            ["Insights", ["Dashboard", "Overall Stats"]],
        ])
    })

    it("drops empty sections", () => {
        expect(getSheet(90)).toEqual([])
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

    it("maps a callback reminder's lead-source path to LeadSourceDetail", () => {
        expect(resolveNotificationPath(`/admin/operations/lead-sources/${ID}`)).toEqual({
            tab: "CallsTab",
            screen: "LeadSourceDetail",
            params: { sourceId: ID },
        })
        expect(resolveNotificationPath("/admin/operations/lead-sources/uploads")).toBeNull()
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

    it("opens the Meetings tab, and a page over the Leads list", () => {
        expect(getRoutes("meetings")).toEqual(["App", "MeetingsTab", "Meetings"])
        expect(getRoutes("activity-logs")).toEqual(["App", "LeadsTab", "LeadsList", "ActivityLogs"])
        expect(getRoutes("settings")).toEqual(["App", "LeadsTab", "LeadsList", "Settings"])
        expect(getRoutes(`clients/${ID}/projects/create`)).toContain("ProjectCreate")
    })
})
