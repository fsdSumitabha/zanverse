import { useRoute, type RouteProp } from "@react-navigation/native"
import { FlatList, RefreshControl, View } from "react-native"

import ClientProjectPreviewCard from "@/components/clients/ClientProjectPreviewCard"
import { AccessDenied, EmptyState, SkeletonList } from "@/components/ui"
import { useAuth } from "@/contexts/AuthContext"
import { useDetailQuery } from "@/hooks/useDetailQuery"
import { openProject } from "@/navigation/openRecord"
import type { ClientsStackParamList } from "@/navigation/types"
import type { Project } from "@/types/projects"
import { BRAND_COLOR } from "@/theme"

const SKELETON_CARDS = 3

/**
 * Every project of one client. The route returns the whole array, so this is one scrolling list; the web's slices
 * of five with previous and next buttons are dropped.
 */
export default function ClientProjectsScreen() {
    const { clientId } = useRoute<RouteProp<ClientsStackParamList, "ClientProjects">>().params
    const { role } = useAuth()
    const { data, loading, refreshing, accessError, refresh } = useDetailQuery<Project[]>(
        `/api/admin/operations/clients/${clientId}/projects`,
    )

    if (accessError) {
        return (
            <View className="flex-1 justify-center p-4">
                <AccessDenied message={accessError} />
            </View>
        )
    }

    return (
        <FlatList
            data={loading ? [] : data ?? []}
            keyExtractor={(project) => project._id}
            renderItem={({ item }) => (
                <ClientProjectPreviewCard project={item} onPress={() => openProject(item._id, role)} />
            )}
            contentContainerClassName="gap-3 p-4"
            ListEmptyComponent={
                loading ? <SkeletonList count={SKELETON_CARDS} /> : <EmptyState title="No projects yet" />
            }
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[BRAND_COLOR.light]} />}
        />
    )
}
