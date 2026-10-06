import { Check, X } from "lucide-react-native"
import { useState } from "react"
import { View } from "react-native"

import { send } from "@/api/client"
import { Button, Input, Textarea } from "@/components/ui"
import { notify } from "@/lib/notify"

interface Props {
    interactionId: string
    initialTitle?: string
    initialDescription?: string
    showTitle?: boolean
    onCancel: () => void
    onSaved: () => void
}

/**
 * Inline edit of a note (title and description) or a status change's remarks (description only). Ported from the
 * web's InteractionEditor.tsx: Save stays disabled until something changed, and the PATCH sends only the changed keys.
 */
export default function InteractionEditor({
    interactionId,
    initialTitle = "",
    initialDescription = "",
    showTitle = true,
    onCancel,
    onSaved,
}: Props) {
    const [title, setTitle] = useState(initialTitle)
    const [description, setDescription] = useState(initialDescription)
    const [saving, setSaving] = useState(false)

    const dirty = title.trim() !== initialTitle.trim() || description.trim() !== initialDescription.trim()

    async function save() {
        if (!dirty) return
        setSaving(true)
        try {
            const body: Record<string, string> = {}
            if (showTitle && title.trim() !== initialTitle.trim()) body.title = title.trim()
            if (description.trim() !== initialDescription.trim()) body.description = description.trim()

            await send(`/api/admin/operations/interactions/${interactionId}`, "PATCH", body)
            notify.success("Updated")
            onSaved()
        } catch (error) {
            notify.error(error instanceof Error ? error.message : "Failed to save")
        } finally {
            setSaving(false)
        }
    }

    return (
        <View className="gap-2">
            {showTitle && (
                <Input
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Title"
                    accessibilityLabel="Title"
                    editable={!saving}
                />
            )}
            <Textarea
                value={description}
                onChangeText={setDescription}
                placeholder="Description"
                accessibilityLabel="Description"
                numberOfLines={3}
                editable={!saving}
            />
            <View className="flex-row items-center justify-end gap-2">
                <Button label="Cancel" variant="quiet" icon={X} onPress={onCancel} disabled={saving} />
                <Button label="Save" icon={Check} onPress={save} disabled={!dirty || saving} loading={saving} />
            </View>
        </View>
    )
}
