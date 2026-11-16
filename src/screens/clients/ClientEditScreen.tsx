import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useMemo } from "react"
import { View } from "react-native"

import ClientForm from "@/components/clients/ClientForm"
import LeadDetailsSkeleton from "@/components/leads/LeadDetailsSkeleton"
import { AccessDenied, EmptyState, FormScrollView } from "@/components/ui"
import { useDetailQuery } from "@/hooks/useDetailQuery"
import type { ClientsStackParamList } from "@/navigation/types"
import type { Client } from "@/types/clients"

type Navigation = NativeStackNavigationProp<ClientsStackParamList, "ClientEdit">

const CLIENTS_API = "/api/admin/operations/clients"

/** Edits a client, seeded from `data.client`. On save it returns to the client, which reloads on focus. */
export default function ClientEditScreen() {
    const navigation = useNavigation<Navigation>()
    const { id } = useRoute<RouteProp<ClientsStackParamList, "ClientEdit">>().params
    const { data, loading, accessError } = useDetailQuery<{ client: Client | null }>(`${CLIENTS_API}/${id}`)
    const client = data?.client ?? null

    // A new object only for a different saved client, so a reload never wipes what is being typed.
    const initialValues = useMemo(
        () =>
            client
                ? { name: client.name, company: client.company, email: client.email, phone: client.phone }
                : undefined,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [client?._id, client?.updatedAt],
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
            {!loading && !client && <EmptyState title="Client not found" />}
            {!loading && client && (
                <ClientForm
                    mode="edit"
                    clientId={id}
                    initialValues={initialValues}
                    onSaved={() => navigation.popTo("ClientDetail", { id })}
                />
            )}
        </FormScrollView>
    )
}
