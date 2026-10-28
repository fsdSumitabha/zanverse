import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { Bell, ChevronRight, Code, Pencil, Send, type LucideIcon } from "lucide-react-native"
import { useState, type ReactNode } from "react"
import { Pressable, ScrollView, Text, View } from "react-native"

import { ApiError, send } from "@/api/client"
import { API_BASE_URL, OPERATIONS_API } from "@/api/endpoints"
import { navigationRef } from "@/api/navigationRef"
import { Card } from "@/components/ui"
import { enableIconClassNames } from "@/lib/iconClassName"
import { notify } from "@/lib/notify"
import type { PageParamList } from "@/navigation/types"
import { getActiveRegion } from "@/store/mmkv"

type Navigation = NativeStackNavigationProp<PageParamList, "Settings">

const APP_NAME = "ZAN Mobile"

enableIconClassNames(Bell, ChevronRight, Code, Pencil, Send)

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <View className="gap-2">
            <Text className="px-1 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {title}
            </Text>
            {children}
        </View>
    )
}

interface RowProps {
    label: string
    icon: LucideIcon
    onPress: () => void
    hasChevron?: boolean
}

function SettingsRow({ label, icon: Icon, onPress, hasChevron = true }: RowProps) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            className="min-h-[52px] flex-row items-center gap-3 px-4 py-3 active:bg-neutral-100 dark:active:bg-neutral-800"
        >
            <Icon size={18} className="text-neutral-600 dark:text-neutral-300" />
            <Text className="flex-1 text-sm text-neutral-800 dark:text-neutral-100">{label}</Text>
            {hasChevron && <ChevronRight size={16} className="text-neutral-400" />}
        </Pressable>
    )
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <View className="flex-row items-center justify-between gap-3 px-4 py-3">
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">{label}</Text>
            <Text numberOfLines={1} className="flex-shrink text-sm text-neutral-800 dark:text-neutral-100">
                {value}
            </Text>
        </View>
    )
}

function Divider() {
    return <View className="h-px bg-gray-200 dark:bg-neutral-800" />
}

/**
 * App Settings, from the profile sheet: the account, notification settings, what the app talks to, and in a debug
 * build the developer tools that used to sit on the More tab.
 */
export default function SettingsScreen() {
    const navigation = useNavigation<Navigation>()
    const [isTesting, setIsTesting] = useState(false)
    const serverHost = API_BASE_URL.replace(/^https?:\/\//i, "")

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

    return (
        <ScrollView contentContainerClassName="gap-6 p-4">
            <Section title="Account">
                <Card className="overflow-hidden">
                    <SettingsRow
                        label="Edit profile"
                        icon={Pencil}
                        onPress={() => navigation.navigate("ProfileEdit")}
                    />
                </Card>
            </Section>

            <Section title="Notifications">
                <Card className="overflow-hidden">
                    <SettingsRow
                        label="Notification settings"
                        icon={Bell}
                        onPress={() => navigation.navigate("NotificationSettings")}
                    />
                </Card>
            </Section>

            <Section title="About">
                <Card className="overflow-hidden">
                    <InfoRow label="App" value={APP_NAME} />
                    <Divider />
                    <InfoRow label="Server" value={serverHost} />
                </Card>
            </Section>

            {__DEV__ && (
                <Section title="Developer">
                    <Card className="overflow-hidden">
                        <SettingsRow
                            label={isTesting ? "Sending…" : "Send a test request"}
                            icon={Send}
                            hasChevron={false}
                            onPress={handleTestRequest}
                        />
                        <Divider />
                        <SettingsRow
                            label="Kitchen sink"
                            icon={Code}
                            onPress={() => navigationRef.navigate("KitchenSink")}
                        />
                    </Card>
                </Section>
            )}
        </ScrollView>
    )
}
