import { useState } from "react"

import { send } from "@/api/client"
import { LEAD_SOURCES_API } from "@/api/endpoints"
import { notify } from "@/lib/notify"
import type { LeadSourceRow } from "@/types/leadSource"

import NoteBox from "./NoteBox"

interface Props {
    sourceId: string
    onAdded: (row: LeadSourceRow) => void
}

/**
 * Adds a note without changing the status. Ported from the web's NoteBox.tsx: `POST /:id/notes`, then the field
 * clears and "Note added". The web's Ctrl+Enter has no phone equivalent, so the button is the only way to save.
 */
export default function AddNote({ sourceId, onAdded }: Props) {
    const [text, setText] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    async function save() {
        if (!text.trim() || isSaving) return
        setIsSaving(true)
        try {
            const row = await send<LeadSourceRow>(`${LEAD_SOURCES_API}/${sourceId}/notes`, "POST", {
                text: text.trim(),
            })
            setText("")
            onAdded(row)
            notify.success("Note added")
        } catch (error) {
            notify.error(error instanceof Error ? error.message : "Failed to add the note")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <NoteBox
            value={text}
            onChangeText={setText}
            placeholder="What did you learn on the call?"
            onSave={save}
            isSaving={isSaving}
        />
    )
}
