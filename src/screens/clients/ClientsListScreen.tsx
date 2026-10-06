import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"

import ClientCard from "@/components/clients/ClientCard"
import ListScreen from "@/components/list/ListScreen"
import { CLIENT_STATUS_META } from "@/constants/clientStatus"
import { useListQuery } from "@/hooks/useListQuery"
import type { ClientsStackParamList } from "@/navigation/types"
import type { Client } from "@/types/clients"

type Navigation = NativeStackNavigationProp<ClientsStackParamList, "ClientsList">

const CLIENTS_API = "/api/admin/operations/clients"

function getCountLabel(total: number): string {
    return `${total} ${total === 1 ? "client" : "clients"} found`
}

/**
 * The Clients tab: every client in scope, with search, status and date filters. Ported from the web's ClientsClient.
 * No create button: clients come from converting a lead.
 */
export default function ClientsListScreen() {
    const navigation = useNavigation<Navigation>()
    const query = useListQuery<Client>({ path: CLIENTS_API })

    return (
        <ListScreen
            query={query}
            renderItem={(client) => (
                <ClientCard client={client} onPress={() => navigation.navigate("ClientDetail", { id: client._id })} />
            )}
            emptyText="No clients found"
            getCountLabel={getCountLabel}
            searchPlaceholder="Search clients"
            statusMeta={CLIENT_STATUS_META}
        />
    )
}
