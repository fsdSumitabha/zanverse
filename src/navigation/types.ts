import type { NavigatorScreenParams } from "@react-navigation/native"

/** Route params for a screen about one record. */
export interface IdParams {
    id: string
}

export type DashboardStackParamList = {
    Dashboard: undefined
    Search: undefined
}

export type LeadsStackParamList = {
    LeadsList: undefined
    LeadDetail: IdParams
    LeadCreate: undefined
    LeadEdit: IdParams
    LeadConvert: IdParams
}

export type CallsStackParamList = {
    /** A report's "Open the N imported sources" opens the list on one upload, in the All tab. */
    LeadSources: { view?: "today" | "upcoming" | "unscheduled" | "closed" | "all"; upload?: string } | undefined
    LeadSourceDetail: { sourceId: string }
    LeadSourceUploads: undefined
    LeadSourceUpload: undefined
    LeadSourceReport: { uploadId: string }
}

export type ClientsStackParamList = {
    /** The dashboard's Active Clients tile opens the list on status 1. */
    ClientsList: { status?: string } | undefined
    ClientDetail: IdParams
    ClientEdit: IdParams
    /** Every project of one client. */
    ClientProjects: { clientId: string }
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
    /** The dashboard's meetings card opens the list on the upcoming range. */
    Meetings: { range?: string } | undefined
    OverallStats: undefined
    ActivityLogs: undefined
    Notifications: undefined
    Profile: undefined
    ProfileEdit: undefined
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

/** A meeting attendee, as the picker returns it to the meeting form. */
export interface AttendeeOption {
    _id: string
    name: string
}

/** The record a timeline form writes to: a lead (0), client (1) or project (2). */
export interface InteractionFormParams {
    entityType: number
    entityId: string
}

export type RootStackParamList = {
    Splash: undefined
    Auth: undefined
    App: NavigatorScreenParams<TabParamList> | undefined
    /** The session 3 primitives page, kept reachable for the device checklists. */
    KitchenSink: undefined
    // The timeline forms, as modals over the tabs, so the lead, client and project screens all open the same ones.
    AddNote: InteractionFormParams
    LogCall: InteractionFormParams
    SendQuotation: InteractionFormParams
    /** `attendees` comes back from AttendeePicker. */
    ScheduleMeeting: InteractionFormParams & { attendees?: AttendeeOption[] }
    AttendeePicker: { selected: AttendeeOption[] }
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
