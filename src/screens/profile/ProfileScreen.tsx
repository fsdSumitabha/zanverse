import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { Activity, Pencil } from "lucide-react-native"
import { useState } from "react"
import { Pressable, Text, View } from "react-native"

import { AUTH_API } from "@/api/endpoints"
import ActivityLogFilterSheet, { hasActiveFilters } from "@/components/activityLog/ActivityLogFilterSheet"
import ActivityLogList from "@/components/activityLog/ActivityLogList"
import FilterButton from "@/components/activityLog/FilterButton"
import ProfileCard from "@/components/profile/ProfileCard"
import ProfileFacts from "@/components/profile/ProfileFacts"
import { Card, SkeletonBlock } from "@/components/ui"
import { useAuth } from "@/contexts/AuthContext"
import { useDetailQuery } from "@/hooks/useDetailQuery"
import { enableIconClassNames } from "@/lib/iconClassName"
import type { MoreStackParamList } from "@/navigation/types"
import { EMPTY_FILTERS, type ActivityLogFilterState } from "@/types/activityLog"
import type { AuthProfileUser } from "@/types/authProfile"

type Navigation = NativeStackNavigationProp<MoreStackParamList, "Profile">

enableIconClassNames(Activity, Pencil)

/**
 * The signed-in person's account: the profile card and facts, then "My activity". Ported from the web's profile page.
 * Every role sees their own; the API scopes the activity to them.
 */
export default function ProfileScreen() {
    const navigation = useNavigation<Navigation>()
    const { user } = useAuth()
    const detail = useDetailQuery<AuthProfileUser>(AUTH_API.PROFILE)
    const [filters, setFilters] = useState<ActivityLogFilterState>({ ...EMPTY_FILTERS })
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const profile = detail.data

    if (detail.loading) {
        return (
            <View accessibilityLabel="Loading" className="gap-3 p-4">
                <SkeletonBlock width="100%" height={140} rounded="lg" />
                <SkeletonBlock width="100%" height={180} rounded="lg" />
            </View>
        )
    }

    if (!profile || !user) {
        return (
            <View className="p-4">
                <Card className="p-8">
                    <Text className="text-red-500">Could not load your profile.</Text>
                </Card>
            </View>
        )
    }

    const header = (
        <View className="gap-4 p-4">
            <View className="flex-row items-start justify-between gap-3">
                <View>
                    <Text className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Profile</Text>
                    <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Your account details</Text>
                </View>
                <Pressable
                    onPress={() => navigation.navigate("ProfileEdit")}
                    accessibilityRole="button"
                    className="min-h-[44px] flex-row items-center gap-2 rounded-lg border border-emerald-500/40 px-4 active:bg-emerald-500/10"
                >
                    <Pencil size={16} className="text-emerald-700 dark:text-emerald-400" />
                    <Text className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Edit profile</Text>
                </Pressable>
            </View>
            <Card className="px-5 pt-5">
                <View className="pb-5">
                    <ProfileCard profile={profile} />
                </View>
                <ProfileFacts profile={profile} />
            </Card>
            <View className="flex-row items-start gap-3 pt-2">
                <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                        <Activity size={20} className="text-emerald-500" />
                        <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                            My activity
                        </Text>
                    </View>
                    <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                        Everything you’ve done across the system.
                    </Text>
                </View>
                <FilterButton isActive={hasActiveFilters(filters)} onPress={() => setIsSheetOpen(true)} />
            </View>
        </View>
    )

    return (
        <>
            <ActivityLogList
                filters={filters}
                forceUserId={user.id}
                ListHeaderComponent={header}
                onRefresh={detail.refresh}
                isRefreshing={detail.refreshing}
            />
            <ActivityLogFilterSheet
                visible={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                value={filters}
                onChange={setFilters}
                isAdmin={false}
            />
        </>
    )
}
