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

type LeadFormValues = {
    name: string
    email: string
    phone: string
    source: string
}

interface LeadFormProps {
    mode?: "create" | "edit"
    leadId?: string
    initialValues?: Partial<LeadFormValues>
    /** Called with the lead's id after a successful save. */
    onSaved: (leadId: string) => void
}

const LEADS_API = "/api/admin/operations/leads"

/**
 * One form for creating and editing a lead. Ported from the web's LeadForm.tsx: the same fields, body, messages and
 * phone rules. A server error with `field: "phone"` shows under the phone field instead of as a toast.
 */
export default function LeadForm({ mode = "create", leadId, initialValues, onSaved }: LeadFormProps) {
    const [form, setForm] = useState<Omit<LeadFormValues, "phone">>({ name: "", email: "", source: "" })
    const phone = useEditablePhone(mode === "edit" ? initialValues?.phone : "")
    // Create only. A lead's region does not change after it is saved.
    const region = useWriteRegion()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (mode === "edit" && initialValues) {
            setForm({
                name: initialValues.name || "",
                email: initialValues.email || "",
                source: initialValues.source || "",
            })
        }
    }, [mode, initialValues])

    function handleChange(name: keyof typeof form, value: string) {
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    async function handleSubmit() {
        const phoneToSend = phone.check({ focus: true })

        if (!form.name || !form.source) {
            notify.error("Please fill required fields")
            return
        }
        if (!phoneToSend) return

        setLoading(true)
        try {
            const isEdit = mode === "edit" && !!leadId
            const body = {
                ...form,
                phone: phoneToSend,
                ...(mode === "create" && region.value ? { region: region.value } : {}),
            }
            const data = await send<{ _id: string }>(
                isEdit ? `${LEADS_API}/${leadId}` : LEADS_API,
                isEdit ? "PATCH" : "POST",
                body,
            )

            notify.success(isEdit ? "Lead updated successfully" : "Lead created successfully")
            onSaved(isEdit ? leadId : data._id)
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

    const isEdit = mode === "edit"

    return (
        <Card className="gap-4 p-5 dark:border-neutral-700">
            <Text className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
                {isEdit ? "Edit Lead" : "Create Lead"}
            </Text>

            <Input
                label="Name"
                required
                value={form.name}
                onChangeText={(value) => handleChange("name", value)}
                placeholder="Enter full name"
                autoCapitalize="words"
            />

            <Field label="Phone" required>
                <PhoneField {...phone.fieldProps} />
                <PhoneHint error={phone.error} savedInvalid={phone.savedInvalid} />
            </Field>

            <Input
                label="Email"
                value={form.email}
                onChangeText={(value) => handleChange("email", value)}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
            />

            <Input
                label="Source (Facebook, Google...)"
                required
                value={form.source}
                onChangeText={(value) => handleChange("source", value)}
                placeholder="Enter source"
            />

            {!isEdit && <WriteRegionField region={region} />}

            <Button
                label={loading ? (isEdit ? "Updating..." : "Creating...") : isEdit ? "Update Lead" : "Create Lead"}
                onPress={handleSubmit}
                loading={loading}
            />
        </Card>
    )
}
