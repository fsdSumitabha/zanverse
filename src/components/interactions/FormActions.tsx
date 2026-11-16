import { View } from "react-native"

import { Button } from "@/components/ui"
import { useOfflineReason } from "@/hooks/useIsOnline"

interface Props {
    saveLabel: string
    savingLabel: string
    isSaving: boolean
    onSave: () => void
    onCancel: () => void
}

/** Cancel and Save at the end of a timeline form, as the web's forms end. */
export default function FormActions({ saveLabel, savingLabel, isSaving, onSave, onCancel }: Props) {
    const offlineReason = useOfflineReason()
    return (
        <View className="flex-row justify-end gap-2">
            <Button label="Cancel" variant="quiet" onPress={onCancel} disabled={isSaving} />
            <Button
                disabledReason={offlineReason}
                label={isSaving ? savingLabel : saveLabel}
                onPress={onSave}
                loading={isSaving}
            />
        </View>
    )
}
