import clsx from "clsx"
import { X } from "lucide-react-native"
import { Pressable, ScrollView, Text, View } from "react-native"

import { SelectSheet, type SelectOption } from "@/components/ui"
import { ENTITY_TYPE_META } from "@/constants/entityTypes"
import { MEETING_STATUS_META } from "@/constants/meetingStatus"
import type { ListFilterPatch, ListQuery } from "@/hooks/useListQuery"
import { enableIconClassNames } from "@/lib/iconClassName"

interface Props {
    query: ListQuery
    onChange: (patch: ListFilterPatch) => void
}

const LABEL = "text-[11px] font-medium uppercase tracking-wide text-neutral-500"

// Temporal quick-ranges on scheduledAt. "" is no range. Verbatim from the web.
const RANGES = [
    { value: "", label: "All" },
    { value: "today", label: "Today" },
    { value: "last7", label: "Last 7 days" },
    { value: "upcoming", label: "Upcoming" },
]

const STATUS_OPTIONS: SelectOption<string>[] = [
    { label: "All statuses", value: "" },
    ...Object.entries(MEETING_STATUS_META).map(([value, meta]) => ({ label: meta.label, value })),
]

// Every entity type, as the web lists them. Only Lead, Client and Project ever hold a meeting.
const ENTITY_OPTIONS: SelectOption<string>[] = [
    { label: "All entities", value: "" },
    ...Object.entries(ENTITY_TYPE_META).map(([value, meta]) => ({ label: meta.label, value })),
]

enableIconClassNames(X)

/** Status, entity and the quick range for the meetings list. Ported from the web's MeetingFilters.tsx. */
export default function MeetingFilters({ query, onChange }: Props) {
    const hasActive = Boolean(query.status || query.range || query.entityType)

    return (
        <View className="gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
            <View className="flex-row gap-2">
                <View className="flex-1 gap-1">
                    <Text className={LABEL}>Status</Text>
                    <SelectSheet
                        options={STATUS_OPTIONS}
                        value={query.status}
                        onChange={(status) => onChange({ status })}
                        title="Status"
                    />
                </View>
                <View className="flex-1 gap-1">
                    <Text className={LABEL}>Entity</Text>
                    <SelectSheet
                        options={ENTITY_OPTIONS}
                        value={query.entityType}
                        onChange={(entityType) => onChange({ entityType })}
                        title="Entity"
                    />
                </View>
            </View>

            <View className="gap-1">
                <Text className={LABEL}>When</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-1.5">
                    {RANGES.map((range) => {
                        const isActive = query.range === range.value
                        return (
                            <Pressable
                                key={range.value || "all"}
                                onPress={() => onChange({ range: range.value })}
                                accessibilityRole="button"
                                accessibilityState={{ selected: isActive }}
                                className={clsx(
                                    "min-h-[44px] justify-center rounded-lg border px-3",
                                    isActive
                                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                                        : "border-slate-300 active:bg-neutral-100 dark:border-neutral-700 dark:active:bg-neutral-800",
                                )}
                            >
                                <Text
                                    className={clsx(
                                        "text-sm",
                                        isActive
                                            ? "font-medium text-emerald-700 dark:text-emerald-300"
                                            : "text-neutral-600 dark:text-neutral-400",
                                    )}
                                >
                                    {range.label}
                                </Text>
                            </Pressable>
                        )
                    })}
                </ScrollView>
            </View>

            {hasActive && (
                <Pressable
                    onPress={() => onChange({ status: "", range: "", entityType: "" })}
                    accessibilityRole="button"
                    className="min-h-[44px] flex-row items-center gap-1.5 self-start rounded-lg border border-slate-300 px-3 active:bg-neutral-100 dark:border-neutral-700 dark:active:bg-neutral-800"
                >
                    <X size={16} className="text-neutral-700 dark:text-neutral-300" />
                    <Text className="text-sm text-neutral-700 dark:text-neutral-300">Clear filters</Text>
                </Pressable>
            )}
        </View>
    )
}
