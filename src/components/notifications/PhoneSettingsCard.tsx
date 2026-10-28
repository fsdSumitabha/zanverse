import { AlarmClock, BatteryWarning, Send, type LucideIcon } from "lucide-react-native"
import { useCallback, useEffect, useState, type ReactNode } from "react"
import { AppState, Platform, Pressable, Text, View } from "react-native"

import { ApiError, sendRaw } from "@/api/client"
import { NOTIFICATIONS_API } from "@/api/endpoints"
import { Card } from "@/components/ui"
import { enableIconClassNames } from "@/lib/iconClassName"
import { notify } from "@/lib/notify"
import { isFirebaseConfigured } from "@/lib/push/device"
import { hasExactAlarms, isBatteryRestricted, openBatterySettings, openExactAlarmSettings } from "@/lib/push/permission"

enableIconClassNames(AlarmClock, BatteryWarning, Send)

interface TestResult {
    sent?: number
}

interface RowProps {
    icon: LucideIcon
    title: string
    detail: string
    /** The chip or button on the right. */
    children: ReactNode
}

function Row({ icon: Icon, title, detail, children }: RowProps) {
    return (
        <View className="min-h-[52px] flex-row items-center gap-3 px-4 py-3">
            <Icon size={18} className="text-neutral-600 dark:text-neutral-300" />
            <View className="flex-1">
                <Text className="text-sm text-neutral-800 dark:text-neutral-100">{title}</Text>
                <Text className="text-xs text-neutral-500 dark:text-neutral-400">{detail}</Text>
            </View>
            {children}
        </View>
    )
}

function Chip({ label }: { label: string }) {
    return (
        <Text className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            {label}
        </Text>
    )
}

function ActionChip({ label, onPress, isBusy = false }: { label: string; onPress: () => void; isBusy?: boolean }) {
    return (
        <Pressable
            onPress={onPress}
            disabled={isBusy}
            accessibilityRole="button"
            className="min-h-[44px] justify-center rounded-md border border-blue-500/40 px-3 active:bg-blue-500/10 disabled:opacity-50"
        >
            <Text className="text-xs text-blue-600 dark:text-blue-400">{isBusy ? "Sending…" : label}</Text>
        </Pressable>
    )
}

function Divider() {
    return <View className="h-px bg-gray-200 dark:bg-neutral-800" />
}

/**
 * What this phone allows besides the channels: exact timing for callback reminders, the battery saver that can hold
 * pushes back, and a test push through the server's existing test route.
 */
export default function PhoneSettingsCard() {
    const isAndroid = Platform.OS === "android"
    const [isExact, setIsExact] = useState(true)
    const [isRestricted, setIsRestricted] = useState(false)
    const [isSending, setIsSending] = useState(false)

    const load = useCallback(async () => {
        if (!isAndroid) return
        try {
            const [exact, restricted] = await Promise.all([hasExactAlarms(), isBatteryRestricted()])
            setIsExact(exact)
            setIsRestricted(restricted)
        } catch {
            // The rows keep their last values. Nothing here blocks a notification.
        }
    }, [isAndroid])

    useEffect(() => {
        load()
        const subscription = AppState.addEventListener("change", (next) => {
            if (next === "active") load()
        })
        return () => subscription.remove()
    }, [load])

    async function handleTest() {
        setIsSending(true)
        try {
            const result = await sendRaw<TestResult>(NOTIFICATIONS_API.DEVICES_TEST, "POST")
            const sent = result.sent ?? 0
            if (sent === 0) notify.info("No device of yours is set up for push yet")
            else notify.success(`Test notification sent to ${sent} ${sent === 1 ? "device" : "devices"}`)
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) return
            notify.error(error instanceof Error ? error.message : "Failed to send test push")
        } finally {
            setIsSending(false)
        }
    }

    return (
        <Card className="overflow-hidden">
            {isAndroid && (
                <>
                    <Row icon={AlarmClock} title="Exact timing for callbacks" detail="Alarms and reminders permission">
                        {isExact ? (
                            <Chip label="Allowed" />
                        ) : (
                            <ActionChip label="Turn on" onPress={openExactAlarmSettings} />
                        )}
                    </Row>
                    <Divider />
                    <Row icon={BatteryWarning} title="Battery" detail="Some phones stop apps in the background">
                        {isRestricted ? (
                            <ActionChip label="Change" onPress={openBatterySettings} />
                        ) : (
                            <Chip label="Unrestricted" />
                        )}
                    </Row>
                    <Divider />
                </>
            )}
            <Row
                icon={Send}
                title="Send a test notification"
                detail={isFirebaseConfigured() ? "To every device you are signed in on" : "This build has no push"}
            >
                {isFirebaseConfigured() && <ActionChip label="Send" onPress={handleTest} isBusy={isSending} />}
            </Row>
        </Card>
    )
}
