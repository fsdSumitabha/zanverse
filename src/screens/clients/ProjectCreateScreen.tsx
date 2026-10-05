import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useState } from "react"
import { Text, View } from "react-native"

import { send } from "@/api/client"
import ClientInfoCard from "@/components/clients/ClientInfoCard"
import FormActions from "@/components/interactions/FormActions"
import LeadDetailsSkeleton from "@/components/leads/LeadDetailsSkeleton"
import {
    AccessDenied,
    Card,
    EmptyState,
    FormScrollView,
    Input,
    SelectSheet,
    Textarea,
    type SelectOption,
} from "@/components/ui"
import { PROJECT_STATUS, type ProjectStatus } from "@/constants/projectStatus"
import { Service, type ServiceType } from "@/constants/services"
import { useAuth } from "@/contexts/AuthContext"
import { useDetailQuery } from "@/hooks/useDetailQuery"
import { notify } from "@/lib/notify"
import { toastPromise } from "@/lib/toastPromise"
import { openProject } from "@/navigation/openRecord"
import type { ClientsStackParamList } from "@/navigation/types"
import type { Client } from "@/types/clients"

type Navigation = NativeStackNavigationProp<ClientsStackParamList, "ProjectCreate">

// The web's option labels: the enum and constant keys, with underscores as spaces.
const SERVICE_OPTIONS: SelectOption<ServiceType>[] = Object.entries(Service)
    .filter(([key]) => isNaN(Number(key)))
    .map(([key, value]) => ({ label: key.replaceAll("_", " "), value: value as ServiceType }))
const STATUS_OPTIONS: SelectOption<ProjectStatus>[] = Object.entries(PROJECT_STATUS).map(([key, value]) => ({
    label: key.replace("_", " "),
    value,
}))

/**
 * A new project for the client in the route, shown read-only above the form, so no id is ever typed. Ported from the
 * web's projects/create page, without its 3-second wait: on success it opens the new project.
 */
export default function ProjectCreateScreen() {
    const navigation = useNavigation<Navigation>()
    const { clientId } = useRoute<RouteProp<ClientsStackParamList, "ProjectCreate">>().params
    const { role } = useAuth()
    const { data, loading, accessError } = useDetailQuery<{ client: Client | null }>(
        `/api/admin/operations/clients/${clientId}`,
    )
    const [form, setForm] = useState({ title: "", description: "", budget: "" })
    const [serviceType, setServiceType] = useState<ServiceType | null>(null)
    const [status, setStatus] = useState<ProjectStatus>(PROJECT_STATUS.DISCUSSION)
    const [isSaving, setIsSaving] = useState(false)
    const client = data?.client ?? null

    function set(field: keyof typeof form) {
        return (value: string) => setForm((prev) => ({ ...prev, [field]: value }))
    }

    async function handleSubmit() {
        // The web's inputs are `required`, which the browser enforces.
        if (!form.title.trim() || !form.description.trim() || !form.budget) {
            notify.error("Please fill required fields")
            return
        }

        setIsSaving(true)
        // No region: a project inherits its client's.
        const promise = send<{ _id: string }>("/api/admin/operations/projects", "POST", {
            clientId,
            title: form.title,
            description: form.description,
            serviceType: serviceType ?? undefined,
            status,
            budget: Number(form.budget),
        })
        toastPromise(promise, {
            loading: "Creating project...",
            success: "Project created successfully",
            error: (error) => (error instanceof Error ? error.message : "Failed to create project"),
        })
        try {
            const project = await promise
            navigation.goBack()
            openProject(project._id, role)
        } catch {
            // The toast already shows the error.
        } finally {
            setIsSaving(false)
        }
    }

    if (accessError) {
        return (
            <View className="flex-1 justify-center p-4">
                <AccessDenied message={accessError} />
            </View>
        )
    }

    return (
        <FormScrollView>
            {loading && <LeadDetailsSkeleton />}
            {!loading && !client && <EmptyState title="Failed to load client" />}
            {!loading && client && (
                <>
                    <ClientInfoCard client={client} />
                    <Card className="gap-4 p-5">
                        <View>
                            <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                Create Project
                            </Text>
                            <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                                Add a new project for this client
                            </Text>
                        </View>
                        <Input
                            label="Title"
                            required
                            value={form.title}
                            onChangeText={set("title")}
                            placeholder="Project Title"
                        />
                        <Textarea
                            label="Description"
                            required
                            value={form.description}
                            onChangeText={set("description")}
                            placeholder="Project Description"
                        />
                        <SelectSheet
                            label="Service Type"
                            placeholder="Select Service Type"
                            options={SERVICE_OPTIONS}
                            value={serviceType}
                            onChange={setServiceType}
                        />
                        <SelectSheet
                            label="Status"
                            required
                            options={STATUS_OPTIONS}
                            value={status}
                            onChange={setStatus}
                        />
                        <Input
                            label="Budget"
                            required
                            value={form.budget}
                            onChangeText={(value) => set("budget")(value.replace(/[^0-9.]/g, ""))}
                            placeholder="Total Budget (₹)"
                            keyboardType="numeric"
                        />
                        <FormActions
                            saveLabel="Create Project"
                            savingLabel="Creating..."
                            isSaving={isSaving}
                            onSave={handleSubmit}
                            onCancel={() => navigation.goBack()}
                        />
                    </Card>
                </>
            )}
        </FormScrollView>
    )
}
