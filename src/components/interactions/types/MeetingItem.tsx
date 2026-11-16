import { Calendar } from "lucide-react-native"
import { Text, View } from "react-native"

import { Badge, TimeAgo } from "@/components/ui"
import { MEETING_STATUS_META } from "@/constants/meetingStatus"
import { MEETING_TYPE } from "@/constants/meetingTypes"

import InteractionRowFrame from "../InteractionRowFrame"
import MeetingLinkButton from "../MeetingLinkButton"
import RowHeader from "../RowHeader"
import type { TimelineItem } from "../timelineTypes"

/**
 * A meeting row (2010–2050). Ported from the web's MeetingItem.tsx. `meeting` is null on a completed meeting (2050),
 * because the route joins 2010–2040 only, so every read guards it. The web read `meeting.description` without a guard
 * and crashed on those rows.
 */
export default function MeetingItem({ item }: { item: TimelineItem }) {
    const meeting = item.meeting ?? null

    return (
        <InteractionRowFrame icon={Calendar} createdBy={item.createdBy}>
            <RowHeader createdAt={item.createdAt}>
                <Text className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{item.title}</Text>
                {!!meeting?.status && <Badge meta={MEETING_STATUS_META} status={meeting.status} />}
            </RowHeader>

            {!!meeting?.agenda && (
                <Text className="text-sm text-gray-600 dark:text-gray-400">Agenda: {meeting.agenda}</Text>
            )}

            {!!meeting?.description && <Text className="text-sm text-gray-500">{meeting.description}</Text>}

            {meeting && (
                <View className="flex-row flex-wrap items-center justify-between gap-3 pt-1">
                    <View className="flex-row items-center gap-1">
                        <Text className="text-xs text-gray-500">Scheduled at:</Text>
                        <TimeAgo date={meeting.scheduledAt} className="text-xs" />
                    </View>
                    {meeting.meetingType === MEETING_TYPE.ONLINE && !!meeting.meetingLink && (
                        <MeetingLinkButton link={meeting.meetingLink} />
                    )}
                </View>
            )}
        </InteractionRowFrame>
    )
}
