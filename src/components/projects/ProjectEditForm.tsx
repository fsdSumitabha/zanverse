import { useEffect, useState } from "react"
import { Text, View } from "react-native"

import { send } from "@/api/client"
import FormActions from "@/components/interactions/FormActions"
import { Card, Field, Input, SelectSheet, Textarea, type SelectOption } from "@/components/ui"
import { PROJECT_STATUS, type ProjectStatus } from "@/constants/projectStatus"
import { Service, type ServiceType } from "@/constants/services"
import { notify } from "@/lib/notify"
import { toastPromise } from "@/lib/toastPromise"

export interface ProjectEditValues {
    clientId: string
    /** Shown read-only: "<company> • <name>". */
    clientLabel: string
    companyName: string
    title: string
    description: string
    serviceType: ServiceType | null
    budget: string
    status: ProjectStatus
}

interface Props {
    projectId: string
    initialValues: ProjectEditValues
    onSaved: () => void
    onCancel: () => void
}

// The web's option labels: the enum and constant keys, with underscores as spaces.
const SERVICE_OPTIONS: SelectOption<ServiceType>[] = Object.entries(Service)
    .filter(([key]) => Number.isNaN(Number(key)))
    .map(([key, value]) => ({ label: key.replaceAll("_", " "), value: value as ServiceType }))
const STATUS_OPTIONS: SelectOption<ProjectStatus>[] = Object.entries(PROJECT_STATUS).map(([key, value]) => ({
    label: key.replace("_", " "),
    value,
}))

const READ_ONLY_CLASSES =
    "min-h-[44px] w-full justify-center rounded-lg border border-slate-300 bg-gray-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800/60"

/**
 * Edits a project. Ported from the web's ProjectEditForm.tsx: the same body and messages, with the client shown as a
 * read-only row instead of a typed Mongo id. The client id is sent back unchanged.
 */
export default function ProjectEditForm({ projectId, initialValues, onSaved, onCancel }: Props) {
    const [form, setForm] = useState<ProjectEditValues>(initialValues)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setForm(initialValues)
    }, [initialValues])

    function set<K extends keyof ProjectEditValues>(field: K) {
        return (value: ProjectEditValues[K]) => setForm((prev) => ({ ...prev, [field]: value }))
    }

    async function handleSubmit() {
        if (!form.clientId?.trim() || !form.title?.trim()) {
            notify.error("Client ID and project title are required")
            return
        }

        setLoading(true)
        const promise = send(`/api/admin/operations/projects/${projectId}`, "PATCH", {
            clientId: form.clientId.trim(),
            title: form.title.trim(),
            description: form.description || undefined,
            serviceType: form.serviceType ?? undefined,
            status: Number(form.status),
            companyName: form.companyName?.trim() || undefined,
            budget: form.budget ? Number(form.budget) : undefined,
        })
        toastPromise(promise, {
            loading: "Updating project...",
            success: "Project updated successfully",
            error: (error) => (error instanceof Error ? error.message : "Failed to update project"),
        })
        try {
            await promise
            onSaved()
        } catch {
            // The toast already shows the error.
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="gap-4 p-5">
            <View>
                <Text className="text-2xl font-semibold text-neutral-800 dark:text-neutral-200">Edit Project</Text>
                <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                    Update project details for this client
                </Text>
            </View>
            <Field label="Client">
                <View accessible accessibilityLabel={`Client: ${form.clientLabel}`} className={READ_ONLY_CLASSES}>
                    <Text className="text-sm text-neutral-800 dark:text-neutral-100">{form.clientLabel}</Text>
                </View>
            </Field>
            <Input
                label="Company name"
                value={form.companyName}
                onChangeText={set("companyName")}
                placeholder="Company name (optional)"
            />
            <Input label="Title" required value={form.title} onChangeText={set("title")} placeholder="Project title" />
            <Textarea
                label="Description"
                value={form.description}
                onChangeText={set("description")}
                placeholder="Project description"
            />
            <SelectSheet
                label="Service type"
                placeholder="Select service type"
                options={SERVICE_OPTIONS}
                value={form.serviceType}
                onChange={set("serviceType")}
            />
            <SelectSheet label="Status" options={STATUS_OPTIONS} value={form.status} onChange={set("status")} />
            <Input
                label="Budget"
                value={form.budget}
                onChangeText={(value) => set("budget")(value.replace(/[^0-9.]/g, ""))}
                placeholder="Total budget (₹)"
                keyboardType="numeric"
            />
            <FormActions
                saveLabel="Save changes"
                savingLabel="Saving..."
                isSaving={loading}
                onSave={handleSubmit}
                onCancel={onCancel}
            />
        </Card>
    )
}
