import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { ScrollView, View } from "react-native"

import InteractionActions from "@/components/interactions/InteractionActions"
import InteractionTimeline from "@/components/interactions/InteractionTimeline"
import ConvertedClientBlock from "@/components/leads/ConvertedClientBlock"
import LeadDetailsCard from "@/components/leads/LeadDetailsCard"
import LeadDetailsSkeleton from "@/components/leads/LeadDetailsSkeleton"
import { AccessDenied, Button, EmptyState } from "@/components/ui"
import { ENTITY_TYPE } from "@/constants/entityTypes"
import { useAuth } from "@/contexts/AuthContext"
import { useDeleteRecord } from "@/hooks/useDeleteRecord"
import { useDetailQuery } from "@/hooks/useDetailQuery"
import { useInteractions } from "@/hooks/useInteractions"
import { openClient } from "@/navigation/openRecord"
import type { LeadsStackParamList } from "@/navigation/types"
import type { Client } from "@/types/clients"
import type { Lead } from "@/types/lead"
import { useOfflineReason } from "@/hooks/useIsOnline"

type Navigation = NativeStackNavigationProp<LeadsStackParamList, "LeadDetail">

interface LeadDetailData {
    lead: Lead | null
    /** The converted client, or null while the lead is not converted. */
    client: Client | null
}

const LEADS_API = "/api/admin/operations/leads"
const ADMIN_ROLE = 10

/** One lead: header card, converted client, the add buttons, the timeline and, for Admin, Delete. */
export default function LeadDetailScreen() {
    const offlineReason = useOfflineReason()
    const navigation = useNavigation<Navigation>()
    const { id } = useRoute<RouteProp<LeadsStackParamList, "LeadDetail">>().params
    const { role } = useAuth()
    const detail = useDetailQuery<LeadDetailData>(`${LEADS_API}/${id}`)
    const timeline = useInteractions({ entityType: ENTITY_TYPE.LEAD, entityId: id })
    const remove = useDeleteRecord({
        path: `${LEADS_API}/${id}`,
        question: "Delete this lead?",
        successMessage: "Lead deleted successfully",
        onDeleted: () => navigation.popTo("LeadsList"),
    })

    const lead = detail.data?.lead ?? null
    const client = detail.data?.client ?? null

    function handleRefresh() {
        detail.refresh()
        timeline.reload()
    }

    function handleStatusUpdated() {
        // The status change adds a 2510 row, so the timeline reloads with the lead.
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

    if (detail.loading || !lead) {
        return (
            <ScrollView contentContainerClassName="gap-3 p-4">
                {detail.loading ? <LeadDetailsSkeleton /> : <EmptyState title="Lead not found" />}
            </ScrollView>
        )
    }

    const header = (
        <View className="gap-3">
            <View>
                <LeadDetailsCard
                    lead={lead}
                    onEdit={() => navigation.navigate("LeadEdit", { id })}
                    onConvert={() => navigation.navigate("LeadConvert", { id })}
                    onStatusUpdated={handleStatusUpdated}
                />
                {client && <ConvertedClientBlock client={client} onViewClient={() => openClient(client._id, role)} />}
            </View>

            <InteractionActions entityType={ENTITY_TYPE.LEAD} entityId={id} />

            {role === ADMIN_ROLE && (
                <View className="flex-row justify-end">
                    <Button
                        disabledReason={offlineReason}
                        label={remove.isDeleting ? "Deleting..." : "Delete Lead"}
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
            entityType={ENTITY_TYPE.LEAD}
            timeline={timeline}
            header={header}
            refreshing={detail.refreshing}
            onRefresh={handleRefresh}
        />
    )
}
