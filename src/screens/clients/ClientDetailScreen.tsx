import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useState } from "react"
import { RefreshControl, ScrollView, View } from "react-native"

import ClientHeaderCard from "@/components/clients/ClientHeaderCard"
import ClientProjectsSection from "@/components/clients/ClientProjectsSection"
import ConvertedFromLeadBlock from "@/components/clients/ConvertedFromLeadBlock"
import InteractionActions from "@/components/interactions/InteractionActions"
import InteractionTimeline from "@/components/interactions/InteractionTimeline"
import LeadDetailsSkeleton from "@/components/leads/LeadDetailsSkeleton"
import { AccessDenied, Button, EmptyState, Fab, SegmentedControl, type Segment } from "@/components/ui"
import { ENTITY_TYPE } from "@/constants/entityTypes"
import { useAuth } from "@/contexts/AuthContext"
import { useDeleteRecord } from "@/hooks/useDeleteRecord"
import { useDetailQuery } from "@/hooks/useDetailQuery"
import { useInteractions } from "@/hooks/useInteractions"
import { openLead, openProject } from "@/navigation/openRecord"
import { canOpen } from "@/navigation/permissions"
import type { ClientsStackParamList } from "@/navigation/types"
import type { Client } from "@/types/clients"
import type { Lead } from "@/types/lead"
import type { Project } from "@/types/projects"
import { BRAND_COLOR } from "@/theme"
import { useOfflineReason } from "@/hooks/useIsOnline"

type Navigation = NativeStackNavigationProp<ClientsStackParamList, "ClientDetail">
type Section = "overview" | "timeline" | "projects"

interface ClientDetailData {
    client: Client | null
    /** The lead this client was converted from, or null for a client created directly. */
    lead: Lead | null
    projects: Project[]
}

const CLIENTS_API = "/api/admin/operations/clients"
// The DELETE route's roles. The web shows Delete to everyone and lets the API refuse.
const CLIENT_DELETE_ROLES = [10, 15, 45]
// Room under the last card so the floating button never covers it.
const FAB_SPACE = 72
const SECTIONS: Segment<Section>[] = [
    { label: "Overview", value: "overview" },
    { label: "Timeline", value: "timeline" },
    { label: "Projects", value: "projects" },
]

/** One client: Overview (header, source lead, Delete), Timeline (entityType 1) and Projects, plus Create New Project. */
export default function ClientDetailScreen() {
    const offlineReason = useOfflineReason()
    const navigation = useNavigation<Navigation>()
    const { id } = useRoute<RouteProp<ClientsStackParamList, "ClientDetail">>().params
    const { role } = useAuth()
    const [section, setSection] = useState<Section>("overview")
    const detail = useDetailQuery<ClientDetailData>(`${CLIENTS_API}/${id}`)
    const timeline = useInteractions({ entityType: ENTITY_TYPE.CLIENT, entityId: id })
    const remove = useDeleteRecord({
        path: `${CLIENTS_API}/${id}`,
        question: "Delete this client?",
        successMessage: "Client deleted successfully",
        onDeleted: () => navigation.popTo("ClientsList"),
    })

    const client = detail.data?.client ?? null
    const canCreateProject = canOpen("ProjectCreate", role)

    function handleRefresh() {
        detail.refresh()
        timeline.reload()
    }

    // The web refetches only the client here, so its new 2510 row needs a manual reload. Both reload.
    function handleStatusUpdated() {
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

    if (detail.loading || !client) {
        return (
            <ScrollView contentContainerClassName="gap-3 p-4">
                {detail.loading ? <LeadDetailsSkeleton /> : <EmptyState title="Client not found" />}
            </ScrollView>
        )
    }

    const refreshControl = (
        <RefreshControl refreshing={detail.refreshing} onRefresh={handleRefresh} colors={[BRAND_COLOR.light]} />
    )
    const bottomSpace = { paddingBottom: canCreateProject ? FAB_SPACE : 16 }

    return (
        <View className="flex-1">
            <View className="px-4 pt-3">
                <SegmentedControl segments={SECTIONS} value={section} onChange={setSection} />
            </View>

            {section === "overview" && (
                <ScrollView
                    contentContainerClassName="gap-3 p-4"
                    contentContainerStyle={bottomSpace}
                    refreshControl={refreshControl}
                >
                    <View>
                        <ClientHeaderCard
                            client={client}
                            onEdit={() => navigation.navigate("ClientEdit", { id })}
                            onStatusUpdated={handleStatusUpdated}
                        />
                        {detail.data?.lead && (
                            <ConvertedFromLeadBlock
                                lead={detail.data.lead}
                                convertedAt={client.createdAt}
                                onViewLead={() => openLead(detail.data?.lead?._id ?? "", role)}
                            />
                        )}
                    </View>
                    {role !== null && CLIENT_DELETE_ROLES.includes(role) && (
                        <View className="flex-row justify-end">
                            <Button
                                disabledReason={offlineReason}
                                label={remove.isDeleting ? "Deleting..." : "Delete Client"}
                                variant="danger"
                                loading={remove.isDeleting}
                                onPress={remove.confirmDelete}
                            />
                        </View>
                    )}
                </ScrollView>
            )}

            {section === "timeline" && (
                <InteractionTimeline
                    entityType={ENTITY_TYPE.CLIENT}
                    timeline={timeline}
                    header={<InteractionActions entityType={ENTITY_TYPE.CLIENT} entityId={id} />}
                    refreshing={detail.refreshing}
                    onRefresh={handleRefresh}
                />
            )}

            {section === "projects" && (
                <ScrollView
                    contentContainerClassName="p-4"
                    contentContainerStyle={bottomSpace}
                    refreshControl={refreshControl}
                >
                    <ClientProjectsSection
                        projects={detail.data?.projects ?? []}
                        onOpenProject={(project) => openProject(project._id, role)}
                        onViewAll={() => navigation.navigate("ClientProjects", { clientId: id })}
                    />
                </ScrollView>
            )}

            {canCreateProject && (
                <Fab
                    accessibilityLabel="Create New Project"
                    onPress={() => navigation.navigate("ProjectCreate", { clientId: id })}
                    isAboveTabBar
                />
            )}
        </View>
    )
}
