import clsx from "clsx"
import { ChevronRight } from "lucide-react-native"
import { useCallback, useEffect, useState } from "react"
import { AppState, Pressable, Text, View } from "react-native"

import { Button, Card, SkeletonBlock } from "@/components/ui"
import { PUSH_CHANNEL_GROUP_META, PUSH_CHANNEL_META, type PushChannelGroup } from "@/constants/pushChannels"
import { enableIconClassNames } from "@/lib/iconClassName"
import { getChannelStatuses, type ChannelState, type ChannelStatus } from "@/lib/push/channels"
import { openChannelSettings } from "@/lib/push/permission"

enableIconClassNames(ChevronRight)

const STATE_CHIP: Record<ChannelState, { label: string; className: string }> = {
    "pops-up": { label: "Pops up", className: "bg-violet-500/10 text-violet-700 dark:text-violet-300" },
    sound: { label: "Sound", className: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
    silent: { label: "Silent", className: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-300" },
    off: { label: "Off", className: "bg-rose-500/10 text-rose-700 dark:text-rose-300" },
}

const OTHER_GROUP = "Other"
const SKELETON_KEYS = [0, 1, 2, 3]

interface Section {
    title: string
    rows: ChannelStatus[]
}

// Android lists channels without a group under "Other", after the groups. The list keeps that order.
function toSections(statuses: ChannelStatus[]): Section[] {
    const sections = new Map<string, ChannelStatus[]>()
    for (const status of statuses) {
        const group = PUSH_CHANNEL_META[status.code].group as PushChannelGroup | undefined
        const title = group ? PUSH_CHANNEL_GROUP_META[group].label : OTHER_GROUP
        sections.set(title, [...(sections.get(title) ?? []), status])
    }
    const ordered = [...sections.entries()].sort(([a], [b]) => Number(a === OTHER_GROUP) - Number(b === OTHER_GROUP))
    return ordered.map(([title, rows]) => ({ title, rows }))
}

function ChannelRow({ status }: { status: ChannelStatus }) {
    const { id, label, description } = PUSH_CHANNEL_META[status.code]
    const chip = STATE_CHIP[status.state]
    return (
        <Pressable
            onPress={() => openChannelSettings(id)}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${chip.label}. Opens Android settings.`}
            className="min-h-[52px] flex-row items-center gap-3 px-4 py-3 active:bg-neutral-100 dark:active:bg-neutral-800"
        >
            <View className="flex-1">
                <Text className="text-sm text-neutral-800 dark:text-neutral-100">{label}</Text>
                <Text className="text-xs text-neutral-500 dark:text-neutral-400">{description}</Text>
            </View>
            <Text className={clsx("rounded-full px-2 py-0.5 text-[11px] font-semibold", chip.className)}>
                {chip.label}
            </Text>
            <ChevronRight size={16} className="text-neutral-400" />
        </Pressable>
    )
}

/**
 * The channels this phone has, as Android Settings shows them, with what each one does now. A tap opens that
 * channel's page in Settings, where the person changes it; the list reads it again on the way back.
 */
export default function ChannelList() {
    const [statuses, setStatuses] = useState<ChannelStatus[] | null>(null)
    const [hasError, setHasError] = useState(false)

    const load = useCallback(async () => {
        try {
            setStatuses(await getChannelStatuses())
            setHasError(false)
        } catch {
            setHasError(true)
        }
    }, [])

    useEffect(() => {
        load()
        const subscription = AppState.addEventListener("change", (next) => {
            if (next === "active") load()
        })
        return () => subscription.remove()
    }, [load])

    if (hasError) {
        return (
            <Card className="gap-3 p-4">
                <Text className="text-sm text-neutral-700 dark:text-neutral-200">Could not read the channels.</Text>
                <Button label="Try again" variant="quiet" onPress={load} />
            </Card>
        )
    }
    if (statuses === null) {
        return (
            <Card className="gap-3 p-4">
                {SKELETON_KEYS.map((key) => (
                    <SkeletonBlock key={key} width="80%" height={14} />
                ))}
            </Card>
        )
    }
    if (statuses.length === 0) {
        return (
            <Card className="p-4">
                <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                    No channels yet. They appear after the app starts signed in.
                </Text>
            </Card>
        )
    }
    return (
        <View className="gap-4">
            {toSections(statuses).map((section) => (
                <View key={section.title} className="gap-2">
                    <Text className="px-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        {section.title}
                    </Text>
                    <Card className="overflow-hidden">
                        {section.rows.map((status, index) => (
                            <View key={status.code}>
                                {index > 0 && <View className="h-px bg-gray-200 dark:bg-neutral-800" />}
                                <ChannelRow status={status} />
                            </View>
                        ))}
                    </Card>
                </View>
            ))}
        </View>
    )
}
