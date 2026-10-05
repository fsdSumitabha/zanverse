import { INTERACTION_TYPE } from "@/constants/interactionTypes"

import type { TimelineItem } from "./timelineTypes"
import CallItem from "./types/CallItem"
import DocumentItem from "./types/DocumentItem"
import MeetingItem from "./types/MeetingItem"
import NoteItem from "./types/NoteItem"
import QuotationItem from "./types/QuotationItem"
import StatusChangeItem from "./types/StatusChangeItem"

interface Props {
    entityType: number
    item: TimelineItem
    onChanged?: () => void
}

/** Picks the row for an interaction's type. The web's switch, with a row for documents (2310) added. */
export default function InteractionItem({ entityType, item, onChanged }: Props) {
    switch (item.type) {
        case INTERACTION_TYPE.MEETING_SCHEDULED:
        case INTERACTION_TYPE.MEETING_RESCHEDULED:
        case INTERACTION_TYPE.MEETING_CANCELLED:
        case INTERACTION_TYPE.MEETING_MISSED:
        case INTERACTION_TYPE.MEETING_COMPLETED:
            return <MeetingItem item={item} />
        case INTERACTION_TYPE.NOTE_ADDED:
            return <NoteItem item={item} onChanged={onChanged} />
        case INTERACTION_TYPE.QUOTATION_SENT:
            return <QuotationItem item={item} />
        case INTERACTION_TYPE.STATUS_CHANGED:
            return <StatusChangeItem entityType={entityType} item={item} onChanged={onChanged} />
        case INTERACTION_TYPE.CALL_MADE:
            return <CallItem item={item} />
        case INTERACTION_TYPE.DOCUMENT_UPLOADED:
            return <DocumentItem item={item} />
        default:
            return null
    }
}
