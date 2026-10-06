import clsx from "clsx"
import { Pressable, ScrollView, Text, View } from "react-native"

import { SelectSheet, type SelectOption } from "@/components/ui"
import { LEAD_SOURCE_STATUS_META, LEAD_SOURCE_STATUSES } from "@/constants/leadSourceStatus"
import type { LeadSourceTab } from "@/hooks/useLeadSourceList"
import type { LeadSourceCounts, LeadSourceView } from "@/types/leadSource"

interface Props {
    view: LeadSourceView
    counts: LeadSourceCounts | null
    onChange: (view: LeadSourceTab) => void
    status: string
    onStatusChange: (status: string) => void
}

// The web's tabs, labels and hints, in its order.
const TABS: { view: LeadSourceTab; label: string; hint: string }[] = [
    {
        view: "today",
        label: "Today",
        hint: "Today's sources, callbacks that are due, and sources left over from earlier days",
    },
    { view: "upcoming", label: "Upcoming", hint: "Open sources set for a later day" },
    { view: "unscheduled", label: "No day", hint: "Open sources that have no day yet" },
    { view: "closed", label: "Closed", hint: "Not Interested and Converted" },
    { view: "all", label: "All", hint: "Every lead source" },
]

// The status filter. "" is every status, the web's "All statuses" option.
const STATUS_OPTIONS: SelectOption<string>[] = [
    { label: "All statuses", value: "" },
    ...LEAD_SOURCE_STATUSES.map((status) => ({ label: LEAD_SOURCE_STATUS_META[status].label, value: String(status) })),
]

/**
 * The five view tabs with their counts, scrolling sideways, and the status filter under them. Ported from the web's
 * ViewTabs.tsx and its StatusFilter.
 */
export default function ViewTabs({ view, counts, onChange, status, onStatusChange }: Props) {
    return (
        <View className="gap-1.5 rounded-xl border border-slate-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900">
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                accessibilityRole="tablist"
                accessibilityLabel="Views"
                contentContainerClassName="gap-1"
            >
                {TABS.map((tab) => {
                    const isActive = view === tab.view
                    const count = counts?.[tab.view]
                    return (
                        <Pressable
                            key={tab.view}
                            onPress={() => onChange(tab.view)}
                            accessibilityRole="tab"
                            accessibilityState={{ selected: isActive }}
                            accessibilityHint={tab.hint}
                            className={clsx(
                                "min-h-[44px] flex-row items-center gap-1.5 rounded-lg px-3",
                                isActive ? "bg-emerald-600" : "active:bg-slate-100 dark:active:bg-neutral-800",
                            )}
                        >
                            <Text
                                className={clsx(
                                    "text-sm font-medium",
                                    isActive ? "text-white" : "text-neutral-600 dark:text-neutral-300",
                                )}
                            >
                                {tab.label}
                            </Text>
                            {count !== undefined && (
                                <View
                                    className={clsx(
                                        "min-w-[24px] rounded-full px-1.5",
                                        isActive ? "bg-white/25" : "bg-slate-100 dark:bg-neutral-800",
                                    )}
                                >
                                    <Text
                                        className={clsx(
                                            "text-center text-[11px] font-semibold",
                                            isActive ? "text-white" : "text-neutral-600 dark:text-neutral-300",
                                        )}
                                    >
                                        {count}
                                    </Text>
                                </View>
                            )}
                        </Pressable>
                    )
                })}
            </ScrollView>
            <View className="px-1 pb-1">
                <SelectSheet
                    options={STATUS_OPTIONS}
                    value={status}
                    onChange={onStatusChange}
                    title="Status"
                    placeholder="All statuses"
                />
            </View>
        </View>
    )
}
