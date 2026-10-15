import type { NavigatorScreenParams } from "@react-navigation/native"

/** Route params for a screen about one record. */
export interface IdParams {
    id: string
}

/**
 * The pages every tab's stack can open over its first screen: the profile sheet's destinations and the top bar's
 * search and bell. They open in the tab you are in, so Back returns to where you were.
 */
export type PageParamList = {
    Dashboard: undefined
    Search: undefined
    OverallStats: undefined
    ActivityLogs: undefined
    Notifications: undefined
    Profile: undefined
    ProfileEdit: undefined
    Settings: undefined
}

export type LeadsStackParamList = PageParamList & {
    LeadsList: undefined
    LeadDetail: IdParams
    LeadCreate: undefined
    LeadEdit: IdParams
    LeadConvert: IdParams
}

export type CallsStackParamList = PageParamList & {
    /** A report's "Open the N imported sources" opens the list on one upload, in the All tab. */
    LeadSources: { view?: "today" | "upcoming" | "unscheduled" | "closed" | "all"; upload?: string } | undefined
    LeadSourceDetail: { sourceId: string }
    LeadSourceUploads: undefined
    LeadSourceUpload: undefined
    LeadSourceReport: { uploadId: string }
}

export type ClientsStackParamList = PageParamList & {
    /** The dashboard's Active Clients tile opens the list on status 1. */
    ClientsList: { status?: string } | undefined
    ClientDetail: IdParams
    ClientEdit: IdParams
    /** Every project of one client. */
    ClientProjects: { clientId: string }
    /** The web's clients/:id/projects/create. A project always belongs to a client. */
    ProjectCreate: { clientId: string }
}

export type ProjectsStackParamList = PageParamList & {
    ProjectsList: undefined
    ProjectDetail: IdParams
    ProjectEdit: IdParams
}

export type MeetingsStackParamList = PageParamList & {
    /** The dashboard's meetings card opens the list on the upcoming range. */
    Meetings: { range?: string } | undefined
}

export type UsersStackParamList = PageParamList & {
    UsersList: undefined
    UserCreate: undefined
    UserEdit: IdParams
}

export type TabParamList = {
    LeadsTab: NavigatorScreenParams<LeadsStackParamList>
    ClientsTab: NavigatorScreenParams<ClientsStackParamList>
    ProjectsTab: NavigatorScreenParams<ProjectsStackParamList>
    MeetingsTab: NavigatorScreenParams<MeetingsStackParamList>
    CallsTab: NavigatorScreenParams<CallsStackParamList>
    UsersTab: NavigatorScreenParams<UsersStackParamList>
}

export type TabName = keyof TabParamList

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
    | keyof LeadsStackParamList
    | keyof CallsStackParamList
    | keyof ClientsStackParamList
    | keyof ProjectsStackParamList
    | keyof MeetingsStackParamList
    | keyof UsersStackParamList

// Types `useNavigation()` and `navigationRef` without a generic, as React Navigation's docs recommend.
declare global {
    namespace ReactNavigation {
        interface RootParamList extends RootStackParamList {}
    }
}
