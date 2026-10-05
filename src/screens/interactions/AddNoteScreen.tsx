import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native"
import { useState } from "react"

import { send } from "@/api/client"
import FormActions from "@/components/interactions/FormActions"
import { FormScrollView, Input, Textarea } from "@/components/ui"
import { INTERACTION_TYPE } from "@/constants/interactionTypes"
import { notify } from "@/lib/notify"
import { toastPromise } from "@/lib/toastPromise"
import type { RootStackParamList } from "@/navigation/types"

function getErrorText(error: unknown): string {
    return error instanceof Error ? error.message || "Something went wrong" : "Something went wrong"
}

/** Adds a note to a lead, client or project timeline. Ported from the web's NoteForm.tsx. */
export default function AddNoteScreen() {
    const navigation = useNavigation()
    const { entityType, entityId } = useRoute<RouteProp<RootStackParamList, "AddNote">>().params
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleSubmit() {
        if (!description.trim()) {
            notify.error("Description cannot be empty")
            return
        }

        setLoading(true)
        const promise = send("/api/admin/operations/notes", "POST", {
            entityType,
            entityId,
            type: INTERACTION_TYPE.NOTE_ADDED,
            title,
            description,
        })
        toastPromise(promise, { loading: "Saving note...", success: "Note added successfully", error: getErrorText })

        try {
            await promise
            // The timeline reloads when its screen is focused again.
            navigation.goBack()
        } catch {
            // The toast already shows the error.
        } finally {
            setLoading(false)
        }
    }

    return (
        <FormScrollView>
            <Input label="Title" value={title} onChangeText={setTitle} placeholder="write a proper title" />
            <Textarea
                label="Note"
                required
                value={description}
                onChangeText={setDescription}
                placeholder="Write your note..."
            />
            <FormActions
                saveLabel="Save Note"
                savingLabel="Saving..."
                isSaving={loading}
                onSave={handleSubmit}
                onCancel={() => navigation.goBack()}
            />
        </FormScrollView>
    )
}
