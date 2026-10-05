import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useState, type ReactNode } from "react"
import { ScrollView, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { ApiError, send } from "@/api/client"
import { OPERATIONS_API } from "@/api/endpoints"
import RegionBadges from "@/components/region/RegionBadges"
import RegionSwitcher from "@/components/region/RegionSwitcher"
import { Button, Card, InlineValue } from "@/components/ui"
import { USER_ROLE_META } from "@/constants/userRoles"
import { useAuth } from "@/contexts/AuthContext"
import { useRegionScope } from "@/contexts/RegionContext"
import type { RootStackParamList } from "@/navigation/types"
import { notify } from "@/lib/notify"
import { getActiveRegion } from "@/store/mmkv"

interface RowProps {
    label: string
    children: ReactNode
}

function Row({ label, children }: RowProps) {
    return (
        <View className="gap-1">
            <Text className="text-xs text-neutral-500 dark:text-neutral-400">{label}</Text>
            {children}
        </View>
    )
}

/**
 * Session 4's stand-in for the app: who is signed in, their regions and the switcher, a test request and Logout.
 * Session 5 replaces it with the tabs.
 */
export default function HomePlaceholderScreen() {
    const { user, logout } = useAuth()
    const { active, canSwitch } = useRegionScope()
    const insets = useSafeAreaInsets()
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
    const [isTesting, setIsTesting] = useState(false)

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
        <ScrollView
            className="flex-1 bg-neutral-50 dark:bg-neutral-950"
            contentContainerClassName="gap-4 px-4"
            contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
        >
            <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Signed in</Text>

            <Card className="gap-4 p-4">
                <Row label="Name">
                    <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        {user.name || "—"}
                    </Text>
                    <InlineValue value={user.email ?? ""} />
                </Row>
                <Row label="Role">
                    <Text className="text-sm text-neutral-800 dark:text-neutral-100">
                        {USER_ROLE_META[user.role]?.label ?? `Role ${user.role}`}
                    </Text>
                </Row>
                <Row label="Regions held">
                    <RegionBadges regions={user.regions} />
                </Row>
                <Row label={`Active region (${active}). canSwitch: ${String(canSwitch)}`}>
                    <RegionSwitcher />
                </Row>
            </Card>

            <Button label="Send a test request" variant="quiet" loading={isTesting} onPress={handleTestRequest} />
            <Button label="Open the kitchen sink" variant="quiet" onPress={() => navigation.navigate("KitchenSink")} />
            <Button label="Log out" variant="danger" onPress={logout} />
        </ScrollView>
    )
}
