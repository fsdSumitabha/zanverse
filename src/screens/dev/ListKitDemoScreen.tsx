import { Text, View } from "react-native"

import ListScreen from "@/components/list/ListScreen"
import { Card } from "@/components/ui"
import { LEAD_STATUS_META } from "@/constants/leadStatus"
import { useListQuery } from "@/hooks/useListQuery"
import type { Lead } from "@/types/lead"

const LEADS_PATH = "/api/admin/operations/leads"

function DemoRow({ lead }: { lead: Lead }) {
    return (
        <Card className="flex-row items-center gap-3 px-4 py-3">
            <Text numberOfLines={1} className="flex-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {lead.name}
            </Text>
            <Text numberOfLines={1} className="text-xs text-neutral-500 dark:text-neutral-400">
                {lead.phone}
            </Text>
            <View className="min-w-[72px] items-end">
                <Text numberOfLines={1} className="text-xs text-neutral-700 dark:text-neutral-300">
                    {LEAD_STATUS_META[lead.status]?.label ?? "Unknown"}
                </Text>
            </View>
        </Card>
    )
}

/**
 * Session 6's throwaway proof of the list kit on the real leads endpoint: paging on scroll, pull-to-refresh, the
 * status and date filters, search, and a reload on focus. Session 7 replaces it with the leads list. Debug builds
 * open it from More.
 */
export default function ListKitDemoScreen() {
    const query = useListQuery<Lead>({ path: LEADS_PATH })

    return (
        <ListScreen
            query={query}
            renderItem={(lead) => <DemoRow lead={lead} />}
            emptyText="No leads found"
            getCountLabel={(total) => `${total} ${total === 1 ? "lead" : "leads"} found`}
            searchPlaceholder="Search leads"
            statusMeta={LEAD_STATUS_META}
        />
    )
}
