import type { NavigatorScreenParams } from "@react-navigation/native"

/** Route params for a screen about one record. */
export interface IdParams {
    id: string
}

export type DashboardStackParamList = {
    Dashboard: undefined
}

export type LeadsStackParamList = {
    LeadsList: undefined
    LeadDetail: IdParams
    LeadCreate: undefined
    LeadEdit: IdParams
    LeadConvert: IdParams
}

export type CallsStackParamList = {
    LeadSources: undefined
    LeadSourceDetail: IdParams
    LeadSourceUploads: undefined
}

export type ClientsStackParamList = {
    ClientsList: undefined
    ClientDetail: IdParams
    ClientEdit: IdParams
    /** The web's clients/:id/projects/create. A project always belongs to a client. */
    ProjectCreate: { clientId: string }
}

export type ProjectsStackParamList = {
    ProjectsList: undefined
    ProjectDetail: IdParams
    ProjectEdit: IdParams
}

export type UsersStackParamList = {
    UsersList: undefined
    UserCreate: undefined
    UserEdit: IdParams
}

export type MoreStackParamList = {
    More: undefined
    Meetings: undefined
    OverallStats: undefined
    ActivityLogs: undefined
    Notifications: undefined
    Profile: undefined
    /** Session 6's list kit demo, in debug builds. */
    ListKitDemo: undefined
}

export type TabParamList = {
    DashboardTab: NavigatorScreenParams<DashboardStackParamList>
    LeadsTab: NavigatorScreenParams<LeadsStackParamList>
    CallsTab: NavigatorScreenParams<CallsStackParamList>
    ClientsTab: NavigatorScreenParams<ClientsStackParamList>
    ProjectsTab: NavigatorScreenParams<ProjectsStackParamList>
    UsersTab: NavigatorScreenParams<UsersStackParamList>
    MoreTab: NavigatorScreenParams<MoreStackParamList>
}

export type RootStackParamList = {
    Splash: undefined
    Auth: undefined
    App: NavigatorScreenParams<TabParamList> | undefined
    /** The session 3 primitives page, kept reachable for the device checklists. */
    KitchenSink: undefined
}

/** Every screen inside a tab, by name. */
export type AppScreenName =
    | keyof DashboardStackParamList
    | keyof LeadsStackParamList
    | keyof CallsStackParamList
    | keyof ClientsStackParamList
    | keyof ProjectsStackParamList
    | keyof UsersStackParamList
    | keyof MoreStackParamList

// Types `useNavigation()` and `navigationRef` without a generic, as React Navigation's docs recommend.
declare global {
    namespace ReactNavigation {
        interface RootParamList extends RootStackParamList {}
    }
}
