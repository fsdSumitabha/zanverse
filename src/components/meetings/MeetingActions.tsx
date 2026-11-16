import { CalendarClock, CalendarOff, CircleCheck, CircleX, type LucideIcon } from "lucide-react-native"
import { useState } from "react"
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
    showMissed: boolean
    showComplete: boolean
    showReschedule: boolean
    meetingLink: string | null
    onReschedule: () => void
    onComplete: () => void
    onChanged: () => void
}

enableIconClassNames(CalendarClock, CalendarOff, CircleCheck, CircleX)

interface ActionButtonProps {
    icon: LucideIcon
    label: string
    border: string
    tone: string
    onPress: () => void
    isDisabled?: boolean
}

function ActionButton({ icon: Icon, label, border, tone, onPress, isDisabled = false }: ActionButtonProps) {
    return (
        <Pressable
            onPress={onPress}
            disabled={isDisabled}
            accessibilityRole="button"
            accessibilityState={{ disabled: isDisabled }}
            className={`min-h-[44px] flex-row items-center gap-1 rounded-md border px-2.5 active:opacity-70 ${border} ${
                isDisabled ? "opacity-50" : ""
            }`}
        >
            <Icon size={12} className={tone} />
            <Text className={`text-xs ${tone}`}>{label}</Text>
        </Pressable>
    )
}

/**
 * Cancel, Missed, Completed and Reschedule for a meeting still open, and Join / Copy for an online one. Cancel and
 * Missed ask first, which the web does not: neither can be undone, and a mistaken tap on a phone would close the
 * meeting.
 */
export default function MeetingActions(props: Props) {
    const {
        meetingId,
        showCancel,
        showMissed,
        showComplete,
        showReschedule,
        meetingLink,
        onReschedule,
        onComplete,
        onChanged,
    } = props
    // The status being saved by Cancel or Missed, or null when neither is busy.
    const [closing, setClosing] = useState<number | null>(null)

    // Cancel (any time) and Missed (after the meeting day) close the meeting without a note. Completed needs one, see
    // CompleteSheet.
    async function closeMeeting(status: number, fallbackMessage: string) {
        if (closing !== null) return
        setClosing(status)
        try {
            const json = await sendRaw<{ message?: string }>(`${MEETINGS_API}/${meetingId}/status`, "PATCH", { status })
            notify.success(json.message || fallbackMessage)
        } catch (error) {
            notify.error(error instanceof Error ? error.message : "Failed to update meeting")
        } finally {
            setClosing(null)
        }
        // After a 409 too: the list shows the meeting as the server has it.
        onChanged()
    }

    function confirmCancel() {
        Alert.alert("Cancel this meeting?", "It is marked cancelled for everyone.", [
            { text: "Keep it", style: "cancel" },
            {
                text: "Cancel meeting",
                style: "destructive",
                onPress: () => closeMeeting(MEETING_STATUS.CANCELLED, "Meeting cancelled"),
            },
        ])
    }

    function confirmMissed() {
        Alert.alert("Mark this meeting as missed?", "It is marked missed for everyone.", [
            { text: "Keep it", style: "cancel" },
            {
                text: "Mark missed",
                style: "destructive",
                onPress: () => closeMeeting(MEETING_STATUS.MISSED, "Meeting marked as missed"),
            },
        ])
    }

    if (!showCancel && !showMissed && !showComplete && !showReschedule && !meetingLink) return null

    return (
        <View className="flex-row flex-wrap items-center justify-end gap-2">
            {showCancel && (
                <ActionButton
                    icon={CircleX}
                    label={closing === MEETING_STATUS.CANCELLED ? "Cancelling…" : "Cancel"}
                    border="border-red-500/40"
                    tone="text-red-600 dark:text-red-400"
                    onPress={confirmCancel}
                    isDisabled={closing !== null}
                />
            )}
            {showMissed && (
                <ActionButton
                    icon={CalendarOff}
                    label={closing === MEETING_STATUS.MISSED ? "Saving…" : "Missed"}
                    border="border-neutral-400/50"
                    tone="text-neutral-600 dark:text-neutral-300"
                    onPress={confirmMissed}
                    isDisabled={closing !== null}
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
