import { useState } from "react"

import DayChoice from "@/components/leadSources/DayChoice"
import { Button, Dialog } from "@/components/ui"
import { pluralSources } from "@/lib/leadSourceBulk"
import { formatDay, todayString } from "@/lib/leadSourceDay"

import { useBulkSave, type BulkSheetProps } from "./useBulkSave"

/** Moves every selected row to one day, or to no day. Ported from the web's DayDialog. */
export default function DaySheet(props: BulkSheetProps) {
    const { open, onClose, ids } = props
    const [day, setDay] = useState<string | null>(() => todayString())
    const { isSaving, save } = useBulkSave(props)

    function handleSave() {
        save({
            action: "day",
            body: { day },
            verb: day ? `moved to ${formatDay(day)}` : "left without a day",
            failure: "Failed to set the day",
        })
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={`Set the day for ${pluralSources(ids.length)}`}
            description="Any callback time on them is cleared, because the day changes."
            footer={
                <>
                    <Button label="Cancel" variant="quiet" onPress={onClose} />
                    <Button label={isSaving ? "Saving..." : "Set day"} onPress={handleSave} disabled={isSaving} />
                </>
            }
        >
            <DayChoice value={day} onChange={setDay} />
        </Dialog>
    )
}
