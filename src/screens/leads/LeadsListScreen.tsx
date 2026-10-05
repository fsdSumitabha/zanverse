import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { Plus } from "lucide-react-native"
import { View } from "react-native"

import LeadCard from "@/components/leads/LeadCard"
import LeadCardSkeleton from "@/components/leads/LeadCardSkeleton"
import ListScreen from "@/components/list/ListScreen"
import { Button, Fab } from "@/components/ui"
import { LEAD_STATUS_META } from "@/constants/leadStatus"
import { useAuth } from "@/contexts/AuthContext"
import { useListQuery } from "@/hooks/useListQuery"
import { canOpen } from "@/navigation/permissions"
import type { LeadsStackParamList } from "@/navigation/types"
import type { Lead } from "@/types/lead"

type Navigation = NativeStackNavigationProp<LeadsStackParamList, "LeadsList">

const LEADS_API = "/api/admin/operations/leads"
// Room under the last card so the floating button never covers it.
const FAB_SPACE = 72

function getCountLabel(total: number): string {
    return `${total} ${total === 1 ? "lead" : "leads"} found`
}

/** The Leads tab: every lead in scope, with search, status and date filters. Ported from the web's LeadsClient. */
export default function LeadsListScreen() {
    const navigation = useNavigation<Navigation>()
    const { role } = useAuth()
    const query = useListQuery<Lead>({ path: LEADS_API })
    const canCreate = canOpen("LeadCreate", role)
    const canConvert = canOpen("LeadConvert", role)

    function openCreate() {
        navigation.navigate("LeadCreate")
    }

    return (
        <View className="flex-1">
            <ListScreen
                query={query}
                renderItem={(lead) => (
                    <LeadCard
                        lead={lead}
                        onPress={() => navigation.navigate("LeadDetail", { id: lead._id })}
                        onConvert={canConvert ? () => navigation.navigate("LeadConvert", { id: lead._id }) : undefined}
                    />
                )}
                SkeletonComponent={LeadCardSkeleton}
                emptyText="No leads found"
                getCountLabel={getCountLabel}
                searchPlaceholder="Search leads"
                statusMeta={LEAD_STATUS_META}
                headerExtra={
                    canCreate ? (
                        <Button label="Create New Lead" variant="soft" icon={Plus} onPress={openCreate} />
                    ) : undefined
                }
                bottomInset={canCreate ? FAB_SPACE : 0}
            />
            {canCreate && <Fab accessibilityLabel="Create New Lead" onPress={openCreate} isAboveTabBar />}
        </View>
    )
}
