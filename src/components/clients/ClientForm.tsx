import { useEffect, useState } from "react"
import { Text } from "react-native"

import { ApiError, send } from "@/api/client"
import PhoneField from "@/components/phone/PhoneField"
import PhoneHint from "@/components/phone/PhoneHint"
import { useEditablePhone } from "@/components/phone/useEditablePhone"
import WriteRegionField from "@/components/region/WriteRegionField"
import { Button, Card, Field, Input } from "@/components/ui"
import { useWriteRegion } from "@/hooks/useWriteRegion"
import { notify } from "@/lib/notify"
import { useOfflineReason } from "@/hooks/useIsOnline"

type ClientFormValues = {
    name: string
    company: string
    email: string
    phone: string
}

interface ClientFormProps {
    mode?: "create" | "edit"
    clientId?: string
    initialValues?: Partial<ClientFormValues>
    /** Called with the client's id after a successful save. */
    onSaved: (clientId: string) => void
}

const CLIENTS_API = "/api/admin/operations/clients"

/**
 * Edits a client, or creates one (no screen uses create yet: clients come from converting a lead). Ported from the
 * web's ClientForm.tsx: the same fields, body and messages. A `field: "phone"` error shows under the phone field.
 */
export default function ClientForm({ mode = "edit", clientId, initialValues, onSaved }: ClientFormProps) {
    const offlineReason = useOfflineReason()
    const [form, setForm] = useState<Omit<ClientFormValues, "phone">>({ name: "", company: "", email: "" })
    const phone = useEditablePhone(mode === "edit" ? initialValues?.phone : "")
    // Create only. A client's region does not change after it is saved.
    const region = useWriteRegion()
    const [loading, setLoading] = useState(false)
    const isEdit = mode === "edit" && !!clientId

    useEffect(() => {
        if (initialValues) {
            setForm({
                name: initialValues.name || "",
                company: initialValues.company || "",
                email: initialValues.email || "",
            })
        }
    }, [initialValues])

    function handleChange(name: keyof typeof form, value: string) {
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    async function handleSubmit() {
        const phoneToSend = phone.check({ focus: true })

        if (!form.name || !form.company) {
            notify.error("Please fill required fields")
            return
        }
        if (!phoneToSend) return

        setLoading(true)
        try {
            const body = {
                name: form.name,
                company: form.company,
                email: form.email || undefined,
                phone: phoneToSend,
                ...(!isEdit && region.value ? { region: region.value } : {}),
            }
            const data = await send<{ _id: string }>(
                isEdit ? `${CLIENTS_API}/${clientId}` : CLIENTS_API,
                isEdit ? "PATCH" : "POST",
                body,
            )
            notify.success(isEdit ? "Client updated successfully" : "Client created successfully")
            onSaved(isEdit ? clientId : data._id)
        } catch (error) {
            if (error instanceof ApiError && error.field === "phone" && error.message) {
                phone.setError(error.message)
                return
            }
            notify.error(error instanceof Error ? error.message : "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="gap-4 p-5 dark:border-neutral-700">
            <Text className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
                {isEdit ? "Edit Client" : "Create Client"}
            </Text>
            <Input
                label="Name"
                required
                value={form.name}
                onChangeText={(value) => handleChange("name", value)}
                placeholder="Client name"
                autoCapitalize="words"
            />
            <Input
                label="Company"
                required
                value={form.company}
                onChangeText={(value) => handleChange("company", value)}
                placeholder="Company name"
            />
            <Field label="Phone" required>
                <PhoneField {...phone.fieldProps} />
                <PhoneHint error={phone.error} savedInvalid={phone.savedInvalid} />
            </Field>
            <Input
                label="Email"
                value={form.email}
                onChangeText={(value) => handleChange("email", value)}
                placeholder="Email address"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
            />
            {!isEdit && <WriteRegionField region={region} />}
            <Button
                disabledReason={offlineReason}
                label={loading ? (isEdit ? "Updating..." : "Creating...") : isEdit ? "Update Client" : "Create Client"}
                onPress={handleSubmit}
                loading={loading}
            />
        </Card>
    )
}
