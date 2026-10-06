import { useState } from "react"

import { ApiError, sendRaw } from "@/api/client"
import { MEETINGS_API } from "@/api/endpoints"
import { Button, DateTimeField, Dialog, Textarea } from "@/components/ui"
import { notify } from "@/lib/notify"

interface Props {
    meetingId: string
    currentScheduledAt: string
    onClose: () => void
    /** Called after a save, and after a refusal, so the list shows the meeting as the server has it. */
    onChanged: () => void
}

const HTTP_CONFLICT = 409

function getStartDate(iso: string): Date | null {
    const date = new Date(iso)
    return Number.isNaN(date.getTime()) ? null : date
}

/**
 * A new time and a reason for a meeting. Ported from the web's RescheduleMeetingForm.tsx, as a sheet: the same
 * client checks in the same order, then `PATCH /meetings/:id/reschedule`.
 */
export default function RescheduleSheet({ meetingId, currentScheduledAt, onClose, onChanged }: Props) {
    const [scheduledAt, setScheduledAt] = useState<Date | null>(() => getStartDate(currentScheduledAt))
    const [reason, setReason] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    async function submit() {
        if (!scheduledAt) {
            notify.error("Please pick a new date and time")
            return
        }
        if (!reason.trim()) {
            notify.error("Please provide a reason")
            return
        }
        if (scheduledAt.getTime() <= Date.now()) {
            notify.error("New time must be in the future")
            return
        }

        setIsSaving(true)
        try {
            const json = await sendRaw<{ message?: string }>(`${MEETINGS_API}/${meetingId}/reschedule`, "PATCH", {
                scheduledAt: scheduledAt.toISOString(),
                reason: reason.trim(),
            })
            notify.success(json.message || "Meeting rescheduled")
            onClose()
            onChanged()
        } catch (error) {
            notify.error(error instanceof Error ? error.message : "Failed to reschedule")
            // A 409 means the meeting closed meanwhile: show it as it is now.
            if (error instanceof ApiError && error.status === HTTP_CONFLICT) {
                onClose()
                onChanged()
            }
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog
            open
            onClose={() => !isSaving && onClose()}
            title="Reschedule meeting"
            footer={
                <>
                    <Button label="Cancel" variant="quiet" onPress={onClose} disabled={isSaving} />
                    <Button label={isSaving ? "Saving…" : "Confirm"} onPress={submit} disabled={isSaving} />
                </>
            }
        >
            <DateTimeField
                label="New date & time"
                value={scheduledAt}
                onChange={setScheduledAt}
                minimumDate={new Date()}
            />
            <Textarea
                label="Reason"
                value={reason}
                onChangeText={setReason}
                placeholder="Why are you rescheduling?"
                numberOfLines={2}
            />
        </Dialog>
    )
}
