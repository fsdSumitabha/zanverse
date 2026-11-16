import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { Activity } from "lucide-react-native"
import { useState } from "react"
import { Text, View } from "react-native"

import ActivityLogFilterSheet, { hasActiveFilters } from "@/components/activityLog/ActivityLogFilterSheet"
import ActivityLogList from "@/components/activityLog/ActivityLogList"
import FilterButton from "@/components/activityLog/FilterButton"
import RestrictedArea from "@/components/activityLog/RestrictedArea"
import { useAuth } from "@/contexts/AuthContext"
import { enableIconClassNames } from "@/lib/iconClassName"
import type { MoreStackParamList } from "@/navigation/types"
import { EMPTY_FILTERS, type ActivityLogFilterState } from "@/types/activityLog"

type Navigation = NativeStackNavigationProp<MoreStackParamList, "ActivityLogs">

/** Roles that see every tracked change. The API scopes anyone else to their own rows. */
const ADMIN_ROLES = [10, 20]

enableIconClassNames(Activity)

/**
 * The system audit feed for admins: every tracked change, filtered by entity, user, dates and name. Everyone else
 * sees the Restricted-area card pointing at their profile. Ported from the web's ActivityLogsClient.tsx.
 */
export default function ActivityLogsScreen() {
    const navigation = useNavigation<Navigation>()
    const { role } = useAuth()
    const [filters, setFilters] = useState<ActivityLogFilterState>({ ...EMPTY_FILTERS })
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    if (role === null || !ADMIN_ROLES.includes(role)) {
        return (
            <View className="p-4">
                <RestrictedArea onOpenProfile={() => navigation.navigate("Profile")} />
            </View>
        )
    }

    const header = (
        <View className="flex-row items-start gap-3 px-4 pb-3 pt-4">
            <View className="flex-1">
                <View className="flex-row items-center gap-2">
                    <Activity size={24} className="text-emerald-500" />
                    <Text
                        accessibilityRole="header"
                        className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100"
                    >
                        Activity Log
                    </Text>
                </View>
                <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    Every tracked change across the system. Filter by user, entity, or date range.
                </Text>
            </View>
            <FilterButton isActive={hasActiveFilters(filters)} onPress={() => setIsSheetOpen(true)} />
        </View>
    )

    return (
        <>
            <ActivityLogList filters={filters} ListHeaderComponent={header} />
            <ActivityLogFilterSheet
                visible={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                value={filters}
                onChange={setFilters}
                isAdmin
            />
        </>
    )
}
