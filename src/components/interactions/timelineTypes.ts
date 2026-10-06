import type { InteractionType } from "@/constants/interactionTypes"
import type { MeetingStatus } from "@/constants/meetingStatus"
import type { MeetingType } from "@/constants/meetingTypes"

// The rows the three timeline routes return (leads, clients and projects /:id/interactions). RN-only: the web passes
// these around as `any`. Field names are the API's, including the lower-case `entitytype`.

/** A person as the API populates them: a document, or a bare id when the user row is gone. */
export type TimelinePerson = { _id?: string; name?: string; email?: string } | string | null | undefined

export interface EditEntry {
    oldTitle?: string
    oldDescription?: string
    editedBy?: TimelinePerson
    editedAt: string
}

export interface TimelineMeeting {
    _id: string
    title?: string
    agenda?: string
    description?: string
    meetingType?: MeetingType
    meetingLink?: string
    scheduledAt?: string
    status?: MeetingStatus
}

export interface TimelineCall {
    _id: string
    contactPersonName?: string
    contactPersonPhone?: string
    callTime?: string
    duration?: number
    direction?: number
    status?: number
    notes?: string
    /** Relative, such as `/uploads/calls/<file>`. Prefix the API base URL before opening it. */
    recordingUrl?: string
}

export interface TimelineQuotation {
    _id: string
    amount: number
    gst_percentage?: number
    /** An absolute ImageKit URL. */
    url?: string
}

export interface TimelineDocument {
    _id: string
    title?: string
    url?: string
}

export interface TimelineItem {
    _id: string
    entitytype?: number
    type: InteractionType
    title?: string
    description?: string
    createdAt: string
    updatedAt?: string
    createdBy?: { _id?: string; name?: string; email?: string } | null
    editHistory?: EditEntry[]
    /** Joined for 2010–2040 only. A completed meeting (2050) arrives with `meeting: null`. */
    meeting?: TimelineMeeting | null
    document?: TimelineDocument | null
    quotation?: TimelineQuotation | null
    call?: TimelineCall | null
}

/** The timeline routes put the rows at the top level, not inside `data`. */
export interface TimelineResponse {
    success: boolean
    interactions?: TimelineItem[]
}
