import type { LinkingOptions, PathConfig } from "@react-navigation/native"
import { Linking } from "react-native"

import { waitForAuthBoot } from "@/contexts/AuthContext"
import { getToken } from "@/store/keychain"

import type {
    CallsStackParamList,
    ClientsStackParamList,
    DashboardStackParamList,
    LeadsStackParamList,
    MoreStackParamList,
    ProjectsStackParamList,
    RootStackParamList,
    TabParamList,
    UsersStackParamList,
} from "./types"

export const DEEP_LINK_PREFIX = "zanverse://"

/** Where a web path or a notification's `url` leads in the app. */
export interface LinkTarget {
    tab: keyof TabParamList
    screen: "LeadDetail" | "ClientDetail" | "ProjectDetail"
    params: { id: string }
}

const OBJECT_ID = /^[a-f0-9]{24}$/i

// The three shapes a notification row's `url` takes (the web's src/lib/notifications/render.ts).
const RECORD_PATHS: { prefix: string; tab: LinkTarget["tab"]; screen: LinkTarget["screen"] }[] = [
    { prefix: "/admin/operations/leads/", tab: "LeadsTab", screen: "LeadDetail" },
    { prefix: "/admin/operations/clients/", tab: "ClientsTab", screen: "ClientDetail" },
    { prefix: "/admin/operations/projects/", tab: "ProjectsTab", screen: "ProjectDetail" },
]

/**
 * Maps a notification's web path to a screen: `/admin/operations/leads/:id`, `/clients/:id` and `/projects/:id` go to
 * LeadDetail, ClientDetail and ProjectDetail. Anything else, including a missing id, gives `null`.
 */
export function resolveNotificationPath(url: string | null | undefined): LinkTarget | null {
    if (!url) return null
    const path = url.replace(/^https?:\/\/[^/]+/i, "").split(/[?#]/)[0]

    for (const { prefix, tab, screen } of RECORD_PATHS) {
        if (!path.startsWith(prefix)) continue
        const id = path.slice(prefix.length).replace(/\/+$/, "")
        return OBJECT_ID.test(id) ? { tab, screen, params: { id } } : null
    }
    return null
}

/** The `navigate` arguments that open a target inside its tab, with the tab's list kept under it for Back. */
export function getTargetNavigation(target: LinkTarget) {
    return {
        screen: target.tab,
        params: { screen: target.screen, params: target.params, initial: false },
    } as const
}

// The URL that opened the app is handled once. Without this, a later remount would open it again.
let wasInitialUrlHandled = false

async function getInitialURL(): Promise<string | null> {
    const url = await Linking.getInitialURL()
    if (!url || wasInitialUrlHandled) return null
    wasInitialUrlHandled = true

    // A link into the app needs a session. Signed out, the app opens on Login as usual.
    const isSignedIn = await waitForAuthBoot()
    return isSignedIn ? url : null
}

function subscribe(listener: (url: string) => void) {
    const subscription = Linking.addEventListener("url", ({ url }) => {
        if (getToken()) listener(url)
    })
    return () => subscription.remove()
}

// Each tab's paths, typed against its own stack. React Navigation cannot infer the nested types through
// NavigatorScreenParams, so the map below is cast once and these carry the checking.
const LEADS_PATHS: PathConfig<LeadsStackParamList> = {
    initialRouteName: "LeadsList",
    screens: {
        LeadsList: "leads",
        LeadCreate: "leads/create",
        LeadDetail: "leads/:id",
        LeadEdit: "leads/:id/edit",
        LeadConvert: "leads/:id/convert",
    },
}

const CALLS_PATHS: PathConfig<CallsStackParamList> = {
    initialRouteName: "LeadSources",
    screens: {
        LeadSources: "lead-sources",
        LeadSourceUpload: "lead-sources/upload",
        LeadSourceUploads: "lead-sources/uploads",
        LeadSourceReport: "lead-sources/uploads/:uploadId",
        LeadSourceDetail: "lead-sources/:sourceId",
    },
}

const CLIENTS_PATHS: PathConfig<ClientsStackParamList> = {
    initialRouteName: "ClientsList",
    screens: {
        ClientsList: "clients",
        ClientDetail: "clients/:id",
        ClientEdit: "clients/:id/edit",
        ClientProjects: "clients/:clientId/projects",
        ProjectCreate: "clients/:clientId/projects/create",
    },
}

const PROJECTS_PATHS: PathConfig<ProjectsStackParamList> = {
    initialRouteName: "ProjectsList",
    screens: {
        ProjectsList: "projects",
        ProjectDetail: "projects/:id",
        ProjectEdit: "projects/:id/edit",
    },
}

const USERS_PATHS: PathConfig<UsersStackParamList> = {
    initialRouteName: "UsersList",
    screens: {
        UsersList: "users",
        UserCreate: "users/create",
        UserEdit: "users/:id/edit",
    },
}

const MORE_PATHS: PathConfig<MoreStackParamList> = {
    initialRouteName: "More",
    screens: {
        More: "more",
        Meetings: "meetings",
        OverallStats: "overall-stats",
        ActivityLogs: "activity-logs",
        Notifications: "notifications",
        Profile: "profile",
        ProfileEdit: "profile/edit",
    },
}

const DASHBOARD_PATHS: PathConfig<DashboardStackParamList> = {
    screens: { Dashboard: "" },
}

/**
 * Deep links: `zanverse://` plus the web's path without `/admin/operations`, for example `zanverse://leads/<id>`.
 * Each tab opens on its list with the linked screen on top, so Back stays inside the app.
 */
export const linking: LinkingOptions<RootStackParamList> = {
    prefixes: [DEEP_LINK_PREFIX],
    getInitialURL,
    subscribe,
    config: {
        screens: {
            App: {
                screens: {
                    DashboardTab: DASHBOARD_PATHS,
                    LeadsTab: LEADS_PATHS,
                    CallsTab: CALLS_PATHS,
                    ClientsTab: CLIENTS_PATHS,
                    ProjectsTab: PROJECTS_PATHS,
                    UsersTab: USERS_PATHS,
                    MoreTab: MORE_PATHS,
                },
            },
        },
    } as LinkingOptions<RootStackParamList>["config"],
}
