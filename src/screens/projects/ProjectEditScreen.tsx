import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useMemo } from "react"
import { View } from "react-native"

import LeadDetailsSkeleton from "@/components/leads/LeadDetailsSkeleton"
import ProjectEditForm, { type ProjectEditValues } from "@/components/projects/ProjectEditForm"
import { AccessDenied, EmptyState, FormScrollView } from "@/components/ui"
import { useDetailQuery } from "@/hooks/useDetailQuery"
import type { ProjectsStackParamList } from "@/navigation/types"
import type { Project } from "@/types/projects"

type Navigation = NativeStackNavigationProp<ProjectsStackParamList, "ProjectEdit">

/** Edits a project, seeded from its route. On save it returns to the project, which reloads on focus. */
export default function ProjectEditScreen() {
    const navigation = useNavigation<Navigation>()
    const { id } = useRoute<RouteProp<ProjectsStackParamList, "ProjectEdit">>().params
    const { data: project, loading, accessError } = useDetailQuery<Project>(`/api/admin/operations/projects/${id}`)

    // A new object only for a different saved project, so a reload never wipes what is being typed.
    const initialValues = useMemo<ProjectEditValues | null>(
        () =>
            project
                ? {
                      clientId: project.clientId?._id ?? "",
                      clientLabel: `${project.clientId?.company || "N/A"} • ${
                          project.clientId?.name ?? "Deleted client"
                      }`,
                      companyName: project.companyName ?? "",
                      title: project.title ?? "",
                      description: project.description ?? "",
                      serviceType: project.serviceType ?? null,
                      budget: project.budget != null ? String(project.budget) : "",
                      status: project.status,
                  }
                : null,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [project?._id, project?.updatedAt],
    )

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
            {!loading && !initialValues && <EmptyState title="Project not found" />}
            {!loading && initialValues && (
                <ProjectEditForm
                    projectId={id}
                    initialValues={initialValues}
                    onSaved={() => navigation.popTo("ProjectDetail", { id })}
                    onCancel={() => navigation.goBack()}
                />
            )}
        </FormScrollView>
    )
}
