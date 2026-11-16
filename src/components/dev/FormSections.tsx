import { useState } from "react"
import { View } from "react-native"

import { Button, Dialog, Input, SelectSheet, Textarea, type SelectOption } from "@/components/ui"
import {
    LEAD_SOURCE_PICKABLE_STATUSES,
    LEAD_SOURCE_STATUS_META,
    type LeadSourceStatus,
} from "@/constants/leadSourceStatus"
import { PHONE_MESSAGES } from "@/lib/phone"
import { notify } from "@/lib/notify"

import KitchenSection from "./KitchenSection"

const STATUS_OPTIONS: SelectOption<LeadSourceStatus>[] = LEAD_SOURCE_PICKABLE_STATUSES.map((status) => ({
    label: LEAD_SOURCE_STATUS_META[status].label,
    value: status,
}))

/** Input, Textarea, SelectSheet and Dialog. */
export default function FormSections() {
    const [name, setName] = useState("")
    const [phone, setPhone] = useState("Call after 6pm: 415 555 0146")
    const [notes, setNotes] = useState("")
    const [status, setStatus] = useState<LeadSourceStatus | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [dialogNote, setDialogNote] = useState("")

    function handleSave() {
        setIsDialogOpen(false)
        notify.success("Note saved", { description: dialogNote || "(empty)" })
    }

    return (
        <>
            <KitchenSection
                title="Input"
                note="Focus a field: the border turns blue. The phone field shows a server error under it."
            >
                <Input label="Name" required placeholder="Full name" value={name} onChangeText={setName} />
                <Input
                    label="Phone"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    error={PHONE_MESSAGES.NOT_A_NUMBER}
                />
                <Input label="Region" value="India" editable={false} />
            </KitchenSection>

            <KitchenSection title="Textarea">
                <Textarea label="Notes" placeholder="What did they say?" value={notes} onChangeText={setNotes} />
            </KitchenSection>

            <KitchenSection
                title="SelectSheet"
                note="Opens a sheet with a check on the current value. Close it with the back button or a tap outside."
            >
                <SelectSheet
                    label="Status"
                    required
                    placeholder="Pick a status"
                    options={STATUS_OPTIONS}
                    value={status}
                    onChange={setStatus}
                />
            </KitchenSection>

            <KitchenSection
                title="Dialog"
                note="Type in the field: it must stay above the keyboard. Back and a tap outside both close it."
            >
                <Button label="Open dialog" variant="quiet" onPress={() => setIsDialogOpen(true)} />
                <Dialog
                    open={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    title="Add a note"
                    description="The note shows on the lead source's timeline."
                    footer={
                        <View className="flex-row gap-2">
                            <Button label="Cancel" variant="quiet" onPress={() => setIsDialogOpen(false)} />
                            <Button label="Save" onPress={handleSave} />
                        </View>
                    }
                >
                    <Textarea label="Note" placeholder="Write a note" value={dialogNote} onChangeText={setDialogNote} />
                </Dialog>
            </KitchenSection>
        </>
    )
}
