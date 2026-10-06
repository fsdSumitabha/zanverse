import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"

import ListScreen from "@/components/list/ListScreen"
import ProjectCard from "@/components/projects/ProjectCard"
import ProjectCardSkeleton from "@/components/projects/ProjectCardSkeleton"
import { PROJECT_STATUS_META } from "@/constants/projectStatus"
import { useListQuery } from "@/hooks/useListQuery"
import type { ProjectsStackParamList } from "@/navigation/types"
import type { Project } from "@/types/projects"

type Navigation = NativeStackNavigationProp<ProjectsStackParamList, "ProjectsList">

const PROJECTS_API = "/api/admin/operations/projects"

function getCountLabel(total: number): string {
    return `${total} ${total === 1 ? "project" : "projects"} found`
}

/**
 * The Projects tab: every project in scope, across all clients, with search, status and date filters. Ported from the
 * web's ProjectsClient. No create button: a project is created from its client.
 */
export default function ProjectsListScreen() {
    const navigation = useNavigation<Navigation>()
    const query = useListQuery<Project>({ path: PROJECTS_API })

    return (
        <ListScreen
            query={query}
            renderItem={(project) => (
                <ProjectCard
                    project={project}
                    onPress={() => navigation.navigate("ProjectDetail", { id: project._id })}
                />
            )}
            SkeletonComponent={ProjectCardSkeleton}
            emptyText="No projects found"
            getCountLabel={getCountLabel}
            searchPlaceholder="Search projects"
            statusMeta={PROJECT_STATUS_META}
        />
    )
}
