import { Calendar, IndianRupee, Tag } from "lucide-react-native"
import { Pressable, Text, View } from "react-native"

import { Badge, TimeAgo } from "@/components/ui"
import { PROJECT_STATUS_META } from "@/constants/projectStatus"
import { SERVICE_META } from "@/constants/services"
import { enableIconClassNames } from "@/lib/iconClassName"
import type { Project } from "@/types/projects"

interface Props {
    project: Project
    onPress: () => void
}

enableIconClassNames(Calendar, IndianRupee, Tag)

const PILL = "flex-row items-center gap-1 rounded-full border px-2 py-0.5"

/**
 * A project under its client: title, company, description, status, service, budget and age. Ported from the web's
 * ClientProjectPreviewCard.tsx. The service pill shows its SERVICE_META label where the web shows the raw code.
 */
export default function ClientProjectPreviewCard({ project, onPress }: Props) {
    const service = project.serviceType != null ? SERVICE_META[project.serviceType] : undefined

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`Project ${project.title}`}
            className="gap-3 rounded-lg border border-neutral-200 bg-white p-4 active:border-blue-500/50 dark:rounded-xl dark:border-neutral-800 dark:bg-neutral-900"
        >
            <View className="flex-row items-start justify-between gap-3">
                <View className="min-w-0 flex-1">
                    <Text numberOfLines={1} className="text-sm font-semibold text-gray-900 dark:text-white">
                        {project.title}
                    </Text>
                    {!!project.companyName && (
                        <Text numberOfLines={1} className="mt-0.5 text-xs text-gray-400">
                            {project.companyName}
                        </Text>
                    )}
                </View>
                <Badge meta={PROJECT_STATUS_META} status={project.status} />
            </View>

            {!!project.description && (
                <Text numberOfLines={2} className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                    {project.description}
                </Text>
            )}

            <View className="flex-row flex-wrap items-center gap-2">
                {!!service && (
                    <View
                        className={`${PILL} border-violet-200 bg-violet-50 dark:border-violet-500/20 dark:bg-violet-500/10`}
                    >
                        <Tag size={12} className="text-violet-600 dark:text-violet-400" />
                        <Text className="text-xs text-violet-600 dark:text-violet-400">{service.label}</Text>
                    </View>
                )}
                {project.budget != null && (
                    <View
                        className={`${PILL} border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10`}
                    >
                        <IndianRupee size={12} className="text-emerald-600 dark:text-emerald-400" />
                        <Text className="text-xs text-emerald-600 dark:text-emerald-400">
                            {project.budget.toLocaleString("en-IN")}
                        </Text>
                    </View>
                )}
                {!!project.createdAt && (
                    <View className={`${PILL} border-gray-200 bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800`}>
                        <Calendar size={12} className="text-gray-500 dark:text-gray-400" />
                        <TimeAgo date={project.createdAt} className="text-xs text-gray-500 dark:text-gray-400" />
                    </View>
                )}
            </View>
        </Pressable>
    )
}
