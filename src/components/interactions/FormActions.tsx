import { View } from "react-native"

import { Button } from "@/components/ui"

interface Props {
    saveLabel: string
    savingLabel: string
    isSaving: boolean
    onSave: () => void
    onCancel: () => void
}

/** Cancel and Save at the end of a timeline form, as the web's forms end. */
export default function FormActions({ saveLabel, savingLabel, isSaving, onSave, onCancel }: Props) {
    return (
        <View className="flex-row justify-end gap-2">
            <Button label="Cancel" variant="quiet" onPress={onCancel} disabled={isSaving} />
            <Button label={isSaving ? savingLabel : saveLabel} onPress={onSave} loading={isSaving} />
        </View>
    )
}
