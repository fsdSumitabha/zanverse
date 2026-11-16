import { FileSpreadsheet, X } from "lucide-react-native"
import { Pressable, Text, View } from "react-native"

import DateField from "@/components/list/DateField"
import { SelectSheet, type SelectOption } from "@/components/ui"
import { useAssignees } from "@/hooks/useAssignees"
import type { LeadSourceFilters as Filters } from "@/lib/leadSourceQuery"
import { enableIconClassNames } from "@/lib/iconClassName"
import { todayString } from "@/lib/leadSourceDay"

type FilterValues = Pick<Filters, "status" | "assignee" | "day" | "upload">

interface Props {
    values: FilterValues
    onChange: (patch: Partial<FilterValues>) => void
    onClear: () => void
    onOpenUploads: () => void
}

enableIconClassNames(FileSpreadsheet, X)

/**
 * Filters for managers, who see the whole team: the person, one exact day, and one upload. Ported from the web's
 * LeadSourceFilters.tsx. The status filter sits under the view tabs, for everyone.
 */
export default function LeadSourceFilters({ values, onChange, onClear, onOpenUploads }: Props) {
    const { people } = useAssignees([])
    const hasActive = Boolean(values.status || values.assignee || values.day || values.upload)
    const personOptions: SelectOption<string>[] = [
        { label: "Everyone", value: "" },
        { label: "Assigned to me", value: "me" },
        { label: "Not assigned", value: "none" },
        ...people.map((person) => ({ label: person.name, value: person._id })),
    ]

    return (
        <View className="gap-2 rounded-xl border border-slate-200 bg-white p-2 dark:border-neutral-800 dark:bg-neutral-900">
            <View className="flex-row items-end gap-2">
                <SelectSheet
                    label="Person"
                    options={personOptions}
                    value={values.assignee}
                    onChange={(assignee) => onChange({ assignee })}
                    className="flex-1"
                />
                <DateField
                    label="One day"
                    value={values.day || todayString()}
                    active={!!values.day}
                    onChange={(day) => onChange({ day })}
                />
            </View>

            <View className="flex-row items-center justify-end gap-1.5">
                <Pressable
                    onPress={onOpenUploads}
                    accessibilityRole="button"
                    className="min-h-[44px] flex-row items-center gap-1.5 rounded-lg px-2.5 active:bg-slate-100 dark:active:bg-neutral-800"
                >
                    <FileSpreadsheet size={16} className="text-neutral-600 dark:text-neutral-300" />
                    <Text className="text-sm text-neutral-600 dark:text-neutral-300">Uploads</Text>
                </Pressable>
                {hasActive && (
                    <Pressable
                        onPress={onClear}
                        accessibilityRole="button"
                        className="min-h-[44px] flex-row items-center gap-1 rounded-lg border border-slate-300 px-2.5 active:bg-slate-100 dark:border-neutral-700 dark:active:bg-neutral-800"
                    >
                        <X size={16} className="text-neutral-700 dark:text-neutral-300" />
                        <Text className="text-sm text-neutral-700 dark:text-neutral-300">Clear</Text>
                    </Pressable>
                )}
            </View>

            {!!values.upload && (
                <View className="flex-row flex-wrap items-center gap-2">
                    <FileSpreadsheet size={14} className="text-emerald-600" />
                    <Text className="text-xs text-neutral-600 dark:text-neutral-300">Showing one upload only.</Text>
                    <Pressable onPress={() => onChange({ upload: "" })} accessibilityRole="button" hitSlop={12}>
                        <Text className="text-xs font-medium text-blue-600 dark:text-blue-400">Show all uploads</Text>
                    </Pressable>
                </View>
            )}

            {!!values.day && (
                <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                    Showing every source set for this day, in any status. Clear the day to go back to the tabs.
                </Text>
            )}
        </View>
    )
}
