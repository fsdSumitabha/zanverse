import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useState } from "react"
import { Alert, RefreshControl, ScrollView, View } from "react-native"

import { sendRaw } from "@/api/client"
import ConvertedClientBlock from "@/components/leads/ConvertedClientBlock"
import LeadDetailsCard from "@/components/leads/LeadDetailsCard"
import LeadDetailsSkeleton from "@/components/leads/LeadDetailsSkeleton"
import LeadInteractionActions from "@/components/leads/LeadInteractionActions"
import { AccessDenied, Button, EmptyState } from "@/components/ui"
import { useAuth } from "@/contexts/AuthContext"
import { useDetailQuery } from "@/hooks/useDetailQuery"
import { notify } from "@/lib/notify"
import { openClient } from "@/navigation/openRecord"
import type { LeadsStackParamList } from "@/navigation/types"
import type { Client } from "@/types/clients"
import type { Lead } from "@/types/lead"
import { BRAND_COLOR } from "@/theme"

type Navigation = NativeStackNavigationProp<LeadsStackParamList, "LeadDetail">

interface LeadDetailData {
    lead: Lead | null
    /** The converted client, or null while the lead is not converted. */
    client: Client | null
}

const LEADS_API = "/api/admin/operations/leads"
const ADMIN_ROLE = 10

/** One lead: header card, converted client, the add-interaction buttons and, for Admin, Delete. */
export default function LeadDetailScreen() {
    const navigation = useNavigation<Navigation>()
    const { id } = useRoute<RouteProp<LeadsStackParamList, "LeadDetail">>().params
    const { role } = useAuth()
    const { data, loading, refreshing, accessError, refresh, refetch } = useDetailQuery<LeadDetailData>(
        `${LEADS_API}/${id}`,
    )
    const [isDeleting, setIsDeleting] = useState(false)

    const lead = data?.lead ?? null
    const client = data?.client ?? null

    async function deleteLead() {
        if (isDeleting) return
        setIsDeleting(true)
        try {
            const json = await sendRaw<{ message?: string }>(`${LEADS_API}/${id}`, "DELETE")
            notify.success(json.message || "Lead deleted successfully")
            navigation.popTo("LeadsList")
        } catch (error) {
            notify.error(error instanceof Error ? error.message : "Something went wrong")
        } finally {
            setIsDeleting(false)
        }
    }

    function handleDelete() {
        Alert.alert("Delete this lead?", "This cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: deleteLead },
        ])
    }

    if (accessError) {
        return (
            <View className="flex-1 justify-center p-4">
                <AccessDenied message={accessError} />
            </View>
        )
    }

    return (
        <ScrollView
            contentContainerClassName="gap-3 p-4"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[BRAND_COLOR.light]} />}
        >
            {loading && <LeadDetailsSkeleton />}

            {!loading && !lead && <EmptyState title="Lead not found" />}

            {!loading && lead && (
                <>
                    <View>
                        <LeadDetailsCard
                            lead={lead}
                            onEdit={() => navigation.navigate("LeadEdit", { id })}
                            onConvert={() => navigation.navigate("LeadConvert", { id })}
                            onStatusUpdated={refetch}
                        />
                        {client && (
                            <ConvertedClientBlock client={client} onViewClient={() => openClient(client._id, role)} />
                        )}
                    </View>

                    <LeadInteractionActions onAction={() => notify.info("Available in the next session")} />

                    {role === ADMIN_ROLE && (
                        <View className="flex-row justify-end">
                            <Button
                                label={isDeleting ? "Deleting..." : "Delete Lead"}
                                variant="danger"
                                loading={isDeleting}
                                onPress={handleDelete}
                            />
                        </View>
                    )}
                </>
            )}
        </ScrollView>
    )
}
