import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { ChevronRight, Code, List, LogOut, Send, type LucideIcon } from "lucide-react-native"
import { useState } from "react"
import { Pressable, ScrollView, Text, View } from "react-native"

import { ApiError, send } from "@/api/client"
import { OPERATIONS_API } from "@/api/endpoints"
import { navigationRef } from "@/api/navigationRef"
import RegionSwitcher from "@/components/region/RegionSwitcher"
import { Avatar, Card } from "@/components/ui"
import { USER_ROLE_META } from "@/constants/userRoles"
import { useAuth } from "@/contexts/AuthContext"
import { enableIconClassNames } from "@/lib/iconClassName"
import { notify } from "@/lib/notify"
import { getMoreItemsForRole } from "@/navigation/moreItems"
import type { MoreStackParamList } from "@/navigation/types"
import { getActiveRegion } from "@/store/mmkv"

type MoreNavigation = NativeStackNavigationProp<MoreStackParamList, "More">

interface RowProps {
    label: string
    icon: LucideIcon
    onPress: () => void
    isDanger?: boolean
    hasChevron?: boolean
}

enableIconClassNames(ChevronRight, Code, List, LogOut, Send)

function MoreRow({ label, icon: Icon, onPress, isDanger = false, hasChevron = true }: RowProps) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            className="min-h-[48px] flex-row items-center gap-3 px-4 py-3 active:bg-neutral-100 dark:active:bg-neutral-800"
        >
            <Icon
                size={20}
                className={isDanger ? "text-red-600 dark:text-red-400" : "text-neutral-600 dark:text-neutral-300"}
            />
            <Text
                className={
                    isDanger
                        ? "flex-1 text-sm font-medium text-red-600 dark:text-red-400"
                        : "flex-1 text-sm text-neutral-800 dark:text-neutral-100"
                }
            >
                {label}
            </Text>
            {hasChevron && <ChevronRight size={16} className="text-neutral-400" />}
        </Pressable>
    )
}

function Divider() {
    return <View className="h-px bg-gray-200 dark:bg-neutral-800" />
}

/**
 * The More tab: who is signed in, the destinations that have no tab, the region switcher and Logout. It replaces the
 * web's profile and more menus in MobileTopBar.
 */
export default function MoreScreen() {
    const navigation = useNavigation<MoreNavigation>()
    const { user, role, logout } = useAuth()
    const [isTesting, setIsTesting] = useState(false)
    const items = getMoreItemsForRole(role)

    async function handleTestRequest() {
        setIsTesting(true)
        try {
            await send(`${OPERATIONS_API}/leads?limit=1`, "GET")
            notify.success("Request OK", { description: `Sent X-Active-Region: ${getActiveRegion() ?? "(none)"}` })
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) return
            notify.error(error instanceof Error ? error.message : "Request failed")
        } finally {
            setIsTesting(false)
        }
    }

    if (!user) return null

    return (
        <ScrollView contentContainerClassName="gap-4 p-4">
            <Card className="flex-row items-center gap-3 p-4">
                <Avatar uri={user.avatar} size={48} name={user.name} />
                <View className="min-w-0 flex-1">
                    <Text numberOfLines={1} className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        {user.name || user.email || "—"}
                    </Text>
                    <Text numberOfLines={1} className="text-sm text-neutral-500 dark:text-neutral-400">
                        {USER_ROLE_META[user.role]?.label ?? `Role ${user.role}`}
                    </Text>
                </View>
            </Card>

            <Card className="flex-row items-center justify-between gap-3 px-4 py-3">
                <Text className="text-sm text-neutral-800 dark:text-neutral-100">Region</Text>
                <RegionSwitcher />
            </Card>

            <Card className="overflow-hidden">
                {items.map((item, index) => (
                    <View key={item.screen}>
                        {index > 0 && <Divider />}
                        <MoreRow label={item.name} icon={item.icon} onPress={() => navigation.navigate(item.screen)} />
                    </View>
                ))}
            </Card>

            {__DEV__ && (
                <Card className="overflow-hidden">
                    <MoreRow
                        label={isTesting ? "Sending…" : "Send a test request"}
                        icon={Send}
                        hasChevron={false}
                        onPress={handleTestRequest}
                    />
                    <Divider />
                    <MoreRow label="List kit demo" icon={List} onPress={() => navigation.navigate("ListKitDemo")} />
                    <Divider />
                    <MoreRow label="Kitchen sink" icon={Code} onPress={() => navigationRef.navigate("KitchenSink")} />
                </Card>
            )}

            <Card className="overflow-hidden">
                <MoreRow label="Logout" icon={LogOut} isDanger hasChevron={false} onPress={logout} />
            </Card>
        </ScrollView>
    )
}
