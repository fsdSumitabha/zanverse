import dayjs from "dayjs"
import { BarChart3, CalendarClock, ChevronRight, Users, Video } from "lucide-react-native"
import { useEffect, useState } from "react"
import { Pressable, Text, View } from "react-native"

import { send } from "@/api/client"
import { MEETINGS_API } from "@/api/endpoints"
import { SkeletonBlock } from "@/components/ui"
import { ENTITY_TYPE } from "@/constants/entityTypes"
import { MEETING_TYPE } from "@/constants/meetingTypes"
import { useAuth } from "@/contexts/AuthContext"
import { navigateToEntity, openTabScreen } from "@/lib/entityNav"
import { enableIconClassNames } from "@/lib/iconClassName"

interface MeetingItem {
    _id: string
    title: string
    agenda?: string
    scheduledAt: string
    meetingType?: number
    entityType?: number
    entityId?: string
    entity?: { type: number; label: string; title: string }
}

const VISIBLE_COUNT = 4
const SKELETON_KEYS = [0, 1, 2]
const PARENT_TYPES: number[] = [ENTITY_TYPE.LEAD, ENTITY_TYPE.CLIENT, ENTITY_TYPE.PROJECT]

enableIconClassNames(BarChart3, CalendarClock, ChevronRight, Users, Video)

/** "Today, 3:07 PM", "Tomorrow, 9:00 AM", "Fri, 2:30 PM" this week, else "Oct 21, 11:00 AM". Verbatim from the web. */
export function smartDate(iso: string): string {
    const date = dayjs(iso)
    const diffDays = date.startOf("day").diff(dayjs().startOf("day"), "day")
    if (diffDays === 0) return `Today, ${date.format("h:mm A")}`
    if (diffDays === 1) return `Tomorrow, ${date.format("h:mm A")}`
    if (diffDays > 1 && diffDays < 7) return date.format("ddd, h:mm A")
    return date.format("MMM D, h:mm A")
}

/**
 * The next four meetings, soonest first, each opening its lead, client or project. The route sorts newest first, so
 * it asks for 20 and re-sorts here, as the web does. Ported from the web's UpcomingMeetingsPanel.tsx.
 */
export default function UpcomingMeetingsCard({ refreshKey }: { refreshKey: number }) {
    const { role } = useAuth()
    const [meetings, setMeetings] = useState<MeetingItem[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let isCancelled = false
        send<MeetingItem[]>(`${MEETINGS_API}?range=upcoming&limit=20`, "GET")
            .then((data) => {
                if (isCancelled || !Array.isArray(data)) return
                const sorted = [...data].sort(
                    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
                )
                setMeetings(sorted.slice(0, VISIBLE_COUNT))
            })
            .catch(() => undefined)
            .finally(() => {
                if (!isCancelled) setIsLoading(false)
            })
        return () => {
            isCancelled = true
        }
    }, [refreshKey])

    return (
        <View className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <View className="flex-row items-center gap-2 border-b border-slate-200 px-3 py-1 dark:border-neutral-800">
                <CalendarClock size={14} className="text-amber-500" />
                <Text className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Upcoming meetings
                </Text>
                <Pressable
                    onPress={() => openTabScreen("MoreTab", "Meetings", { range: "upcoming" }, role)}
                    accessibilityRole="link"
                    className="min-h-[44px] justify-center px-2"
                >
                    <Text className="text-xs text-blue-600 dark:text-blue-400">View all</Text>
                </Pressable>
            </View>

            {isLoading ? (
                <View className="gap-3 p-3">
                    {SKELETON_KEYS.map((key) => (
                        <SkeletonBlock key={key} width="66%" height={12} />
                    ))}
                </View>
            ) : meetings.length === 0 ? (
                <Text className="px-3 py-5 text-center text-xs text-neutral-500 dark:text-neutral-400">
                    No upcoming meetings
                </Text>
            ) : (
                meetings.map((meeting) => {
                    const hasParent = !!meeting.entityId && PARENT_TYPES.includes(meeting.entityType ?? -1)
                    const Icon = meeting.meetingType === MEETING_TYPE.ONLINE ? Video : Users
                    return (
                        <Pressable
                            key={meeting._id}
                            onPress={() =>
                                hasParent && navigateToEntity(meeting.entityType ?? -1, meeting.entityId ?? "", role)
                            }
                            disabled={!hasParent}
                            accessibilityRole={hasParent ? "button" : undefined}
                            className="min-h-[52px] flex-row items-start gap-2.5 border-b border-slate-200 px-3 py-2.5 active:bg-neutral-50 dark:border-neutral-800 dark:active:bg-neutral-800/50"
                        >
                            <View className="mt-0.5 h-7 w-7 items-center justify-center rounded-md bg-amber-50 dark:bg-amber-500/10">
                                <Icon size={14} className="text-amber-600 dark:text-amber-400" />
                            </View>
                            <View className="min-w-0 flex-1">
                                <Text
                                    numberOfLines={1}
                                    className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100"
                                >
                                    {meeting.title || meeting.agenda || "Untitled meeting"}
                                </Text>
                                <Text
                                    numberOfLines={1}
                                    className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400"
                                >
                                    {smartDate(meeting.scheduledAt)}
                                    {meeting.entity?.title ? ` · ${meeting.entity.title}` : ""}
                                </Text>
                            </View>
                            {hasParent && <ChevronRight size={14} className="mt-1 text-neutral-400" />}
                        </Pressable>
                    )
                })
            )}

            <Pressable
                onPress={() => openTabScreen("MoreTab", "OverallStats", undefined, role)}
                accessibilityRole="link"
                className="min-h-[44px] flex-row items-center gap-2 px-3 active:bg-neutral-50 dark:active:bg-neutral-800/50"
            >
                <BarChart3 size={14} className="text-blue-500" />
                <Text className="flex-1 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    View pipeline overview
                </Text>
                <ChevronRight size={14} className="text-neutral-400" />
            </Pressable>
        </View>
    )
}
