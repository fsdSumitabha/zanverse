import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native"
import { useState } from "react"

import { send } from "@/api/client"
import FormActions from "@/components/interactions/FormActions"
import { FilePickerField, FormScrollView, Input, Textarea, type PickedFile } from "@/components/ui"
import { INTERACTION_TYPE } from "@/constants/interactionTypes"
import { notify } from "@/lib/notify"
import { toastPromise } from "@/lib/toastPromise"
import type { RootStackParamList } from "@/navigation/types"

// The web QuotationForm's file rules.
const QUOTATION_MAX_SIZE = 10 * 1024 * 1024
const QUOTATION_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]
const DEFAULT_GST = "18"

function getErrorText(error: unknown): string {
    return error instanceof Error ? error.message || "Something went wrong" : "Something went wrong"
}

/** Sends a quotation, with an optional file, as multipart. Ported from the web's QuotationForm.tsx. */
export default function SendQuotationScreen() {
    const navigation = useNavigation()
    const { entityType, entityId } = useRoute<RouteProp<RootStackParamList, "SendQuotation">>().params
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [amount, setAmount] = useState("")
    const [gstPercentage, setGstPercentage] = useState(DEFAULT_GST)
    const [file, setFile] = useState<PickedFile | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit() {
        if (!title.trim()) {
            notify.error("Title is required")
            return
        }
        if (!amount) {
            notify.error("Amount is required")
            return
        }

        // The web's part names. No Content-Type: fetch writes the multipart boundary.
        const formData = new FormData()
        formData.append("entityType", String(entityType))
        formData.append("entityId", entityId)
        formData.append("title", title)
        formData.append("description", description)
        formData.append("amount", amount)
        formData.append("gst_percentage", gstPercentage)
        formData.append("status", String(INTERACTION_TYPE.QUOTATION_SENT))
        if (file) formData.append("file", { uri: file.uri, name: file.name, type: file.type } as unknown as Blob)

        setLoading(true)
        const promise = send("/api/admin/operations/quotations", "POST", formData)
        toastPromise(promise, {
            loading: "Uploading quotation...",
            success: "Quotation created successfully",
            error: getErrorText,
        })

        try {
            await promise
            navigation.goBack()
        } catch {
            // The toast already shows the error.
        } finally {
            setLoading(false)
        }
    }

    return (
        <FormScrollView>
            <Input label="Title" required value={title} onChangeText={setTitle} placeholder="Quotation title" />
            <Textarea
                label="Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Description (optional)"
                numberOfLines={3}
            />
            <Input
                label="Amount (₹)"
                required
                value={amount}
                onChangeText={setAmount}
                placeholder="Amount (₹)"
                keyboardType="decimal-pad"
            />
            <Input
                label="GST % (Default: 18%)"
                value={gstPercentage}
                onChangeText={setGstPercentage}
                placeholder="GST % (Default: 18%)"
                keyboardType="decimal-pad"
            />
            <FilePickerField
                label="Upload Quotation File"
                file={file}
                onChange={setFile}
                acceptedTypes={QUOTATION_TYPES}
                maxSize={QUOTATION_MAX_SIZE}
            />
            <FormActions
                saveLabel="Send"
                savingLabel="Uploading..."
                isSaving={loading}
                onSave={handleSubmit}
                onCancel={() => navigation.goBack()}
            />
        </FormScrollView>
    )
}
