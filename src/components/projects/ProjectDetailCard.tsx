import type { ReactNode } from "react"
import { Pressable, Text, View } from "react-native"

import WhatsAppLink from "@/components/phone/WhatsAppLink"
import { Badge, TimeAgo } from "@/components/ui"
import { SERVICE_META } from "@/constants/services"
import { useAuth } from "@/contexts/AuthContext"
import { formatAmount } from "@/lib/format"
import { canOpen } from "@/navigation/permissions"
import type { Project } from "@/types/projects"

import ProjectStatusSheet from "./ProjectStatusSheet"

interface Props {
    project: Project
    onEdit: () => void
    onOpenClient: (clientId: string) => void
    /** Called after a status change, so the screen can refetch the project and the timeline. */
    onStatusUpdated: () => void
}

/** Roles allowed to edit a Project. Mirrors the backend PATCH role list. Copied from the web's ProjectDetail.tsx. */
const PROJECT_EDIT_ROLES = [10, 15, 60, 45, 70]
// The web's shadow-sm, as Android elevation.
const CARD_SHADOW = { elevation: 1 }
const BLOCK_CLASSES =
    "flex-1 rounded-lg border border-neutral-200 bg-gray-50 p-4 dark:rounded-xl dark:border-neutral-700 dark:bg-neutral-800"

function BudgetBlock({ label, children }: { label: string; children: ReactNode }) {
    return (
        <View className={BLOCK_CLASSES}>
            <Text className="text-xs text-gray-500">{label}</Text>
            {children}
        </View>
    )
}

/**
 * The project's header card: title, the client row, Edit and status, service, description, the budget blocks and the
 * last update. Ported from the web's ProjectDetail.tsx; the remarks box lives in the status sheet.
 */
export default function ProjectDetailCard({ project, onEdit, onOpenClient, onStatusUpdated }: Props) {
    const { role } = useAuth()
    // The web's list, narrowed to the roles that may open the edit screen, so the button never leads to AccessDenied.
    const showEdit = role !== null && PROJECT_EDIT_ROLES.includes(role) && canOpen("ProjectEdit", role)
    const client = project.clientId
    const clientLine = `${client?.company || "N/A"} • ${client?.name ?? "Deleted client"}`

    return (
        <View
            className="gap-6 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
            style={CARD_SHADOW}
        >
            <View className="flex-row items-start justify-between gap-4">
                <View className="min-w-0 flex-1">
                    <Text className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
                        {project.title}
                    </Text>
                    {client?._id ? (
                        <Pressable
                            onPress={() => onOpenClient(client._id)}
                            accessibilityRole="link"
                            accessibilityLabel={`Client ${clientLine}`}
                            className="mt-1 min-h-[32px] justify-center"
                        >
                            <Text className="text-sm text-gray-500 underline">{clientLine}</Text>
                        </Pressable>
                    ) : (
                        <Text className="mt-1 text-sm text-gray-500">{clientLine}</Text>
                    )}
                    {!!client?.phone && <WhatsAppLink phone={client.phone} />}
                </View>
                <View className="flex-row items-center gap-2">
                    {showEdit && (
                        <Pressable
                            onPress={onEdit}
                            accessibilityRole="button"
                            accessibilityLabel="Edit project"
                            className="min-h-[36px] justify-center rounded border border-blue-500/40 px-3 py-1.5 active:bg-blue-500/10"
                        >
                            <Text className="text-xs text-blue-500">Edit</Text>
                        </Pressable>
                    )}
                    <ProjectStatusSheet
                        projectId={project._id}
                        currentStatus={project.status}
                        onUpdated={onStatusUpdated}
                    />
                </View>
            </View>

            {project.serviceType != null && <Badge meta={SERVICE_META} status={project.serviceType} />}

            {!!project.description && (
                <View>
                    <Text className="mb-1 text-sm font-medium text-gray-500">Description</Text>
                    <Text className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                        {project.description}
                    </Text>
                </View>
            )}

            <View>
                <Text className="mb-2 text-sm font-medium text-gray-500">Budget Overview</Text>
                <View className="gap-4">
                    <BudgetBlock label="Estimated">
                        <Text className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
                            ₹{project.budget ? formatAmount(project.budget) : "—"}
                        </Text>
                    </BudgetBlock>
                    {/* The web's placeholders for amounts the API does not track yet. */}
                    <View className="flex-row gap-4">
                        <BudgetBlock label="Paid">
                            <Text className="text-lg font-semibold text-green-600">₹—</Text>
                        </BudgetBlock>
                        <BudgetBlock label="Due">
                            <Text className="text-lg font-semibold text-red-500">₹—</Text>
                        </BudgetBlock>
                    </View>
                </View>
            </View>

            <View className="flex-row items-center gap-1">
                <Text className="text-xs text-gray-500">Updated:</Text>
                <TimeAgo date={project.updatedAt} className="text-xs" />
            </View>
        </View>
    )
}
