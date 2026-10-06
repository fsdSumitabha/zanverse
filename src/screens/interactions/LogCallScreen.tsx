import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native"
import { useState } from "react"

import { ApiError, send } from "@/api/client"
import FormActions from "@/components/interactions/FormActions"
import PhoneField from "@/components/phone/PhoneField"
import PhoneHint from "@/components/phone/PhoneHint"
import { useEditablePhone } from "@/components/phone/useEditablePhone"
import {
    DateTimeField,
    Field,
    FilePickerField,
    FormSheet,
    Input,
    SelectSheet,
    Textarea,
    type PickedFile,
    type SelectOption,
} from "@/components/ui"
import { CALL_DIRECTION_META } from "@/constants/callStatus"
import { notify } from "@/lib/notify"
import { toastPromise } from "@/lib/toastPromise"
import type { RootStackParamList } from "@/navigation/types"

const DIRECTION_OPTIONS: SelectOption<string>[] = Object.entries(CALL_DIRECTION_META).map(([value, meta]) => ({
    label: meta.label,
    value,
}))
const RECORDING_TYPES = ["audio/*"]
// The calls route sets no size limit. This keeps a phone from uploading a very long recording by accident.
const RECORDING_MAX_SIZE = 50 * 1024 * 1024
// The route hardcodes the call's status and ignores this part. The web sends "0", so the app does too.
const CALL_STATUS_PART = "0"

function getErrorText(error: unknown): string {
    return error instanceof Error ? error.message || "Something went wrong" : "Something went wrong"
}

/** Logs a call, with an optional recording, as multipart. Ported from the web's CallForm.tsx. */
export default function LogCallScreen() {
    const navigation = useNavigation()
    const { entityType, entityId } = useRoute<RouteProp<RootStackParamList, "LogCall">>().params
    const phone = useEditablePhone()
    const [form, setForm] = useState({ contactPersonName: "", duration: "", direction: "0", title: "", notes: "" })
    const [callTime, setCallTime] = useState<Date>(() => new Date())
    const [recording, setRecording] = useState<PickedFile | null>(null)
    const [loading, setLoading] = useState(false)

    function set(field: keyof typeof form) {
        return (value: string) => setForm((prev) => ({ ...prev, [field]: value }))
    }

    async function handleSubmit() {
        const phoneToSend = phone.check({ focus: true })
        if (!phoneToSend) return
        // The web's inputs are `required`, which the browser enforces.
        if (!form.contactPersonName.trim() || !form.title.trim() || !form.notes.trim() || !form.duration) {
            notify.error("Please fill required fields")
            return
        }

        // Exactly the web's part names.
        const formData = new FormData()
        formData.append("entityType", String(entityType))
        formData.append("entityId", entityId)
        formData.append("contactPersonName", form.contactPersonName)
        formData.append("contactPersonPhone", phoneToSend)
        formData.append("callTime", callTime.toISOString())
        formData.append("duration", form.duration || "0")
        formData.append("direction", form.direction)
        formData.append("status", CALL_STATUS_PART)
        formData.append("title", form.title)
        formData.append("description", "")
        formData.append("notes", form.notes)
        if (recording) {
            formData.append("recording", {
                uri: recording.uri,
                name: recording.name,
                type: recording.type,
            } as unknown as Blob)
        }

        setLoading(true)
        const promise = send("/api/admin/operations/calls", "POST", formData)
        toastPromise(promise, {
            loading: "Saving call details...",
            success: "Call logged successfully",
            error: getErrorText,
        })

        try {
            await promise
            navigation.goBack()
        } catch (error) {
            if (error instanceof ApiError && error.field === "phone" && error.message) phone.setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <FormSheet title="Log Call" onClose={() => navigation.goBack()}>
            <Input
                label="Contact Name"
                required
                value={form.contactPersonName}
                onChangeText={set("contactPersonName")}
                placeholder="Jane Doe"
                autoCapitalize="words"
            />
            <Field label="Contact Phone" required>
                <PhoneField {...phone.fieldProps} accessibilityLabel="Contact Phone" />
                <PhoneHint error={phone.error} />
            </Field>
            <DateTimeField label="Call Time" required value={callTime} onChange={setCallTime} />
            <Input
                label="Duration (minutes)"
                required
                value={form.duration}
                onChangeText={(value) => set("duration")(value.replace(/[^0-9]/g, ""))}
                placeholder="e.g. 120"
                keyboardType="number-pad"
            />
            <SelectSheet
                label="Direction"
                required
                options={DIRECTION_OPTIONS}
                value={form.direction}
                onChange={set("direction")}
            />
            <Input
                label="Title"
                required
                value={form.title}
                onChangeText={set("title")}
                placeholder="e.g. Follow-up call"
            />
            <Textarea
                label="Notes"
                required
                value={form.notes}
                onChangeText={set("notes")}
                placeholder="Detailed call notes..."
                numberOfLines={3}
            />
            <FilePickerField
                label="Recording"
                file={recording}
                onChange={setRecording}
                acceptedTypes={RECORDING_TYPES}
                maxSize={RECORDING_MAX_SIZE}
            />
            <FormActions
                saveLabel="Save Call"
                savingLabel="Saving..."
                isSaving={loading}
                onSave={handleSubmit}
                onCancel={() => navigation.goBack()}
            />
        </FormSheet>
    )
}
