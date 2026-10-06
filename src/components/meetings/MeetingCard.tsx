import clsx from "clsx"
import { Calendar, Users } from "lucide-react-native"
import { memo, useState } from "react"
import { Pressable, Text, View } from "react-native"

import { Badge, TemporalBadge, TimeAgo } from "@/components/ui"
import { ENTITY_TYPE } from "@/constants/entityTypes"
import { MEETING_STATUS, MEETING_STATUS_META } from "@/constants/meetingStatus"
import { MEETING_TYPE } from "@/constants/meetingTypes"
import { useAuth } from "@/contexts/AuthContext"
import { enableIconClassNames } from "@/lib/iconClassName"
import { getMeetingTemporalStatus } from "@/lib/meetingTemporal"
import { openClient, openLead, openProject } from "@/navigation/openRecord"
import type { Meeting, MeetingAttendee } from "@/types/meeting"

import CompleteSheet from "./CompleteSheet"
import MeetingActions from "./MeetingActions"
import { getMeetingIcon } from "./meetingIcons"
import MeetingOutcome from "./MeetingOutcome"
import PulseDot, { type DotColor } from "./PulseDot"
import RescheduleHistory from "./RescheduleHistory"
import RescheduleSheet from "./RescheduleSheet"

/** A meeting as the list route returns it: with its parent's label and title. */
export interface MeetingListItem extends Meeting {
    entity?: { type: number; label: string; title: string }
}

/** Roles allowed to reschedule or close a meeting. Mirrors the backend PATCH roles on both routes. */
const RESCHEDULE_ROLES = [10, 15, 60, 65, 69, 45, 70]
const CLOSE_ROLES = RESCHEDULE_ROLES
// The web clamps agenda + description over 110 characters to two lines.
const LONG_TEXT = 110
const CLAMPED_LINES = 2

enableIconClassNames(Calendar, Users)

function openEntity(meeting: MeetingListItem, role: number | null) {
    if (meeting.entityType === ENTITY_TYPE.LEAD) openLead(meeting.entityId, role)
    if (meeting.entityType === ENTITY_TYPE.CLIENT) openClient(meeting.entityId, role)
    if (meeting.entityType === ENTITY_TYPE.PROJECT) openProject(meeting.entityId, role)
}

/**
 * One meeting: status and temporal badges, its lead, client or project, attendees, agenda, reschedule history,
 * outcome, and the actions a permitted role may take. Ported from the web's MeetingCard.tsx.
 */
