import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useMemo } from "react"
import { View } from "react-native"

import LeadDetailsSkeleton from "@/components/leads/LeadDetailsSkeleton"
import LeadForm from "@/components/leads/LeadForm"
import { AccessDenied, EmptyState, FormScrollView } from "@/components/ui"
import { useDetailQuery } from "@/hooks/useDetailQuery"
import type { LeadsStackParamList } from "@/navigation/types"
import type { Lead } from "@/types/lead"

type Navigation = NativeStackNavigationProp<LeadsStackParamList, "LeadEdit">

const LEADS_API = "/api/admin/operations/leads"

/** Edits a lead, seeded from `data.lead`. On save it returns to the lead, which reloads on focus. */
export default function LeadEditScreen() {
    const navigation = useNavigation<Navigation>()
    const { id } = useRoute<RouteProp<LeadsStackParamList, "LeadEdit">>().params
    const { data, loading, accessError } = useDetailQuery<{ lead: Lead | null }>(`${LEADS_API}/${id}`)
    const lead = data?.lead ?? null

    // A new object only for a different saved lead, so a reload never wipes what is being typed.
    const initialValues = useMemo(
        () => (lead ? { name: lead.name, email: lead.email, phone: lead.phone, source: lead.source } : undefined),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [lead?._id, lead?.updatedAt],
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
            {!loading && !lead && <EmptyState title="Lead not found" />}
            {!loading && lead && (
                <LeadForm
                    mode="edit"
                    leadId={id}
                    initialValues={initialValues}
                    onSaved={() => navigation.popTo("LeadDetail", { id })}
                />
            )}
        </FormScrollView>
    )
}
