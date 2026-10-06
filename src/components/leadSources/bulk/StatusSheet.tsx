import clsx from "clsx"
import { useState } from "react"
import { Pressable, Text, View } from "react-native"

import { Button, Dialog, Textarea } from "@/components/ui"
import {
    LEAD_SOURCE_PICKABLE_STATUSES,
    LEAD_SOURCE_STATUS,
    LEAD_SOURCE_STATUS_META,
    type LeadSourceStatus,
} from "@/constants/leadSourceStatus"
import { useOfflineReason } from "@/hooks/useIsOnline"
import { pluralSources } from "@/lib/leadSourceBulk"

import { useBulkSave, type BulkSheetProps } from "./useBulkSave"

const NOTE_MAX_LENGTH = 2000
// Call Back needs its own time on each source, so it is set one at a time.
const CHOICES = LEAD_SOURCE_PICKABLE_STATUSES.filter((status) => status !== LEAD_SOURCE_STATUS.CALL_BACK)

/** One status and an optional note for every selected row. Ported from the web's StatusDialog. */
export default function StatusSheet(props: BulkSheetProps) {
    const offlineReason = useOfflineReason()
    const { open, onClose, ids } = props
    const [status, setStatus] = useState<LeadSourceStatus>(LEAD_SOURCE_STATUS.NOT_REACHED)
    const [note, setNote] = useState("")
    const { isSaving, save } = useBulkSave(props)

    function handleSave() {
        save({
            action: "status",
            body: { status, note: note.trim() || undefined },
            verb: `marked ${LEAD_SOURCE_STATUS_META[status].label}`,
            failure: "Failed to set the status",
        })
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={`Set the status of ${pluralSources(ids.length)}`}
            description="To set Call Back, open each one, so each gets its own time."
            footer={
                <>
                    <Button label="Cancel" variant="quiet" onPress={onClose} />
                    <Button
                        disabledReason={offlineReason}
                        label={isSaving ? "Saving..." : "Save"}
                        onPress={handleSave}
                        disabled={isSaving}
                    />
                </>
            }
        >
            <View className="flex-row flex-wrap justify-between gap-y-1.5" accessibilityRole="radiogroup">
                {CHOICES.map((choice) => {
                    const isActive = status === choice
                    return (
                        <Pressable
                            key={choice}
                            onPress={() => setStatus(choice)}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: isActive }}
                            className={clsx(
                                "min-h-[44px] w-[49%] flex-row items-center gap-2 rounded-lg border px-3",
                                isActive
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                                    : "border-slate-200 active:bg-slate-50 dark:border-neutral-700 dark:active:bg-neutral-800",
                            )}
                        >
                            <View className={clsx("h-2.5 w-2.5 rounded-full", LEAD_SOURCE_STATUS_META[choice].dot)} />
                            <Text
                                numberOfLines={1}
                                className={clsx(
                                    "flex-1 text-sm",
                                    isActive
                                        ? "text-blue-900 dark:text-blue-100"
                                        : "text-neutral-700 dark:text-neutral-200",
                                )}
                            >
                                {LEAD_SOURCE_STATUS_META[choice].label}
                            </Text>
                        </Pressable>
                    )
                })}
            </View>
            <Textarea
                value={note}
                onChangeText={setNote}
                maxLength={NOTE_MAX_LENGTH}
                placeholder="Note for all of them (optional)"
                accessibilityLabel="Note for all of them"
            />
        </Dialog>
    )
}