function MeetingCard({ meeting, onChanged }: { meeting: MeetingListItem; onChanged: () => void }) {
    const { role } = useAuth()
    const [isExpanded, setIsExpanded] = useState(false)
    const [sheet, setSheet] = useState<"reschedule" | "complete" | null>(null)
    const canReschedule = role !== null && RESCHEDULE_ROLES.includes(role)
    const canClose = role !== null && CLOSE_ROLES.includes(role)

    const Icon = getMeetingIcon(meeting.status)
    const agenda = meeting.agenda || ""
    const description = meeting.description || ""
    const outcome = meeting.outcome || ""
    const isLongText = agenda.length + description.length > LONG_TEXT
    const lines = !isExpanded && isLongText ? CLAMPED_LINES : undefined

    const temporal = getMeetingTemporalStatus(meeting.scheduledAt)
    const isCancelledOrMissed = meeting.status === MEETING_STATUS.CANCELLED || meeting.status === MEETING_STATUS.MISSED
    const isCompleted = meeting.status === MEETING_STATUS.COMPLETED
    const isRescheduled = meeting.status === MEETING_STATUS.RESCHEDULED
    const isScheduled = meeting.status === MEETING_STATUS.SCHEDULED || isRescheduled
    const isUpcoming = isScheduled && temporal === "UPCOMING"
    const isToday = isScheduled && temporal === "TODAY"
    // Rescheduled wins over the green and red dots, so that state is seen first.
    const dot: DotColor | null = isRescheduled
        ? "orange"
        : isUpcoming || isToday
        ? "green"
        : isScheduled && temporal === "PAST"
        ? "red"
        : null
    const attendees =
        Array.isArray(meeting.attendees) && typeof meeting.attendees[0] === "object"
            ? (meeting.attendees as MeetingAttendee[])
            : []
    const meetingLink =
        meeting.meetingType === MEETING_TYPE.ONLINE && meeting.meetingLink && isScheduled ? meeting.meetingLink : null

    return (
        <View
            className={clsx(
                "flex-row gap-3 rounded-xl border bg-white p-4 dark:bg-neutral-900",
                isCancelledOrMissed
                    ? "border-red-500 opacity-70"
                    : isCompleted
                    ? "border-green-500 opacity-80"
                    : isToday
                    ? "border-emerald-500"
                    : isUpcoming
                    ? "border-blue-500"
                    : "border-slate-200 dark:border-neutral-800",
            )}
        >
            {dot && <PulseDot color={dot} />}
            <View className="mt-1 h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                <Icon size={16} className="text-neutral-600 dark:text-neutral-300" />
            </View>

            <View className="min-w-0 flex-1 gap-2">
                <View className="flex-row items-start justify-between gap-2">
                    <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-2">
                        <Text numberOfLines={1} className="font-bold text-neutral-800 dark:text-neutral-200">
                            {meeting.title}
                        </Text>
                        <Badge meta={MEETING_STATUS_META} status={meeting.status} />
                        {isScheduled && <TemporalBadge status={temporal} />}
                    </View>
                    <View className="flex-row items-center gap-1">
                        <Calendar size={12} className="text-neutral-500" />
                        <TimeAgo date={meeting.createdAt} className="text-xs text-neutral-500" />
                    </View>
                </View>

                {!!meeting.entity?.title && (
                    <Pressable
                        onPress={() => openEntity(meeting, role)}
                        accessibilityRole="link"
                        className="min-h-[32px] justify-center self-start"
                        hitSlop={6}
                    >
                        <Text
                            numberOfLines={1}
                            className="text-sm font-medium text-neutral-600 underline dark:text-neutral-300"
                        >
                            {meeting.entity.title}
                        </Text>
                    </Pressable>
                )}

                {attendees.length > 0 && (
                    <View className="flex-row flex-wrap items-center gap-1.5">
                        <Users size={12} className="text-neutral-400" />
                        {attendees.map((attendee) => (
                            <Text
                                numberOfLines={1}
                                key={attendee._id}
                                className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                            >
                                {attendee.name}
                            </Text>
                        ))}
                    </View>
                )}

                {!!agenda && (
                    <Text numberOfLines={lines} className="text-sm text-gray-600 dark:text-gray-400">
                        Agenda: {agenda}
                    </Text>
                )}
                {!!description && (
                    <Text numberOfLines={lines} className="text-sm text-gray-500">
                        {description}
                    </Text>
                )}
                {isLongText && (
                    <Pressable onPress={() => setIsExpanded((value) => !value)} accessibilityRole="button" hitSlop={10}>
                        <Text className="text-xs font-medium text-emerald-600">
                            {isExpanded ? "Read less" : "Read more…"}
                        </Text>
                    </Pressable>
                )}

                <RescheduleHistory history={meeting.rescheduleHistory} />

                <View className="flex-row flex-wrap items-center justify-between gap-3 pt-1">
                    <View className="flex-row items-center gap-1">
                        <Text className="text-xs text-gray-500">Scheduled:</Text>
                        <TimeAgo date={meeting.scheduledAt} className="text-xs text-gray-500" />
                    </View>
                    <MeetingActions
                        meetingId={meeting._id}
                        showCancel={isScheduled && canClose}
                        showComplete={isScheduled && canClose && temporal === "PAST"}
                        showReschedule={isScheduled && canReschedule}
                        meetingLink={meetingLink}
                        onReschedule={() => setSheet("reschedule")}
                        onComplete={() => setSheet("complete")}
                        onChanged={onChanged}
                    />
                </View>

                {isCompleted && !!outcome && <MeetingOutcome text={outcome} />}
            </View>

            {sheet === "reschedule" && (
                <RescheduleSheet
                    meetingId={meeting._id}
                    currentScheduledAt={meeting.scheduledAt}
                    onClose={() => setSheet(null)}
                    onChanged={onChanged}
                />
            )}
            {sheet === "complete" && (
                <CompleteSheet meetingId={meeting._id} onClose={() => setSheet(null)} onChanged={onChanged} />
            )}
        </View>
    )
}

export default memo(MeetingCard)
