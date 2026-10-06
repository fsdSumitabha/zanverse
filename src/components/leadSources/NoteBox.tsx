import { View, Text } from "react-native"

import { Button, Textarea } from "@/components/ui"

interface Props {
    value: string
    onChangeText: (text: string) => void
    placeholder?: string
    /** Shows the box's own Save button, for a note on its own. In the status sheet the sheet's Save sends it. */
    onSave?: () => void
    saveLabel?: string
    isSaving?: boolean
}

export const NOTE_MAX_LENGTH = 2000

/**
 * A note of up to 2000 characters, with a counter. The web saves with Enter or Ctrl+Enter, which mean nothing on a
 * phone keyboard, so saving is always a visible button.
 */
export default function NoteBox({
    value,
    onChangeText,
    placeholder,
    onSave,
    saveLabel = "Add note",
    isSaving = false,
}: Props) {
    return (
        <View className="gap-1.5">
            <Textarea
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder ?? "What happened on the call? (optional)"}
                accessibilityLabel="Note"
                maxLength={NOTE_MAX_LENGTH}
                numberOfLines={3}
            />
            <View className="flex-row items-center justify-between gap-2">
                <Text className="text-[11px] text-neutral-400">
                    {value.length}/{NOTE_MAX_LENGTH}
                </Text>
                {onSave && (
                    <Button
                        label={isSaving ? "Adding..." : saveLabel}
                        onPress={onSave}
                        disabled={!value.trim() || isSaving}
                        loading={isSaving}
                    />
                )}
            </View>
        </View>
    )
}
