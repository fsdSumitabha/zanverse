import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useState } from "react"
import { Text, View } from "react-native"

import { send } from "@/api/client"
import LeadDetailsSkeleton from "@/components/leads/LeadDetailsSkeleton"
import LeadInfoCard from "@/components/leads/LeadInfoCard"
import { AccessDenied, Button, Card, EmptyState, FormScrollView, Input } from "@/components/ui"
import { useAuth } from "@/contexts/AuthContext"
import { useDetailQuery } from "@/hooks/useDetailQuery"
import { notify } from "@/lib/notify"
import { openClient } from "@/navigation/openRecord"
import type { LeadsStackParamList } from "@/navigation/types"
import type { Lead } from "@/types/lead"

type Navigation = NativeStackNavigationProp<LeadsStackParamList, "LeadConvert">

const LEADS_API = "/api/admin/operations/leads"

/**
 * Turns a lead into a client: the lead's details, then one required Company field. Ported from the web's convert
 * page, without its 2-second wait: on success it opens the new client at once.
 */
export default function LeadConvertScreen() {
    const navigation = useNavigation<Navigation>()
    const { id } = useRoute<RouteProp<LeadsStackParamList, "LeadConvert">>().params
    const { role } = useAuth()
    const { data, loading, accessError } = useDetailQuery<{ lead: Lead | null }>(`${LEADS_API}/${id}`)
    const [company, setCompany] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const lead = data?.lead ?? null

    async function handleConvert() {
        if (!company) {
            notify.error("Company is required")
            return
        }

        setIsSubmitting(true)
        try {
            const result = await send<{ clientId: string }>(`${LEADS_API}/${id}/convert`, "POST", { company })
            notify.success("Lead converted successfully")
            // Back to the lead, which reloads at status 60 when the person returns to this tab.
            navigation.goBack()
            openClient(result.clientId, role)
        } catch (error) {
            notify.error(error instanceof Error ? error.message : "Conversion failed")
        } finally {
            setIsSubmitting(false)
        }
    }

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
                <>
                    <LeadInfoCard lead={lead} />
                    <Card className="gap-4 p-5 dark:border-neutral-700">
                        <Text className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                            Convert to Client
                        </Text>
                        <Input
                            label="Company"
                            required
                            value={company}
                            onChangeText={setCompany}
                            placeholder="Enter company name"
                            returnKeyType="done"
                            onSubmitEditing={handleConvert}
                        />
                        <Button
                            label={isSubmitting ? "Converting..." : "Convert to Client"}
                            onPress={handleConvert}
                            loading={isSubmitting}
                        />
                    </Card>
                </>
            )}
        </FormScrollView>
    )
}
