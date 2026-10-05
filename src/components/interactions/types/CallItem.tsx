import {
    CalendarClock,
    ExternalLink,
    Mic,
    NotebookPen,
    Phone,
    PhoneIncoming,
    PhoneOutgoing,
    Timer,
    UserRound,
} from "lucide-react-native"
import { Linking, Pressable, Text, View } from "react-native"

import { resolveApiUrl } from "@/api/endpoints"
import PhoneText from "@/components/phone/PhoneText"
import { Badge } from "@/components/ui"
import { CALL_DIRECTION_META } from "@/constants/callStatus"
import { INTERACTION_TYPE_META } from "@/constants/interactionTypes"
import { formatDateTime } from "@/lib/format"
import { enableIconClassNames } from "@/lib/iconClassName"
import { PALETTE } from "@/theme"

import InteractionRowFrame from "../InteractionRowFrame"
import RowHeader, { RowTitle } from "../RowHeader"
import type { TimelineItem } from "../timelineTypes"

// CALL_DIRECTION_META names its icon. Imported directly instead of the web's lookup on the whole lucide module.
const DIRECTION_ICONS = { PhoneOutgoing, PhoneIncoming } as const
const SECTION_CLASSES = "border-b border-gray-200 px-3 py-2.5 dark:border-gray-700"

enableIconClassNames(CalendarClock, Mic, NotebookPen, PhoneIncoming, PhoneOutgoing, Timer, UserRound)

/**
 * A logged call (2210): contact, direction, time, duration, notes and the recording. Ported from the web's
 * CallItem.tsx. The recording URL is relative, so it gets the API base URL, and the audio player becomes an Open
 * button that hands the file to the phone's player.
 */
export default function CallItem({ item }: { item: TimelineItem }) {
    const call = item.call ?? null
    const direction = CALL_DIRECTION_META[call?.direction ?? 0] ?? CALL_DIRECTION_META[0]
    const DirectionIcon = DIRECTION_ICONS[direction.icon as keyof typeof DIRECTION_ICONS] ?? PhoneOutgoing

    return (
        <InteractionRowFrame icon={Phone} createdBy={item.createdBy}>
            <RowHeader createdAt={item.createdAt}>
                {!!item.title && <RowTitle>{item.title}</RowTitle>}
                <Badge meta={INTERACTION_TYPE_META} status={item.type} />
            </RowHeader>

            {!!item.description && (
                <Text className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{item.description}</Text>
            )}

            {call && (
                <View className="mt-2 overflow-hidden rounded-lg border border-gray-200 bg-neutral-50 dark:border-gray-700 dark:bg-neutral-800">
                    <View className={`flex-row flex-wrap items-center justify-between gap-2 ${SECTION_CLASSES}`}>
                        <View className="min-w-0 flex-1 flex-row items-center gap-2">
                            <UserRound size={16} className="text-gray-400" />
                            <View className="min-w-0 flex-1">
                                <Text className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                    {call.contactPersonName}
                                </Text>
                                <PhoneText
                                    phone={call.contactPersonPhone}
                                    link
                                    className="mt-0.5 text-xs text-blue-500"
                                />
                            </View>
                        </View>
                        <View className="flex-row items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 dark:bg-neutral-700">
                            <DirectionIcon size={12} className="text-gray-600 dark:text-gray-300" />
                            <Text className="text-xs text-gray-600 dark:text-gray-300">{direction.label}</Text>
                        </View>
                    </View>

                    {(!!call.callTime || !!call.duration) && (
                        <View className={`flex-row flex-wrap items-center gap-5 ${SECTION_CLASSES}`}>
                            {!!call.callTime && (
                                <View className="flex-row items-center gap-1">
                                    <CalendarClock size={12} className="text-gray-500" />
                                    <Text className="text-xs text-gray-500">{formatDateTime(call.callTime)}</Text>
                                </View>
                            )}
                            {!!call.duration && (
                                <View className="flex-row items-center gap-1">
                                    <Timer size={12} className="text-gray-500" />
                                    <Text className="text-xs text-gray-500">{call.duration} minutes</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {!!call.notes && (
                        <View className={SECTION_CLASSES}>
                            <View className="mb-1 flex-row items-center gap-1">
                                <NotebookPen size={12} className="text-gray-400" />
                                <Text className="text-xs text-gray-400">Notes</Text>
                            </View>
                            <Text className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                                {call.notes}
                            </Text>
                        </View>
                    )}

                    {!!call.recordingUrl && (
                        <View className="flex-row items-center justify-between gap-2 px-3 py-2.5">
                            <View className="flex-row items-center gap-1">
                                <Mic size={12} className="text-gray-400" />
                                <Text className="text-xs text-gray-400">Recording</Text>
                            </View>
                            <Pressable
                                onPress={() => Linking.openURL(resolveApiUrl(call.recordingUrl ?? ""))}
                                accessibilityRole="button"
                                accessibilityLabel="Open recording"
                                className="min-h-[36px] flex-row items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 active:bg-emerald-700"
                            >
                                <ExternalLink size={12} color={PALETTE.white} />
                                <Text className="text-xs text-white">Open</Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            )}
        </InteractionRowFrame>
    )
}
