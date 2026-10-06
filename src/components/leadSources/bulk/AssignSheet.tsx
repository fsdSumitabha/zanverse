import { useState } from "react"

import AssigneeSelect from "@/components/leadSources/AssigneeSelect"
import { Button, Dialog } from "@/components/ui"
import { pluralSources } from "@/lib/leadSourceBulk"

import { useBulkSave, type BulkSheetProps } from "./useBulkSave"
import { useOfflineReason } from "@/hooks/useIsOnline"

/** Gives every selected row to one person, or to nobody. Ported from the web's AssignDialog. */
export default function AssignSheet(props: BulkSheetProps & { regions: string[] }) {
    const offlineReason = useOfflineReason()
    const { open, onClose, ids, regions } = props
    const [userId, setUserId] = useState("")
    const { isSaving, save } = useBulkSave(props)

    function handleSave() {
        save({
            action: "assign",
            body: { assignedTo: userId || null },
            verb: userId ? "assigned" : "unassigned",
            failure: "Failed to assign",
        })
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={`Assign ${pluralSources(ids.length)}`}
            description={
                regions.length > 1
                    ? `These are in ${regions.join(" and ")}. Only people who cover all of them are listed.`
                    : "Only people with a lead source role in this region are listed."
            }
            footer={
                <>
                    <Button label="Cancel" variant="quiet" onPress={onClose} />
                    <Button
                        disabledReason={offlineReason}
                        label={isSaving ? "Saving..." : userId ? "Assign" : "Remove assignee"}
                        onPress={handleSave}
                        disabled={isSaving}
                    />
                </>
            }
        >
            <AssigneeSelect
                label="Assign to"
                regions={regions}
                value={userId}
                onChange={setUserId}
                noneLabel="Nobody (unassign)"
            />
        </Dialog>
    )
}
