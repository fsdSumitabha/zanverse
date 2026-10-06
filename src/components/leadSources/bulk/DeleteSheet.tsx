import { Text } from "react-native"

import { Button, Dialog } from "@/components/ui"
import { pluralSources } from "@/lib/leadSourceBulk"

import { useBulkSave, type BulkSheetProps } from "./useBulkSave"

/** Deletes every selected row. Converted leads stay. Ported from the web's DeleteDialog. */
export default function DeleteSheet(props: BulkSheetProps) {
    const { open, onClose, ids } = props
    const { isSaving, save } = useBulkSave(props)

    function handleDelete() {
        save({ action: "delete", verb: "deleted", failure: "Failed to delete" })
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={`Delete ${pluralSources(ids.length)}?`}
            description="They disappear from every list. Their numbers can be uploaded again later. The upload reports still show them."
            footer={
                <>
                    <Button label="Cancel" variant="quiet" onPress={onClose} />
                    <Button
                        label={isSaving ? "Deleting..." : "Delete"}
                        variant="danger"
                        onPress={handleDelete}
                        disabled={isSaving}
                    />
                </>
            }
        >
            <Text className="text-sm text-neutral-600 dark:text-neutral-300">
                Converted leads are not touched. Only the lead source rows are deleted.
            </Text>
        </Dialog>
    )
}
