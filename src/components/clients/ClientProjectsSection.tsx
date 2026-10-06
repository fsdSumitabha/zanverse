import { Pressable, Text, View } from "react-native"

import type { Project } from "@/types/projects"

import ClientProjectPreviewCard from "./ClientProjectPreviewCard"

interface Props {
    projects: Project[]
    onOpenProject: (project: Project) => void
    onViewAll: () => void
}

const PREVIEW_COUNT = 3

/** The client's first three projects and "View All". Ported from the projects block in the web's client page. */
export default function ClientProjectsSection({ projects, onOpenProject, onViewAll }: Props) {
    return (
        <View className="gap-4 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <View className="flex-row items-center justify-between">
                <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Projects</Text>
                <Pressable
                    onPress={onViewAll}
                    accessibilityRole="link"
                    hitSlop={12}
                    className="min-h-[44px] justify-center"
                >
                    <Text className="text-sm text-blue-500">View All</Text>
                </Pressable>
            </View>
            {projects.length === 0 && <Text className="text-sm text-gray-500">No projects yet</Text>}
            <View className="gap-3">
                {projects.slice(0, PREVIEW_COUNT).map((project) => (
                    <ClientProjectPreviewCard
                        key={project._id}
                        project={project}
                        onPress={() => onOpenProject(project)}
                    />
                ))}
            </View>
        </View>
    )
}
