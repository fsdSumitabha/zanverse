import { CalendarClock, CircleCheck, CircleX, type LucideIcon } from "lucide-react-native"
import { Alert, Pressable, Text, View } from "react-native"

import { sendRaw } from "@/api/client"
import { MEETINGS_API } from "@/api/endpoints"
import MeetingLinkButton from "@/components/interactions/MeetingLinkButton"
import { MEETING_STATUS } from "@/constants/meetingStatus"
import { enableIconClassNames } from "@/lib/iconClassName"
import { notify } from "@/lib/notify"

interface Props {
    meetingId: string
    showCancel: boolean
    showComplete: boolean
    showReschedule: boolean
    meetingLink: string | null
    onReschedule: () => void
    onComplete: () => void
    onChanged: () => void
}

enableIconClassNames(CalendarClock, CircleCheck, CircleX)

interface ActionButtonProps {
    icon: LucideIcon
    label: string
    border: string
    tone: string
    onPress: () => void
}

function ActionButton({ icon: Icon, label, border, tone, onPress }: ActionButtonProps) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            className={`min-h-[44px] flex-row items-center gap-1 rounded-md border px-2.5 active:opacity-70 ${border}`}
        >
            <Icon size={12} className={tone} />
            <Text className={`text-xs ${tone}`}>{label}</Text>
        </Pressable>
    )
}

/**
 * Cancel, Completed and Reschedule for a meeting still open, and Join / Copy for an online one. Cancel asks first,
 * which the web does not; a mistaken tap on a phone would otherwise close the meeting.
 */
export default function MeetingActions(props: Props) {
    const { meetingId, showCancel, showComplete, showReschedule, meetingLink, onReschedule, onComplete, onChanged } =
        props

    async function cancelMeeting() {
        try {
            const json = await sendRaw<{ message?: string }>(`${MEETINGS_API}/${meetingId}/status`, "PATCH", {
                status: MEETING_STATUS.CANCELLED,
            })
            notify.success(json.message || "Meeting cancelled")
        } catch (error) {
            notify.error(error instanceof Error ? error.message : "Failed to cancel meeting")
        }
        // After a 409 too: the list shows the meeting as the server has it.
        onChanged()
    }

    function confirmCancel() {
        Alert.alert("Cancel this meeting?", "It is marked cancelled for everyone.", [
            { text: "Keep it", style: "cancel" },
            { text: "Cancel meeting", style: "destructive", onPress: cancelMeeting },
        ])
    }

    if (!showCancel && !showComplete && !showReschedule && !meetingLink) return null

    return (
        <View className="flex-row flex-wrap items-center justify-end gap-2">
            {showCancel && (
                <ActionButton
                    icon={CircleX}
                    label="Cancel"
                    border="border-red-500/40"
                    tone="text-red-600 dark:text-red-400"
                    onPress={confirmCancel}
                />
            )}
            {showComplete && (
                <ActionButton
                    icon={CircleCheck}
                    label="Completed"
                    border="border-emerald-500/40"
                    tone="text-emerald-600 dark:text-emerald-400"
                    onPress={onComplete}
                />
            )}
            {showReschedule && (
                <ActionButton
                    icon={CalendarClock}
                    label="Reschedule"
                    border="border-amber-500/40"
                    tone="text-amber-600 dark:text-amber-400"
                    onPress={onReschedule}
                />
            )}
            {!!meetingLink && <MeetingLinkButton link={meetingLink} />}
        </View>
    )
}
