import { Pressable, Text, View } from "react-native"

import { Badge, InlineValue, TimeAgo } from "@/components/ui"
import { PROJECT_STATUS_META } from "@/constants/projectStatus"
import { SERVICE_META } from "@/constants/services"
import { formatAmount } from "@/lib/format"
import type { Project } from "@/types/projects"

interface Props {
    project: Project
    onPress: () => void
}

const CARD_CLASSES =
    "rounded-lg border border-slate-200 bg-white p-4 active:border-blue-500/40 dark:rounded-xl dark:border-neutral-600 dark:bg-neutral-950"

// The web's `shadow`, as Android elevation.
const CARD_SHADOW = {
    elevation: 2,
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
}

/**
 * One project in the list: its client first, then the title, status, description, budget, age and service. Ported from
 * the web's ProjectCard.tsx. A deleted client shows "Deleted client" and "N/A", as the web's detail page does.
 */
export default function ProjectCard({ project, onPress }: Props) {
    const clientName = project.clientId?.name ?? "Deleted client"
    const clientCompany = project.clientId?.company || "N/A"

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`Project ${project.title}`}
            className={CARD_CLASSES}
            style={CARD_SHADOW}
        >
            <View className="flex-row items-start justify-between gap-3">
                <View className="min-w-0 flex-1">
                    <Text numberOfLines={1} className="font-semibold text-neutral-900 dark:text-white">
                        {clientName}
                    </Text>
                    <Text numberOfLines={1} className="text-sm text-neutral-500 dark:text-neutral-400">
                        {clientCompany}
                    </Text>
                    <Text numberOfLines={1} className="mt-1 text-sm font-medium text-blue-600 dark:text-blue-400">
                        {project.title}
                    </Text>
                </View>
                <Badge meta={PROJECT_STATUS_META} status={project.status} />
            </View>

            {!!project.description && (
                <Text numberOfLines={2} className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
                    {project.description}
                </Text>
            )}

            {project.budget != null && project.budget > 0 && (
                <Text className="mt-3 text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    ₹{formatAmount(project.budget)}
                </Text>
            )}

            <View className="mt-2 flex-row flex-wrap items-center gap-2">
                <TimeAgo date={project.createdAt} className="text-xs" />
                {project.serviceType != null && <Badge meta={SERVICE_META} status={project.serviceType} />}
            </View>

            {!!project.createdBy && (
                <View className="mt-2">
                    <InlineValue value={`Created by ${project.createdBy.name}`} />
                </View>
            )}
        </Pressable>
    )
}
