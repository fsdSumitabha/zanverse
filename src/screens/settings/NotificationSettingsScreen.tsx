import type { ReactNode } from "react"
import { Platform, ScrollView, Text, View } from "react-native"

import ChannelList from "@/components/notifications/ChannelList"
import PhoneSettingsCard from "@/components/notifications/PhoneSettingsCard"
import PushPermissionCard from "@/components/notifications/PushPermissionCard"
import ReminderSwitch from "@/components/profile/ReminderSwitch"

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

/**
 * Notification settings, from App Settings and from Android's "Additional settings in the app" link. It shows whether
 * notifications are on, the phone's own reminder settings, and each channel as Android has it now. The channels
 * themselves belong to the person and change in system Settings, which each row opens.
 */
export default function NotificationSettingsScreen() {
    return (
        <ScrollView contentContainerClassName="gap-6 p-4">
            <PushPermissionCard isShownWhenOn />

            <Section title="This phone">
                <ReminderSwitch />
                <PhoneSettingsCard />
            </Section>

            {Platform.OS === "android" && (
                <Section title="Channels · tap to open Android settings">
                    <ChannelList />
                </Section>
            )}
        </ScrollView>
    )
}
