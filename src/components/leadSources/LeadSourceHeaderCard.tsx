import { ArrowRight, CalendarDays, FileSpreadsheet, Trash2, UserRoundPlus, type LucideIcon } from "lucide-react-native"
import type { ReactNode } from "react"
import { Pressable, Text, View } from "react-native"

import { RegionBadge } from "@/components/region/RegionBadges"
import { Button, Card, ContactRow } from "@/components/ui"
import { canConvertLeadSources, canManageLeadSources } from "@/constants/leadSourceRoles"
import { LEAD_SOURCE_STATUS } from "@/constants/leadSourceStatus"
import { useAuth } from "@/contexts/AuthContext"
import { enableIconClassNames } from "@/lib/iconClassName"
import { formatDay, todayString } from "@/lib/leadSourceDay"
import type { LeadSourceDetail } from "@/types/leadSource"

import CallbackButton from "./CallbackButton"
import CallButton from "./CallButton"
import { StatusBadgeButton } from "./StatusMenuSheet"
import { useOfflineReason } from "@/hooks/useIsOnline"

export type DetailPanel = "assign" | "day" | "delete" | "convert" | "status" | "callback"

interface Props {
    source: LeadSourceDetail
    now: number
    onOpen: (panel: DetailPanel) => void
    /** Opens the upload report. Only managers get the link. */
    onOpenUpload?: (uploadId: string) => void
}

const QUIET_TONE = "text-neutral-700 dark:text-neutral-200"
const DANGER_TONE = "text-rose-600 dark:text-rose-400"

enableIconClassNames(CalendarDays, FileSpreadsheet, Trash2, UserRoundPlus)

function Item({ label, children }: { label: string; children: ReactNode }) {
    return (
        <View className="gap-0.5">
            <Text className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</Text>
            {children}
        </View>
    )
}

function QuietButton({
    icon: Icon,
    label,
    tone,
    onPress,
}: {
    icon: LucideIcon
    label: string
    tone: string
    onPress: () => void
}) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            className="min-h-[44px] flex-row items-center gap-1.5 rounded-lg border border-slate-300 px-3 active:bg-neutral-100 dark:border-neutral-700 dark:active:bg-neutral-800"
        >
            <Icon size={16} className={tone} />
            <Text className={`text-sm font-medium ${tone}`}>{label}</Text>
        </Pressable>
    )
}

/**
 * The details screen's first card: the name, the status, the call and callback buttons, the contact grid, and the
 * manager and convert actions. Ported from the header card of the web's [sourceId]/page.tsx.
 */
export default function LeadSourceHeaderCard({ source, now, onOpen, onOpenUpload }: Props) {
    const offlineReason = useOfflineReason()
    const { role } = useAuth()
    const isManager = canManageLeadSources(role)
    const canConvert = canConvertLeadSources(role)
    const isConverted = source.status === LEAD_SOURCE_STATUS.CONVERTED
    const today = todayString()
    const fileLine = source.upload
        ? `${source.upload.fileName}${source.rowNumber ? `, row ${source.rowNumber}` : ""}`
        : null

    return (
        <Card className="gap-4 p-4">
            <View className="gap-3">
                <View className="min-w-0">
                    <Text className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{source.name}</Text>
                    {source.listInfo.length > 0 && (
                        <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                            {source.listInfo.join(" · ")}
                        </Text>
                    )}
                </View>
                <View className="flex-row flex-wrap items-center gap-2">
                    <StatusBadgeButton status={source.status} size="md" onPress={() => onOpen("status")} />
                    {!isConverted && (
                        <CallButton name={source.name} phone={source.phone} status={source.status} size="md" />
                    )}
                </View>
                {!isConverted && (
                    <CallbackButton callbackAt={source.callbackAt} now={now} onPress={() => onOpen("callback")} />
                )}
            </View>

            <View className="gap-3 border-t border-slate-100 pt-4 dark:border-neutral-800">
                <Item label="Phone">
                    <ContactRow kind="phone" value={source.phone} />
                </Item>
                <Item label="Email">
                    <ContactRow kind="email" value={source.email} />
                </Item>
                <Item label="Assigned to">
                    <Text className="text-sm text-neutral-900 dark:text-neutral-100">
                        {source.assignee?.name || "Nobody yet"}
                    </Text>
                </Item>
                <Item label="Day">
                    <View className="flex-row items-center gap-2">
                        <Text className="text-sm text-neutral-900 dark:text-neutral-100">
                            {source.allottedDay ? formatDay(source.allottedDay, today) : "No day"}
                        </Text>
                        {!!source.allottedDay && source.allottedDay < today && !isConverted && (
                            <Text className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                                left over
                            </Text>
                        )}
                    </View>
                </Item>
                <View className="flex-row items-center gap-2">
                    <RegionBadge code={source.region} />
                    {source.upload && fileLine && (
                        <Pressable
                            onPress={() => source.upload && onOpenUpload?.(source.upload._id)}
                            disabled={!isManager || !onOpenUpload}
                            accessibilityRole={isManager && onOpenUpload ? "link" : undefined}
                            className="min-w-0 flex-1 flex-row items-center gap-1.5"
                        >
                            <FileSpreadsheet size={14} className="text-neutral-500 dark:text-neutral-400" />
                            <Text
                                numberOfLines={1}
                                className="flex-shrink text-xs text-neutral-500 dark:text-neutral-400"
                            >
                                {fileLine}
                            </Text>
                        </Pressable>
                    )}
                </View>
            </View>

            {(isManager || (canConvert && !isConverted)) && (
                <View className="flex-row flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-neutral-800">
                    {isManager && (
                        <>
                            <QuietButton
                                icon={UserRoundPlus}
                                label="Assign"
                                tone={QUIET_TONE}
                                onPress={() => onOpen("assign")}
                            />
                            <QuietButton
                                icon={CalendarDays}
                                label="Set day"
                                tone={QUIET_TONE}
                                onPress={() => onOpen("day")}
                            />
                            <QuietButton
                                icon={Trash2}
                                label="Delete"
                                tone={DANGER_TONE}
                                onPress={() => onOpen("delete")}
                            />
                        </>
                    )}
                    {canConvert && !isConverted && (
                        <Button
                            disabledReason={offlineReason}
                            label="Convert to lead"
                            icon={ArrowRight}
                            onPress={() => onOpen("convert")}
                            className="ml-auto"
                        />
                    )}
                </View>
            )}
        </Card>
    )
}
