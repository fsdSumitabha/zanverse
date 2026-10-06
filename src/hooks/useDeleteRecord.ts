import { useState } from "react"
import { Alert } from "react-native"

import { sendRaw } from "@/api/client"
import { notify } from "@/lib/notify"

interface Options {
    /** The record's route, such as `/api/admin/operations/clients/<id>`. */
    path: string
    /** The Alert's question, such as "Delete this client?". */
    question: string
    /** The toast when the server sends no message. */
    successMessage: string
    onDeleted: () => void
}

/**
 * Delete behind a confirm: an Alert, then `DELETE path`, then the server's message as a toast. Replaces the web's
 * sonner toast with Delete and Cancel buttons.
 */
export function useDeleteRecord({ path, question, successMessage, onDeleted }: Options) {
    const [isDeleting, setIsDeleting] = useState(false)

    async function deleteRecord() {
        if (isDeleting) return
        setIsDeleting(true)
        try {
            const json = await sendRaw<{ message?: string }>(path, "DELETE")
            notify.success(json.message || successMessage)
            onDeleted()
        } catch (error) {
            notify.error(error instanceof Error ? error.message : "Something went wrong")
        } finally {
            setIsDeleting(false)
        }
    }

    function confirmDelete() {
        Alert.alert(question, "This cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: deleteRecord },
        ])
    }

    return { isDeleting, confirmDelete }
}
