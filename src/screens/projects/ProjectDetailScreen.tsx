import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { ScrollView, View } from "react-native"

import InteractionActions from "@/components/interactions/InteractionActions"
import InteractionTimeline from "@/components/interactions/InteractionTimeline"
import LeadDetailsSkeleton from "@/components/leads/LeadDetailsSkeleton"
import ProjectDetailCard from "@/components/projects/ProjectDetailCard"
import { AccessDenied, Button, EmptyState } from "@/components/ui"
import { ENTITY_TYPE } from "@/constants/entityTypes"
import { useAuth } from "@/contexts/AuthContext"
import { useDeleteRecord } from "@/hooks/useDeleteRecord"
import { useDetailQuery } from "@/hooks/useDetailQuery"
import { useInteractions } from "@/hooks/useInteractions"
import { openClient } from "@/navigation/openRecord"
import type { ProjectsStackParamList } from "@/navigation/types"
import type { Project } from "@/types/projects"

type Navigation = NativeStackNavigationProp<ProjectsStackParamList, "ProjectDetail">

const PROJECTS_API = "/api/admin/operations/projects"
// The DELETE route's roles. The web shows Delete to everyone and lets the API refuse.
const PROJECT_DELETE_ROLES = [10, 15, 60, 45, 70]

/**
 * One project: the header card, the four add buttons and Delete above its timeline (entityType 2). The project route
 * answers with the project itself in `data`, not nested like leads and clients.
 */
export default function ProjectDetailScreen() {
    const navigation = useNavigation<Navigation>()
    const { id } = useRoute<RouteProp<ProjectsStackParamList, "ProjectDetail">>().params
    const { role } = useAuth()
    const detail = useDetailQuery<Project>(`${PROJECTS_API}/${id}`)
    const timeline = useInteractions({ entityType: ENTITY_TYPE.PROJECT, entityId: id })
    const remove = useDeleteRecord({
        path: `${PROJECTS_API}/${id}`,
        question: "Delete this project?",
        successMessage: "Projects deleted successfully",
        onDeleted: () => navigation.popTo("ProjectsList"),
    })
    const project = detail.data

    function handleRefresh() {
        detail.refresh()
        timeline.reload()
    }

    function handleStatusUpdated() {
        // The status change adds a 2510 row, so the timeline reloads with the project.
        detail.refetch()
        timeline.reload()
    }

    if (detail.accessError) {
        return (
            <View className="flex-1 justify-center p-4">
                <AccessDenied message={detail.accessError} />
            </View>
        )
    }

    if (detail.loading || !project) {
        return (
            <ScrollView contentContainerClassName="gap-3 p-4">
                {detail.loading ? <LeadDetailsSkeleton /> : <EmptyState title="Project not found" />}
            </ScrollView>
        )
    }

    const header = (
        <View className="gap-3">
            <ProjectDetailCard
                project={project}
                onEdit={() => navigation.navigate("ProjectEdit", { id })}
                onOpenClient={(clientId) => openClient(clientId, role)}
                onStatusUpdated={handleStatusUpdated}
            />
            <InteractionActions entityType={ENTITY_TYPE.PROJECT} entityId={id} />
            {role !== null && PROJECT_DELETE_ROLES.includes(role) && (
                <View className="flex-row justify-end">
                    <Button
                        label={remove.isDeleting ? "Deleting..." : "Delete Project"}
                        variant="danger"
                        loading={remove.isDeleting}
                        onPress={remove.confirmDelete}
                    />
                </View>
            )}
        </View>
    )

    return (
        <InteractionTimeline
            entityType={ENTITY_TYPE.PROJECT}
            timeline={timeline}
            header={header}
            refreshing={detail.refreshing}
            onRefresh={handleRefresh}
        />
    )
}
