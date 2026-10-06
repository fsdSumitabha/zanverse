import { useState } from "react"

import { ApiError, sendRaw } from "@/api/client"
import { MEETINGS_API } from "@/api/endpoints"
import { Button, Dialog, Textarea } from "@/components/ui"
import { MEETING_STATUS } from "@/constants/meetingStatus"
import { notify } from "@/lib/notify"

const HTTP_CONFLICT = 409

interface Props {
    meetingId: string
    onClose: () => void
    onChanged: () => void
}

/**
 * Marks a past meeting completed, with the outcome note the server requires. Ported from the inline form in the
 * web's MeetingCard.
 */
export default function CompleteSheet({ meetingId, onClose, onChanged }: Props) {
    const [outcome, setOutcome] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    async function submit() {
        const note = outcome.trim()
        if (!note) {
            notify.error("Please add an outcome note")
            return
        }
        setIsSaving(true)
        try {
            const json = await sendRaw<{ message?: string }>(`${MEETINGS_API}/${meetingId}/status`, "PATCH", {
                status: MEETING_STATUS.COMPLETED,
                outcome: note,
            })
            notify.success(json.message || "Meeting marked completed")
            onClose()
            onChanged()
        } catch (error) {
            notify.error(error instanceof Error ? error.message : "Failed to update status")
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
            title="Mark as completed"
            footer={
                <>
                    <Button label="Cancel" variant="quiet" onPress={onClose} disabled={isSaving} />
                    <Button label={isSaving ? "Saving…" : "Confirm completed"} onPress={submit} disabled={isSaving} />
                </>
            }
        >
            <Textarea
                value={outcome}
                onChangeText={setOutcome}
                placeholder="What was discussed / decided?"
                accessibilityLabel="Outcome"
                numberOfLines={3}
            />
        </Dialog>
    )
}
