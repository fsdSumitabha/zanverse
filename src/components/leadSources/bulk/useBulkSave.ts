import { useState } from "react"

import { reportBulkResult, runBulk, type BulkAction } from "@/lib/leadSourceBulk"
import { notify } from "@/lib/notify"

/** What every bulk sheet takes. */
export interface BulkSheetProps {
    open: boolean
    onClose: () => void
    ids: string[]
    /** Called after the change is saved, to clear the selection and reload the list. */
    onDone: () => void
}

interface SaveOptions {
    action: BulkAction
    body?: Record<string, unknown>
    verb: string
    failure: string
}

/**
 * The save step the four bulk sheets share, from the web's ActionDialogs.tsx: post, toast the counts, reload, close.
 * A failure toasts the server's message, or the sheet's own line, and keeps the sheet open.
 */
export function useBulkSave({ ids, onDone, onClose }: BulkSheetProps) {
    const [isSaving, setIsSaving] = useState(false)

    async function save({ action, body, verb, failure }: SaveOptions) {
        setIsSaving(true)
        try {
            const result = await runBulk(action, ids, body)
            reportBulkResult(result, verb)
            onDone()
            onClose()
        } catch (error) {
            notify.error(error instanceof Error ? error.message : failure)
        } finally {
            setIsSaving(false)
        }
    }

    return { isSaving, save }
}
